const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || null;
    this.init();
  }

  init() {
    try {
      const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
      let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

      if (!clientEmail || !privateKey || clientEmail.includes('your_service_account')) {
        console.warn('⚠️ [Google Drive Service] Missing or placeholder credentials in .env. Cloud sync disabled.');
        return;
      }

      if (privateKey) {
        // Handle escaped newlines from .env string
        privateKey = privateKey.replace(/\\n/g, '\n').trim();
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
          privateKey = privateKey.slice(1, -1);
        }
      }

      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/drive']
      });

      this.auth = auth;
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      console.log('✅ [Google Drive Service] Automated Cloud Sync initialized successfully for:', clientEmail);
    } catch (err) {
      console.error('❌ [Google Drive Service] Authorization error:', err.message);
    }
  }

  async findOrCreateFolder(name, parentFolderId) {
    if (!this.drive) return null;
    try {
      const query = `name = '${name.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      const res = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (res.data.files && res.data.files.length > 0) {
        return res.data.files[0].id;
      }

      const folderMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId]
      };

      const folder = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (err) {
      console.error(`[Google Drive Service] Error creating folder "${name}":`, err.message);
      return parentFolderId;
    }
  }

  async uploadFile(filePath, fileName, mimeType, parentFolderId) {
    if (!this.drive || !fs.existsSync(filePath)) return null;
    try {
      const fileMetadata = {
        name: fileName,
        parents: [parentFolderId]
      };

      const media = {
        mimeType: mimeType || 'application/octet-stream',
        body: fs.createReadStream(filePath)
      };

      const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        fields: 'id, webViewLink'
      });

      return file.data;
    } catch (err) {
      console.error(`[Google Drive Service] Error uploading file "${fileName}":`, err.message);
      return null;
    }
  }

  async syncArticleToDrive(articleItem) {
    // Re-check authentication in case .env was updated dynamically
    if (!this.drive) {
      this.init();
    }

    this.rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || this.rootFolderId;

    if (!this.drive || !this.rootFolderId) {
      throw new Error('Google Drive API not authenticated or missing GOOGLE_DRIVE_FOLDER_ID in .env');
    }

    try {
      console.log(`🚀 [Google Drive Sync] Starting upload for published article "${articleItem.title}" (${articleItem.id})...`);

      const pubDate = articleItem.publishing_date || articleItem.updated_at || '2026-09-15';
      const year = pubDate.split('-')[0] || '2026';
      const monthNum = parseInt(pubDate.split('-')[1] || '09', 10);
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const monthName = `${String(monthNum).padStart(2, '0')}-${months[monthNum - 1] || 'September'}`;
      const category = articleItem.category || 'General';
      const folderName = `${articleItem.id}_${(articleItem.title || 'Article').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)}`;

      // Create hierarchy inside the shared root Google Drive folder: Root -> Year -> Month -> Category -> ArticleFolder
      const yearFolderId = await this.findOrCreateFolder(year, this.rootFolderId);
      const monthFolderId = await this.findOrCreateFolder(monthName, yearFolderId);
      const catFolderId = await this.findOrCreateFolder(category, monthFolderId);
      const articleFolderId = await this.findOrCreateFolder(folderName, catFolderId);

      // 1. Save & Upload metadata.json
      const localVaultPath = path.join(__dirname, '..', 'public', 'content_vault', year, monthName, category, articleItem.id);
      if (!fs.existsSync(localVaultPath)) {
        fs.mkdirSync(localVaultPath, { recursive: true });
      }

      const metaPath = path.join(localVaultPath, `${articleItem.id}_metadata.json`);
      fs.writeFileSync(metaPath, JSON.stringify(articleItem, null, 2), 'utf8');
      await this.uploadFile(metaPath, `${articleItem.id}_metadata.json`, 'application/json', articleFolderId);

      // 2. Save & Upload Markdown article
      const mdContent = `# ${articleItem.title}\n\n**Category**: ${articleItem.category} | **Status**: ${articleItem.status}\n**Writer**: ${articleItem.writer ? articleItem.writer.name : 'Heritage Pulse Bureau'}\n\n${articleItem.body || ''}`;
      const mdPath = path.join(localVaultPath, `${articleItem.id}_content.md`);
      fs.writeFileSync(mdPath, mdContent, 'utf8');
      await this.uploadFile(mdPath, `${articleItem.id}_content.md`, 'text/markdown', articleFolderId);

      // 3. Upload featured image & attached images if present
      if (articleItem.images && Array.isArray(articleItem.images)) {
        for (const img of articleItem.images) {
          if (img.file_url) {
            const relPath = img.file_url.startsWith('/') ? img.file_url.slice(1) : img.file_url;
            const imgLocalPath = path.join(__dirname, '..', 'public', relPath);
            if (fs.existsSync(imgLocalPath)) {
              await this.uploadFile(imgLocalPath, img.filename || path.basename(imgLocalPath), 'image/jpeg', articleFolderId);
            }
          }
        }
      }

      console.log(`✅ [Google Drive Sync] Successfully synced "${articleItem.title}" to Google Drive Vault!`);
      return true;
    } catch (err) {
      console.error('❌ [Google Drive Sync] Sync failed:', err.message);
      throw err;
    }
  }
}

module.exports = new GoogleDriveService();
