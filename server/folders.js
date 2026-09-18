const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const VAULT_ROOT = path.join(__dirname, '..', 'public', 'content_vault');
const DOWNLOADS_DIR = path.join(__dirname, '..', 'public', 'downloads');

// Ensure directories exist
[VAULT_ROOT, DOWNLOADS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function sanitizeSlug(str) {
  if (!str) return 'untitled';
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50);
}

function getMonthName(monthIndex) {
  const months = ['01-January', '02-February', '03-March', '04-April', '05-May', '06-June', 
                  '07-July', '08-August', '09-September', '10-October', '11-November', '12-December'];
  return months[monthIndex] || '01-January';
}

function getArticleFolderInfo(item) {
  const dateStr = item.publishing_date || item.start_date || item.created_at || '2026-08-24';
  const d = new Date(dateStr);
  const year = isNaN(d.getFullYear()) ? '2026' : String(d.getFullYear());
  const month = isNaN(d.getMonth()) ? '08-August' : getMonthName(d.getMonth());
  const dayStr = isNaN(d.getDate()) ? '2026-08-24' : d.toISOString().split('T')[0];
  
  const category = (item.category || 'General').trim();
  const catSlug = sanitizeSlug(category);
  const titleSlug = sanitizeSlug(item.title || item.topic || 'story');
  const folderName = `${item.id}-${titleSlug}`;
  
  const relativeDatePath = path.join(year, month, category, folderName);
  const relativeCategoryPath = path.join(category, year, month, folderName);
  const writerName = (item.writer && item.writer.name) ? item.writer.name : 'Staff-Writer';
  const relativeWriterPath = path.join(sanitizeSlug(writerName), year, category, folderName);

  const absoluteDiskPath = path.join(VAULT_ROOT, year, month, category, folderName);

  return {
    year,
    month,
    dayStr,
    category,
    catSlug,
    titleSlug,
    folderName,
    writerName,
    relativeDatePath,
    relativeCategoryPath,
    relativeWriterPath,
    absoluteDiskPath,
    webVaultUrl: `/content_vault/${year}/${month}/${encodeURIComponent(category)}/${encodeURIComponent(folderName)}`
  };
}

// Format article to clean markdown
function formatArticleMarkdown(item) {
  const plainBody = (item.body || '')
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*')
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<[^>]+>/g, '');

  const imagesList = (item.images || []).map((img, i) => `
![${img.caption || img.filename || 'Image ' + (i+1)}](${img.file_url})
*Caption:* ${img.caption || 'N/A'} | *Credit:* ${img.credit || 'Heritage Pulse Bureau'}
`).join('\n');

  return `---
id: "${item.id}"
title: "${item.title || item.topic}"
category: "${item.category}"
content_type: "${item.content_type || 'Article'}"
priority: "${item.priority || 'Medium'}"
status: "${item.status || 'DRAFT'}"
writer: "${item.writer ? item.writer.name : 'Staff'}"
editor: "${item.editor ? item.editor.name : 'Dr. Tejaswini Ma\'am'}"
start_date: "${item.start_date || ''}"
deadline: "${item.deadline || ''}"
publishing_date: "${item.publishing_date || ''}"
published_url: "${item.published_url || ''}"
tags: ${JSON.stringify(item.tags || [])}
seo_title: "${item.seo_title || ''}"
seo_description: "${item.seo_description || ''}"
created_at: "${item.created_at || new Date().toISOString()}"
vault_folder: "${item.id}"
---

# ${item.title || item.topic}
${item.subtitle ? `> *${item.subtitle}*\n\n` : ''}

**Category:** ${item.category} | **Author:** ${item.writer ? item.writer.name : 'Staff Writer'} | **Status:** ${item.status}

---

## Article Content

${plainBody}

---

## Attached Media & Images (${(item.images || []).length} assets)

${imagesList || '_No images attached to this article yet._'}

---
*Heritage Pulse Editorial Vault — Generated on ${new Date().toLocaleString()}*
`;
}

