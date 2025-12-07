import { useState, useEffect } from 'react';
import api from '../utils/api';

function Home() {
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
      {sponsors.length > 0 && (
        <div className="sponsor-slider">
          <h2>Sponsorlarımız</h2>
          <div className="sponsors-grid">
            {sponsors.map((sponsor) => (
              <div key={sponsor.id} className="sponsor-item">
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
            <li>Master</li>
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
