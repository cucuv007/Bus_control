import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Giriş başarısız');
        setLoading(false);
        return;
      }

      if (data.success) {
        // Session bilgisini localStorage'a kaydet
        localStorage.setItem('userSession', JSON.stringify({
          username: data.user.Kullanıcı,
          gorev: data.user.Görev,
          loginTime: new Date().toISOString()
        }));

        // code.html sayfasına yönlendir
        window.location.href = '/code.html';
      }
    } catch (err) {
      setError('Bağlantı hatası: ' + err.message);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Giriş Yap - Bus Control</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={styles.container}>
        <div style={styles.loginBox}>
          <h1 style={styles.title}>🚌 Otobüs Kontrol</h1>
          <p style={styles.subtitle}>Giriş Yap</p>
          
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Kullanıcı Adı</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={styles.input}
                placeholder="Kullanıcı adınızı girin"
                autoFocus
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="Şifrenizi girin"
              />
            </div>

            {error && (
              <div style={styles.error}>
                ❌ {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '⏳ Giriş yapılıyor...' : '🔐 Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    fontFamily: 'Arial, sans-serif'
  },
  loginBox: {
    background: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '400px',
    margin: '20px'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '32px',
    color: '#2c3e50',
    textAlign: 'center'
  },
  subtitle: {
    margin: '0 0 30px 0',
    fontSize: '16px',
    color: '#7f8c8d',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#2c3e50'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    outline: 'none',
    transition: 'border-color 0.3s',
    ':focus': {
      borderColor: '#667eea'
    }
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: 'white',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'scale(1.02)'
    }
  },
  error: {
    padding: '12px',
    background: '#fee',
    color: '#c33',
    borderRadius: '6px',
    fontSize: '14px',
    textAlign: 'center'
  }
};
