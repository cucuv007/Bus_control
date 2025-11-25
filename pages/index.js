import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Ana sayfaya geldiğinde login'e yönlendir
    router.push('/login');
  }, [router]);

  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Arial' }}>
      <h1>Yönlendiriliyor...</h1>
      <p>Lütfen bekleyin...</p>
    </div>
  );
}
