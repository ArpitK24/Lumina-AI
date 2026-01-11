from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError
import models, database, auth, ai_service
from sqlmodel import select, Session as SQLSession
from datetime import datetime

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Init DB
    database.init_db()
    yield
    # Shutdown logic if needed

app = FastAPI(title="Lumina AI API", lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    with SQLSession(database.engine) as session:
        yield session

# Auth
@app.post("/auth/signup")
def signup(data: models.AuthRequest, db: SQLSession = Depends(get_db)):
    user_exists = db.exec(select(models.User).where(models.User.email == data.email)).first()
    if user_exists:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(data.password)
    new_user = models.User(email=data.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully"}

@app.post("/auth/login")
def login(data: models.AuthRequest, db: SQLSession = Depends(get_db)):
    user = db.exec(select(models.User).where(models.User.email == data.email)).first()
    if not user or not auth.verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

security = HTTPBearer()

# Protected Routes Helper
def get_current_user(auth_credentials: HTTPAuthorizationCredentials = Depends(security), db: SQLSession = Depends(get_db)):
    token = auth_credentials.credentials
    payload = auth.decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    email = payload.get("sub")
    user = db.exec(select(models.User).where(models.User.email == email)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# Chat Routes
@app.get("/chats", response_model=List[models.Chat])
def get_chats(user: models.User = Depends(get_current_user), db: SQLSession = Depends(get_db)):
    return db.exec(select(models.Chat).where(models.Chat.user_id == user.id)).all()

@app.post("/chats", response_model=models.Chat)
def create_chat(data: models.ChatCreate, user: models.User = Depends(get_current_user), db: SQLSession = Depends(get_db)):
    new_chat = models.Chat(title=data.title, user_id=user.id)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

@app.patch("/chats/{chat_id}", response_model=models.Chat)
def update_chat(chat_id: int, data: models.ChatCreate, user: models.User = Depends(get_current_user), db: SQLSession = Depends(get_db)):
    chat = db.exec(select(models.Chat).where(models.Chat.id == chat_id, models.Chat.user_id == user.id)).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    chat.title = data.title
    db.add(chat)
    db.commit()
    db.refresh(chat)
    return chat

@app.delete("/chats/{chat_id}")
def delete_chat(chat_id: int, user: models.User = Depends(get_current_user), db: SQLSession = Depends(get_db)):
    chat = db.exec(select(models.Chat).where(models.Chat.id == chat_id, models.Chat.user_id == user.id)).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Also delete associated messages
    messages = db.exec(select(models.Message).where(models.Message.chat_id == chat_id)).all()
    for msg in messages:
        db.delete(msg)
        
    db.delete(chat)
    db.commit()
    return {"message": "Chat deleted successfully"}

@app.post("/chats/{chat_id}/messages")
async def send_message(
    chat_id: int, 
    data: models.MessageCreate,
    user: models.User = Depends(get_current_user), 
    db: SQLSession = Depends(get_db)
):
    # Check credits
    cost = 5 if data.thinking_mode else 1
    if user.credits < cost:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Save user message
    user_msg = models.Message(content=data.content, role="user", chat_id=chat_id)
    db.add(user_msg)
    
    # Get AI response
    ai_resp_data = await ai_service.ai_service.get_response(data.content, data.model_type, data.thinking_mode)
    
    # Save AI message
    ai_msg = models.Message(
        content=ai_resp_data["response"], 
        role="assistant", 
        thinking=ai_resp_data["thinking"],
        chat_id=chat_id
    )
    db.add(ai_msg)
    
    # Deduct credits
    user.credits -= cost
    db.add(user)
    
    db.commit()
    db.refresh(ai_msg)
    
    return {
        "user_message": user_msg,
        "assistant_message": ai_msg,
        "remaining_credits": user.credits
    }

@app.post("/chats/{chat_id}/messages/stream")
async def send_message_stream(
    chat_id: int, 
    data: models.MessageCreate,
    user: models.User = Depends(get_current_user), 
    db: SQLSession = Depends(get_db)
):
    # Check credits
    cost = 5 if data.thinking_mode else 1
    if user.credits < cost:
        raise HTTPException(status_code=402, detail="Insufficient credits")

    # Save user message immediately
    user_msg = models.Message(content=data.content, role="user", chat_id=chat_id)
    db.add(user_msg)
    db.commit()

    async def event_generator():
        full_response = ""
        try:
            async for chunk in ai_service.ai_service.stream_response(data.content, data.model_type, data.thinking_mode):
                full_response += chunk
                # Using a simple JSON format for each chunk to handle special characters
                import json
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
            
            # After stream ends, save assistant message to DB
            parsed = ai_service.ai_service._parse_thinking(full_response)
            ai_msg = models.Message(
                content=parsed["response"], 
                role="assistant", 
                thinking=parsed["thinking"],
                chat_id=chat_id
            )
            db.add(ai_msg)
            
            # Deduct credits
            user.credits -= cost
            db.add(user)
            db.commit()
            
            yield f"data: {json.dumps({'done': True, 'remaining_credits': user.credits})}\n\n"
        except Exception as e:
            print(f"Streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/chats/{chat_id}/messages", response_model=List[models.Message])
def get_messages(chat_id: int, user: models.User = Depends(get_current_user), db: SQLSession = Depends(get_db)):
    return db.exec(select(models.Message).where(models.Message.chat_id == chat_id)).all()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
