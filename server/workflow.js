const db = require('./db');
const os = require('os');

function getClickableDashboardUrl(contentId) {
  let networkIp = '127.0.0.1';
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if ((net.family === 'IPv4' || net.family === 4) && !net.internal) {
          networkIp = net.address;
          break;
        }
      }
    }
  } catch (e) {}

  const port = global.activePort || process.env.PORT || 80;
  const portSuffix = (port == 80) ? '' : `:${port}`;
  const baseUrl = process.env.DASHBOARD_URL
    ? process.env.DASHBOARD_URL.replace(/localhost|127\.0\.0\.1/g, networkIp)
    : `http://${networkIp}${portSuffix}`;

  if (contentId) {
    return `${baseUrl}/review/${contentId}`;
  }
  return baseUrl;
}

let notificationService;
try {
  notificationService = require('./notificationService');
} catch (e) {
  console.warn('[Workflow] NotificationService load warning:', e.message);
}

const STAGES = {
  TOPIC_CREATED: { code: 'TOPIC_CREATED', label: 'Topic Created', progress: 0, color: '#64748b' },
  ASSIGNED: { code: 'ASSIGNED', label: 'Writer Assigned', progress: 10, color: '#3b82f6' },
  WRITING: { code: 'WRITING', label: 'Writing In Progress', progress: 25, color: '#a855f7' },
  CONTENT_COMPLETED: { code: 'CONTENT_COMPLETED', label: 'Content Completed', progress: 40, color: '#8b5cf6' },
  IMAGES_PENDING: { code: 'IMAGES_PENDING', label: 'Images Pending', progress: 45, color: '#f97316' },
  IMAGES_UPLOADED: { code: 'IMAGES_UPLOADED', label: 'Images Uploaded', progress: 50, color: '#f97316' },
  WRITER_SUBMITTED: { code: 'WRITER_SUBMITTED', label: 'Submitted to Editor', progress: 60, color: '#eab308' },
  EDITOR_REVIEW: { code: 'EDITOR_REVIEW', label: 'Editor Review In Progress', progress: 70, color: '#6366f1' },
  CHANGES_REQUIRED: { code: 'CHANGES_REQUIRED', label: 'Changes Required', progress: 35, color: '#ef4444' },
  EDITOR_APPROVED: { code: 'EDITOR_APPROVED', label: 'Editor Approved', progress: 80, color: '#0d9488' },
  FINAL_REVIEW: { code: 'FINAL_REVIEW', label: 'Final Approval Stage', progress: 90, color: '#1e3a8a' },
  READY_TO_PUBLISH: { code: 'READY_TO_PUBLISH', label: 'Ready for Website Publishing', progress: 95, color: '#059669' },
  PUBLISHED: { code: 'PUBLISHED', label: 'Published (100% Complete)', progress: 100, color: '#16a34a' }
};

class WorkflowEngine {
  getStages() {
    return STAGES;
  }