function formatArticleWordDocument(item) {
  const baseUrl = process.env.DASHBOARD_URL || 'http://localhost:3000';
  const imagesHtml = (item.images || []).map((img, i) => {
    let imgSrc = '';
    if (img.file_url) {
      if (img.file_url.startsWith('http://') || img.file_url.startsWith('https://') || img.file_url.startsWith('data:')) {
        imgSrc = img.file_url;
      } else {
        imgSrc = `${baseUrl}${img.file_url.startsWith('/') ? '' : '/'}${img.file_url}`;
      }
    }
    return `
    <div style="margin: 15px 0; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;">
      ${imgSrc ? `<img src="${imgSrc}" style="max-width: 100%; max-height: 400px; display: block; margin: 0 auto 10px auto; border-radius: 4px;" alt="${img.filename || 'Photo'}"/>` : ''}
      <p style="font-weight: bold; margin: 0 0 4px 0; color: #1e293b;">Image Asset ${i+1}: ${img.filename || 'Photo'}</p>
      <p style="margin: 0; color: #475569; font-size: 10pt;"><em>Caption:</em> ${img.caption || 'Editorial Photo'}</p>
      <p style="margin: 0; color: #64748b; font-size: 9pt;"><em>Credit:</em> ${img.credit || 'Heritage Pulse Photo Bureau'}</p>
    </div>
  `;
  }).join('');

  const linksList = (item.sources || []).map(s => `<li><a href="${s.url}">${s.name || s.url}</a></li>`).join('') +
    (item.reference_links ? `<li>Reference: <a href="${item.reference_links}">${item.reference_links}</a></li>` : '') +
    (item.published_url ? `<li>Live URL: <a href="${item.published_url}">${item.published_url}</a></li>` : '') +
    (item.video_url ? `<li>Video Source: <a href="${item.video_url}">${item.video_url}</a></li>` : '');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${item.title || item.topic} — Heritage Pulse</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #1e293b; margin: 40px; }
    h1 { color: #d97706; font-size: 22pt; font-family: 'Times New Roman', Georgia, serif; margin-bottom: 6px; border-bottom: 2px solid #fef3c7; padding-bottom: 8px; }
    h2 { color: #1e3a8a; font-size: 14pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-top: 22px; }
    h3 { color: #334155; font-size: 12pt; margin-top: 14px; }
    .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .meta-table td { padding: 8px 12px; font-size: 10pt; border-bottom: 1px solid #e2e8f0; }
    blockquote { border-left: 4px solid #d97706; padding-left: 12px; color: #475569; font-style: italic; margin: 15px 0; background: #fffbeb; padding: 10px; }
    .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 9pt; color: #64748b; }
  </style>
</head>
<body>
  <h1>${item.title || item.topic}</h1>
  ${item.subtitle ? `<p style="font-size: 12pt; color: #475569; font-style: italic; margin-bottom: 16px;">${item.subtitle}</p>` : ''}
  
  <table class="meta-table">
    <tr>
      <td><strong>Article ID:</strong> ${item.id}</td>
      <td><strong>Category:</strong> ${item.category}</td>
      <td><strong>Content Type:</strong> ${item.content_type || 'Featured Article'}</td>
    </tr>
    <tr>
      <td><strong>Writer:</strong> ${item.writer ? item.writer.name : 'Staff Writer'}</td>
      <td><strong>Reviewer:</strong> ${item.editor ? item.editor.name : 'Dr. Tejaswini Ma\'am'}</td>
      <td><strong>Status:</strong> ${item.status}</td>
    </tr>
    <tr>
      <td><strong>Publishing Date:</strong> ${item.publishing_date || item.deadline || 'N/A'}</td>
      <td><strong>Priority:</strong> ${item.priority || 'Medium'}</td>
      <td><strong>Tags:</strong> ${(item.tags || []).join(', ')}</td>
    </tr>
  </table>

  <h2>Article Content</h2>
  <div class="article-content">
    ${item.body || '<p>No content written yet.</p>'}
  </div>

  <h2>Attached Media Assets (${(item.images || []).length})</h2>
  ${imagesHtml || '<p>No images attached to this article.</p>'}

  ${linksList ? `<h2>Reference Sources & Links</h2><ul>${linksList}</ul>` : ''}

  <div class="footer">
    <p>Heritage Pulse Editorial Operations & Content Vault · Document ID: ${item.id} · Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;
}

// Synchronize published & active articles to physical disk folders
function syncPhysicalDiskVault(contentList) {
  if (!Array.isArray(contentList)) return { count: 0 };
  let synced = 0;

  // Include active working articles (progress >= 10) so folders data vault builds for all active topics
  const targetList = contentList.filter(item => item && !item.is_deleted);

  targetList.forEach(item => {
    try {
      const info = getArticleFolderInfo(item);
      if (!fs.existsSync(info.absoluteDiskPath)) {
        fs.mkdirSync(info.absoluteDiskPath, { recursive: true });
      }

      // 1. Write structured clean JSON metadata
      const jsonPath = path.join(info.absoluteDiskPath, `${item.id}_metadata.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(item, null, 2), 'utf8');

      // 2. Write clean Markdown content
      const mdPath = path.join(info.absoluteDiskPath, `${item.id}_content.md`);
      fs.writeFileSync(mdPath, formatArticleMarkdown(item), 'utf8');

      // 3. Write Microsoft Word Document (.doc format)
      const docPath = path.join(info.absoluteDiskPath, `${item.id}_article.doc`);
      fs.writeFileSync(docPath, formatArticleWordDocument(item), 'utf8');

      // 4. Copy local uploaded images to article folder if local uploads exist
      if (Array.isArray(item.images)) {
        item.images.forEach(img => {
          if (img.file_url && img.file_url.startsWith('/uploads/')) {
            const localUploadPath = path.join(__dirname, '..', 'public', img.file_url);
            if (fs.existsSync(localUploadPath)) {
              const targetImgPath = path.join(info.absoluteDiskPath, path.basename(img.file_url));
              if (!fs.existsSync(targetImgPath)) {
                try {
                  fs.copyFileSync(localUploadPath, targetImgPath);
                } catch (e) {
                  // ignore copy error
                }
              }
            }
          }
        });
      }

      synced++;
    } catch (err) {
      console.error(`Error syncing vault item ${item.id}:`, err);
    }
  });

  return { count: synced, total: targetList.length };
}

// Build Google Drive hierarchical tree
function buildFoldersTree(contentList, options = {}) {
  const groupBy = options.groupBy || 'date'; // 'date' | 'category' | 'writer'
  const searchQuery = (options.search || '').toLowerCase().trim();
  const categoryFilter = options.category || '';
  const writerFilter = options.writer_id || '';
  const statusFilter = options.status || '';
  const yearFilter = options.year || '';
  const monthFilter = (options.month !== undefined && options.month !== null && options.month !== '' && options.month !== 'all') ? String(options.month) : '';
  const dateFilter = options.date || '';

  let filtered = contentList.filter(item => {
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (writerFilter && item.writer_id !== writerFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    
    // Date & Year Filtering
    const dStr = item.publishing_date || item.deadline || item.start_date || (item.created_at ? item.created_at.split('T')[0] : '2026-08-24');
    const d = new Date(dStr);
    const itemYear = isNaN(d.getFullYear()) ? '2026' : String(d.getFullYear());
    const itemMonthIdx = isNaN(d.getMonth()) ? 7 : d.getMonth();

    if (dateFilter && dStr !== dateFilter && item.deadline !== dateFilter && item.publishing_date !== dateFilter) {
      return false;
    }
    if (yearFilter && itemYear !== String(yearFilter)) {
      return false;
    }
    if (monthFilter !== '' && String(itemMonthIdx) !== monthFilter && getMonthName(itemMonthIdx) !== monthFilter) {
      return false;
    }

    if (searchQuery) {
      const matchText = `${item.id} ${item.title || ''} ${item.topic || ''} ${item.category || ''} ${item.writer ? item.writer.name : ''} ${(item.tags || []).join(' ')}`.toLowerCase();
      if (!matchText.includes(searchQuery)) return false;
    }
    return true;
  });

  // Calculate high-level stats
  let totalImages = 0;
  let totalWords = 0;
  filtered.forEach(item => {
    totalImages += (item.images || []).length;
    const words = (item.body || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    totalWords += words;
  });

  // Est. size in KB (~15KB per json/md + ~350KB per image)
  const totalEstSizeKB = (filtered.length * 25) + (totalImages * 420);
  const formattedStorage = totalEstSizeKB > 1024 
    ? `${(totalEstSizeKB / 1024).toFixed(1)} MB` 
    : `${totalEstSizeKB.toFixed(0)} KB`;

  // Build tree based on groupBy mode
  const root = {
    name: "Heritage Pulse Content Vault",
    path: "/",
    type: "root",
    groupBy,
    stats: {
      totalFolders: filtered.length,
      totalArticles: filtered.length,
      totalImages,
      totalWords,
      storageSize: formattedStorage
    },
    children: []
  };

  if (groupBy === 'date') {
    // Year -> Month -> Date -> Category -> Article Folder
    const yearMap = new Map();

    filtered.forEach(item => {
      const info = getArticleFolderInfo(item);
      
      if (!yearMap.has(info.year)) {
        yearMap.set(info.year, new Map());
      }
      const monthMap = yearMap.get(info.year);

      if (!monthMap.has(info.month)) {
        monthMap.set(info.month, new Map());
      }
      const dateMap = monthMap.get(info.month);

      const dayKey = info.dayStr || '2026-08-24';
      if (!dateMap.has(dayKey)) {
        dateMap.set(dayKey, new Map());
      }
      const catMap = dateMap.get(dayKey);

      const category = (info.category || 'Heritage').trim();
      if (!catMap.has(category)) {
        catMap.set(category, []);
      }
      catMap.get(category).push(formatArticleFolderItem(item, info));
    });

    yearMap.forEach((monthMap, yearKey) => {
      const yearNode = {
        id: `yr-${yearKey}`,
        name: `Year ${yearKey}`,
        slug: yearKey,
        type: "folder",
        folderType: "year",
        icon: "fa-solid fa-calendar-days",
        color: "#f59e0b",
        itemCount: 0,
        children: []
      };

      monthMap.forEach((dateMap, monthKey) => {
        const monthNode = {
          id: `mo-${yearKey}-${monthKey}`,
          name: monthKey,
          slug: monthKey,
          type: "folder",
          folderType: "month",
          icon: "fa-regular fa-folder-open",
          color: "#3b82f6",
          itemCount: 0,
          children: []
        };

        dateMap.forEach((catMap, dateKey) => {
          const dObj = new Date(dateKey + 'T00:00:00');
          const prettyDate = isNaN(dObj.getTime()) ? dateKey : dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const dateNode = {
            id: `dt-${yearKey}-${monthKey}-${dateKey}`,
            name: `${dateKey} (${prettyDate})`,
            slug: dateKey,
            type: "folder",
            folderType: "date",
            icon: "fa-solid fa-calendar-check",
            color: "#10b981",
            itemCount: 0,
            children: []
          };

          catMap.forEach((articles, catKey) => {
            const catNode = {
              id: `cat-${yearKey}-${monthKey}-${dateKey}-${catKey}`,
              name: catKey,
              slug: catKey,
              type: "folder",
              folderType: "category",
              icon: "fa-solid fa-tags",
              color: "#a855f7",
              itemCount: articles.length,
              children: articles
            };
            dateNode.itemCount += articles.length;
            dateNode.children.push(catNode);
          });

          monthNode.itemCount += dateNode.itemCount;
          monthNode.children.push(dateNode);
        });

        yearNode.itemCount += monthNode.itemCount;
        yearNode.children.push(monthNode);
      });

      root.children.push(yearNode);
    });

  } else if (groupBy === 'category') {
    // Category -> Year -> Month -> Article Folder
    const catMap = new Map();

    filtered.forEach(item => {
      const info = getArticleFolderInfo(item);
      if (!catMap.has(info.category)) {
        catMap.set(info.category, new Map());
      }
      const yearMap = catMap.get(info.category);

      if (!yearMap.has(info.year)) {
        yearMap.set(info.year, []);
      }
      yearMap.get(info.year).push(formatArticleFolderItem(item, info));
    });

    catMap.forEach((yearMap, catKey) => {
      const catNode = {
        id: `cat-${catKey}`,
        name: catKey,
        slug: catKey,
        type: "folder",
        folderType: "category",
        icon: "fa-solid fa-folder",
        color: "#8b5cf6",
        itemCount: 0,
        children: []
      };

      yearMap.forEach((articles, yearKey) => {
        const yearNode = {
          id: `yr-${catKey}-${yearKey}`,
          name: `Year ${yearKey}`,
          slug: yearKey,
          type: "folder",
          folderType: "year",
          icon: "fa-regular fa-folder",
          color: "#f59e0b",
          itemCount: articles.length,
          children: articles
        };
        catNode.itemCount += articles.length;
        catNode.children.push(yearNode);
      });

      root.children.push(catNode);
    });

  } else if (groupBy === 'writer') {
    // Writer -> Year -> Category -> Article Folder
    const writerMap = new Map();

    filtered.forEach(item => {
      const info = getArticleFolderInfo(item);
      const writerName = item.writer ? item.writer.name : 'Staff Writer';
      if (!writerMap.has(writerName)) {
        writerMap.set(writerName, new Map());
      }
      const yearMap = writerMap.get(writerName);

      if (!yearMap.has(info.year)) {
        yearMap.set(info.year, []);
      }
      yearMap.get(info.year).push(formatArticleFolderItem(item, info));
    });

    writerMap.forEach((yearMap, writerKey) => {
      const writerNode = {
        id: `writer-${writerKey}`,
        name: writerKey,
        slug: writerKey,
        type: "folder",
        folderType: "writer",
        icon: "fa-solid fa-user-pen",
        color: "#10b981",
        itemCount: 0,
        children: []
      };

      yearMap.forEach((articles, yearKey) => {
        const yearNode = {
          id: `yr-${writerKey}-${yearKey}`,
          name: `Year ${yearKey}`,
          slug: yearKey,
          type: "folder",
          folderType: "year",
          icon: "fa-regular fa-folder",
          color: "#f59e0b",
          itemCount: articles.length,
          children: articles
        };
        writerNode.itemCount += articles.length;
        writerNode.children.push(yearNode);
      });

      root.children.push(writerNode);
    });
  }

  return root;
}

function formatArticleFolderItem(item, info) {
  const images = (item.images || []).map((img, idx) => ({
    id: img.id || `img-${idx}`,
    name: img.filename || `image-${idx + 1}.jpg`,
    url: img.file_url,
    caption: img.caption || '',
    credit: img.credit || 'Heritage Pulse Bureau',
    is_featured: !!img.is_featured,
    type: 'image',
    ext: path.extname(img.filename || img.file_url || '.jpg').toLowerCase() || '.jpg',
    sizeKb: 380 + (idx * 45)
  }));

  const wordCount = (item.body || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  const estKb = 15 + Math.round(wordCount * 0.05);

  const files = [
    {
      name: `${item.id}_article.doc`,
      type: 'doc',
      icon: 'fa-solid fa-file-word',
      color: '#2563eb',
      sizeKb: estKb + 18,
      description: 'Microsoft Word document (.doc) with headings, author metadata, and formatted article body',
      downloadUrl: `/api/folders/file/${item.id}/doc`
    },
    {
      name: `${item.id}_content.md`,
      type: 'md',
      icon: 'fa-solid fa-file-code',
      color: '#6366f1',
      sizeKb: estKb,
      description: 'Standard Markdown (.md) source content with complete YAML metadata headers',
      downloadUrl: `/api/folders/file/${item.id}/md`
    },
    {
      name: `${item.id}_metadata.json`,
      type: 'json',
      icon: 'fa-solid fa-file-lines',
      color: '#f59e0b',
      sizeKb: 6,
      description: 'Structured JSON data file with workflow history, schema tags, and timestamps',
      downloadUrl: `/api/folders/file/${item.id}/json`
    },
    {
      name: `${item.id}_proof.pdf`,
      type: 'pdf',
      icon: 'fa-solid fa-file-pdf',
      color: '#ef4444',
      sizeKb: estKb + 45,
      description: 'Printable and downloadable PDF editorial proof with typography styling',
      downloadUrl: `/api/folders/file/${item.id}/pdf`
    },
    ...images.map(img => ({
      name: img.name,
      type: 'image',
      icon: 'fa-solid fa-file-image',
      color: '#10b981',
      url: img.url,
      caption: img.caption,
      credit: img.credit,
      is_featured: img.is_featured,
      sizeKb: img.sizeKb,
      description: `High-resolution image asset (${img.caption || 'Editorial photo'})`,
      downloadUrl: img.url
    }))
  ];

  return {
    id: item.id,
    name: `[${item.id}] ${item.title || item.topic}`,
    folderName: info.folderName,
    type: "article_folder",
    title: item.title || item.topic,
    subtitle: item.subtitle || '',
    category: item.category,
    content_type: item.content_type || 'Article',
    priority: item.priority || 'Medium',
    status: item.status || 'DRAFT',
    progress: item.progress || 0,
    writer: item.writer,
    editor: item.editor,
    publisher: item.publisher,
    start_date: item.start_date,
    deadline: item.deadline,
    publishing_date: item.publishing_date,
    published_url: item.published_url,
    video_url: item.video_url,
    reference_links: item.reference_links,
    sources: item.sources || [],
    featured_image: item.featured_image,
    word_count: wordCount,
    folder_path: info.relativeDatePath,
    vault_path: info.absoluteDiskPath,
    web_vault_url: info.webVaultUrl,
    created_at: item.created_at,
    updated_at: item.updated_at,
    files_count: files.length,
    images_count: images.length,
    total_size_kb: files.reduce((sum, f) => sum + (f.sizeKb || 10), 0),
    files: files,
    images: images
  };
}

// Generate ZIP export package containing JSON, MD, HTML and images
function createFolderZipArchive(item) {
  const info = getArticleFolderInfo(item);
  syncPhysicalDiskVault([item]);

  const zipFilename = `HeritagePulse_${item.id}_${info.titleSlug}.zip`;
  const zipFilePath = path.join(DOWNLOADS_DIR, zipFilename);

  try {
    // Use system zip utility on macOS/Linux
    const cmd = `cd "${path.dirname(info.absoluteDiskPath)}" && zip -r -q "${zipFilePath}" "${path.basename(info.absoluteDiskPath)}"`;
    execSync(cmd);
    return {
      success: true,
      filename: zipFilename,
      downloadUrl: `/downloads/${zipFilename}`,
      path: zipFilePath
    };
  } catch (err) {
    console.error("ZIP creation error:", err);
    // Fallback: create simple export file
    return {
      success: true,
      filename: `${item.id}_export.md`,
      downloadUrl: `/api/folders/file/${item.id}/md`,
      path: path.join(info.absoluteDiskPath, `${item.id}_content.md`)
    };
  }
}

module.exports = {
  getArticleFolderInfo,
  formatArticleMarkdown,
  formatArticleWordDocument,
  syncPhysicalDiskVault,
  buildFoldersTree,
  formatArticleFolderItem,
  createFolderZipArchive,
  VAULT_ROOT
};
