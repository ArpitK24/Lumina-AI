import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, MessageSquare, Send, User, Bot,
  Settings, LogOut, Sparkles, Brain, Paperclip,
  ChevronLeft, MoreVertical, Edit2, Trash2, Check, X, ArrowUp
} from 'lucide-react';
import axios from 'axios';

const ChatPage = () => {
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [modelType, setModelType] = useState('gemini');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Chat management state
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: API_URL,
    headers: { Authorization: `Bearer ${token}` }
  });

  useEffect(() => {
    if (!token) navigate('/auth');
    fetchChats();
  }, [token]);

  useEffect(() => {
    if (currentChatId) fetchMessages(currentChatId);
    else setMessages([]);
  }, [currentChatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChats = async () => {
    try {
      const res = await api.get('/chats');
      // Sort by creation date descending
      const sortedChats = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setChats(sortedChats);

      // Auto-select latest chat if none selected
      if (sortedChats.length > 0 && !currentChatId) {
        setCurrentChatId(sortedChats[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const res = await api.get(`/chats/${chatId}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createNewChat = async (initialMessage = null) => {
    try {
      const title = initialMessage ? (initialMessage.length > 30 ? initialMessage.slice(0, 30) + '...' : initialMessage) : 'New chat';
      const res = await api.post('/chats', { title });
      setChats([res.data, ...chats]);
      setCurrentChatId(res.data.id);
      return res.data.id;
    } catch (err) {
      console.error(err);
      return null;
    }
  };

  const deleteChat = async (id) => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/chats/${id}`);
      setChats(chats.filter(c => c.id !== id));
      if (currentChatId === id) {
        setCurrentChatId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startRename = (chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleRename = async () => {
    if (!editTitle.trim() || !editingChatId) return;
    try {
      const res = await api.patch(`/chats/${editingChatId}`, { title: editTitle });
      setChats(chats.map(c => c.id === editingChatId ? { ...c, title: res.data.title } : c));
      setEditingChatId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    let chatId = currentChatId;
    const messageText = input;

    if (!chatId) {
      chatId = await createNewChat(messageText);
      if (!chatId) return;
    }

    const userMsg = { content: messageText, role: 'user', created_at: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post(`/chats/${chatId}/messages`, {
        content: messageText,
        model_type: modelType,
        thinking_mode: thinkingMode
      });
      setMessages(prev => [...prev, res.data.assistant_message]);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Message failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-nav">
          <button className="new-chat-btn" onClick={() => { setCurrentChatId(null); setMessages([]); }}>
            <div className="btn-left">
              <Plus size={18} />
              <span>New chat</span>
            </div>
            <Edit2 size={16} className="edit-btn-icon" />
          </button>
        </div>

        <div className="history-section">
          <div className="history-list">
            <div className="history-group">
              <div className="group-label">Recent Conversations</div>
              {chats.map(chat => (
                <div
                  key={chat.id}
                  className={`history-item ${currentChatId === chat.id ? 'active' : ''}`}
                  onClick={() => !editingChatId && setCurrentChatId(chat.id)}
                >
                  <MessageSquare size={16} className="item-icon" />
                  {editingChatId === chat.id ? (
                    <input
                      className="rename-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={handleRename}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                      autoFocus
                    />
                  ) : (
                    <span className="item-title">{chat.title}</span>
                  )}

                  <div className="item-actions">
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); startRename(chat); }}>
                      <Edit2 size={14} />
                    </button>
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="sidebar-user">
          <button className="user-menu-btn">
            <div className="user-avatar">A</div>
            <span className="user-name">Arpit</span>
          </button>
          <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/'); }}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="chat-main">
        <header className="chat-top-nav">
          <button className="toggle-sidebar" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <ChevronLeft size={20} style={{ transform: sidebarOpen ? 'rotate(0deg)' : 'rotate(180deg)' }} />
          </button>

          <div className="model-selector-pills">
            <button
              className={`pill ${modelType === 'gemini' ? 'active' : ''}`}
              onClick={() => setModelType('gemini')}
            >Gemini 1.5</button>
            <button
              className={`pill ${modelType === 'openai' ? 'active' : ''}`}
              onClick={() => setModelType('openai')}
            >GPT-4 Turbo</button>
          </div>

          <button
            className={`thinking-mode-btn ${thinkingMode ? 'active' : ''}`}
            onClick={() => setThinkingMode(!thinkingMode)}
            title="Premium Thinking Mode"
          >
            <Brain size={20} />
            {thinkingMode && <Sparkles size={12} className="premium-sparkle" />}
          </button>
        </header>

        <div className="chat-body">
          {!currentChatId && messages.length === 0 ? (
            <div className="welcome-screen">
              <div className="welcome-logo">
                <Sparkles size={40} className="logo-sparkle" />
              </div>
              <h2>How can I help you today?</h2>
              <div className="quick-actions">
                <div className="action-card" onClick={() => setInput("Explain quantum computing in simple terms")}>
                  Explain a concept
                </div>
                <div className="action-card" onClick={() => setInput("Write a professional resignation letter")}>
                  Write an email
                </div>
                <div className="action-card" onClick={() => setInput("How do I make a chocolate cake?")}>
                  Get a recipe
                </div>
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, i) => (
                <div key={i} className={`message-row ${msg.role}`}>
                  <div className="message-container">
                    <div className="message-avatar">
                      {msg.role === 'user' ? 'A' : <Bot size={18} />}
                    </div>
                    <div className="message-content">
                      <div className="sender-name">{msg.role === 'user' ? 'You' : 'Lumina AI'}</div>
                      {msg.thinking && (
                        <div className="thinking-process">
                          <div className="thinking-header"><Brain size={12} /> Thought Process</div>
                          <div className="thinking-text">{msg.thinking}</div>
                        </div>
                      )}
                      <div className="message-text">{msg.content}</div>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message-row assistant">
                  <div className="message-container">
                    <div className="message-avatar bot-loading"><Bot size={18} /></div>
                    <div className="message-content">
                      <div className="sender-name">Lumina AI</div>
                      <div className="typing-dots">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <footer className="chat-bottom">
          <div className="input-area">
            <form className="input-form glass" onSubmit={sendMessage}>
              <button type="button" className="attach-btn" title="Attach file">
                <Plus size={20} />
              </button>
              <textarea
                rows="1"
                placeholder="Message Lumina AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                className={`send-btn ${input.trim() ? 'active' : ''}`}
                disabled={!input.trim() || loading}
              >
                <ArrowUp size={20} />
              </button>
            </form>
            <div className="footer-disclaimer">
              Lumina AI can make mistakes. Consider checking important information.
            </div>
          </div>
        </footer>
      </main>

      <style jsx>{`
        .chat-interface {
          display: flex;
          height: 100vh;
          background: #0d0d0d;
          color: #ececec;
          font-family: 'Inter', sans-serif;
        }

        /* Sidebar */
        .sidebar {
          width: 260px;
          background: #000;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #222;
          transition: transform 0.3s ease;
        }
        .sidebar.closed { transform: translateX(-260px); width: 0; }

        .sidebar-nav { padding: 12px; }
        .new-chat-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .new-chat-btn:hover { background: #1a1a1a; }
        .btn-left { display: flex; align-items: center; gap: 8px; font-weight: 500; }
        .edit-btn-icon { color: #888; opacity: 0; transition: opacity 0.2s; }
        .new-chat-btn:hover .edit-btn-icon { opacity: 1; }

        .history-section { flex: 1; overflow-y: auto; padding: 12px; }
        .group-label { font-size: 0.75rem; color: #666; font-weight: 600; margin-bottom: 8px; padding-left: 8px; }
        .history-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 2px;
          color: #ccc;
          transition: 0.2s;
        }
        .history-item:hover { background: #1a1a1a; color: #fff; }
        .history-item.active { background: #212121; color: #fff; }
        .item-icon { flex-shrink: 0; color: #888; }
        .item-title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9rem; }
        
        .item-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
        .history-item:hover .item-actions { opacity: 1; }
        .action-btn { background: none; border: none; color: #888; cursor: pointer; padding: 4px; border-radius: 4px; }
        .action-btn:hover { color: #fff; background: #333; }
        
        .rename-input { background: #333; border: 1px solid #444; color: #fff; padding: 2px 4px; border-radius: 4px; width: 100%; outline: none; }

        .sidebar-user { padding: 12px; border-top: 1px solid #222; }
        .user-menu-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: transparent;
          border: none;
          color: #fff;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .user-menu-btn:hover { background: #1a1a1a; }
        .user-avatar { width: 28px; height: 28px; background: #3a3a3a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; }
        .logout-btn { background: none; border: none; color: #ff4d4d; display: flex; align-items: center; gap: 10px; padding: 10px; width: 100%; cursor: pointer; font-size: 0.9rem; opacity: 0.7; }
        .logout-btn:hover { opacity: 1; }

        /* Main */
        .chat-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .chat-top-nav { height: 60px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
        .toggle-sidebar { background: none; border: none; color: #888; cursor: pointer; padding: 8px; border-radius: 8px; }
        .toggle-sidebar:hover { background: #1a1a1a; color: #fff; }

        .model-selector-pills { background: #1a1a1a; padding: 4px; border-radius: 12px; display: flex; gap: 4px; }
        .pill { background: transparent; border: none; color: #888; padding: 6px 12px; font-size: 0.85rem; font-weight: 500; cursor: pointer; border-radius: 8px; }
        .pill.active { background: #333; color: #fff; }

        .thinking-mode-btn { background: none; border: 1px solid #333; color: #888; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; position: relative; transition: 0.3s; }
        .thinking-mode-btn.active { color: #00f2fe; border-color: #00f2fe; box-shadow: 0 0 10px rgba(0,242,254,0.2); }
        .premium-sparkle { position: absolute; top: -2px; right: -2px; color: #7000ff; }

        .chat-body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
        .welcome-screen { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 20px; }
        .welcome-logo { margin-bottom: 24px; }
        .logo-sparkle { color: #00f2fe; filter: drop-shadow(0 0 8px #00f2fe); }
        .quick-actions { display: flex; gap: 12px; margin-top: 32px; flex-wrap: wrap; justify-content: center; }
        .action-card { background: #1a1a1a; border: 1px solid #333; padding: 12px 20px; border-radius: 12px; cursor: pointer; color: #bbb; transition: 0.2s; font-size: 0.9rem; }
        .action-card:hover { border-color: #444; color: #fff; background: #222; }

        .messages-list { max-width: 800px; width: 100%; margin: 0 auto; padding: 40px 20px; display: flex; flex-direction: column; gap: 40px; }
        .message-row { display: flex; width: 100%; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .message-container { display: flex; gap: 20px; width: 100%; }
        .message-avatar { width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: #333; font-weight: 700; font-size: 0.8rem; }
        .assistant .message-avatar { background: #00f2fe; color: #000; }
        
        .message-content { flex: 1; min-width: 0; }
        .sender-name { font-weight: 700; font-size: 0.85rem; margin-bottom: 6px; }
        .message-text { line-height: 1.6; color: #ececec; font-size: 1.05rem; white-space: pre-wrap; word-wrap: break-word; }

        .thinking-process { background: #111; border: 1px dashed #333; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
        .thinking-header { display: flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 700; color: #00f2fe; text-transform: uppercase; margin-bottom: 8px; }
        .thinking-text { font-size: 0.9rem; color: #888; font-style: italic; }

        .typing-dots { display: flex; gap: 4px; padding-top: 10px; }
        .typing-dots span { width: 8px; height: 8px; background: #444; border-radius: 50%; animation: dotBounce 1s infinite alternate; }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce { to { opacity: 0.3; transform: translateY(-4px); } }

        /* Bottom */
        .chat-bottom { padding: 24px; }
        .input-area { max-width: 800px; width: 100%; margin: 0 auto; }
        .input-form { display: flex; align-items: flex-end; gap: 12px; padding: 10px 14px; background: #1a1a1a; border-radius: 20px; border: 1px solid #333; }
        .input-form:focus-within { border-color: #444; }
        
        .attach-btn { background: none; border: none; color: #888; cursor: pointer; padding: 8px; border-radius: 50%; }
        .attach-btn:hover { background: #2a2a2a; color: #fff; }
        
        textarea { flex: 1; background: transparent; border: none; color: #fff; font-size: 1rem; padding: 10px 0; outline: none; resize: none; max-height: 200px; font-family: inherit; }
        
        .send-btn { width: 36px; height: 36px; border-radius: 50%; border: none; background: #333; color: #000; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.3s; margin-bottom: 2px; }
        .send-btn.active { background: #fff; }
        .send-btn:disabled { opacity: 0.5; cursor: default; }

        .footer-disclaimer { text-align: center; font-size: 0.72rem; color: #555; margin-top: 12px; }

        @media (max-width: 768px) {
          .sidebar { position: fixed; height: 100vh; z-index: 100; }
          .sidebar.closed { transform: translateX(-100%); width: 260px; }
        }
      `}</style>
    </div>
  );
};

export default ChatPage;
