import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, LogIn, Wallet, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface LoginPageProps {
  onGoRegister: () => void;
}

export default function LoginPage({ onGoRegister }: LoginPageProps) {
  const { login, isLoading, error, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (error) setLocalError(error);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    if (!username.trim() || !password) {
      setLocalError('Please fill in all fields');
      return;
    }
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setLocalError(String(err));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Wallet size={28} color="white" />
          </div>
          <div>
            <div className="auth-brand">BudgetFlow</div>
            <div className="auth-tagline">Personal Finance Manager</div>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {localError && (
          <div className="auth-error">
            <AlertCircle size={15} />
            {localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label className="input-label">Username</label>
            <input
              className="input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', display: 'flex',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={isLoading}
          >
            {isLoading
              ? <span className="auth-spinner" />
              : <><LogIn size={16} /> Sign In</>
            }
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account?{' '}
          <button className="auth-link" onClick={onGoRegister}>
            Create one
          </button>
        </div>
      </div>

      {/* Decorative background blobs */}
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />
    </div>
  );
}
