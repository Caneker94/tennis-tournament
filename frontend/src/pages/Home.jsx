import { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';

function Home() {
  const { user } = useAuth();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    try {
      const response = await api.get('/sponsors');
      setSponsors(response.data);
    } catch (error) {
      console.error('Failed to load sponsors:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {user && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          marginBottom: '1.5rem',
          padding: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'white' }}>
            Hoş Geldiniz, {user.full_name || user.username}!
          </h2>
          <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
            GMB Endüstri Bursa Open Turnuvasına katılımınız için teşekkür ederiz.
          </p>
        </div>
      )}
      {sponsors.length > 0 && (() => {
        const mainSponsor = sponsors.find(s => s.display_order === 0);
        const secondarySponsors = sponsors.filter(s => s.display_order > 0);

        return (
          <div className="sponsor-slider">
            <h2>Katkı Sağlayanlarımız</h2>

            {/* Ana Katkı Sağlayan */}
            {mainSponsor && (
              <div className="main-sponsor">
                <h3>Ana Katkı Sağlayanımız</h3>
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
                <h3>Destekleyenler</h3>
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

      <div className="card">
        <h2>Turnuva Hakkında</h2>
        <p style={{ marginTop: '1rem', lineHeight: '1.6' }}>
          GMB ENDUSTRI BURSA OPEN turnuvasına hoş geldiniz! Bu platformda maç programlarını takip edebilir,
          puan durumunu görüntüleyebilir ve kendi maç skorlarınızı girebilirsiniz.
        </p>

        <h3 style={{ marginTop: '1.5rem' }}>Kategoriler</h3>
        <div style={{ marginTop: '1rem' }}>
          <h4>Erkekler:</h4>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Elite</li>
            <li>Master</li>
            <li>Rising</li>
          </ul>

          <h4 style={{ marginTop: '1rem' }}>Kadınlar:</h4>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Elite</li>
            <li>Rising</li>
          </ul>
        </div>

        <h3 style={{ marginTop: '1.5rem' }}>Puanlama Sistemi</h3>
        <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>Galibiyet: 3 puan</li>
          <li>Mağlubiyet: 1 puan</li>
          <li>Walkover (maça çıkmama): 0 puan</li>
        </ul>
      </div>
    </div>
  );
}

export default Home;
