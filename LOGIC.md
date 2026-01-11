# Lumina AI: Codebase Logic & Architecture

This document tracks the technical logic and responsibilities of each file within the Lumina AI codebase.

## 🏗️ Folder Structure

```text
/
├── backend/            # FastAPI Project
│   ├── ai_service.py   # AI Engine Integration (Gemini/OpenAI)
│   ├── auth.py         # JWT & Security Logic
│   ├── database.py     # SQLModel Engine & Startup Logic
│   ├── main.py         # API Endpoints & Core App Lifecycle
│   ├── models.py       # Database Schemas & Pydantic Models
│   └── requirements.txt# Backend Dependencies
├── frontend/           # React + Vite Project
│   ├── src/
│   │   ├── pages/      # Application Screens
│   │   │   ├── LandingPage.jsx # Public Entry
│   │   │   ├── AuthPage.jsx    # Signup/Login
│   │   │   └── ChatPage.jsx    # Main Chat App
│   │   └── index.css   # Core Styling
└── .gitignore          # Security rules for Git
```

## 🧠 Backend Logic

### 1. `database.py`
- **Responsibility**: Manages the connection to Supabase.
- **Logic**: Implements a robust URL-parser that handles special characters in passwords (like `@`). Uses SQLModel's `create_engine` to establish the bridge.

### 2. `auth.py`
- **Responsibility**: Security and Identity.
- **Logic**: 
  - Uses `Passlib` for bcrypt password hashing.
  - Implements `python-jose` for creating and decoding Secure JWT tokens.
  - Contains the `SECRET_KEY` logic that powers session persistence.

### 3. `models.py`
- **Responsibility**: The Single Source of Truth for data.
- **Logic**: 
  - **User Table**: Stores emails, hashed passwords, and credit balances.
  - **Chat Table**: Groups messages into conversations.
  - **Message Table**: Stores individual turns of dialogue, including the `thinking` reasoning field.
  - **Pydantic Schemas**: Handles JSON body validation for API requests.

### 4. `ai_service.py`
- **Responsibility**: The "Brain" interface.
- **Logic**: An asynchronous service that manages model-switching.
  - If `Gemini` is selected, it uses `google-generativeai`.
  - If `GPT-4` is selected, it uses the `openai` SDK.
  - **Thinking Logic**: If `thinking_mode` is enabled, it sends a specific system instruction to the AI to output its reasoning process inside `<thought>` tags, which are then parsed and returned separately to the frontend.

### 5. `main.py`
- **Responsibility**: API Routing & Execution.
- **Logic**: Orchestrates all parts. It handles user authentication, protects sensitive routes with a dependency, and manages the lifecycle of the database.

## 🎨 Frontend Logic

### 1. `ChatPage.jsx`
- **Responsibility**: The User Experience.
- **Logic**:
  - **Auto-Selection**: On load, it fetches all chats and selects the latest one.
  - **Dynamic Messaging**: When a message is sent, it immediately pushes a local "User" message to the list (optimistic UI) and then replaces or adds the "Assistant" response once the API call finishes.
  - **Auto-Titling**: Detects if a chat is a "New chat" and automatically updates its title based on the first prompt sent.
  - **Stateful Sidebar**: Manages the opening/closing transitions and the inline-renaming editing state.

### 2. `index.css`
- **Responsibility**: Styling & Aesthetics.
- **Logic**: Uses CSS variables (`:root`) to create a unified design system. It implements glassmorphism using `backdrop-filter` and smooth transitions for a "Premium" app feel.

## 🔐 Security Logic
- **Authorization**: All sensitive endpoints (Get Chats, Send Message, Rename) require a valid JWT in the `Authorization` header.
- **Data Safety**: `.gitignore` ensures that `.env` files and `node_modules` are never uploaded to public repositories.
- **Password Safety**: High-entropy bcrypt hashing ensures that even if the database is compromised, user passwords remain secure.
