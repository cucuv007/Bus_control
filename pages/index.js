export default function Home() {
  return (
    <div style={{ textAlign: 'center', padding: '40px', fontFamily: 'Arial' }}>
      <h1>Yönlendiriliyor...</h1>
      <p>Lütfen bekleyin...</p>
      <script dangerouslySetInnerHTML={{__html: `window.location.href = '/code.html';`}} />
    </div>
  );
}
