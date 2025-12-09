// pages/api/send-refresh-email.js
import nodemailer from 'nodemailer';

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
    const { recipients, excelData, screenshotData, timestamp, username } = req.body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'En az bir alıcı gerekli'
      });
    }

    // Nodemailer transporter oluştur
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const dateStr = new Date(timestamp).toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Excel dosyası attachment
    const attachments = [];
    
    if (excelData) {
      attachments.push({
        filename: `Hat_Listesi_${timestamp}.xlsx`,
        content: Buffer.from(excelData, 'base64'),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    }

    if (screenshotData) {
      attachments.push({
        filename: `Ekran_Goruntusu_${timestamp}.jpg`,
        content: Buffer.from(screenshotData, 'base64'),
        contentType: 'image/jpeg'
      });
    }

    // Her alıcıya paralel olarak mail gönder (hız için)
    const sendPromises = recipients.map(async (recipient) => {
      try {
        await transporter.sendMail({
          from: `"Bus Control Sistemi" <${process.env.SMTP_USER}>`,
          to: recipient.mail,
          subject: `Hat Listesi Yenileme - ${dateStr}`,
          html: `
            <h2>Merhaba ${recipient.Kullanıcı},</h2>
            <p>Hat listesi yenileme işlemi gerçekleştirilmiştir.</p>
            <p><strong>İşlem Zamanı:</strong> ${dateStr}</p>
            <p><strong>İşlemi Yapan Kullanıcı:</strong> ${username || 'Bilinmiyor'}</p>
            <p>Ekteki dosyalarda temizlenmeden önceki hat listesi ve ekran görüntüsünü bulabilirsiniz.</p>
            <hr>
            <p><em>Bu mail otomatik olarak gönderilmiştir.</em></p>
          `,
          attachments
        });

        console.log(`✅ Mail gönderildi: ${recipient.mail}`);
        return { email: recipient.mail, success: true };
      } catch (err) {
        console.error(`❌ Mail gönderilemedi (${recipient.mail}):`, err.message);
        return { email: recipient.mail, success: false, error: err.message };
      }
    });

    const results = await Promise.all(sendPromises);

    const allSuccess = results.every(r => r.success);

    return res.status(200).json({
      success: allSuccess,
      results,
      message: allSuccess 
        ? 'Tüm maller başarıyla gönderildi' 
        : 'Bazı mailler gönderilemedi'
    });

  } catch (err) {
    console.error('Send email error:', err);
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}
