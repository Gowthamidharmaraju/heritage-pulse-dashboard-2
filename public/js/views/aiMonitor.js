// AI Content Intelligence Monitor — Admin & Dr. Tejaswini ONLY
const AiMonitorView = {
  notifSettings: {},

  // ── AI DETECTION ENGINE ──────────────────────────────────────────────────
  analyzeAiContent(text) {
    if (!text || text.trim().length < 40) return { score: 0, level: 'Insufficient', color: '#64748b', emoji: '⚪', flags: [] };
    const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = clean.split(/\s+/);
    const sentences = clean.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const flags = [];
    let score = 0;

    const aiPhrases = [
      'it is worth noting','it is important to note','in conclusion','furthermore','moreover','additionally',
      'in summary','to summarize','delve into','tapestry of','in the realm of','at its core','testament to',
      'underscores the','navigating the','pivotal role','holistic approach','robust','leverage','paradigm',
      'groundbreaking','cutting-edge','synergy','in order to','a myriad of','shed light on','stands as a beacon',
      'embodies the essence','comprehensive','multifaceted','nuanced','intricate','crucial role','time-honored',
      'enduring legacy','profound significance','deep-rooted','pinnacle of','rich heritage','monumental testament'
    ];
    const phraseHits = aiPhrases.filter(p => clean.toLowerCase().includes(p));
    if (phraseHits.length > 0) {
      score += Math.min(phraseHits.length * 7, 40);
      flags.push({ type: 'AI Phrases Detected', detail: `Found ${phraseHits.length} AI signature phrase(s): "${phraseHits.slice(0,3).join('", "')}"` });
    }

    if (sentences.length >= 4) {
      const lengths = sentences.map(s => s.trim().split(/\s+/).length);
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
      if (Math.sqrt(variance) < 6 && avg > 11) {
        score += 20;
        flags.push({ type: 'Uniform Sentence Length', detail: `Sentences are uniformly long (~${avg.toFixed(0)} words), typical of LLM generative patterns.` });
      }
    }

    const passiveMatches = (clean.match(/\b(was|were|is|are|been|being|be)\s+(written|described|known|considered|noted|found|seen|made|given|used|constructed|crafted|celebrated|observed)\b/gi) || []).length;
    if (passiveMatches > 2) {
      score += Math.min(passiveMatches * 4, 18);
      flags.push({ type: 'High Passive Voice', detail: `${passiveMatches} passive constructions detected — AI tends to over-use passive voice.` });
    }

    const formalWords = ['consequently','therefore','thus','hence','whereas','henceforth','albeit','notwithstanding','wherein','whereby','endeavor','facilitate','utilize','implement','ascertain','comprehensively','meticulously','predominantly'];
    const formalHits = formalWords.filter(w => clean.toLowerCase().includes(w));
    if (formalHits.length > 1) {
      score += Math.min(formalHits.length * 4, 16);
      flags.push({ type: 'Formal Academic Vocabulary', detail: `${formalHits.length} formal AI words: "${formalHits.slice(0,3).join('", "')}"` });
    }

    const contractCount = (clean.match(/(don't|can't|won't|it's|that's|there's|we're|you're|I'm|they're|isn't|aren't|wasn't|weren't|couldn't|wouldn't|shouldn't)/gi) || []).length;
    if (contractCount === 0 && words.length > 60) {
      score += 14;
      flags.push({ type: 'Lack of Natural Contractions', detail: 'No contractions found — human writers naturally use contractions.' });
    }

    score = Math.min(score, 100);
    let level, color, emoji;
    if (score <= 20)      { level = 'Human Written'; color = '#10b981'; emoji = '🟢'; }
    else if (score <= 40) { level = 'Mostly Human';  color = '#84cc16'; emoji = '🟡'; }
    else if (score <= 60) { level = 'AI Assisted';   color = '#f59e0b'; emoji = '🟠'; }
    else if (score <= 80) { level = 'Heavily AI';    color = '#ef4444'; emoji = '🔴'; }
    else                  { level = 'AI Generated';  color = '#dc2626'; emoji = '🔴🔴'; }
    return { score, level, color, emoji, flags };
  },

  // ── HUMANIZER ENGINE — Robust phrase + rhythm replacement ──────────────────
  humanizeHtml(html) {
    let h = html || '';

    // Extensive dictionary of AI phrases -> natural conversational human expressions
    const replacements = [
      [/\bit is worth noting that\b/gi, 'notably,'],
      [/\bit is important to note that\b/gi, 'keep in mind that'],
      [/\bit should be noted that\b/gi, 'to note,'],
      [/\bfurthermore\b/gi, 'also'],
      [/\bmoreover\b/gi, 'also'],
      [/\badditionally\b/gi, 'in addition,'],
      [/\bin conclusion\b/gi, 'to wrap up,'],
      [/\bto summarize\b/gi, "in short,"],
      [/\bin summary\b/gi, 'in short,'],
      [/\bdelve into\b/gi, 'explore'],
      [/\bdelves into\b/gi, 'explores'],
      [/\btapestry of\b/gi, 'rich mix of'],
      [/\bin the realm of\b/gi, 'in'],
      [/\bat its core\b/gi, 'essentially,'],
      [/\bfoster\b/gi, 'build'],
      [/\bfosters\b/gi, 'builds'],
      [/\btestament to\b/gi, 'proof of'],
      [/\bunderscores the\b/gi, 'highlights the'],
      [/\bunderscores\b/gi, 'shows'],
      [/\bnavigating the\b/gi, 'working through'],
      [/\bpivotal role\b/gi, 'key role'],
      [/\bcrucial role\b/gi, 'big role'],
      [/\bholistic approach\b/gi, 'all-round approach'],
      [/\brobust\b/gi, 'strong'],
      [/\bleveraging\b/gi, 'using'],
      [/\bleverage\b/gi, 'use'],
      [/\bparadigm\b/gi, 'framework'],
      [/\bgroundbreaking\b/gi, 'pioneering'],
      [/\bcutting-edge\b/gi, 'modern'],
      [/\bsynergy\b/gi, 'combined strength'],
      [/\bin order to\b/gi, 'to'],
      [/\ba myriad of\b/gi, 'many'],
      [/\bshed light on\b/gi, 'explain'],
      [/\bembodies the essence\b/gi, 'captures the spirit'],
      [/\bconsequently\b/gi, 'as a result,'],
      [/\btherefore\b/gi, 'so'],
      [/\bhenceforth\b/gi, 'from now on,'],
      [/\bwhereas\b/gi, 'while'],
      [/\bfacilitate\b/gi, 'help'],
      [/\bfacilitates\b/gi, 'helps'],
      [/\butilize\b/gi, 'use'],
      [/\butilizes\b/gi, 'uses'],
      [/\butilized\b/gi, 'used'],
      [/\bascertain\b/gi, 'find out'],
      [/\bendeav[ou]r\b/gi, 'effort'],
      [/\bwherein\b/gi, 'where'],
      [/\bcomprehensive\b/gi, 'complete'],
      [/\bmultifaceted\b/gi, 'layered'],
      [/\bnuanced\b/gi, 'detailed'],
      [/\bintricate\b/gi, 'detailed'],
      [/\bmeticulous\b/gi, 'careful'],
      [/\bmeticulously\b/gi, 'carefully'],
      [/\bcomprehensively\b/gi, 'fully'],
      [/\bthus\b/gi, 'so'],
      [/\bhence\b/gi, 'so'],
      [/\bit is evident that\b/gi, 'clearly,'],
      [/\bit can be seen that\b/gi, 'we can see that'],
      [/\bone can observe\b/gi, 'we notice'],
      [/\bhas been demonstrated\b/gi, 'has shown'],
      [/\bplays a crucial role\b/gi, 'is vital'],
      [/\bplays an important role\b/gi, 'matters deeply'],
      [/\bsignificant impact\b/gi, 'big impact'],
      [/\bdiverse range of\b/gi, 'wide variety of'],
      [/\bwide range of\b/gi, 'many kinds of'],
      [/\btime-honored\b/gi, 'historic'],
      [/\benduring legacy\b/gi, 'living legacy'],
      [/\bprofound significance\b/gi, 'deep meaning'],
      [/\bdeep-rooted\b/gi, 'ancient'],
      [/\bpinnacle of\b/gi, 'peak of'],
      [/\bbeacon of\b/gi, 'symbol of'],
      [/\bstands as a testament\b/gi, 'proves'],
      [/\bis characterized by\b/gi, 'features'],
      [/\bare characterized by\b/gi, 'feature'],
      [/\bserves as a reminder\b/gi, 'reminds us'],
      [/\bseamlessly\b/gi, 'smoothly'],
      [/\bunparalleled\b/gi, 'exceptional'],
      [/\bpeerless\b/gi, 'unique'],
      [/\bmonolithic\b/gi, 'single-stone'],
      [/\bconfluence of\b/gi, 'meeting of']
    ];

    replacements.forEach(([p, rep]) => {
      h = h.replace(p, rep);
    });

    // Humanize tone by introducing natural contractions where appropriate
    h = h.replace(/\bit is\b/g, "it's");
    h = h.replace(/\bdo not\b/g, "don't");
    h = h.replace(/\bdoes not\b/g, "doesn't");
    h = h.replace(/\bcannot\b/g, "can't");
    h = h.replace(/\bwe are\b/g, "we're");
    h = h.replace(/\bthere is\b/g, "there's");

    return h;
  },

  countChanges(original, humanized) {
    const a = original.replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim();
    const b = humanized.replace(/<[^>]*>/g, ' ').replace(/\s+/g,' ').trim();
    if (a === b) return 0;
    const wordsA = a.split(/\s+/);
    const wordsB = b.split(/\s+/);
    let diff = 0;
    const maxLen = Math.max(wordsA.length, wordsB.length);
    for (let i = 0; i < maxLen; i++) {
      if (wordsA[i] !== wordsB[i]) diff++;
    }
    return Math.max(diff, 1);
  },

  // ── RENDER MAIN PAGE ─────────────────────────────────────────────────────
  async render(container) {
    container.innerHTML = '<div class="view-loading"><div class="spinner"></div><p>Loading AI Content Intelligence Monitor...</p></div>';
    try {
      const [contentList, users, notifSettings] = await Promise.all([
        app.apiGet('/api/content'),
        app.apiGet('/api/users'),
        app.apiGet('/api/notification-settings').catch(() => ({}))
      ]);
      this.notifSettings = notifSettings || {};
      const analyzed = contentList.map(item => {
        const body = (item.body || '') + ' ' + (item.title || '');
        const analysis = this.analyzeAiContent(body);
        return { ...item, _aiAnalysis: analysis, ai_score: item.ai_score ?? analysis.score };
      });
      const writers = users.filter(u => u.role === 'Writer');
      const writerStats = writers.map(w => {
        const items = analyzed.filter(i => i.writer_id === w.id);
        const avg = items.length > 0 ? Math.round(items.reduce((s, i) => s + i._aiAnalysis.score, 0) / items.length) : 0;
        return { ...w, avgAi: avg, articleCount: items.length };
      });

      container.innerHTML = `
        <div class="view-header">
          <div class="view-title-group">
            <h1>⚡ AI Content Intelligence Monitor</h1>
            <p>AI usage detection, content humanizer, and workflow notification settings. <strong>Restricted to Super Admin &amp; Dr. Tejaswini Ma'am only.</strong></p>
          </div>
          <div class="view-actions">
            <span class="badge" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;padding:5px 14px;font-size:0.78rem;font-weight:700;border-radius:20px;">🔐 Admin Intelligence Suite</span>
          </div>
        </div>

        <div style="display:flex;gap:0;margin-bottom:20px;border-bottom:2px solid var(--border-color);">
          <button id="ai-tab-monitor" class="ai-tab-btn active" onclick="AiMonitorView.showTab('monitor')"><i class="fa-solid fa-robot"></i> AI Scanner</button>
          <button id="ai-tab-writers" class="ai-tab-btn" onclick="AiMonitorView.showTab('writers')"><i class="fa-solid fa-users"></i> Writer AI Report</button>
          <button id="ai-tab-notif" class="ai-tab-btn" onclick="AiMonitorView.showTab('notif')"><i class="fa-solid fa-bell"></i> Notification Settings</button>
        </div>

        <!-- TAB: AI Scanner -->
        <div id="ai-tab-content-monitor" class="ai-tab-panel">
          <div class="card-panel">
            <div class="card-panel-header">
              <div class="card-panel-title"><i class="fa-solid fa-magnifying-glass-chart" style="color:#a855f7;"></i><span>AI Usage Analysis — All Content Items</span></div>
              <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:0.76rem;color:var(--text-dim);">Threshold: <strong style="color:#ef4444;">40%</strong> = action required</span>
                <span style="font-size:0.8rem;color:var(--text-dim);">${analyzed.length} articles scanned</span>
              </div>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead><tr><th>Article</th><th>Writer</th><th>Stage</th><th style="min-width:190px">AI Score</th><th>Level</th><th>Actions</th></tr></thead>
                <tbody>
                  ${analyzed.map(item => {
                    const writer = users.find(u => u.id === item.writer_id) || { name: 'Unknown', avatar: 'W' };
                    const a = item._aiAnalysis;
                    const isHigh = a.score > 40;
                    const barColor = a.score <= 20 ? '#10b981' : a.score <= 40 ? '#84cc16' : a.score <= 60 ? '#f59e0b' : '#ef4444';
                    return `<tr style="${isHigh ? 'background:rgba(239,68,68,0.04);' : ''}">
                      <td style="max-width:280px;">
                        <div style="font-weight:700;color:var(--text-primary);font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${app.escapeHtml(item.title)}">${app.escapeHtml(item.title)}</div>
                        <div style="font-size:0.72rem;color:var(--text-dim);font-family:monospace;">${item.id}</div>
                      </td>
                      <td><div style="display:flex;align-items:center;gap:6px;"><span class="avatar-sm bg-purple">${writer.avatar || 'W'}</span><span style="font-size:0.82rem;font-weight:600;">${writer.name}</span></div></td>
                      <td>${app.renderStatusPill(item.status, item.is_overdue)}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                          <div style="flex:1;background:var(--bg-card-subtle);border-radius:20px;height:8px;overflow:hidden;border:1px solid var(--border-color);position:relative;">
                            <div style="height:100%;width:${a.score}%;background:${barColor};border-radius:20px;transition:width 0.8s;"></div>
                            ${isHigh ? '<div style="position:absolute;left:40%;top:0;height:100%;width:2px;background:#fff3;"></div>' : ''}
                          </div>
                          <span style="font-weight:900;font-size:0.95rem;color:${isHigh ? '#ef4444' : barColor};min-width:40px;${isHigh ? 'animation:aiRedPulse 1.5s infinite;' : ''}">${a.score}%</span>
                        </div>
                        ${isHigh ? '<div style="font-size:0.68rem;color:#ef4444;margin-top:2px;font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Above 40% threshold — review needed</div>' : ''}
                      </td>
                      <td><span style="display:inline-flex;align-items:center;gap:4px;background:${barColor}22;color:${barColor};padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;border:1px solid ${barColor}44;">${a.emoji} ${a.level}</span></td>
                      <td>
                        <div style="display:flex;gap:5px;flex-wrap:wrap;">
                          <button class="btn btn-xs btn-outline-light" onclick="AiMonitorView.showAiReport('${item.id}')"><i class="fa-solid fa-chart-bar"></i> Report</button>
                          <button class="btn btn-xs" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:700;border:none;" onclick="AiMonitorView.openHumanizerModal('${item.id}')"><i class="fa-solid fa-wand-magic-sparkles"></i> Humanize</button>
                          <button class="btn btn-xs btn-outline-light" onclick="app.navigateTo('content-detail',{id:'${item.id}'})"><i class="fa-solid fa-arrow-up-right-from-square"></i></button>
                        </div>
                      </td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:12px;padding:12px 16px;background:var(--bg-card-subtle);border-radius:var(--radius-md);border:1px solid var(--border-color);align-items:center;">
            <span style="font-size:0.76rem;font-weight:700;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.05em;">Legend:</span>
            ${[['0–20%','Human Written','#10b981'],['21–40%','Mostly Human','#84cc16'],['41–60%','AI Assisted','#f59e0b'],['61–80%','Heavily AI','#ef4444'],['81–100%','AI Generated','#dc2626']].map(([range,label,color])=>`<span style="display:inline-flex;align-items:center;gap:6px;font-size:0.76rem;"><span style="width:10px;height:10px;border-radius:50%;background:${color};"></span><strong style="color:${color};">${range}</strong><span style="color:var(--text-secondary);">${label}</span></span>`).join('')}
            <span style="margin-left:auto;font-size:0.75rem;color:#ef4444;font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Red highlight = AI usage above 40% threshold</span>
          </div>
        </div>

        <!-- TAB: Writer AI Report -->
        <div id="ai-tab-content-writers" class="ai-tab-panel hidden">
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:20px;">
            ${writerStats.map(w => {
              const color = w.avgAi <= 20 ? '#10b981' : w.avgAi <= 40 ? '#84cc16' : w.avgAi <= 60 ? '#f59e0b' : '#ef4444';
              return `<div class="card-panel" style="padding:18px;${w.avgAi > 40 ? 'border-color:#ef444444;' : ''}">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
                  <span class="avatar bg-purple" style="width:42px;height:42px;font-size:1rem;">${w.avatar}</span>
                  <div><div style="font-weight:700;color:var(--text-primary);">${w.name}</div><div style="font-size:0.72rem;color:var(--text-dim);">${w.title || 'Writer'}</div></div>
                </div>
                <div style="margin-bottom:10px;">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-size:0.76rem;color:var(--text-secondary);font-weight:600;">Avg AI Score</span>
                    <span style="font-weight:800;color:${color};font-size:1rem;">${w.avgAi}%</span>
                  </div>
                  <div style="background:var(--bg-card-subtle);border-radius:20px;height:10px;overflow:hidden;border:1px solid var(--border-color);">
                    <div style="height:100%;width:${w.avgAi}%;background:linear-gradient(90deg,${color},${color}99);border-radius:20px;"></div>
                  </div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.76rem;color:var(--text-dim);">
                  <span><i class="fa-solid fa-file-lines"></i> ${w.articleCount} articles</span>
                  <span style="color:${color};font-weight:700;">${w.avgAi <= 20 ? '✅ Excellent' : w.avgAi <= 40 ? '🟡 Acceptable' : w.avgAi <= 60 ? '🟠 Review' : '🔴 High AI'}</span>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- TAB: Notification Settings -->
        <div id="ai-tab-content-notif" class="ai-tab-panel hidden">
          ${this.renderNotifSettingsPanel(notifSettings)}
        </div>
      `;
    } catch(err) {
      console.error(err);
      container.innerHTML = `<div class="card-panel"><p style="color:#ef4444;">Failed to load AI Monitor: ${err.message}</p></div>`;
    }
  },

  renderNotifSettingsPanel(settings) {
    const s = settings || {};
    return `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:20px;">
      <div class="card-panel" style="padding:20px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#2563eb,#60a5fa);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-envelope" style="color:#fff;font-size:1.1rem;"></i></div>
          <div><div style="font-weight:700;color:var(--text-primary);font-size:1rem;">Email Notifications</div><div style="font-size:0.72rem;color:var(--text-dim);">Opens email app with pre-filled workflow update</div></div>
        </div>
        <div class="form-group"><label class="form-label">Super Admin (Jitendra) Email</label><input type="email" id="notif-admin-email" class="form-control" value="${s.adminEmail || 'jitendra@heritagepulse.org'}"></div>
        <div class="form-group"><label class="form-label">Dr. Tejaswini Ma'am Email</label><input type="email" id="notif-tej-email" class="form-control" value="${s.tejaswiniEmail || 'tejaswini@heritagepulse.org'}"></div>
        <div style="font-size:0.76rem;color:var(--text-dim);background:rgba(37,99,235,0.08);padding:10px 12px;border-radius:8px;border:1px solid rgba(37,99,235,0.2);margin-bottom:14px;"><i class="fa-solid fa-circle-info" style="color:#3b82f6;"></i> Notifications appear in 🔔 bell with quick Email action button.</div>
        <button class="btn btn-primary btn-sm w-100" onclick="AiMonitorView.saveNotifSettings()"><i class="fa-solid fa-floppy-disk"></i> Save Email Settings</button>
      </div>

      <div class="card-panel" style="padding:20px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#16a34a,#4ade80);display:flex;align-items:center;justify-content:center;"><i class="fa-brands fa-whatsapp" style="color:#fff;font-size:1.2rem;"></i></div>
          <div><div style="font-weight:700;color:var(--text-primary);font-size:1rem;">WhatsApp Notifications</div><div style="font-size:0.72rem;color:var(--text-dim);">Opens WhatsApp with pre-filled stage update message</div></div>
        </div>
        <div class="form-group"><label class="form-label">Super Admin (Jitendra) WhatsApp Number</label><input type="text" id="notif-admin-phone" class="form-control" value="${s.adminPhone || ''}" placeholder="+91 98765 43210"></div>
        <div class="form-group"><label class="form-label">Dr. Tejaswini Ma'am WhatsApp Number</label><input type="text" id="notif-tej-phone" class="form-control" value="${s.tejaswiniPhone || ''}" placeholder="+91 99887 11223"></div>
        <div style="font-size:0.76rem;color:var(--text-dim);background:rgba(22,163,74,0.08);padding:10px 12px;border-radius:8px;border:1px solid rgba(22,163,74,0.2);margin-bottom:12px;"><i class="fa-brands fa-whatsapp" style="color:#16a34a;"></i> Workflow notification → click WhatsApp button → opens WA with ready-to-send message.</div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <button class="btn btn-sm btn-outline-light" style="flex:1;" onclick="AiMonitorView.testWhatsApp('admin')"><i class="fa-brands fa-whatsapp" style="color:#16a34a;"></i> Test Super Admin WA</button>
          <button class="btn btn-sm btn-outline-light" style="flex:1;" onclick="AiMonitorView.testWhatsApp('tej')"><i class="fa-brands fa-whatsapp" style="color:#16a34a;"></i> Test Dr. TM WA</button>
        </div>
        <button class="btn btn-primary btn-sm w-100" onclick="AiMonitorView.saveNotifSettings()"><i class="fa-solid fa-floppy-disk"></i> Save WhatsApp Settings</button>
      </div>

      <div class="card-panel" style="padding:20px;">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
          <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;"><i class="fa-solid fa-sliders" style="color:#fff;font-size:1.1rem;"></i></div>
          <div><div style="font-weight:700;color:var(--text-primary);font-size:1rem;">Notify When</div><div style="font-size:0.72rem;color:var(--text-dim);">Choose which stages trigger notifications</div></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
          ${[['all','📋 Every Stage Transition','Get notified whenever any stage changes'],['submit_only','📝 Writer Submission Only','Only when writer submits to editor'],['final_only','✅ Final Approval Only','Only when content reaches final approval'],['publish_only','🚀 Ready to Publish Only','Only when content is ready to go live']].map(([val,label,desc])=>`
            <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:10px;border-radius:8px;border:1px solid ${(s.notifyOn||'all')===val?'var(--indigo-bright)':'var(--border-color)'};background:${(s.notifyOn||'all')===val?'rgba(99,102,241,0.08)':'transparent'};">
              <input type="radio" name="notif-trigger" value="${val}" ${(s.notifyOn||'all')===val?'checked':''} style="margin-top:2px;accent-color:var(--indigo-bright);">
              <div><div style="font-weight:600;font-size:0.85rem;color:var(--text-primary);">${label}</div><div style="font-size:0.72rem;color:var(--text-dim);">${desc}</div></div>
            </label>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-sm w-100" onclick="AiMonitorView.saveNotifSettings()"><i class="fa-solid fa-floppy-disk"></i> Save Preferences</button>
      </div>
    </div>`;
  },

  async showAiReport(contentId) {
    const items = await app.apiGet('/api/content');
    const item = items.find(i => i.id === contentId);
    if (!item) return;
    const a = this.analyzeAiContent((item.body || '') + ' ' + (item.title || ''));
    const existing = document.getElementById('ai-report-modal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', `
      <div id="ai-report-modal" class="modal-overlay" onclick="if(event.target===this)this.remove()">
        <div class="modal-card modal-lg">
          <div class="modal-header">
            <div class="modal-title">
              <span class="badge" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:700;font-size:0.76rem;padding:3px 10px;border-radius:4px;"><i class="fa-solid fa-robot"></i> AI ANALYSIS REPORT</span>
              <h3 style="font-family:var(--font-display);font-size:1.1rem;color:var(--text-primary);margin-top:4px;">${app.escapeHtml(item.title)}</h3>
            </div>
            <button class="modal-close" onclick="document.getElementById('ai-report-modal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding:24px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="font-size:3.5rem;font-weight:900;color:${a.color};line-height:1;">${a.score}%</div>
              <div style="font-size:0.78rem;color:var(--text-dim);margin-bottom:8px;">AI Usage Score</div>
              <span style="display:inline-flex;align-items:center;gap:6px;background:${a.color}22;color:${a.color};padding:4px 14px;border-radius:20px;font-weight:700;font-size:0.9rem;border:1px solid ${a.color}44;">${a.emoji} ${a.level}</span>
              ${a.score > 40 ? '<div style="margin-top:10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);padding:8px 14px;border-radius:8px;font-size:0.8rem;color:#ef4444;font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> Above 40% threshold — humanization recommended before publishing</div>' : '<div style="margin-top:10px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);padding:8px 14px;border-radius:8px;font-size:0.8rem;color:#10b981;font-weight:700;"><i class="fa-solid fa-circle-check"></i> Within acceptable AI usage threshold (≤40%)</div>'}
            </div>
            <div style="font-weight:700;color:var(--text-primary);margin-bottom:10px;"><i class="fa-solid fa-flag" style="color:var(--saffron);"></i> Detected AI Patterns (${a.flags.length})</div>
            ${a.flags.length === 0 ? `<div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);padding:12px;border-radius:8px;font-size:0.83rem;color:#10b981;font-weight:600;">✅ No significant AI patterns detected. Content appears human-written.</div>` : a.flags.map(f=>`<div style="display:flex;gap:10px;padding:10px;background:var(--bg-card-subtle);border:1px solid var(--border-color);border-radius:8px;margin-bottom:8px;"><i class="fa-solid fa-triangle-exclamation" style="color:${a.color};margin-top:2px;"></i><div><div style="font-weight:700;font-size:0.82rem;color:var(--text-primary);">${f.type}</div><div style="font-size:0.78rem;color:var(--text-secondary);">${f.detail}</div></div></div>`).join('')}
          </div>
          <div class="modal-footer" style="justify-content:space-between;">
            <button class="btn btn-outline-light btn-sm" onclick="document.getElementById('ai-report-modal').remove()">Close</button>
            <button class="btn btn-sm" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:700;border:none;" onclick="document.getElementById('ai-report-modal').remove();AiMonitorView.openHumanizerModal('${contentId}')"><i class="fa-solid fa-wand-magic-sparkles"></i> Humanize This Content</button>
          </div>
        </div>
      </div>
    `);
  },

  // ── HUMANIZER MODAL ───────────────────────────────────────────────────────
  async openHumanizerModal(contentId) {
    const item = await app.apiGet('/api/content/' + contentId);
    if (!item) return;
    const existing = document.getElementById('humanizer-modal');
    if (existing) existing.remove();

    // Get current live editor content if active
    let currentBody = item.body || '';
    const activeEditor = document.getElementById('article-body');
    if (activeEditor && app.currentView === 'content-detail' && app.viewParams?.id === contentId) {
      currentBody = activeEditor.innerHTML || currentBody;
    }

    const originalHtml = currentBody;
    const humanizedHtml = this.humanizeHtml(originalHtml);
    const changes = this.countChanges(originalHtml, humanizedHtml);

    const originalPlain = originalHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const humanizedPlain = humanizedHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    document.body.insertAdjacentHTML('beforeend', `
      <div id="humanizer-modal" class="modal-overlay" onclick="if(event.target===this)this.remove()">
        <div class="modal-card modal-xl">
          <div class="modal-header">
            <div class="modal-title">
              <span class="badge" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:700;font-size:0.76rem;padding:3px 10px;border-radius:4px;"><i class="fa-solid fa-wand-magic-sparkles"></i> HP INTELLIGENCE HUMANIZER</span>
              <h3 style="font-family:var(--font-display);font-size:1.1rem;color:var(--text-primary);margin-top:4px;">${app.escapeHtml(item.title)}</h3>
            </div>
            <button class="modal-close" onclick="document.getElementById('humanizer-modal').remove()">&times;</button>
          </div>
          <div class="modal-body" style="padding:20px;">
            <div style="background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(168,85,247,0.08));border:1px solid rgba(124,58,237,0.3);padding:12px 16px;border-radius:10px;margin-bottom:16px;font-size:0.82rem;color:var(--text-secondary);display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
              <i class="fa-solid fa-wand-magic-sparkles" style="color:#a855f7;"></i>
              <strong>HP Intelligence Humanizer</strong> — Replaces robotic AI signature phrases, reduces passive voice, and adds natural conversational rhythm.
              <span class="badge" style="background:rgba(16,185,129,0.15);color:#10b981;border:1px solid rgba(16,185,129,0.3);font-size:0.75rem;padding:3px 8px;border-radius:10px;margin-left:auto;">
                <i class="fa-solid fa-check"></i> ${changes} phrase &amp; rhythm improvements
              </span>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
              <div>
                <div style="font-weight:700;color:var(--text-dim);font-size:0.76rem;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                  <span style="width:10px;height:10px;border-radius:50%;background:#ef4444;display:inline-block;"></span> Original Content (AI Detected)
                </div>
                <textarea class="form-control" style="height:340px;font-size:0.8rem;line-height:1.7;font-family:var(--font-mono);resize:vertical;background:rgba(239,68,68,0.04);border-color:rgba(239,68,68,0.2);" readonly>${app.escapeHtml(originalPlain)}</textarea>
              </div>
              <div>
                <div style="font-weight:700;color:var(--text-dim);font-size:0.76rem;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                  <span style="width:10px;height:10px;border-radius:50%;background:#10b981;display:inline-block;"></span> Humanized Version <span style="color:#10b981;font-size:0.7rem;">(editable)</span>
                </div>
                <textarea id="humanizer-preview-text" data-html="${encodeURIComponent(humanizedHtml)}" class="form-control" style="height:340px;font-size:0.8rem;line-height:1.7;font-family:var(--font-mono);resize:vertical;background:rgba(16,185,129,0.04);border-color:rgba(16,185,129,0.2);">${app.escapeHtml(humanizedPlain)}</textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="justify-content:space-between;">
            <button class="btn btn-outline-light btn-sm" onclick="document.getElementById('humanizer-modal').remove()">Cancel</button>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-secondary btn-sm" onclick="AiMonitorView.copyHumanized()"><i class="fa-solid fa-copy"></i> Copy Text</button>
              <button class="btn btn-sm" style="background:linear-gradient(135deg,#7c3aed,#a855f7);color:#fff;font-weight:700;border:none;" onclick="AiMonitorView.applyHumanized('${contentId}')"><i class="fa-solid fa-check"></i> Apply &amp; Save to Article</button>
            </div>
          </div>
        </div>
      </div>
    `);
  },

  copyHumanized() {
    const ta = document.getElementById('humanizer-preview-text');
    if (ta) app.copyToClipboard(ta.value, 'Humanized Text');
  },

  async applyHumanized(contentId) {
    const ta = document.getElementById('humanizer-preview-text');
    if (!ta) return;
    const htmlData = ta.getAttribute('data-html');
    const newBody = htmlData ? decodeURIComponent(htmlData) : ta.value;

    document.getElementById('humanizer-modal')?.remove();

    await app.animateWorkflowProgress({
      prevProgress: 0,
      targetProgress: 100,
      targetStatus: 'WRITING',
      title: 'AI Content Intelligence Monitor',
      subtitle: 'Applying humanized natural phrasing & saving article to database...',
      onComplete: async () => {
        try {
          await app.apiPut('/api/content/' + contentId, { body: newBody });
          const newAnalysis = this.analyzeAiContent(newBody);
          await fetch('/api/content/' + contentId + '/ai-score', { 
            method: 'PUT', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ ai_score: newAnalysis.score }) 
          });

          app.showToast(`✨ Humanized content saved! New AI score: ${newAnalysis.score}% (${newAnalysis.level})`, 'success');

          // Update active editor if user is on content detail view
          if (app.currentView === 'content-detail') {
            const editor = document.getElementById('article-body-editor') || document.getElementById('article-body');
            if (editor) editor.innerHTML = newBody;
            app.renderCurrentView();
          } else if (app.currentView === 'ai-monitor') {
            this.render(document.getElementById('main-content-view'));
          } else {
            app.renderCurrentView();
          }
        } catch(err) {
          app.showToast('Failed to save: ' + err.message, 'error');
        }
      }
    });
  },

  showTab(tab) {
    document.querySelectorAll('.ai-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.ai-tab-panel').forEach(p => p.classList.add('hidden'));
    const btn = document.getElementById('ai-tab-' + tab);
    const panel = document.getElementById('ai-tab-content-' + tab);
    if (btn) btn.classList.add('active');
    if (panel) panel.classList.remove('hidden');
  },

  async saveNotifSettings() {
    const adminEmail = document.getElementById('notif-admin-email')?.value || '';
    const tejaswiniEmail = document.getElementById('notif-tej-email')?.value || '';
    const adminPhone = document.getElementById('notif-admin-phone')?.value || '';
    const tejaswiniPhone = document.getElementById('notif-tej-phone')?.value || '';
    const notifyOnEl = document.querySelector('input[name="notif-trigger"]:checked');
    const notifyOn = notifyOnEl ? notifyOnEl.value : 'all';
    try {
      await app.apiPut('/api/notification-settings', { adminEmail, tejaswiniEmail, adminPhone, tejaswiniPhone, notifyOn });
      app.showToast('✅ Notification settings saved!', 'success');
    } catch(err) {
      app.showToast('Failed to save: ' + err.message, 'error');
    }
  },

  testWhatsApp(who) {
    const phoneEl = document.getElementById(who === 'admin' ? 'notif-admin-phone' : 'notif-tej-phone');
    const phone = phoneEl ? phoneEl.value.replace(/[^0-9]/g, '') : '';
    if (!phone) { app.showToast('Please enter a phone number first!', 'error'); return; }
    const msg = encodeURIComponent('👋 *Heritage Pulse Test Notification*\n\nThis is a test message from the Heritage Pulse Editorial Dashboard.\n\nWorkflow notifications for article stage updates will be sent to this number.\n\n_Dashboard: http://localhost:3000_');
    window.open('https://wa.me/' + phone + '?text=' + msg, '_blank');
  }
};
