import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    // Doğrudan HTML dosyasına yönlendir
    window.location.href = '/code.html';
  }, []);

  return <div style={{ textAlign: 'center', padding: '20px' }}>Yönlendiriliyor...</div>;
}
