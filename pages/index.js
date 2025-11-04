import { useEffect, useState } from "react";
import { supabase } from "./api/supabase";

export default function Home() {
  const [bilgi, setBilgi] = useState("Yükleniyor...");
  const [kalan, setKalan] = useState(null);
  const [currentTarife, setCurrentTarife] = useState(null);
  const [intervalId, setIntervalId] = useState(null);

  // Süreyi mm:ss formatına dönüştür
  const formatSure = (s) => {
    const dk = Math.floor(s / 60);
    const sn = s % 60;
    return `${dk.toString().padStart(2, "0")}:${sn.toString().padStart(2, "0")}`;
  };

  async function kontrolEtVeBaslat() {
    clearInterval(intervalId);

    const now = new Date();

    // Supabase'ten VL13 tablosunu oku
    const { data, error } = await supabase
      .from("VL13")
      .select("Tarife_Saati, Plaka, Tarife");

    if (error) {
      console.error("Supabase hatası:", error);
      setBilgi("Veri alınamadı.");
      return;
    }

    // En yakın 10 dakika altındaki tarifeyi bul
    const yaklasan = data
      .map((row) => ({
        ...row,
        fark: (new Date(row.Tarife_Saati) - now) / 1000, // saniye farkı
      }))
      .filter((r) => r.fark > 0 && r.fark <= 600) // 10 dakika (600 sn)
      .sort((a, b) => a.fark - b.fark)[0];

    if (!yaklasan) {
      setBilgi("Yaklaşan tarife yok.");
      setKalan(null);
      return;
    }

    setCurrentTarife(yaklasan);

    let kalanSaniye = Math.floor(yaklasan.fark);
    setKalan(kalanSaniye);

    const id = setInterval(() => {
      kalanSaniye--;
      if (kalanSaniye <= 0) {
        clearInterval(id);
        kontrolEtVeBaslat(); // Yeni tarifeyi bul
      } else {
        setKalan(kalanSaniye);
      }
    }, 1000);
    setIntervalId(id);
  }

  useEffect(() => {
    kontrolEtVeBaslat();

    // Her 15 saniyede bir tekrar kontrol et
    const kontrolTimer = setInterval(kontrolEtVeBaslat, 15000);
    return () => {
      clearInterval(kontrolTimer);
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      {/* Üstte bilgilendirme alanı */}
      <div
        style={{
          background: "#212529",
          color: "#fff",
          padding: "15px 20px",
          borderRadius: "12px",
          boxShadow: "0 3px 6px rgba(0,0,0,0.3)",
          marginBottom: "25px",
          textAlign: "center",
          fontSize: "1.3em",
        }}
      >
        {currentTarife && kalan !== null ? (
          <>
            {currentTarife.Tarife} tarifesi {currentTarife.Plaka} kalan süre{" "}
            {formatSure(kalan)}
          </>
        ) : (
          bilgi
        )}
      </div>

      {/* Buradan sonrası senin mevcut dashboard içeriğin */}
      <iframe
        src="/code.html"
        style={{
          width: "100%",
          height: "80vh",
          border: "none",
          borderRadius: "10px",
        }}
      ></iframe>
    </div>
  );
}
