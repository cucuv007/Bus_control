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

    // 1. Her iki tablodan veri çek
    const { data: operasyonData } = await supabase
      .from('Operasyon_Açıklama')
      .select('*')
      .order('id', { ascending: false });

    const { data: depolamaData } = await supabase
      .from('Depolama_Açıklama')
      .select('*')
      .order('id', { ascending: false });

    // 2. Eski veri kontrolü
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let hasOldData = false;

    const checkOldData = (data) => {
      if (!data || data.length === 0) return false;
      
      return data.some(row => {
        if (row.Tarih) {
          const rowDate = new Date(row.Tarih);
          rowDate.setHours(0, 0, 0, 0);
          return rowDate < today;
        }
        return false;
      });
    };

    hasOldData = checkOldData(operasyonData) || checkOldData(depolamaData);

    // Eski veri yoksa işlem yapma
    if (!hasOldData) {
      console.log('✅ Eski veri yok, güncelleme gerekmiyor');
      return res.status(200).json({
        success: true,
        updated: false,
        message: 'Eski veri bulunamadı'
      });
    }

    console.log('⚠️ Eski veri tespit edildi, güncelleme başlıyor...');

    // 3. Kullanıcıları getir
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

    // 4. Excel dosyaları oluştur (sadece veri varsa)
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
    }

    if (depolamaData && depolamaData.length > 0) {
      depolamaBase64 = await createExcelBase64(depolamaData, 'Depolama');
    }

    console.log('✅ Excel dosyaları oluşturuldu');

    // 5. Mail gönder
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
      console.log('✅ Mailler gönderildi');
    }

    // 6. Tabloları temizle
    await supabase.from('Operasyon_Açıklama').delete().gte('id', 0);
    await supabase.from('Depolama_Açıklama').delete().gte('id', 0);

    console.log('✅ Tablolar temizlendi');

    return res.status(200).json({
      success: true,
      updated: true,
      message: 'Eski veriler temizlendi ve mailler gönderildi',
      emailCount: users.length
    });

  } catch (err) {
    console.error('Auto update error:', err);
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}
