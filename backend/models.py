from typing import List, Optional
from datetime import datetime
from sqlmodel import Field, Relationship, SQLModel, JSON, Column
from pydantic import BaseModel

class AuthRequest(BaseModel):
    email: str
    password: str

class ChatCreate(BaseModel):
    title: str

class MessageCreate(BaseModel):
    content: str
    model_type: str = "gemini"
    thinking_mode: bool = False

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    credits: int = Field(default=100)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    chats: List["Chat"] = Relationship(back_populates="user")

class Chat(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int = Field(foreign_key="user.id")
    
    user: User = Relationship(back_populates="chats")
    messages: List["Message"] = Relationship(back_populates="chat")

class Message(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    role: str  # 'user' or 'assistant'
    type: str = Field(default="text") # 'text', 'image', 'file'
    thinking: Optional[str] = Field(default=None) # Storage for reasoning process
    file_url: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    chat_id: int = Field(foreign_key="chat.id")
    
    chat: Chat = Relationship(back_populates="messages")
