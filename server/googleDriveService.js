const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

class GoogleDriveService {
  constructor() {
    this.drive = null;
    this.rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '1Af7D3UV8nGqMiS0DfYlYPv2Np_pagiIf';
    this.init();
  }

  init() {
    try {
      require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
      require('dotenv').config({ path: path.join(__dirname, '.env') });

      const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

      // 1. Prefer OAuth 2.0 Client credentials (User's personal Gmail quota)
      if (refreshToken) {
        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        this.auth = oauth2Client;
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        console.log('✅ [Google Drive Service] OAuth2 User Account Cloud Sync initialized successfully!');
        return;
      }

      // 2. Fallback to Service Account
      const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
      let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

      if (!clientEmail || !privateKey || clientEmail.includes('your_service_account')) {
        console.warn('⚠️ [Google Drive Service] Missing or placeholder credentials in .env. Cloud sync disabled.');
        return;
      }

      if (privateKey) {
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
      console.log('✅ [Google Drive Service] Service Account Cloud Sync initialized for:', clientEmail);
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
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
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
        supportsAllDrives: true,
        fields: 'id'
      });

      return folder.data.id;
    } catch (err) {
      console.error(`[Google Drive Service] Error creating folder "${name}":`, err.message);
      throw new Error(`Failed to create folder "${name}": ${err.message}`);
    }
  }

  async uploadFile(filePath, fileName, mimeType, parentFolderId) {
    if (!this.drive || !fs.existsSync(filePath)) return null;
    try {
      // Check if file already exists in this folder to avoid duplicates
      const query = `name = '${fileName.replace(/'/g, "\\'")}' and '${parentFolderId}' in parents and trashed = false`;
      const searchRes = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
        spaces: 'drive'
      });

      const media = {
        mimeType: mimeType || 'application/octet-stream',
        body: fs.createReadStream(filePath)
      };

      if (searchRes.data.files && searchRes.data.files.length > 0) {
        // Update existing file instead of creating duplicate!
        const existingFileId = searchRes.data.files[0].id;
        const file = await this.drive.files.update({
          fileId: existingFileId,
          media,
          supportsAllDrives: true,
          fields: 'id, webViewLink'
        });
        return file.data;
      }

      const fileMetadata = {
        name: fileName,
        parents: [parentFolderId]
      };

      const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media,
        supportsAllDrives: true,
        fields: 'id, webViewLink'
      });

      // Transfer / share ownership to workspace or parent folder owner so quota comes from personal account
      if (file.data && file.data.id) {
        try {
          await this.drive.permissions.create({
            fileId: file.data.id,
            requestBody: {
              role: 'writer',
              type: 'anyone'
            }
          });
        } catch(e) {}
      }

      return file.data;
    } catch (err) {
      console.error(`[Google Drive Service] Error uploading file "${fileName}":`, err.message);
      throw new Error(`Failed to upload file "${fileName}": ${err.message}`);
    }
  }

  async syncArticleToDrive(articleItem) {
    // Re-check authentication in case .env was updated dynamically
    if (!this.drive) {
      this.init();
    }

    this.rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || this.rootFolderId || '1Af7D3UV8nGqMiS0DfYlYPv2Np_pagiIf';

    if (!this.drive || !this.rootFolderId) {
      throw new Error('Google Drive API not authenticated or missing GOOGLE_DRIVE_FOLDER_ID in .env');
    }

    try {
      console.log(`🚀 [Google Drive Sync] Starting upload for published article "${articleItem.title}" (${articleItem.id})...`);

      const folders = require('./folders');
      const folderInfo = folders.getArticleFolderInfo(articleItem);
      
      // 1. Generate Word (.doc), Markdown (.md), JSON (.json), and copy attached images to local vault disk folder
      folders.syncPhysicalDiskVault([articleItem]);

      const folderName = `${articleItem.id}_${(articleItem.title || 'Article').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40)}`;

      // 2. Create article folder directly inside root Google Drive folder
      const articleFolderId = await this.findOrCreateFolder(folderName, this.rootFolderId);

      // 3. Scan disk vault folder and upload ALL files (Word doc, Markdown, JSON, images, PDFs, attachments) to Google Drive
      if (fs.existsSync(folderInfo.absoluteDiskPath)) {
        const vaultFiles = fs.readdirSync(folderInfo.absoluteDiskPath);
        for (const f of vaultFiles) {
          const fullFilePath = path.join(folderInfo.absoluteDiskPath, f);
          if (fs.statSync(fullFilePath).isFile()) {
            const ext = path.extname(f).toLowerCase();
            let mime = 'application/octet-stream';
            if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) mime = 'image/jpeg';
            else if (['.doc', '.docx'].includes(ext)) mime = 'application/msword';
            else if (['.pdf'].includes(ext)) mime = 'application/pdf';
            else if (['.md', '.markdown'].includes(ext)) mime = 'text/markdown';
            else if (['.json'].includes(ext)) mime = 'application/json';
            
            console.log(`[Google Drive Sync] Uploading asset "${f}" to Google Drive...`);
            await this.uploadFile(fullFilePath, f, mime, articleFolderId);
          }
        }
      }

      // 4. Also upload any attached images from /uploads/ directory if present
      if (articleItem.images && Array.isArray(articleItem.images)) {
        for (const img of articleItem.images) {
          if (img.file_url) {
            const relPath = img.file_url.startsWith('/') ? img.file_url.slice(1) : img.file_url;
            const imgLocalPath = path.join(__dirname, '..', 'public', relPath);
            if (fs.existsSync(imgLocalPath)) {
              const imgName = img.filename || path.basename(imgLocalPath);
              await this.uploadFile(imgLocalPath, imgName, 'image/jpeg', articleFolderId);
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
