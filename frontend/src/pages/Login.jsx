import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/my-matches');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* Arka plan logosu - CSS ile kontrol ediliyor */}
      <div className="login-background"></div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="tennis-ball-icon">🎾</div>
            <h1>GMB ENDUSTRI BURSA OPEN</h1>
            <p>Tenis Turnuvası Yönetim Sistemi</p>
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>
                <span className="label-icon">👤</span>
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınızı girin"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <span className="label-icon">🔒</span>
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
                required
              />
            </div>

            <button type="submit" className="btn btn-login" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Giriş yapılıyor...
                </>
              ) : (
                <>Giriş Yap</>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Test Hesabı: admin / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;