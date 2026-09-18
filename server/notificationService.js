const nodemailer = require('nodemailer');
const os = require('os');

function getClickableDashboardUrl(contentId) {
  const baseUrl = process.env.DASHBOARD_URL || 'https://dashboard.heritejindia.com';
  if (contentId) {
    return `${baseUrl}/#/content-detail?id=${contentId}`;
  }
  return baseUrl;
}

/**
 * Real Email & WhatsApp Dispatch Service
 * Handles live automated Email (via SMTP / Nodemailer) and WhatsApp (via Twilio / Meta API)
 */
const notificationService = {

  // Create SMTP Transporter lazily
  getTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    if (!user || !pass || user.includes('your-email')) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  },

  /**
   * Send Real Email Notification
   */
  async sendEmail({ to, subject, text, html, replyTo }) {
    try {
      const transporter = this.getTransporter();
      if (!transporter) {
        console.log(`[Notification Service] SMTP not configured in .env. Skipping real email to ${to}`);
        return { success: false, reason: 'SMTP not configured in .env' };
      }

      const from = process.env.EMAIL_FROM || `Heritage Pulse System <${process.env.SMTP_USER}>`;
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        replyTo: replyTo || undefined,
        html: html || `<p style="font-family: sans-serif; line-height: 1.6;">${text.replace(/\n/g, '<br>')}</p>`
      });

      console.log(`[Notification Service] Real Email sent to ${to}: MessageID ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[Notification Service Error] Failed to send email to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send Real Silent WhatsApp Notification via Server (Zero Redirects)
   */
  async sendWhatsApp({ to, body }) {
    if (global.waClientReady && global.waClient) {
      try {
        const envGroup = (process.env.WHATSAPP_GROUP_ID || process.env.WHATSAPP_GROUP || '120363429828097318@g.us').trim();
        const chatId = envGroup.includes('@g.us')
          ? envGroup
          : (to && to.includes('@g.us') ? to : `${(to || '').replace(/[^0-9]/g, '')}@c.us`);

        console.log(`[Notification Service] Sending silent background WhatsApp via whatsapp-web.js to ${chatId}...`);
        await global.waClient.sendMessage(chatId, body);
        console.log(`[Notification Service] Silent WhatsApp sent via whatsapp-web.js to ${chatId}!`);
        return { success: true, method: 'whatsapp-web.js' };
      } catch (err) {
        console.error(`[Notification Service Error] whatsapp-web.js send failed:`, err.message);
        return { success: false, error: err.message };
      }
    }

    console.log(`[Notification Service] WhatsApp Web Client is not ready/authenticated yet. Scanning QR code required.`);
    return { success: false, reason: 'WhatsApp Web Client not ready' };
  },

  /**
   * Dispatch both Email and WhatsApp for Workflow Transitions
   */
  async dispatchWorkflowNotification({ recipientEmail, recipientPhone, subject, text, contentTitle, contentId, stageLabel, byUser, byUserEmail, category, subcategory, publishingDate, publishedUrl, waBodyText }) {
    console.log(`[Notification Service] Dispatching real notifications for '${contentTitle}' (${stageLabel})...`);

    // 1. Send Email
    const isPublished = stageLabel.includes('Published') || stageLabel === 'Published (100% Complete)';
    const isSubmitted = stageLabel.includes('Submitted') || stageLabel === 'Submitted to Editor';
    
    const bannerTitle = isPublished ? '🎉 Article Successfully Published Live!' : isSubmitted ? '⏳ Waiting for Editorial Review' : `📌 Workflow Update: ${stageLabel}`;
    const bannerColor = isPublished ? '#10b981' : isSubmitted ? '#f59e0b' : '#3b82f6';
    const subText = isPublished ? 'The following article has been published live on <strong>Heritage Pulse</strong>:' : 'An article workflow update has occurred on <strong>Heritage Pulse</strong>:';
    const btnText = isPublished ? 'View Live Published Story &rarr;' : 'Review &amp; Approve Article &rarr;';

    const catLabel = category || 'General';
    const subCatLabel = subcategory ? ` &rarr; ${subcategory}` : '';
    const pubDateLabel = publishingDate || 'N/A';
    const reviewUrl = getClickableDashboardUrl(contentId);

    const nowObj = new Date();
    const actionTimeLabel = nowObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + nowObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    const emailResult = await this.sendEmail({
      to: recipientEmail,
      subject,
      text,
      replyTo: byUserEmail,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px;">
          <h2 style="color: ${bannerColor}; margin-top: 0;">${bannerTitle}</h2>
          <p style="font-size: 1rem; color: #cbd5e1;">${subText}</p>
          
          <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; border-left: 4px solid ${bannerColor}; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-size: 1.1rem; color: #ffffff;"><strong>Title:</strong> ${contentTitle}</p>
            <p style="margin: 0 0 8px 0; color: #94a3b8;"><strong>Content ID:</strong> ${contentId}</p>
            <p style="margin: 0 0 8px 0; color: #94a3b8;"><strong>Category:</strong> ${catLabel}${subCatLabel}</p>
            <p style="margin: 0 0 8px 0; color: #94a3b8;"><strong>${isPublished ? 'Publishing Date' : 'Target Publishing Date'}:</strong> ${pubDateLabel}</p>
            <p style="margin: 0 0 8px 0; color: #94a3b8;"><strong>Action Date &amp; Time:</strong> ${actionTimeLabel}</p>
            <p style="margin: 0 0 8px 0; color: #94a3b8;"><strong>Status Stage:</strong> ${stageLabel}</p>
            <p style="margin: 0; color: #94a3b8;"><strong>Action By:</strong> ${byUser}</p>
          </div>

          ${publishedUrl ? `<p style="margin: 16px 0;"><a href="${publishedUrl}" style="background-color: #10b981; color: #000000; font-weight: bold; text-decoration: none; padding: 10px 18px; border-radius: 6px; display: inline-block;" target="_blank">🌐 View Live Published Web Story &rarr;</a></p>` : ''}

          <div style="margin-top: 24px;">
            <a href="${reviewUrl}" 
               style="background-color: ${bannerColor}; color: #000000; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 6px; display: inline-block;">
               ${btnText}
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #334155; margin: 24px 0;">
          <p style="font-size: 0.8rem; color: #64748b;">Heritage Pulse Content Operations &amp; Editorial System</p>
        </div>
      `
    });

    // 2. Send WhatsApp Notification to Group & Recipient
    let waResult = { success: false };
    const envGroup = process.env.WHATSAPP_GROUP_ID;
    const targetWa = recipientPhone || envGroup || 'group';

    if (targetWa) {
      const waBody = waBodyText || `⏳ *Waiting for Editorial Review*\n\n📄 *Title:* ${contentTitle}\n🆔 *Content ID:* ${contentId}\n🏷️ *Category:* ${catLabel}${subCatLabel}\n📅 *Publishing Date:* ${pubDateLabel}\n✍️ *Submitted By:* ${byUser}\n\n🔗 *Click to Open & Review:*\n${reviewUrl}`;
      waResult = await this.sendWhatsApp({
        to: targetWa,
        body: waBody
      });
    }

    return { emailResult, waResult };
  }
};

module.exports = notificationService;
