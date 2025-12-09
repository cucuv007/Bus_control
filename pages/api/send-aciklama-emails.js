// pages/api/send-aciklama-emails.js
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
    const { recipients, operasyonExcelData, depolamaExcelData, timestamp, username } = req.body;

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
      secure: false,
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

    // Attachments oluştur
    const attachments = [];
    
    if (operasyonExcelData) {
      attachments.push({
        filename: `Operasyon_Aciklamalar_${timestamp}.xlsx`,
        content: Buffer.from(operasyonExcelData, 'base64'),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    }

    if (depolamaExcelData) {
      attachments.push({
        filename: `Depolama_Aciklamalar_${timestamp}.xlsx`,
        content: Buffer.from(depolamaExcelData, 'base64'),
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    }

    // Her alıcıya mail gönder
    const sendPromises = recipients.map(async (recipient) => {
      try {
        await transporter.sendMail({
          from: `"Bus Control Sistemi" <${process.env.SMTP_USER}>`,
          to: recipient.mail,
          subject: `Açıklama Sistemi Güncellendi - ${dateStr}`,
          html: `
            <h2>Merhaba ${recipient.Kullanıcı},</h2>
            <p>Açıklama tabloları temizlenmiştir.</p>
            <p><strong>İşlem Zamanı:</strong> ${dateStr}</p>
            <p><strong>İşlemi Yapan Kullanıcı:</strong> ${username || 'Bilinmiyor'}</p>
            <p>Ekte temizlenmeden önceki açıklama kayıtlarını bulabilirsiniz:</p>
            <ul>
              ${operasyonExcelData ? '<li>Operasyon Açıklamaları</li>' : ''}
              ${depolamaExcelData ? '<li>Depolama Açıklamaları</li>' : ''}
            </ul>
            <hr>
            <p><em>Bu mail otomatik olarak gönderilmiştir.</em></p>
          `,
          attachments
        });

        console.log(`✅ Açıklama maili gönderildi: ${recipient.mail}`);
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
        ? 'Tüm mailler başarıyla gönderildi' 
        : 'Bazı mailler gönderilemedi'
    });

  } catch (err) {
    console.error('Send aciklama email error:', err);
    return res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
}
