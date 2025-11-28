import { useState, useEffect } from 'react';
import { onAuthChange, registerUser, loginUser, loginWithGoogle, logoutUser, resetPassword } from '../lib/auth';
import type { User } from 'firebase/auth';
import './AuthTest.css';

export const AuthTest = () => {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleRegister = async () => {
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await registerUser(email, password, displayName);
      setMessage('登録成功！確認メールを送信しました。');
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await loginUser(email, password);
      setMessage('ログイン成功！');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      setMessage('Googleログイン成功！');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    setError('');
    try {
      await logoutUser();
      setMessage('ログアウトしました');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await resetPassword(email);
      setMessage('パスワードリセットメールを送信しました');
      setEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-test-container">
      <h2>Firebase Authentication Test</h2>
      
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}
      
      {user ? (
        <div className="user-info">
          <h3>ログイン中</h3>
          <p><strong>UID:</strong> {user.uid}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>表示名:</strong> {user.displayName || '未設定'}</p>
          <p><strong>メール確認:</strong> {user.emailVerified ? '済み' : '未確認'}</p>
          <button 
            onClick={handleLogout} 
            disabled={isLoading}
            className="btn btn-danger"
          >
            {isLoading ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      ) : (
        <div className="auth-forms">
          <div className="mode-selector">
            <button 
              className={mode === 'login' ? 'active' : ''} 
              onClick={() => setMode('login')}
            >
              ログイン
            </button>
            <button 
              className={mode === 'register' ? 'active' : ''} 
              onClick={() => setMode('register')}
            >
              新規登録
            </button>
            <button 
              className={mode === 'reset' ? 'active' : ''} 
              onClick={() => setMode('reset')}
            >
              パスワードリセット
            </button>
          </div>

          <div className="form-content">
            {mode === 'register' && (
              <input
                type="text"
                placeholder="表示名（任意）"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field"
              />
            )}
            
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
            />
            
            {mode !== 'reset' && (
              <input
                type="password"
                placeholder="パスワード（6文字以上）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            )}

            <div className="button-group">
              {mode === 'login' && (
                <>
                  <button 
                    onClick={handleLogin} 
                    disabled={isLoading}
                    className="btn btn-primary"
                  >
                    {isLoading ? 'ログイン中...' : 'ログイン'}
                  </button>
                  <button 
                    onClick={handleGoogleLogin} 
                    disabled={isLoading}
                    className="btn btn-google"
                  >
                    {isLoading ? '処理中...' : 'Googleでログイン'}
                  </button>
                </>
              )}
              
              {mode === 'register' && (
                <button 
                  onClick={handleRegister} 
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? '登録中...' : '新規登録'}
                </button>
              )}
              
              {mode === 'reset' && (
                <button 
                  onClick={handleResetPassword} 
                  disabled={isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? '送信中...' : 'リセットメール送信'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