  // Advance or change content workflow status
  transition(contentId, targetStatus, userId, options = {}) {
    const rawData = db.load();
    const content = rawData.content.find(c => c.id === contentId);
    if (!content) throw new Error(`Content item ${contentId} not found`);

    const user = rawData.users.find(u => u.id === userId) || rawData.users[0];
    const previousStatus = content.status;
    const stageInfo = STAGES[targetStatus];
    if (!stageInfo) throw new Error(`Invalid target status: ${targetStatus}`);

    const now = new Date().toISOString();

    // Specific business rules for transitions
    if (targetStatus === 'PUBLISHED') {
      if (!options.published_url) {
        options.published_url = `https://heritagepulse.org/${(content.category || 'culture').toLowerCase()}/${content.id.toLowerCase()}-${encodeURIComponent(content.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40))}`;
      }
      content.published_url = options.published_url;
      content.publishing_date = options.publishing_date || "2026-08-24";
      if (!content.checklist) content.checklist = {};
      content.checklist.website_published = true;

      // Automated Google Drive Cloud Sync Trigger for Published articles
      try {
        const driveService = require('./googleDriveService');
        driveService.syncArticleToDrive(content).catch(e => console.error('[Google Drive Sync Error]', e));
      } catch (e) {
        console.warn('[Google Drive Sync Trigger Warning]', e.message);
      }
    }

    if (targetStatus === 'WRITER_SUBMITTED') {
      // Trigger Google Drive sync on 60% Writer Submission as well
      try {
        const driveService = require('./googleDriveService');
        driveService.syncArticleToDrive(content).catch(e => console.error('[Google Drive Sync Error on 60% Submission]', e));
      } catch (e) {}
    }

    if (targetStatus === 'CHANGES_REQUIRED') {
      // Progress moves backward
      content.progress = 35;
    } else {
      content.progress = stageInfo.progress;
    }

    content.status = targetStatus;
    content.updated_at = now;

    // Record in workflow history
    const historyEntry = {
      id: `wf-${Date.now()}`,
      content_id: contentId,
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      action: targetStatus,
      previous_status: previousStatus,
      new_status: targetStatus,
      progress: content.progress,
      comment: options.comment || `Moved to ${stageInfo.label} by ${user.name} (${user.role}).`,
      created_at: now
    };

    rawData.workflow_history.unshift(historyEntry);

    // === STAGE NOTIFICATION LABELS ===
    const STAGE_LABELS = {
      TOPIC_CREATED: 'Topic Created',
      ASSIGNED: 'Writer Assigned',
      WRITING: 'Writing In Progress',
      CONTENT_COMPLETED: 'Content Completed',
      IMAGES_PENDING: 'Images Pending',
      IMAGES_UPLOADED: 'Images Uploaded',
      WRITER_SUBMITTED: 'Submitted to Editor',
      EDITOR_REVIEW: 'Editor Review In Progress',
      CHANGES_REQUIRED: 'Changes Required — Writer must revise',
      EDITOR_APPROVED: 'Editor Approved',
      FINAL_REVIEW: 'Final Approval Stage',
      READY_TO_PUBLISH: 'Ready for Website Publishing',
      PUBLISHED: 'Published Live on Heritage Pulse'
    };

    const stageLabel = STAGE_LABELS[targetStatus] || targetStatus;
    const emoji = targetStatus === 'PUBLISHED' ? '🎉' :
      targetStatus === 'CHANGES_REQUIRED' ? '🔴' :
      targetStatus === 'WRITER_SUBMITTED' ? '📝' :
      targetStatus === 'FINAL_REVIEW' ? '✅' :
      targetStatus === 'EDITOR_APPROVED' ? '👍' :
      targetStatus === 'READY_TO_PUBLISH' ? '🚀' : '📋';

    // Helper: build WhatsApp message text dynamically from content API data
    const buildWAText = (title, contentTitle, stageLabel, byUser, comment) => {
      const reviewUrl = getClickableDashboardUrl(contentId);
      const catStr = content.category || 'General';
      const subCatStr = content.subcategory ? ` (${content.subcategory})` : '';
      const pubDate = content.publishing_date ? content.publishing_date : 'N/A';

      const nowObj = new Date();
      const actionDateTime = nowObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + nowObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

      if (targetStatus === 'WRITER_SUBMITTED') {
        let msg = `⏳ *Waiting for Editorial Review*\n\n`;
        msg += `📄 *Title:* ${contentTitle}\n`;
        msg += `🆔 *Content ID:* ${contentId}\n`;
        msg += `🏷️ *Category:* ${catStr}${subCatStr}\n`;
        msg += `📅 *Target Publishing Date:* ${pubDate}\n`;
        msg += `🕒 *Submission Time:* ${actionDateTime}\n`;
        msg += `✍️ *Submitted By:* ${byUser}\n`;
        if (comment) msg += `💬 *Note:* ${comment}\n`;
        msg += `\n🔗 *Click to Open & Review:*\n${reviewUrl}`;
        return encodeURIComponent(msg);
      }

      if (targetStatus === 'PUBLISHED') {
        let msg = `🎉 *Article Published Live!*\n\n`;
        msg += `📄 *Title:* ${contentTitle}\n`;
        msg += `🆔 *Content ID:* ${contentId}\n`;
        msg += `🏷️ *Category:* ${catStr}${subCatStr}\n`;
        msg += `📆 *Publishing Date:* ${pubDate}\n`;
        msg += `🕒 *Published Time:* ${actionDateTime}\n`;
        msg += `👤 *Published By:* ${byUser}\n`;
        if (content.published_url) msg += `🌐 *Live URL:* ${content.published_url}\n`;
        msg += `\n🔗 *Click to Open Dashboard:*\n${reviewUrl}`;
        return encodeURIComponent(msg);
      }

      let msg = `${emoji} *Heritage Pulse — Workflow Update*\n`;
      msg += `📄 *Article:* ${contentTitle}\n`;
      msg += `🆔 *Content ID:* ${contentId}\n`;
      msg += `🏷️ *Category:* ${catStr}${subCatStr}\n`;
      msg += `📅 *Publishing Date:* ${pubDate}\n`;
      msg += `🕒 *Action Time:* ${actionDateTime}\n`;
      msg += `🔄 *Stage:* ${stageLabel}\n`;
      msg += `👤 *By:* ${byUser}\n`;
      if (comment) msg += `💬 *Note:* ${comment}\n`;
      msg += `\n🔗 *Click to Open Article:*\n${reviewUrl}`;
      return encodeURIComponent(msg);
    };

    // Helper: build email subject + body
    const buildEmailBody = (contentTitle, stageLabel, byUser, contentId, comment) => {
      let body = `Hello Dr. Tejaswini Ma'am,\n\n`;
      if (targetStatus === 'WRITER_SUBMITTED') {
        body += `An article has been completed by ${byUser} and is waiting for your review and approval.\n\n`;
        body += `Article Title: ${contentTitle}\n`;
        body += `Content ID: ${contentId}\n`;
        body += `Status: ⏳ Waiting for Editor Review\n`;
        if (comment) body += `Writer Note: ${comment}\n`;
        body += `\nPlease log in to review and approve: http://localhost:3000/#content-detail?id=${contentId}\n\nRegards,\nHeritage Pulse Editorial System`;
      } else {
        body += `A workflow stage update has occurred on Heritage Pulse Editorial Dashboard.\n\n`;
        body += `Article: ${contentTitle}\nContent ID: ${contentId}\nNew Stage: ${stageLabel}\nMoved by: ${byUser}\n`;
        if (comment) body += `Editor Note: ${comment}\n`;
        body += `\nPlease log in to review: http://localhost:3000/#content-detail?id=${contentId}\n\nRegards,\nHeritage Pulse Editorial System`;
      }
      return encodeURIComponent(body);
    };

    // Load notification settings (.env override prioritized)
    const settings = rawData.notificationSettings || {};
    const adminEmail = process.env.ADMIN_EMAIL || settings.adminEmail || 'jitendra@heritagepulse.org';
    const tejaswiniEmail = process.env.TEJASWINI_EMAIL || settings.tejaswiniEmail || 'tejaswini@heritagepulse.org';
    const adminPhone = process.env.ADMIN_WHATSAPP || settings.adminPhone || '';
    const tejaswiniPhone = process.env.TEJASWINI_WHATSAPP || settings.tejaswiniPhone || '';

    // === NOTIFY ADMIN + DR. TEJASWINI ON EVERY STAGE TRANSITION ===
    const adminNotifIds = ['usr-admin-1', 'usr-editor-1'];
    const waText = buildWAText(null, content.title, stageLabel, user.name, options.comment);
    const emailSubjRaw = targetStatus === 'WRITER_SUBMITTED'
      ? `[Heritage Pulse] ⏳ Waiting for your approval: ${content.title}`
      : `[Heritage Pulse] ${emoji} ${content.title} → ${stageLabel}`;
    const emailSubj = encodeURIComponent(emailSubjRaw);
    const emailBody = buildEmailBody(content.title, stageLabel, user.name, contentId, options.comment);
    const emailTextRaw = decodeURIComponent(emailBody);

    const dispatchedPhones = new Set();
    const dispatchedEmails = new Set();

    adminNotifIds.forEach((uid, idx) => {
      const targetUser = rawData.users.find(u => u.id === uid);
      if (!targetUser) return;
      const recipPhone = uid === 'usr-admin-1' ? adminPhone : tejaswiniPhone;
      const recipEmail = uid === 'usr-admin-1' ? adminEmail : tejaswiniEmail;
      rawData.notifications.unshift({
        id: `notif-admin-${Date.now()}-${idx}`,
        user_id: uid,
        content_id: contentId,
        title: `${emoji} Stage Update: ${stageLabel}`,
        message: `'${content.title}' moved to [${stageLabel}] by ${user.name} (${user.role}).${options.comment ? ' Note: ' + options.comment : ''}`,
        type: 'WORKFLOW_UPDATE',
        stage: targetStatus,
        stage_label: stageLabel,
        by_user: user.name,
        by_role: user.role,
        wa_link: recipPhone ? `https://wa.me/${recipPhone.replace(/[^0-9]/g, '')}?text=${waText}` : null,
        email_link: `mailto:${recipEmail}?subject=${emailSubj}&body=${emailBody}`,
        read: false,
        created_at: now
      });

      // Dispatch Real Automated Email & WhatsApp Notifications (Group + Direct)
      const isActionableStage = ['WRITER_SUBMITTED', 'CHANGES_REQUIRED', 'PUBLISHED'].includes(targetStatus);
      if (notificationService && isActionableStage && idx === 0) {
        notificationService.dispatchWorkflowNotification({
          recipientEmail: recipEmail || adminEmail,
          recipientPhone: recipPhone || adminPhone,
          subject: emailSubjRaw,
          text: emailTextRaw,
          contentTitle: content.title,
          contentId,
          category: content.category,
          subcategory: content.subcategory,
          publishingDate: content.publishing_date,
          publishedUrl: content.published_url,
          stageLabel,
          byUser: user.name,
          byUserEmail: user.email,
          waBodyText: decodeURIComponent(waText)
        }).catch(err => console.error('[Notification Dispatch Background Error]', err));
      }
    });

    // === EXISTING ROLE-SPECIFIC NOTIFICATIONS (writer/editor/approver) ===
    if (targetStatus === 'WRITER_SUBMITTED') {
      if (content.editor_id && !adminNotifIds.includes(content.editor_id)) {
        rawData.notifications.unshift({
          id: `notif-${Date.now()}`,
          user_id: content.editor_id,
          content_id: contentId,
          title: "📝 Article Submitted for Review",
          message: `${user.name} submitted '${content.title}' for editorial review.`,
          type: "SUBMISSION",
          read: false,
          created_at: now
        });
      }
    } else if (targetStatus === 'CHANGES_REQUIRED') {
      if (content.writer_id) {
        rawData.notifications.unshift({
          id: `notif-${Date.now()}`,
          user_id: content.writer_id,
          content_id: contentId,
          title: "🔴 Revisions Requested",
          message: `Editor ${user.name} requested changes on '${content.title}': ${options.comment || 'Please check editor notes.'}`,
          type: "CHANGES_REQUIRED",
          read: false,
          created_at: now
        });
      }
    } else if (targetStatus === 'FINAL_REVIEW' || targetStatus === 'EDITOR_APPROVED') {
      const approverUid = content.final_approver_id || content.editor_id;
      if (approverUid && !adminNotifIds.includes(approverUid)) {
        rawData.notifications.unshift({
          id: `notif-${Date.now()}`,
          user_id: approverUid,
          content_id: contentId,
          title: "✅ Article Ready for Final Review",
          message: `'${content.title}' was approved by ${user.name} and is waiting for Final Approval.`,
          type: "APPROVAL",
          read: false,
          created_at: now
        });
      }
    } else if (targetStatus === 'PUBLISHED') {
      rawData.notifications.unshift({
        id: `notif-${Date.now()}`,
        user_id: "all",
        content_id: contentId,
        title: "🎉 Article Published 100%!",
        message: `'${content.title}' is now live on Heritage Pulse by Gowthami at ${content.published_url}`,
        type: "PUBLISHED",
        read: false,
        created_at: now
      });
    }

    // Also create version snapshot recording stage, author, and timestamp
    const existingVersions = rawData.versions.filter(v => v.content_id === contentId);
    const nextVer = existingVersions.length + 1;
    const wordCount = (content.body || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    
    rawData.versions.unshift({
      id: `ver-${contentId}-${nextVer}`,
      content_id: contentId,
      version_number: nextVer,
      version_label: `Version ${nextVer} — ${stageInfo.label}`,
      author_name: `${user.name} (${user.role})`,
      author_avatar: user.avatar || 'HP',
      stage: targetStatus,
      stage_label: stageInfo.label,
      progress: content.progress,
      word_count: wordCount,
      title: content.title,
      body: content.body,
      created_at: now
    });

    db.save(rawData);
    return db.getContentById(contentId);
  }
}

module.exports = new WorkflowEngine();
