import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import axios from 'axios';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await axios.post(`${API_URL}/auth/login`, { email, password });
        localStorage.setItem('token', res.data.access_token);
        navigate('/chat');
      } else {
        await axios.post(`${API_URL}/auth/signup`, { email, password });
        setIsLogin(true);
        alert('Account created! Please login.');
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container flex-center">
      <div className="auth-card glass animate-fade">
        <div className="auth-header">
          <Sparkles className="icon-accent" size={40} />
          <h2>{isLogin ? 'Welcome Back' : 'Join Lumina AI'}</h2>
          <p>{isLogin ? 'Enter your credentials to continue' : 'Create an account to start chatting'}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Sign Up'} <ArrowRight size={20} />
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button className="toggle-btn" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          min-height: 100vh;
          background: radial-gradient(circle at center, #1a1a1a 0%, #050505 100%);
        }
        .auth-card {
          width: 100%;
          max-width: 450px;
          padding: 50px;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 40px;
        }
        .auth-header h2 {
          font-size: 2rem;
          margin-top: 20px;
        }
        .auth-header p {
          color: var(--text-dim);
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .input-group {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-dim);
        }
        input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--glass-border);
          padding: 15px 15px 15px 50px;
          border-radius: 8px;
          color: white;
          outline: none;
          transition: border-color 0.3s;
        }
        input:focus {
          border-color: var(--accent-primary);
        }
        .w-full {
          width: 100%;
          justify-content: center;
        }
        .auth-footer {
          margin-top: 30px;
          text-align: center;
          color: var(--text-dim);
        }
        .toggle-btn {
          background: none;
          border: none;
          color: var(--accent-primary);
          font-weight: 600;
          margin-left: 8px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;
