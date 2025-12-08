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

    // 1. Saat kontrolü zaten frontend'de yapıldı (AutoReset ile)
    // Buraya geldiysek saat uygun demektir
    console.log('✅ Saat kontrolü frontend tarafından geçildi');

    // 2. Her iki tablodan veri çek
    console.log('📊 Tablolardan veri çekiliyor...');
    
    const { data: operasyonData, error: opError } = await supabase
      .from('Operasyon_Açıklama')
      .select('*')
      .order('id', { ascending: false });

    if (opError) {
      console.error('❌ Operasyon_Açıklama sorgu hatası:', opError);
      throw new Error('Operasyon_Açıklama verisi çekilemedi: ' + opError.message);
    }

    const { data: depolamaData, error: depError } = await supabase
      .from('Depolama_Açıklama')
      .select('*')
      .order('id', { ascending: false });

    if (depError) {
      console.error('❌ Depolama_Açıklama sorgu hatası:', depError);
      throw new Error('Depolama_Açıklama verisi çekilemedi: ' + depError.message);
    }

    console.log(`📊 Veriler çekildi - Operasyon: ${operasyonData?.length || 0}, Depolama: ${depolamaData?.length || 0}`);

    // 3. Eski veri kontrolü - O günün herhangi bir saatinden eski kayıt var mı?
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    console.log(`📅 Bugünün başlangıcı: ${todayStart.toISOString()} (${todayStart.toLocaleDateString('tr-TR')})`);

    let hasOldData = false;
    let oldestDate = null;

    const checkOldData = (data, tableName) => {
      if (!data || data.length === 0) {
        console.log(`ℹ️ ${tableName}: Veri yok`);
        return false;
      }
      
      console.log(`🔍 ${tableName}: ${data.length} kayıt kontrol ediliyor...`);
      
      let foundOld = false;
      data.forEach((row, index) => {
        if (row.Tarih) {
          const rowDate = new Date(row.Tarih);
          const rowDateOnly = new Date(rowDate);
          rowDateOnly.setHours(0, 0, 0, 0);
          
          const isOld = rowDateOnly < todayStart;
          
          if (index < 3 || isOld) { // İlk 3 kaydı veya eski olanları logla
            console.log(`  - Kayıt ${index + 1}: ${rowDate.toLocaleString('tr-TR')} ${isOld ? '⚠️ ESKİ' : '✅ GÜNCEL'}`);
          }
          
          if (isOld) {
            foundOld = true;
            if (!oldestDate || rowDateOnly < oldestDate) {
              oldestDate = rowDateOnly;
            }
          }
        }
      });
      
      return foundOld;
    };

    const operasyonHasOld = checkOldData(operasyonData, 'Operasyon_Açıklama');
    const depolamaHasOld = checkOldData(depolamaData, 'Depolama_Açıklama');
    
    hasOldData = operasyonHasOld || depolamaHasOld;

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
    console.log('👥 Kullanıcılar getiriliyor...');
    
    const { data: users, error: usersError } = await supabase
      .from('Kullanıcılar')
      .select('Kullanıcı, mail');

    if (usersError) {
      console.error('❌ Kullanıcı sorgusu hatası:', usersError);
      return res.status(500).json({
        success: false,
        error: 'Kullanıcı sorgusu hatası: ' + usersError.message
      });
    }

    if (!users || users.length === 0) {
      console.log('⚠️ Kullanıcı bulunamadı (tablo boş)');
      return res.status(200).json({
        success: false,
        error: 'Kullanıcı bulunamadı'
      });
    }

    console.log(`✅ ${users.length} kullanıcı bulundu:`, users.map(u => u.Kullanıcı).join(', '));

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
    console.error('❌ Auto update error:', err);
    console.error('📍 Error stack:', err.stack);
    return res.status(500).json({ 
      success: false,
      error: err.message || 'Bilinmeyen hata',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
