import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    try {
      const response = await api.get('/sponsors');
      setSponsors(response.data);
    } catch (error) {
      console.error('Failed to load sponsors:', error);
    }
  }

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
      {/* Arka plan - tenis kortu temalı */}
      <div className="login-background">
        {/* Dekoratif tenis topları - sol taraf */}
        <div style={{
          position: 'absolute',
          fontSize: '70px',
          opacity: 0.13,
          bottom: '15%',
          left: '5%',
          animation: 'floatBall1 10s ease-in-out infinite reverse, rotateBall 8s linear infinite'
        }}>🎾</div>
        <div style={{
          position: 'absolute',
          fontSize: '50px',
          opacity: 0.11,
          top: '20%',
          left: '8%',
          animation: 'floatBall2 12s ease-in-out infinite'
        }}>🎾</div>
        <div style={{
          position: 'absolute',
          fontSize: '45px',
          opacity: 0.09,
          top: '60%',
          left: '3%',
          animation: 'floatBall3 15s ease-in-out infinite'
        }}>🎾</div>

        {/* Dekoratif tenis topları - sağ taraf */}
        <div style={{
          position: 'absolute',
          fontSize: '65px',
          opacity: 0.12,
          top: '15%',
          right: '8%',
          animation: 'floatBall4 11s ease-in-out infinite'
        }}>🎾</div>
        <div style={{
          position: 'absolute',
          fontSize: '55px',
          opacity: 0.1,
          bottom: '25%',
          right: '5%',
          animation: 'floatBall2 13s ease-in-out infinite reverse'
        }}>🎾</div>
        <div style={{
          position: 'absolute',
          fontSize: '40px',
          opacity: 0.08,
          top: '45%',
          right: '12%',
          animation: 'bounceDiagonal 14s ease-in-out infinite'
        }}>🎾</div>

        {/* Büyük arka plan topları */}
        <div style={{
          position: 'absolute',
          fontSize: '100px',
          opacity: 0.05,
          bottom: '5%',
          right: '15%',
          animation: 'floatBall3 18s ease-in-out infinite'
        }}>🎾</div>
        <div style={{
          position: 'absolute',
          fontSize: '95px',
          opacity: 0.04,
          top: '10%',
          left: '20%',
          animation: 'floatBall4 16s ease-in-out infinite reverse'
        }}>🎾</div>

        {/* Ekstra toplar - orta bölge */}
        <div style={{
          position: 'absolute',
          fontSize: '42px',
          opacity: 0.09,
          bottom: '40%',
          left: '15%',
          animation: 'floatBall1 9s ease-in-out infinite, rotateBall 6s linear infinite'
        }}>🎾</div>
        <div style={{
          position: 'absolute',
          fontSize: '38px',
          opacity: 0.07,
          top: '70%',
          right: '20%',
          animation: 'floatBall3 10s ease-in-out infinite reverse'
        }}>🎾</div>
        <div style={{
          position: 'absolute',
          fontSize: '48px',
          opacity: 0.08,
          top: '35%',
          left: '25%',
          animation: 'bounceDiagonal 11s ease-in-out infinite reverse'
        }}>🎾</div>
        <div style={{
          position: 'absolute',
          fontSize: '35px',
          opacity: 0.06,
          bottom: '55%',
          right: '25%',
          animation: 'floatBall2 13s ease-in-out infinite'
        }}>🎾</div>

        {/* Küçük hızlı toplar */}
        <div style={{
          position: 'absolute',
          fontSize: '28px',
          opacity: 0.1,
          top: '50%',
          left: '12%',
          animation: 'floatBall4 7s ease-in-out infinite'
        }}>🎾</div>
        <div style={{
          position: 'absolute',
          fontSize: '32px',
          opacity: 0.09,
          bottom: '30%',
          right: '18%',
          animation: 'floatBall1 8s ease-in-out infinite reverse'
        }}>🎾</div>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <img src="/bursa-open-logo.png" alt="Bursa Open" className="login-logo" style={{ width: '220px', height: 'auto', marginBottom: '0.25rem' }} />
            <h1>GMB ENDUSTRİ<br/>BURSA OPEN</h1>
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

        </div>

        {/* Katkı Sağlayanlar */}
        {sponsors.length > 0 && (() => {
          const mainSponsor = sponsors.find(s => s.display_order === 0);
          const secondarySponsors = sponsors.filter(s => s.display_order > 0);

          return (
            <div className="login-sponsors" style={{ marginTop: '2rem', maxWidth: '900px', margin: '2rem auto 0' }}>
              {/* Ana Katkı Sağlayan */}
              {mainSponsor && (
                <div className="main-sponsor" style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Ana Katkı Sağlayanımız</h3>
                  {mainSponsor.link_url ? (
                    <a href={mainSponsor.link_url} target="_blank" rel="noopener noreferrer">
                      <img src={mainSponsor.logo_url} alt={mainSponsor.name} />
                    </a>
                  ) : (
                    <img src={mainSponsor.logo_url} alt={mainSponsor.name} />
                  )}
                </div>
              )}

              {/* Destekleyenler */}
              {secondarySponsors.length > 0 && (
                <div className="secondary-sponsors">
                  <h3 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Destekleyenler</h3>
                  <div className="secondary-sponsors-grid">
                    {secondarySponsors.map((sponsor) => (
                      <div key={sponsor.id} className="secondary-sponsor-item">
                        {sponsor.link_url ? (
                          <a href={sponsor.link_url} target="_blank" rel="noopener noreferrer">
                            <img src={sponsor.logo_url} alt={sponsor.name} />
                          </a>
                        ) : (
                          <img src={sponsor.logo_url} alt={sponsor.name} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

export default Login;