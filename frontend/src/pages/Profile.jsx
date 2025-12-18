import { useState, useEffect } from 'react';
import api from '../utils/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Profil yüklenemedi' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Fotoğraf boyutu 5MB\'dan küçük olmalıdır' });
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
      setMessage({ type: 'error', text: 'Sadece JPG, PNG veya GIF formatında fotoğraf yükleyebilirsiniz' });
      return;
    }

    try {
      setUploading(true);
      setMessage({ type: '', text: '' });

      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post(
        '/players/profile/photo',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage({ type: 'success', text: 'Profil fotoğrafı başarıyla güncellendi!' });

      // Reload profile to show new photo
      await loadProfile();
    } catch (error) {
      console.error('Error uploading photo:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Fotoğraf yüklenemedi' });
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm('Profil fotoğrafınızı silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setUploading(true);
      setMessage({ type: '', text: '' });

      await api.delete('/players/profile/photo');

      setMessage({ type: 'success', text: 'Profil fotoğrafı silindi' });
      await loadProfile();
    } catch (error) {
      console.error('Error deleting photo:', error);
      setMessage({ type: 'error', text: 'Fotoğraf silinemedi' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (!user) {
    return <div className="card">Profil bilgilerine erişilemedi</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>Profilim</h2>

      {message.text && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            borderRadius: '0.5rem',
            backgroundColor: message.type === 'success' ? '#d1fae5' : '#fee2e2',
            color: message.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#6ee7b7' : '#fca5a5'}`
          }}
        >
          {message.text}
        </div>
      )}

      <div className="card" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Profile Photo Section */}
          <div style={{ flex: '0 0 auto' }}>
            <div
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                overflow: 'hidden',
                border: '4px solid #e5e7eb',
                marginBottom: '1rem'
              }}
            >
              {user.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user.full_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '48px',
                    fontWeight: 'bold'
                  }}
                >
                  {user.full_name.charAt(0)}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label
                htmlFor="photo-upload"
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  borderRadius: '0.375rem',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: uploading ? 0.5 : 1
                }}
              >
                {uploading ? 'Yükleniyor...' : user.profile_photo ? 'Fotoğrafı Değiştir' : 'Fotoğraf Yükle'}
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handlePhotoUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />

              {user.profile_photo && (
                <button
                  onClick={handlePhotoDelete}
                  disabled={uploading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    opacity: uploading ? 0.5 : 1
                  }}
                >
                  Fotoğrafı Sil
                </button>
              )}
            </div>

            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem', textAlign: 'center' }}>
              Maksimum 5MB<br />JPG, PNG veya GIF
            </p>
          </div>

          {/* User Info Section */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                İsim Soyisim
              </label>
              <div style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                {user.full_name}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                Kullanıcı Adı
              </label>
              <div style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                {user.username}
              </div>
            </div>

            {user.phone && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                  Telefon
                </label>
                <div style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                  {user.phone}
                </div>
              </div>
            )}

            {user.category && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                  Kategori
                </label>
                <div style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                  {user.category}
                </div>
              </div>
            )}

            {user.group && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                  Grup
                </label>
                <div style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.375rem', border: '1px solid #e5e7eb' }}>
                  {user.group}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
