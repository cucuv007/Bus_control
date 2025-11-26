// pages/api/auto-update-aciklamalar.js
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    },
    responseLimit: '50mb'
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 Otomatik güncelleme kontrolü başladı...');

    // 1. Saat kontrolü - Sadece 04:00:00 ve sonrasında çalışsın
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentSecond = now.getSeconds();
    
    // Saat 04:00:00'dan önceyse işlem yapma
    if (currentHour < 4) {
      console.log(`⏰ Henüz saat 04:00:00 olmadı (Şu an: ${currentHour}:${currentMinute}:${currentSecond}), güncelleme yapılmayacak`);
      return res.status(200).json({
        success: true,
        updated: false,
        message: 'Güncelleme saati henüz gelmedi (04:00:00 öncesi)'
      });
    }

    console.log(`✅ Saat kontrolü geçildi: ${currentHour}:${currentMinute}:${currentSecond}`);

    // 2. Her iki tablodan veri çek
    const { data: operasyonData } = await supabase
      .from('Operasyon_Açıklama')
      .select('*')
      .order('id', { ascending: false });

    const { data: depolamaData } = await supabase
      .from('Depolama_Açıklama')
      .select('*')
      .order('id', { ascending: false });

    // 3. Eski veri kontrolü - O günün herhangi bir saatinden eski kayıt var mı?
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let hasOldData = false;
    let oldestDate = null;

    const checkOldData = (data) => {
      if (!data || data.length === 0) return false;
      
      return data.some(row => {
        if (row.Tarih) {
          const rowDate = new Date(row.Tarih);
          rowDate.setHours(0, 0, 0, 0);
          
          if (rowDate < todayStart) {
            if (!oldestDate || rowDate < oldestDate) {
              oldestDate = rowDate;
            }
            return true;
          }
        }
        return false;
      });
    };

    hasOldData = checkOldData(operasyonData) || checkOldData(depolamaData);

    // Eski veri yoksa işlem yapma
    if (!hasOldData) {
      console.log('✅ Tüm veriler güncel (bugünden eski veri yok)');
      return res.status(200).json({
        success: true,
        updated: false,
        message: 'Tüm veriler güncel'
      });
    }

    const oldestDateStr = oldestDate ? oldestDate.toLocaleDateString('tr-TR') : '';
    console.log(`⚠️ Eski veri tespit edildi! En eski kayıt: ${oldestDateStr}, güncelleme başlıyor...`);

    // 4. Kullanıcıları getir
    const { data: users } = await supabase
      .from('Kullanıcı_Verileri')
      .select('Kullanıcı, mail');

    if (!users || users.length === 0) {
      console.log('⚠️ Kullanıcı bulunamadı');
      return res.status(200).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    console.log(`👥 ${users.length} kullanıcı bulundu`);

    // 5. Excel dosyaları oluştur - Her iki tablonun TÜM verilerini gönder
    let operasyonBase64 = null;
    let depolamaBase64 = null;

    const createExcelBase64 = async (data, sheetName) => {
      if (!data || data.length === 0) return null;

      const XLSX = (await import('xlsx')).default;
      
      const excelData = data.map(row => {
        let tarihStr = '';
        if (row.Tarih) {
          const tarihObj = new Date(row.Tarih);
          const yil = tarihObj.getFullYear();
          const ay = String(tarihObj.getMonth() + 1).padStart(2, '0');
          const gun = String(tarihObj.getDate()).padStart(2, '0');
          const saat = String(tarihObj.getHours()).padStart(2, '0');
          const dakika = String(tarihObj.getMinutes()).padStart(2, '0');
          const saniye = String(tarihObj.getSeconds()).padStart(2, '0');
          tarihStr = `${gun}.${ay}.${yil} ${saat}:${dakika}:${saniye}`;
        }
        
        return {
          'Tarih': tarihStr,
          'Hat Adı': row.Hat_Adi || '',
          'Çalışma Zamanı': row['Çalışma_Zamanı'] || '',
          'Tarife': row.Tarife || '',
          'Tarife Saati': row.Tarife_Saati || '',
          'Plaka': row.Plaka || '',
          'Açıklama': row.Açıklama || ''
        };
      });

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      const uint8Array = new Uint8Array(buffer);
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        binaryString += String.fromCharCode.apply(null, chunk);
      }
      return Buffer.from(binaryString, 'binary').toString('base64');
    };

    if (operasyonData && operasyonData.length > 0) {
      operasyonBase64 = await createExcelBase64(operasyonData, 'Operasyon');
      console.log(`📊 Operasyon Excel oluşturuldu (${operasyonData.length} kayıt)`);
    }

    if (depolamaData && depolamaData.length > 0) {
      depolamaBase64 = await createExcelBase64(depolamaData, 'Depolama');
      console.log(`📊 Depolama Excel oluşturuldu (${depolamaData.length} kayıt)`);
    }

    console.log('✅ Excel dosyaları oluşturuldu');

    // 6. Mail gönder
    if (operasyonBase64 || depolamaBase64) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const dateStr = new Date().toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      const attachments = [];
      
      if (operasyonBase64) {
        attachments.push({
          filename: `Operasyon_Aciklamalar_${timestamp}.xlsx`,
          content: Buffer.from(operasyonBase64, 'base64'),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }

      if (depolamaBase64) {
        attachments.push({
          filename: `Depolama_Aciklamalar_${timestamp}.xlsx`,
          content: Buffer.from(depolamaBase64, 'base64'),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
      }

      const sendPromises = users.map(async (recipient) => {
        try {
          await transporter.sendMail({
            from: `"Bus Control Sistemi" <${process.env.SMTP_USER}>`,
            to: recipient.mail,
            subject: `[Otomatik] Açıklama Sistemi Güncellendi - ${dateStr}`,
            html: `
              <h2>Merhaba ${recipient.Kullanıcı},</h2>
              <p>Sistemde eski tarihli açıklama kayıtları tespit edildi ve otomatik temizleme yapıldı.</p>
              <p><strong>İşlem Zamanı:</strong> ${dateStr}</p>
              <p>Ekte temizlenmeden önceki açıklama kayıtlarını bulabilirsiniz:</p>
              <ul>
                ${operasyonBase64 ? '<li>Operasyon Açıklamaları</li>' : ''}
                ${depolamaBase64 ? '<li>Depolama Açıklamaları</li>' : ''}
              </ul>
              <hr>
              <p><em>Bu mail otomatik olarak gönderilmiştir.</em></p>
            `,
            attachments
          });
          return { email: recipient.mail, success: true };
        } catch (err) {
          console.error(`❌ Mail gönderilemedi (${recipient.mail}):`, err.message);
          return { email: recipient.mail, success: false };
        }
      });

      await Promise.all(sendPromises);
      console.log(`✅ Mailler gönderildi (${users.length} kullanıcı)`);
    }

    // 7. Her iki tabloyu da tamamen temizle
    console.log('🧹 Tablolar temizleniyor...');
    
    await supabase.from('Operasyon_Açıklama').delete().gte('id', 0);
    console.log('✅ Operasyon_Açıklama tablosu temizlendi');
    
    await supabase.from('Depolama_Açıklama').delete().gte('id', 0);
    console.log('✅ Depolama_Açıklama tablosu temizlendi');

    return res.status(200).json({
      success: true,
      updated: true,
      message: 'Eski veriler temizlendi ve mailler gönderildi',
      emailCount: users.length,
      operasyonCount: operasyonData?.length || 0,
      depolamaCount: depolamaData?.length || 0
    });

  } catch (err) {
    console.error('Auto update error:', err);
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}
