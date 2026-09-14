// ==UserScript==
// @name         Sondeptraidatimthayban
// @namespace    https://sm.config.inc/
// @version      2.14.0
// @description  Tự động đọc Google Sheet và quản lý, đồng bộ TaskBox trên Scenario Manager
// @author       Sondeptrainhatquadat
// @match        https://sm.config.inc/*
// @match        http://sm.config.inc/*
// @connect      docs.google.com
// @connect      google.com
// @connect      googleusercontent.com
// @connect      api.qrserver.com
// @connect      *
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @noframes
// @updateURL    https://github.com/chaocauminhlason/sm-taskbox-tool/raw/main/tampermonkey_taskbox_sync_tool.user.js
// @downloadURL  https://github.com/chaocauminhlason/sm-taskbox-tool/raw/main/tampermonkey_taskbox_sync_tool.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Guard: Do not run inside iframes and prevent multiple instances
  if (typeof window !== 'undefined') {
    if (window.top !== window.self) return;
    if (document.getElementById('sm-sync-floating-btn')) return;
  }

  // --- STYLES ---
  const style = document.createElement('style');
  style.textContent = `
    #sm-sync-floating-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      background: linear-gradient(135deg, #1e40af, #3b82f6);
      color: #ffffff;
      padding: 12px 20px;
      font-weight: 600;
      font-size: 14px;
      border-radius: 50px;
      border: 1px solid rgba(255,255,255,0.2);
      box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.5), 0 8px 10px -6px rgba(59, 130, 246, 0.5);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #sm-sync-floating-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px -5px rgba(59, 130, 246, 0.6);
      background: linear-gradient(135deg, #1d4ed8, #2563eb);
    }
    #sm-sync-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.82);
      z-index: 100000;
      display: none;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    #sm-sync-modal {
      background: #0f172a;
      color: #f8fafc;
      width: 95vw;
      max-width: 1300px;
      min-width: 650px;
      height: 90vh;
      min-height: 500px;
      max-height: 96vh;
      border-radius: 16px;
      border: 1px solid #334155;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      resize: both;
      position: relative;
      transform: translateZ(0);
      backface-visibility: hidden;
    }
    #sm-sync-modal::-webkit-resizer {
      background: linear-gradient(135deg, transparent 50%, #3b82f6 50%);
    }
    
    #sm-sync-modal.sm-modal-fullscreen {
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      border-radius: 0 !important;
      border: none !important;
      resize: none !important;
    }
    .sm-sync-header-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 16px;
      cursor: pointer;
      line-height: 1;
      padding: 6px 8px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .sm-sync-header-btn:hover { color: #f8fafc; background: #334155; }
    .sm-quick-chip {
      background: #1e293b;
      border: 1px solid #475569;
      color: #38bdf8;
      border-radius: 4px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .sm-quick-chip:hover {
      background: #3b82f6;
      color: #ffffff;
      border-color: #60a5fa;
    }

    .sm-sync-header {
      padding: 14px 20px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    .sm-sync-header h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      color: #60a5fa;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sm-sync-close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 22px;
      cursor: pointer;
      line-height: 1;
      padding: 4px;
      border-radius: 6px;
    }
    .sm-sync-close-btn:hover { color: #f8fafc; background: #334155; }
    .sm-sync-body {
      padding: 16px 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      min-height: 0;
    }
    .sm-input-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .sm-input-group label {
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
    }
    .sm-input-control {
      background: #1e293b;
      border: 1px solid #475569;
      border-radius: 8px;
      color: #f8fafc;
      padding: 8px 12px;
      font-size: 13.5px;
      outline: none;
      transition: border-color 0.2s;
    }
    .sm-input-control:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
    .sm-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      flex-shrink: 0;
    }
    .sm-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 10px 14px;
    }
    .sm-card h3 {
      margin: 0 0 8px 0;
      font-size: 13px;
      font-weight: 600;
      color: #93c5fd;
    }
    .sm-assignee-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 8px;
      max-height: 110px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .sm-assignee-item {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #0f172a;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #334155;
    }
    .sm-assignee-item span {
      font-size: 12px;
      font-weight: 600;
      min-width: 55px;
      color: #38bdf8;
    }
    .sm-assignee-item input {
      background: #1e293b;
      border: 1px solid #475569;
      border-radius: 4px;
      color: #fff;
      padding: 3px 6px;
      font-size: 12px;
      width: 100%;
      outline: none;
    }
    .sm-btn-row {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      align-items: center;
      margin-top: 4px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }
    .sm-btn {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .sm-btn-primary {
      background: #2563eb;
      color: white;
    }
    .sm-btn-primary:hover { background: #1d4ed8; }
    .sm-btn-success {
      background: #16a34a;
      color: white;
    }
    .sm-btn-success:hover { background: #15803d; }
    .sm-btn-secondary {
      background: #334155;
      color: #e2e8f0;
    }
    .sm-btn-secondary:hover { background: #475569; }
    .sm-table-container {
      flex: 1;
      min-height: 220px;
      overflow-y: auto;
      border: 1px solid #334155;
      border-radius: 8px;
      background: #0f172a;
      resize: vertical;
    }
    .sm-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
      text-align: left;
    }
    .sm-table th {
      background: #1e293b;
      color: #94a3b8;
      font-weight: 600;
      padding: 10px 12px;
      position: sticky;
      top: 0;
      border-bottom: 1px solid #334155;
    }
    .sm-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #1e293b;
      color: #cbd5e1;
    }
    .sm-table tr:hover td { background: rgba(51, 65, 85, 0.4); }
    .sm-table th.sm-th-sortable {
      cursor: pointer;
      user-select: none;
      transition: background 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .sm-table th.sm-th-sortable:hover {
      background: #334155;
      color: #38bdf8;
    }
    .sm-sort-icon {
      display: inline-block;
      margin-left: 4px;
      font-size: 10px;
      color: #64748b;
    }
    .sm-sort-icon.sm-sort-active {
      color: #38bdf8;
      font-weight: 800;
    }
    .sm-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .sm-badge-create { background: #065f46; color: #34d399; }
    .sm-badge-update { background: #854d0e; color: #fde047; }
    .sm-badge-match { background: #1e3a8a; color: #93c5fd; }
    .sm-badge-collected { background: #991b1b; color: #fca5a5; }
    .sm-badge-skip { background: #334155; color: #94a3b8; }
    .sm-progress-bar {
      height: 6px;
      background: #1e293b;
      border-radius: 3px;
      overflow: hidden;
      display: none;
    }
    .sm-progress-fill {
      height: 100%;
      background: #3b82f6;
      width: 0%;
      transition: width 0.2s;
    }
    .sm-log-box {
      background: #020617;
      border: 1px solid #1e293b;
      border-radius: 6px;
      padding: 10px;
      font-family: monospace;
      font-size: 12px;
      color: #a5f3fc;
      max-height: 120px;
      overflow-y: auto;
      display: none;
    }
    .sm-pill-btn {
      background: #334155;
      color: #e2e8f0;
      border: 1px solid #475569;
      border-radius: 9999px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .sm-pill-btn:hover {
      background: #475569;
      color: #fff;
    }
    .sm-pill-active {
      background: #2563eb !important;
      color: #ffffff !important;
      border-color: #3b82f6 !important;
    }
    .sm-tabs-bar {
      display: flex;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      padding: 0 16px;
      gap: 4px;
      flex-shrink: 0;
    }
    .sm-tab-btn {
      background: transparent;
      border: none;
      color: #94a3b8;
      padding: 10px 18px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .sm-tab-btn:hover {
      color: #f8fafc;
      background: rgba(255, 255, 255, 0.03);
    }
    .sm-tab-btn.sm-tab-active {
      color: #38bdf8;
      border-bottom-color: #38bdf8;
      background: rgba(56, 189, 248, 0.08);
    }
    .sm-tab-pane {
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
      min-height: 0;
    }
  `;
  document.head.appendChild(style);

  // --- COMPLETE STANDARD ANCHOR MAP (77 Anchors) ---
  const STANDARD_ANCHORS = {
    'tulanh': '003673',
    'bephongngoai': '003674',
    'tubep': '003675',
    'mayruabat': '003676',
    'kechauinoxcochan': '003677',
    'tulocker6ngan': '003678',
    'lonuongamtu': '003679',
    'bangchuyen': '003680',
    'xerac': '003681',
    'bepnuongbbq': '003682',
    'boothbanhang': '003683',
    'xedayembe': '003684',
    'giaphoiquanao': '003685',
    'toong': '003828',
    'tugiaynho': '003686',
    'tugiay': '003686',
    'xedap': '003687',
    'leudulich': '003688',
    'caulaquanao': '003689',
    'tumat': '003691',
    'tudong': '003690',
    'tukinhtrungbay': '003692',
    'tuthuoc': '003693',
    'tuthooc': '003693',
    'maylocnuoc': '003731',
    'tutailieu': '003695',
    'tusayquanaoxanh': '003696',
    'tuhapdoan': '003722',
    'maygiatcuatruoc': '003698',
    'mayphacafe': '003699',
    'mayphacaphe': '003699',
    'tulanhmini': '003700',
    'ket': '003701',
    'banhoc': '003702',
    'sofa': '003703',
    'tusayquanaotim': '003704',
    'mayin3d': '003717',
    'tukythuat3f': '003714',
    'banvekythuat': '003706',
    'kededo': '003707',
    'tuquanao': '003712',
    'xebanhang': '003708',
    'tuhapto': '003697',
    'boncau': '003709',
    'lavabo': '003710',
    'maygiatcuatren': '003711',
    'giuongtreem': '003851',
    'bomaytinhserver': '003725',
    'xedayphucvunhahang': '003719',
    'cuitreem': '003705',
    'kecay': '003721',
    'xeototreem': '003716',
    'quathoinuoc': '003730',
    'maybongngo': '003729',
    'tukythuat': '003718',
    'tubanhden': '003727',
    'quayvuichoitreem': '003726',
    'mayhutchankhong': '003723',
    'maymay': '003735',
    'mayphatdien': '003734',
    'xedayyte': '003720',
    'bantrangdiem': '003732',
    'kesieuthi': '003740',
    'quaythungan': '003715',
    'cuithucung': '003739',
    'giuongbenh': '003738',
    'tubanh': '003737',
    'lovisong': '003724',
    'kedochoi': '003736',
    'xelan': '003733',
    'kededotuquanao': '003707',
    'xebanhangtuhapto': '003708',
    'boncaulavabomaygiatcuatren': '003709',
    'maylocnuocquathoinuoc': '003730',
    'quayvuichoitreemototrecon': '003726',
    'mayhutchankhongmayphatdien': '003723',
    'kesieuthikedochoi': '003736',
    'quaythunganlovisong': '003715',
    'giuongbenhxelan': '003738',
    'mayin3dtukythuat': '003717'
  };

  
  // --- CURRENT LOGGED-IN USER HELPER ---
  function getLoggedInUser() {
    try {
      if (typeof window.ME === 'string' && window.ME.trim()) return window.ME.trim();
      if (typeof window.username === 'string' && window.username.trim()) return window.username.trim();
      
      const navStrong = document.querySelector('.nav-link strong, .navbar strong, #indexInventoryReturner');
      if (navStrong) {
        const val = (navStrong.value || navStrong.textContent || '').trim();
        const m = val.match(/^([a-zA-Z0-9_-]+)/);
        if (m) return m[1].trim();
      }
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('objectInventoryCart:')) {
          const u = k.replace('objectInventoryCart:', '').trim();
          if (u) return u;
        }
      }
    } catch (e) {}
    return '';
  }

  function removeVietnameseTones(str) {
    str = str || '';
    str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    str = str.replace(/đ/g, 'd').replace(/Đ/g, 'D');
    return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  }

  function parseCSV(text) {
    const lines = text.split(/\r\n|\n/);
    const rows = [];
    for (let line of lines) {
      if (!line.trim()) continue;
      const row = [];
      let inQuotes = false;
      let cell = '';
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (c === ',' && !inQuotes) {
          row.push(cell);
          cell = '';
        } else {
          cell += c;
        }
      }
      row.push(cell);
      rows.push(row);
    }
    return rows;
  }

  function extractSheetUrlInfo(url) {
    const matchId = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    const matchGid = url.match(/[#&?]gid=([0-9]+)/);
    const docId = matchId ? matchId[1] : null;
    const gid = matchGid ? matchGid[1] : '0';
    return { docId, gid };
  }

  function fetchSheetCSV(url) {
    return new Promise((resolve, reject) => {
      const { docId, gid } = extractSheetUrlInfo(url);
      if (!docId) return reject(new Error('URL Google Sheet không hợp lệ! Vui lòng kiểm tra lại link.'));
      const exportUrl = `https://docs.google.com/spreadsheets/d/${docId}/export?format=csv&gid=${gid}`;

      if (typeof GM_xmlhttpRequest !== 'undefined') {
        GM_xmlhttpRequest({
          method: 'GET',
          url: exportUrl,
          onload: function (response) {
            const rawText = (response.responseText || '').trim();
            if (rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html') || rawText.includes('accounts.google.com') || rawText.includes('ServiceLogin')) {
              reject(new Error('Google Sheet yêu cầu đăng nhập hoặc chưa mở quyền xem công khai. Hãy mở Google Sheet -> Share -> Bất kỳ ai có liên kết đều có thể xem (Anyone with the link).'));
              return;
            }
            if (response.status >= 200 && response.status < 300) {
              try {
                const rows = parseCSV(rawText);
                if (!rows || rows.length === 0) {
                  reject(new Error('Google Sheet rỗng hoặc không có dữ liệu CSV!'));
                } else {
                  resolve(rows);
                }
              } catch (e) {
                reject(new Error('Lỗi khi đọc định dạng CSV từ Sheet: ' + e.message));
              }
            } else {
              reject(new Error(`Không thể tải dữ liệu Sheet (HTTP ${response.status}). Đảm bảo Sheet đã được Share quyền xem (Anyone with link can view).`));
            }
          },
          onerror: function (err) {
            reject(new Error('Lỗi kết nối khi tải Google Sheet: ' + (err.statusText || 'Network Error')));
          }
        });
      } else {
        fetch(exportUrl)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
          })
          .then(text => {
            const trimmed = text.trim();
            if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) {
              throw new Error('Google Sheet yêu cầu đăng nhập. Vui lòng mở quyền chia sẻ (Anyone with the link can view).');
            }
            resolve(parseCSV(trimmed));
          })
          .catch(err => reject(new Error('Không thể tải Google Sheet: ' + err.message)));
      }
    });
  }

  // --- PARSE TASKBOXES FROM CSV ---
  function parseTaskboxesFromRows(rows) {
    const blocks = [];
    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      if (r.length > 0 && /^\d+$/.test(r[0].trim())) {
        const stt = parseInt(r[0].trim(), 10);
        const code = r[1] ? r[1].trim() : '';
        let lo_name = '';
        let direct_anchor_id = '';

        for (let sub = idx + 1; sub < Math.min(idx + 24, rows.length); sub++) {
          if (rows[sub] && rows[sub][1] && rows[sub][1].trim()) {
            const val = rows[sub][1].trim();
            // Check if cell contains direct Anchor ID (5 or 6 digits)
            if (/^\d{5,6}$/.test(val)) {
              direct_anchor_id = val.padStart(6, '0');
            } else if (!val.startsWith('SC') && !val.startsWith('Large') && !val.startsWith('Table') && !val.startsWith('00')) {
              if (!lo_name) lo_name = val;
            }
          }
        }

        blocks.push({
          stt,
          code,
          lo_name,
          direct_anchor_id,
          start_row: idx,
          end_row: idx + 25
        });
      }
    }

    const stagesConfig = [
      { name: 'B2', start_col: 2 },
      { name: 'B3', start_col: 9 },
      { name: 'A1', start_col: 16 }
    ];

    const parsedBoxes = [];

    for (const b of blocks) {
      if (!b.code) continue;

      for (const stg of stagesConfig) {
        let chk_val = 'TRUE';
        const header_r = b.start_row - 2;
        if (header_r >= 0 && header_r < rows.length && rows[header_r].length > stg.start_col) {
          const raw = rows[header_r][stg.start_col].trim().toUpperCase();
          if (raw === 'TRUE' || raw === 'FALSE') {
            chk_val = raw;
          }
        }

        const seen = {};
        const itemsDetail = [];

        for (let r = b.start_row; r < Math.min(b.end_row, rows.length); r++) {
          const row = rows[r];
          if (!row || row.length <= stg.start_col + 4) continue;

          const oname = (row[stg.start_col + 1] || '').trim();
          const oid = (row[stg.start_col + 2] || '').trim();
          const floor = (row[stg.start_col + 3] || '').trim();
          const loc = (row[stg.start_col + 4] || '').trim();
          const qty_str = (row[stg.start_col + 5] || '').trim();

          if (oid && /^\d+$/.test(oid) && oid.length >= 5 && oname && !['Tên object', 'Anchor', 'Tên', 'nghỉ', 'Object ID', 'Tầng', 'Vị trí', 'SL'].includes(oname)) {
            const qty = /^\d+$/.test(qty_str) ? parseInt(qty_str, 10) : 1;
            const oid_pad = oid.padStart(6, '0');
            seen[oid_pad] = (seen[oid_pad] || 0) + qty;
            itemsDetail.push({
              object_id: oid_pad,
              name: oname,
              floor,
              location: loc,
              quantity: qty
            });
          }
        }

        const contents = Object.entries(seen).map(([k, v]) => ({ object_id: k, quantity: v }));
        const norm = removeVietnameseTones(b.lo_name);
        const anchor_id = b.direct_anchor_id || STANDARD_ANCHORS[norm] || '';
        const cleanLoName = (b.lo_name || '').trim();
        const title = cleanLoName ? `${b.code} - ${cleanLoName} - ${stg.name}` : `${b.code} - ${stg.name}`;

        parsedBoxes.push({
          module: b.code,
          lo_name: b.lo_name,
          stage: stg.name,
          title,
          anchor_object_id: anchor_id,
          is_active: (chk_val === 'TRUE' && contents.length > 0),
          checkbox: chk_val,
          item_count: contents.length,
          total_qty: contents.reduce((sum, c) => sum + c.quantity, 0),
          contents,
          itemsDetail
        });
      }
    }

    return parsedBoxes;
  }

  // --- INJECT STYLES AND DOM ELEMENTS ---
  function safeAppend(el) {
    if (document.body) {
      document.body.appendChild(el);
    } else if (document.documentElement) {
      document.documentElement.appendChild(el);
    }
  }

  (document.head || document.documentElement).appendChild(style);

  // --- CREATE UI ELEMENTS ---
  const floatingBtn = document.createElement('button');
  floatingBtn.id = 'sm-sync-floating-btn';
  floatingBtn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
      <path d="M16 21h5v-5"/>
    </svg>
    <span>Quản Lý TaskBox</span>
  `;
  safeAppend(floatingBtn);

  const modalOverlay = document.createElement('div');
  modalOverlay.id = 'sm-sync-modal-overlay';
  modalOverlay.innerHTML = `
    <div id="sm-sync-modal">
      <div class="sm-sync-header">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          Hệ Thống Quản Lý & Đồng Bộ TaskBox
        </h2>
        <div style="display: flex; align-items: center; gap: 6px;">
          <button class="sm-sync-header-btn" id="sm-modal-maximize" title="Phóng to / Thu nhỏ (Maximize)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
          <button class="sm-sync-close-btn" id="sm-modal-close" title="Đóng (Esc)">&times;</button>
        </div>
      </div>

      <div class="sm-tabs-bar">
        <button type="button" class="sm-tab-btn sm-tab-active" id="sm-tab-btn-sheet">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Đồng Bộ Google Sheets
        </button>
        <button type="button" class="sm-tab-btn" id="sm-tab-btn-web">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Quản Lý TaskBox (Web)
        </button>
      </div>

      <div class="sm-sync-body">
        <!-- TAB 1: GOOGLE SHEET SYNC -->
        <div id="sm-tab-pane-sheet" class="sm-tab-pane">
          <div class="sm-input-group">
            <label>Liên kết Google Sheet (Tab phân công người soạn):</label>
            <input type="text" id="sm-sheet-url" class="sm-input-control" placeholder="Dán liên kết Google Sheet tại đây (vd: https://docs.google.com/spreadsheets/d/...)" />
          </div>

          <div class="sm-card" id="sm-assignee-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:8px;">
                <h3 style="margin:0; font-size:13px; font-weight:600; color:#93c5fd;">Cấu hình người nhận (Assignee theo Module):</h3>
                <button type="button" class="sm-pill-btn" id="sm-assignee-toggle-btn" style="background:#334155; font-size:11px;">Thu gọn</button>
              </div>
              <label style="font-size:12px; color:#cbd5e1; display:flex; align-items:center; gap:6px; cursor:pointer;">
                <input type="checkbox" id="sm-auto-assign-check" style="cursor:pointer;" />
                <span>Tự động chuyển sang trạng thái <b>"Assigned"</b> sau khi tạo</span>
              </label>
            </div>
            <div class="sm-assignee-grid" id="sm-assignee-container">
              <!-- Dynamic Assignee inputs -->
            </div>
          </div>

          <div class="sm-progress-bar" id="sm-sync-progress"><div class="sm-progress-fill" id="sm-progress-fill"></div></div>
          <div class="sm-log-box" id="sm-log-box"></div>

          <div class="sm-toolbar-row" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
              <span style="font-size:12px; font-weight:600; color:#94a3b8;">Bộ lọc nhanh:</span>
              <button type="button" class="sm-pill-btn" id="sm-sel-all">Tất cả</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-actionable" style="background:#1e3a8a; color:#93c5fd;">Cần xử lý</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-created" style="background:#312e81; color:#a5b4fc;">Chưa gán</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-assigned" style="background:#0369a1; color:#bae6fd;">Đã gán</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-collected" style="background:#7f1d1d; color:#fecaca;">Đang mượn</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-b1">B1</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-b2">B2</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-b3">B3</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-a1">A1</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-a2">A2</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-a3">A3</button>
              <button type="button" class="sm-pill-btn" id="sm-sel-none">Bỏ chọn</button>
            </div>
            <div id="sm-selection-count" style="font-size:13px; font-weight:600; color:#38bdf8;">
              Đã chọn: 0 box
            </div>
          </div>

          <div class="sm-table-container">
            <table class="sm-table">
              <thead>
                <tr>
                  <th style="width: 36px; text-align: center;"><input type="checkbox" id="sm-th-select-all" checked /></th>
                  <th class="sm-th-sortable" data-sort-tab1="module" title="Bấm để sắp xếp theo Module">Module <span class="sm-sort-icon" id="sm-sort-icon-tab1-module">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab1="stage" title="Bấm để sắp xếp theo Giai đoạn">Giai đoạn <span class="sm-sort-icon" id="sm-sort-icon-tab1-stage">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab1="title" title="Bấm để sắp xếp theo Tên TaskBox">Tên TaskBox <span class="sm-sort-icon" id="sm-sort-icon-tab1-title">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab1="anchor" title="Bấm để sắp xếp theo Anchor ID">Anchor ID <span class="sm-sort-icon" id="sm-sort-icon-tab1-anchor">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab1="item_count" title="Bấm để sắp xếp theo Số món">Số món <span class="sm-sort-icon" id="sm-sort-icon-tab1-item_count">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab1="total_qty" title="Bấm để sắp xếp theo Tổng số lượng">Tổng SL <span class="sm-sort-icon" id="sm-sort-icon-tab1-total_qty">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab1="assignee" title="Bấm để sắp xếp theo Người nhận">Người nhận <span class="sm-sort-icon" id="sm-sort-icon-tab1-assignee">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab1="status" title="Bấm để sắp xếp theo Trạng thái">Trạng thái <span class="sm-sort-icon" id="sm-sort-icon-tab1-status">↕</span></th>
                  <th style="text-align: center;">Thao tác</th>
                </tr>
              </thead>
              <tbody id="sm-preview-tbody">
                <tr>
                  <td colspan="10" style="text-align: center; color: #64748b; padding: 24px;">
                    Nhập URL Tab Sheet và bấm <b>"Quét dữ liệu"</b> để kiểm tra dữ liệu đối chiếu trước khi đồng bộ.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="sm-btn-row" style="flex-wrap:wrap;">
            <span style="font-size:11px; color:#64748b; margin-right:auto; display:flex; align-items:center; gap:4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
              Dev by chaocauminhlason
            </span>
            <button class="sm-btn sm-btn-secondary" id="sm-btn-preview">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              Quét dữ liệu
            </button>
            <button class="sm-btn sm-btn-success" id="sm-btn-sync" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              <span id="sm-sync-btn-text">Đồng bộ TaskBox</span>
            </button>
            <button class="sm-btn" id="sm-btn-assign-only" style="background:#4f46e5; color:white;" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span id="sm-assign-btn-text">Gán người nhận (0)</span>
            </button>
            <button class="sm-btn" id="sm-btn-borrow-only" style="background:#0284c7; color:white;" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
              <span id="sm-borrow-btn-text">Mượn đồ (0)</span>
            </button>
            <button class="sm-btn" id="sm-btn-return-only" style="background:#b91c1c; color:white;" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
              <span id="sm-return-btn-text">Trả đồ (0)</span>
            </button>
            <button class="sm-btn" id="sm-btn-print-qr" style="background:#059669; color:white;" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
              <span id="sm-print-btn-text">In Mã QR (0)</span>
            </button>
          </div>
        </div>

        <!-- TAB 2: LIVE WEB TASKBOX MANAGER (HANDOVER & RETURN) -->
        <div id="sm-tab-pane-web" class="sm-tab-pane" style="display:none;">
          <!-- Filter Card -->
          <div class="sm-card" style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span style="font-size:12.5px; font-weight:700; color:#93c5fd; min-width:85px;">Thời gian:</span>
              <button type="button" class="sm-pill-btn sm-web-date-pill sm-pill-active" data-range="today">Hôm nay</button>
              <button type="button" class="sm-pill-btn sm-web-date-pill" data-range="yesterday">Hôm qua</button>
              <button type="button" class="sm-pill-btn sm-web-date-pill" data-range="last3days">3 ngày gần nhất</button>
              <button type="button" class="sm-pill-btn sm-web-date-pill" data-range="all">Tất cả ngày</button>
              <div style="display:flex; align-items:center; gap:5px; margin-left:6px;">
                <span style="font-size:12px; color:#94a3b8;">Chọn ngày:</span>
                <input type="date" id="sm-web-date-picker" class="sm-input-control" style="padding:2px 8px; font-size:12px; height:28px;" />
              </div>
              <button type="button" class="sm-btn sm-btn-primary" id="sm-web-btn-fetch" style="margin-left:auto; padding:6px 14px; font-size:12.5px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Quét dữ liệu Web
              </button>
            </div>

            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; border-top:1px solid #334155; padding-top:8px;">
              <span style="font-size:12.5px; font-weight:700; color:#93c5fd; min-width:85px;">Trạng thái:</span>
              <button type="button" class="sm-pill-btn sm-web-status-pill sm-pill-active" data-status="active">Đang hoạt động</button>
              <button type="button" class="sm-pill-btn sm-web-status-pill" data-status="collected" style="background:#7f1d1d; color:#fecaca;">Đang mượn</button>
              <button type="button" class="sm-pill-btn sm-web-status-pill" data-status="assigned" style="background:#0369a1; color:#bae6fd;">Đã gán</button>
              <button type="button" class="sm-pill-btn sm-web-status-pill" data-status="created" style="background:#312e81; color:#a5b4fc;">Mới tạo</button>
              <button type="button" class="sm-pill-btn sm-web-status-pill" data-status="all">Tất cả</button>
            </div>

            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; border-top:1px solid #334155; padding-top:8px;">
              <span style="font-size:12.5px; font-weight:700; color:#93c5fd; min-width:85px;">Giai đoạn:</span>
              <button type="button" class="sm-pill-btn sm-web-stage-pill sm-pill-active" data-stage="all">Tất cả</button>
              <button type="button" class="sm-pill-btn sm-web-stage-pill" data-stage="B1">B1</button>
              <button type="button" class="sm-pill-btn sm-web-stage-pill" data-stage="B2">B2</button>
              <button type="button" class="sm-pill-btn sm-web-stage-pill" data-stage="B3">B3</button>
              <button type="button" class="sm-pill-btn sm-web-stage-pill" data-stage="A1">A1</button>
              <button type="button" class="sm-pill-btn sm-web-stage-pill" data-stage="A2">A2</button>
              <button type="button" class="sm-pill-btn sm-web-stage-pill" data-stage="A3">A3</button>
            </div>

            <div style="display:flex; align-items:center; gap:8px; border-top:1px solid #334155; padding-top:8px;">
              <span style="font-size:12.5px; font-weight:700; color:#93c5fd; min-width:85px; flex-shrink:0;">Module:</span>
              <div id="sm-web-module-pills-container" style="display:flex; align-items:center; gap:6px; overflow-x:auto; max-width:100%; white-space:nowrap; padding-bottom:3px; scrollbar-width:thin;">
                <button type="button" class="sm-pill-btn sm-web-module-pill sm-pill-active" data-module="all">Tất cả</button>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; border-top:1px solid #334155; padding-top:8px;">
              <span style="font-size:12.5px; font-weight:700; color:#93c5fd; min-width:85px;">Phạm vi:</span>
              <button type="button" class="sm-pill-btn sm-web-user-pill sm-pill-active" data-user="all">Tất cả người dùng</button>
              <button type="button" class="sm-pill-btn sm-web-user-pill" data-user="me" style="background:#065f46; color:#a7f3d0;" id="sm-web-user-me-btn">Chỉ của tôi</button>

              <div style="display:flex; align-items:center; gap:6px; margin-left:auto; flex:1; max-width:340px;">
                <input type="text" id="sm-web-search-input" class="sm-input-control" placeholder="Tìm theo Module, Tên box, Người giữ, Anchor..." style="padding:4px 10px; font-size:12px; width:100%; height:28px;" />
              </div>
            </div>
          </div>

          <!-- Handover & Batch Action Card -->
          <div class="sm-card" style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; background:#0b1329; border-color:#3b82f6;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span style="font-size:13px; font-weight:700; color:#60a5fa; display:flex; align-items:center; gap:4px;">
                Bàn giao ca:
              </span>
              <input type="text" id="sm-web-handover-receiver" class="sm-input-control" placeholder="ID người nhận mới" style="width:140px; padding:4px 10px; font-size:12.5px;" />
              <input type="text" id="sm-web-handover-note" class="sm-input-control" placeholder="Ghi chú bàn giao (tùy chọn)" style="width:160px; padding:4px 10px; font-size:12.5px;" />
              <button type="button" class="sm-btn" id="sm-web-btn-handover" style="background:#2563eb; color:white; padding:6px 12px; font-size:12.5px;" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span id="sm-web-handover-text">Bàn giao (0)</span>
              </button>
            </div>
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <input type="text" id="sm-web-assign-input" class="sm-input-control" placeholder="ID Assignee mới" style="width:130px; padding:4px 8px; font-size:12px;" />
              <button type="button" class="sm-btn" id="sm-web-btn-assign" style="background:#4338ca; color:#e0e7ff; padding:6px 12px; font-size:12.5px;" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                <span id="sm-web-assign-text">Gán / Đổi Assign (0)</span>
              </button>
              <button type="button" class="sm-btn" id="sm-web-btn-return" style="background:#b91c1c; color:white; padding:6px 12px; font-size:12.5px;" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>
                <span id="sm-web-return-text">Trả đồ (0)</span>
              </button>
              <button type="button" class="sm-btn" id="sm-web-btn-borrow" style="background:#0284c7; color:white; padding:6px 12px; font-size:12.5px;" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                <span id="sm-web-borrow-text">Mượn đồ (0)</span>
              </button>
              <button type="button" class="sm-btn" id="sm-web-btn-print-qr" style="background:#059669; color:white; padding:6px 12px; font-size:12.5px;" disabled>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                <span id="sm-web-print-text">In QR (0)</span>
              </button>
            </div>
          </div>

          <div class="sm-progress-bar" id="sm-web-progress"><div class="sm-progress-fill" id="sm-web-progress-fill"></div></div>
          <div class="sm-log-box" id="sm-web-log-box"></div>

          <!-- Selection Toolbar for Tab 2 -->
          <div class="sm-toolbar-row" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
              <span style="font-size:12px; font-weight:600; color:#94a3b8;">Chọn:</span>
              <button type="button" class="sm-pill-btn" id="sm-web-sel-all">Tất cả trong bảng</button>
              <button type="button" class="sm-pill-btn" id="sm-web-sel-collected" style="background:#7f1d1d; color:#fecaca;">Chỉ Đang mượn</button>
              <button type="button" class="sm-pill-btn" id="sm-web-sel-assigned" style="background:#0369a1; color:#bae6fd;">Chỉ Đã gán</button>
              <button type="button" class="sm-pill-btn" id="sm-web-sel-none">Bỏ chọn</button>
            </div>
            <div id="sm-web-selection-count" style="font-size:13px; font-weight:600; color:#38bdf8;">
              Đã chọn: 0 / 0 box
            </div>
          </div>

          <!-- Web Table Container -->
          <div class="sm-table-container">
            <table class="sm-table">
              <thead>
                <tr>
                  <th style="width: 36px; text-align: center;"><input type="checkbox" id="sm-web-th-select-all" /></th>
                  <th class="sm-th-sortable" data-sort-tab2="id" title="Bấm để sắp xếp theo Mã Box">Mã Box <span class="sm-sort-icon" id="sm-sort-icon-tab2-id">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab2="title" title="Bấm để sắp xếp theo Tên TaskBox">Tên TaskBox <span class="sm-sort-icon" id="sm-sort-icon-tab2-title">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab2="module_stage" title="Bấm để sắp xếp theo Module / Giai đoạn">Module / Giai đoạn <span class="sm-sort-icon" id="sm-sort-icon-tab2-module_stage">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab2="anchor" title="Bấm để sắp xếp theo Anchor ID">Anchor ID <span class="sm-sort-icon" id="sm-sort-icon-tab2-anchor">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab2="total_qty" title="Bấm để sắp xếp theo Tổng số lượng">Tổng SL <span class="sm-sort-icon" id="sm-sort-icon-tab2-total_qty">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab2="holder" title="Bấm để sắp xếp theo Người giữ">Người giữ <span class="sm-sort-icon" id="sm-sort-icon-tab2-holder">↕</span></th>
                  <th class="sm-th-sortable" data-sort-tab2="created_at" title="Bấm để sắp xếp theo Ngày tạo">Ngày tạo <span class="sm-sort-icon sm-sort-active" id="sm-sort-icon-tab2-created_at">▼</span></th>
                  <th class="sm-th-sortable" data-sort-tab2="status" title="Bấm để sắp xếp theo Trạng thái">Trạng thái <span class="sm-sort-icon" id="sm-sort-icon-tab2-status">↕</span></th>
                  <th style="text-align: center;">Thao tác</th>
                </tr>
              </thead>
              <tbody id="sm-web-tbody">
                <tr>
                  <td colspan="10" style="text-align: center; color: #64748b; padding: 24px;">
                    Bấm <b>"Quét TaskBox từ Web"</b> để tải danh sách các box hiện có trên Scenario Manager.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
  safeAppend(modalOverlay);

  // --- STATE ---
  let parsedBoxesCache = [];
  let serverBoxesCache = [];
  let comparisonResults = [];

  // Load Saved Settings
  const savedSheetUrl = localStorage.getItem('sm_sync_sheet_url') || '';
  if (savedSheetUrl) document.getElementById('sm-sheet-url').value = savedSheetUrl;

  const autoAssignCheck = document.getElementById('sm-auto-assign-check');
  if (autoAssignCheck) {
    autoAssignCheck.checked = (localStorage.getItem('sm_sync_auto_assign') === 'true');
    autoAssignCheck.addEventListener('change', (e) => {
      localStorage.setItem('sm_sync_auto_assign', e.target.checked);
    });
  }

  const defaultAssignees = {
    'M10': '3628',
    'M12': '3122',
    'M13': '3178'
  };
  let savedAssignees = JSON.parse(localStorage.getItem('sm_sync_assignees') || JSON.stringify(defaultAssignees));
  // Clean up legacy orphan keys
  if (savedAssignees && savedAssignees['M12-01_B2']) {
    if (!savedAssignees['M12-01']) savedAssignees['M12-01'] = savedAssignees['M12-01_B2'];
    delete savedAssignees['M12-01_B2'];
    localStorage.setItem('sm_sync_assignees', JSON.stringify(savedAssignees));
  }

  function renderAssigneeInputs(modules = ['M10', 'M12', 'M13']) {
    const container = document.getElementById('sm-assignee-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Distinct modules sorted naturally (e.g. M10-01, M10-02, M12-01, M13-01...)
    const allKeys = Array.from(new Set(modules.filter(Boolean))).sort(naturalCompare);
    for (const mod of allKeys) {
      const defaultVal = mod.startsWith('M10') ? '3628' : (mod.startsWith('M13') ? '3178' : (mod.startsWith('M12') ? '3122' : ''));
      const val = savedAssignees[mod] || defaultVal;
      const div = document.createElement('div');
      div.className = 'sm-assignee-item';
      div.innerHTML = `
        <span>${mod}:</span>
        <input type="text" data-mod="${mod}" value="${val}" placeholder="ID người lấy" />
      `;
      div.querySelector('input').addEventListener('input', (e) => {
        savedAssignees[mod] = e.target.value.trim();
        localStorage.setItem('sm_sync_assignees', JSON.stringify(savedAssignees));
      });
      container.appendChild(div);
    }
  }

  renderAssigneeInputs(['M10', 'M12', 'M13']);

  function getAssigneeForBox(tb) {
    if (savedAssignees[tb.module]) return savedAssignees[tb.module];
    const prefix = tb.module.split('-')[0];
    if (savedAssignees[prefix]) return savedAssignees[prefix];
    if (tb.module.startsWith('M10')) return '3628';
    if (tb.module.startsWith('M13')) return '3178';
    if (tb.module.startsWith('M12')) return '3122';
    return '';
  }

  // --- SELECTION HELPERS ---
  function updateSelectionSummary() {
    const allCheckboxes = Array.from(document.querySelectorAll('.sm-row-check'));
    const activeCheckboxes = allCheckboxes.filter(cb => !cb.disabled);

    // Sync isSelected strictly with checkbox DOM state
    allCheckboxes.forEach(cb => {
      const idx = parseInt(cb.getAttribute('data-idx'), 10);
      if (comparisonResults[idx]) {
        comparisonResults[idx].isSelected = cb.disabled ? false : cb.checked;
      }
    });

    const selectedCheckboxes = activeCheckboxes.filter(cb => cb.checked);
    const selectedCount = selectedCheckboxes.length;
    const totalSelectable = activeCheckboxes.length;

    const countDisplay = document.getElementById('sm-selection-count');
    const syncBtnText = document.getElementById('sm-sync-btn-text');
    const syncBtn = document.getElementById('sm-btn-sync');
    const assignBtn = document.getElementById('sm-btn-assign-only');
    const assignBtnText = document.getElementById('sm-assign-btn-text');
    const borrowBtn = document.getElementById('sm-btn-borrow-only');
    const borrowBtnText = document.getElementById('sm-borrow-btn-text');
    const returnBtn = document.getElementById('sm-btn-return-only');
    const returnBtnText = document.getElementById('sm-return-btn-text');
    const printBtn = document.getElementById('sm-btn-print-qr');
    const printBtnText = document.getElementById('sm-print-btn-text');

    // Count selected boxes eligible for each operation
    const toSync = comparisonResults.filter(r => r.isSelected && r.action !== 'SKIP' && r.action !== 'SKIP_COLLECTED');
    const selectedWithServer = comparisonResults.filter(r => r.isSelected && r.serverBoxId && (r.serverStatus === 'created' || r.serverStatus === 'assigned'));
    const selectedAssigned = comparisonResults.filter(r => r.isSelected && r.serverBoxId && r.serverStatus === 'assigned');
    const selectedCollected = comparisonResults.filter(r => r.isSelected && r.serverBoxId && r.serverStatus === 'collected');
    const selectedForPrint = comparisonResults.filter(r => r.isSelected && r.serverBoxId);

    if (countDisplay) {
      countDisplay.textContent = `Đã chọn: ${selectedCount} / ${totalSelectable} box`;
    }

    // Dynamic counts on quick pill buttons
    const actionableCount = comparisonResults.filter(r => r.action === 'CREATE' || r.action === 'UPDATE').length;
    const createdCount = comparisonResults.filter(r => r.serverStatus === 'created').length;
    const assignedCount = comparisonResults.filter(r => r.serverStatus === 'assigned').length;
    const collectedCount = comparisonResults.filter(r => r.serverStatus === 'collected').length;

    const pillAll = document.getElementById('sm-sel-all');
    if (pillAll) pillAll.textContent = `Tất cả (${totalSelectable})`;
    const pillAction = document.getElementById('sm-sel-actionable');
    if (pillAction) pillAction.textContent = `Cần xử lý (${actionableCount})`;
    const pillCreated = document.getElementById('sm-sel-created');
    if (pillCreated) pillCreated.textContent = `Chưa gán (${createdCount})`;
    const pillAssigned = document.getElementById('sm-sel-assigned');
    if (pillAssigned) pillAssigned.textContent = `Đã gán (${assignedCount})`;
    const pillCollected = document.getElementById('sm-sel-collected');
    if (pillCollected) pillCollected.textContent = `Đang mượn (${collectedCount})`;
    if (syncBtnText) {
      syncBtnText.textContent = toSync.length > 0 ? `Đồng bộ (${toSync.length})` : `Đồng bộ Đồ`;
    }
    if (syncBtn) {
      syncBtn.disabled = (toSync.length === 0);
    }
    if (assignBtnText) {
      assignBtnText.textContent = `Gán / Đổi Assignee (${selectedWithServer.length})`;
    }
    if (assignBtn) {
      assignBtn.disabled = (selectedWithServer.length === 0);
    }
    if (borrowBtnText) {
      borrowBtnText.textContent = `Mượn đồ (${selectedAssigned.length})`;
    }
    if (borrowBtn) {
      borrowBtn.disabled = (selectedAssigned.length === 0);
    }
    if (returnBtnText) {
      returnBtnText.textContent = `Trả đồ (${selectedCollected.length})`;
    }
    if (returnBtn) {
      returnBtn.disabled = (selectedCollected.length === 0);
    }
    if (printBtnText) {
      printBtnText.textContent = `In Mã QR (${selectedForPrint.length})`;
    }
    if (printBtn) {
      printBtn.disabled = (selectedForPrint.length === 0);
    }

    const thSelectAll = document.getElementById('sm-th-select-all');
    if (thSelectAll && totalSelectable > 0) {
      thSelectAll.checked = (selectedCount === totalSelectable);
      thSelectAll.indeterminate = (selectedCount > 0 && selectedCount < totalSelectable);
    }
  }

  function setRowSelections(predicate) {
    const checkboxes = Array.from(document.querySelectorAll('.sm-row-check'));
    checkboxes.forEach((cb) => {
      const idx = parseInt(cb.getAttribute('data-idx'), 10);
      const item = comparisonResults[idx];
      if (cb.disabled || !item || item.action === 'SKIP') {
        cb.checked = false;
        if (item) item.isSelected = false;
        return;
      }
      const shouldCheck = !!predicate(item, idx);
      cb.checked = shouldCheck;
      if (item) item.isSelected = shouldCheck;
    });
    updateSelectionSummary();
  }

  document.getElementById('sm-sel-all')?.addEventListener('click', () => setRowSelections(item => item && item.action !== 'SKIP'));
  document.getElementById('sm-sel-none')?.addEventListener('click', () => setRowSelections(() => false));
  document.getElementById('sm-sel-actionable')?.addEventListener('click', () => setRowSelections(item => item && (item.action === 'CREATE' || item.action === 'UPDATE')));
  document.getElementById('sm-sel-created')?.addEventListener('click', () => setRowSelections(item => item && item.serverStatus === 'created'));
  document.getElementById('sm-sel-assigned')?.addEventListener('click', () => setRowSelections(item => item && item.serverStatus === 'assigned'));
  document.getElementById('sm-sel-collected')?.addEventListener('click', () => setRowSelections(item => item && item.serverStatus === 'collected'));
  document.getElementById('sm-sel-b1')?.addEventListener('click', () => setRowSelections(item => item && item.tb && item.tb.stage === 'B1'));
  document.getElementById('sm-sel-b2')?.addEventListener('click', () => setRowSelections(item => item && item.tb && item.tb.stage === 'B2'));
  document.getElementById('sm-sel-b3')?.addEventListener('click', () => setRowSelections(item => item && item.tb && item.tb.stage === 'B3'));
  document.getElementById('sm-sel-a1')?.addEventListener('click', () => setRowSelections(item => item && item.tb && item.tb.stage === 'A1'));
  document.getElementById('sm-sel-a2')?.addEventListener('click', () => setRowSelections(item => item && item.tb && item.tb.stage === 'A2'));
  document.getElementById('sm-sel-a3')?.addEventListener('click', () => setRowSelections(item => item && item.tb && item.tb.stage === 'A3'));

  document.getElementById('sm-th-select-all')?.addEventListener('change', (e) => {
    const checked = e.target.checked;
    setRowSelections(item => checked && item && item.action !== 'SKIP');
  });

  // --- MODAL EVENTS ---
  
  // --- TABLE HEADER SORT EVENT LISTENERS ---
  document.querySelectorAll('#sm-sync-modal th[data-sort-tab1]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort-tab1');
      if (key) handleTab1Sort(key);
    });
  });

  document.querySelectorAll('#sm-sync-modal th[data-sort-tab2]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort-tab2');
      if (key) handleTab2Sort(key);
    });
  });

  // --- DRAGGABLE FLOATING BUTTON & SHORTCUTS ---
  (function initFloatingButton() {
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    // Restore position if saved
    try {
      const savedPos = JSON.parse(localStorage.getItem('sm_sync_floating_pos') || 'null');
      if (savedPos && savedPos.left && savedPos.top) {
        floatingBtn.style.bottom = 'auto';
        floatingBtn.style.right = 'auto';
        floatingBtn.style.left = savedPos.left + 'px';
        floatingBtn.style.top = savedPos.top + 'px';
      }
    } catch (e) {}

    floatingBtn.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      const rect = floatingBtn.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;

      function onMouseMove(moveEvent) {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
          isDragging = true;
          floatingBtn.style.bottom = 'auto';
          floatingBtn.style.right = 'auto';
          const newLeft = Math.max(10, Math.min(window.innerWidth - floatingBtn.offsetWidth - 10, initialLeft + dx));
          const newTop = Math.max(10, Math.min(window.innerHeight - floatingBtn.offsetHeight - 10, initialTop + dy));
          floatingBtn.style.left = newLeft + 'px';
          floatingBtn.style.top = newTop + 'px';
        }
      }

      function onMouseUp() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        if (isDragging) {
          const rect = floatingBtn.getBoundingClientRect();
          localStorage.setItem('sm_sync_floating_pos', JSON.stringify({ left: rect.left, top: rect.top }));
        }
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    floatingBtn.addEventListener('click', (e) => {
      if (isDragging) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    });

    // Maximize Modal Toggle
    document.getElementById('sm-modal-maximize')?.addEventListener('click', () => {
      const modal = document.getElementById('sm-sync-modal');
      modal?.classList.toggle('sm-modal-fullscreen');
    });

    // Assignee Collapse Toggle
    document.getElementById('sm-assignee-toggle-btn')?.addEventListener('click', (e) => {
      const grid = document.getElementById('sm-assignee-container');
      if (grid) {
        const isHidden = grid.style.display === 'none';
        grid.style.display = isHidden ? 'grid' : 'none';
        e.target.textContent = isHidden ? 'Thu gọn' : 'Mở rộng';
      }
    });

    // Assignee Apply My ID to all
    document.getElementById('sm-assignee-apply-me-btn')?.addEventListener('click', () => {
      const me = getLoggedInUser();
      if (!me) {
        alert('Chưa nhận diện được ID người dùng đang đăng nhập.');
        return;
      }
      document.querySelectorAll('.sm-assignee-item input').forEach(input => {
        input.value = me;
        const mod = input.getAttribute('data-mod');
        if (mod) savedAssignees[mod] = me;
      });
      localStorage.setItem('sm_sync_assignees', JSON.stringify(savedAssignees));
      alert(`✅ Đã gán ID "${me}" cho tất cả module!`);
    });

    // Keyboard shortcut: Alt+S to toggle, Escape to close
    window.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        const isOpen = modalOverlay.style.display === 'flex';
        if (isOpen) {
          modalOverlay.style.display = 'none';
        } else {
          floatingBtn.click();
        }
      } else if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
        modalOverlay.style.display = 'none';
      }
    });
  })();

  floatingBtn.addEventListener('click', () => {
    triggerStartFresh();
    modalOverlay.style.display = 'flex';
  });
  document.getElementById('sm-modal-close').addEventListener('click', () => {
    modalOverlay.style.display = 'none';
  });
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.style.display = 'none';
  });

  // --- NATURAL SORT & TAB 1 SORT HELPERS ---
  // --- SAFE FETCH JSON HELPER (Detects HTML login redirects & provides clear error messages) ---
  async function safeFetchJson(url, options = {}) {
    let resp;
    try {
      resp = await fetch(url, options);
    } catch (netErr) {
      throw new Error(`Lỗi kết nối mạng tới Scenario Manager: ${netErr.message}`);
    }

    const contentType = resp.headers.get('content-type') || '';
    const text = await resp.text();
    const trimmed = text.trim();

    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html') || contentType.includes('text/html')) {
      if (resp.status === 401 || resp.status === 403 || trimmed.includes('login') || trimmed.includes('Sign in') || trimmed.includes('Đăng nhập')) {
        throw new Error('Phiên đăng nhập Scenario Manager đã hết hạn. Vui lòng F5 tải lại trang để đăng nhập lại!');
      }
      throw new Error(`Máy chủ Scenario Manager trả về trang HTML thay vì dữ liệu JSON (HTTP ${resp.status}). Có thể bạn cần đăng nhập lại.`);
    }

    if (!resp.ok) {
      let errorDetail = `Lỗi HTTP ${resp.status}`;
      try {
        const jsonErr = JSON.parse(trimmed);
        if (jsonErr && (jsonErr.detail || jsonErr.message || jsonErr.error)) {
          errorDetail = jsonErr.detail || jsonErr.message || jsonErr.error;
        }
      } catch (e) {
        if (trimmed && trimmed.length < 200) errorDetail = trimmed;
      }
      throw new Error(errorDetail);
    }

    try {
      return JSON.parse(trimmed);
    } catch (e) {
      throw new Error(`Dữ liệu nhận được từ máy chủ không đúng định dạng JSON: ${trimmed.slice(0, 100)}...`);
    }
  }

  function getBoxLocalDateStr(dateVal) {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateVN(dateVal) {
    if (!dateVal) return '-';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  function naturalCompare(a, b) {
    return String(a ?? '').localeCompare(String(b ?? ''), undefined, { numeric: true, sensitivity: 'base' });
  }

  let currentTab1SortKey = 'default';
  let currentTab1SortOrder = 'asc';

  function updateTab1SortIcons() {
    document.querySelectorAll('#sm-sync-modal th[data-sort-tab1]').forEach(th => {
      const key = th.getAttribute('data-sort-tab1');
      const icon = th.querySelector('.sm-sort-icon');
      if (!icon) return;
      if (key === currentTab1SortKey) {
        icon.textContent = currentTab1SortOrder === 'asc' ? '▲' : '▼';
        icon.classList.add('sm-sort-active');
      } else {
        icon.textContent = '↕';
        icon.classList.remove('sm-sort-active');
      }
    });
  }

  function sortTab1Results() {
    if (!comparisonResults || comparisonResults.length === 0) return;
    if (currentTab1SortKey === 'default') {
      comparisonResults.sort((a, b) => {
        const diff = (a.originalIndex ?? 0) - (b.originalIndex ?? 0);
        return currentTab1SortOrder === 'asc' ? diff : -diff;
      });
      return;
    }

    comparisonResults.sort((a, b) => {
      let cmp = 0;
      if (currentTab1SortKey === 'module') {
        cmp = naturalCompare(a.tb?.module, b.tb?.module);
      } else if (currentTab1SortKey === 'stage') {
        cmp = naturalCompare(a.tb?.stage, b.tb?.stage);
      } else if (currentTab1SortKey === 'title') {
        cmp = naturalCompare(a.tb?.title, b.tb?.title);
      } else if (currentTab1SortKey === 'anchor') {
        cmp = naturalCompare(a.tb?.anchor_object_id, b.tb?.anchor_object_id);
      } else if (currentTab1SortKey === 'item_count') {
        cmp = (a.tb?.item_count || 0) - (b.tb?.item_count || 0);
      } else if (currentTab1SortKey === 'total_qty') {
        cmp = (a.tb?.total_qty || 0) - (b.tb?.total_qty || 0);
      } else if (currentTab1SortKey === 'assignee') {
        cmp = naturalCompare(a.assignee, b.assignee);
      } else if (currentTab1SortKey === 'status') {
        cmp = naturalCompare(a.serverStatus || a.action, b.serverStatus || b.action);
      }
      return currentTab1SortOrder === 'asc' ? cmp : -cmp;
    });
  }

  function handleTab1Sort(sortKey) {
    if (!comparisonResults || comparisonResults.length === 0) return;
    if (currentTab1SortKey === sortKey) {
      currentTab1SortOrder = currentTab1SortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      currentTab1SortKey = sortKey;
      currentTab1SortOrder = (sortKey === 'item_count' || sortKey === 'total_qty') ? 'desc' : 'asc';
    }
    sortTab1Results();
    renderPreviewTable();
  }

  function renderPreviewTable() {
    const tbody = document.getElementById('sm-preview-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!comparisonResults || comparisonResults.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; color: #64748b; padding: 24px;">
            Nhập URL Tab Sheet và bấm <b>"Quét dữ liệu"</b> để kiểm tra dữ liệu đối chiếu trước khi đồng bộ.
          </td>
        </tr>
      `;
      updateSelectionSummary();
      updateTab1SortIcons();
      return;
    }

    comparisonResults.forEach((item, idx) => {
      const tb = item.tb || {};
      const assignee = item.assignee || '-';
      const action = item.action;
      const matchedBoxId = item.serverBoxId;
      const serverStatus = item.serverStatus || 'Chưa có';

      if (action === 'SKIP') {
        const tr = document.createElement('tr');
        tr.style.opacity = '0.45';
        tr.innerHTML = `
          <td style="text-align:center;"><input type="checkbox" class="sm-row-check" data-idx="${idx}" disabled /></td>
          <td><b>${tb.module || '-'}</b></td>
          <td>${tb.stage || '-'}</td>
          <td>${tb.title || '-'}</td>
          <td><code>${tb.anchor_object_id || '-'}</code></td>
          <td>0</td>
          <td>0</td>
          <td>-</td>
          <td>-</td>
          <td><span class="sm-badge sm-badge-skip">Bỏ qua (Nghỉ)</span></td>
        `;
        tbody.appendChild(tr);
        return;
      }

      let badgeClass = 'sm-badge-create';
      let actionLabel = 'Tạo mới';
      if (action === 'MATCH') {
        badgeClass = 'sm-badge-match';
        actionLabel = 'Đã khớp 100%';
      } else if (action === 'UPDATE') {
        badgeClass = 'sm-badge-update';
        actionLabel = 'Cập nhật đồ';
      } else if (action === 'SKIP_COLLECTED') {
        badgeClass = 'sm-badge-collected';
        actionLabel = 'Đã mượn';
      }

      let lifecycleActionBtn = '';
      if (matchedBoxId) {
        if (serverStatus === 'created') {
          lifecycleActionBtn = `<button type="button" class="sm-pill-btn sm-single-assign-btn" data-idx="${idx}" style="background:#4338ca; color:#c7d2fe; margin-left:6px; border:none; padding:2px 7px; font-size:11px;" title="Gán cho Assignee">Gán</button>`;
        } else if (serverStatus === 'assigned') {
          lifecycleActionBtn = `<button type="button" class="sm-pill-btn sm-single-assign-btn" data-idx="${idx}" style="background:#4338ca; color:#c7d2fe; margin-left:6px; border:none; padding:2px 7px; font-size:11px;" title="Đổi người nhận đã gán">Đổi Gán</button>`;
          lifecycleActionBtn += `<button type="button" class="sm-pill-btn sm-single-borrow-btn" data-idx="${idx}" style="background:#0284c7; color:#e0f2fe; margin-left:4px; border:none; padding:2px 7px; font-size:11px;" title="Mượn đồ">Mượn</button>`;
        } else if (serverStatus === 'collected') {
          lifecycleActionBtn = `<button type="button" class="sm-pill-btn sm-single-return-btn" data-idx="${idx}" style="background:#b91c1c; color:#fecaca; margin-left:6px; border:none; padding:2px 7px; font-size:11px;" title="Trả đồ">Trả</button>`;
        }
        lifecycleActionBtn += `<button type="button" class="sm-pill-btn sm-single-qr-btn" data-idx="${idx}" style="background:#059669; color:#d1fae5; margin-left:4px; border:none; padding:2px 7px; font-size:11px;" title="In mã QR cho Taskbox này">Mã QR</button>`;
      }

      const tr = document.createElement('tr');
      let rowBg = 'transparent';
      if (action === 'CREATE') rowBg = 'rgba(16, 185, 129, 0.08)';
      else if (action === 'UPDATE') rowBg = 'rgba(245, 158, 11, 0.08)';
      else if (action === 'MATCH') rowBg = 'rgba(59, 130, 246, 0.06)';
      else if (action === 'SKIP_COLLECTED') rowBg = 'rgba(239, 68, 68, 0.08)';
      tr.style.background = rowBg;

      tr.innerHTML = `
        <td style="text-align:center;"><input type="checkbox" class="sm-row-check" data-idx="${idx}" ${item.isSelected ? 'checked' : ''} /></td>
        <td><b>${tb.module || '-'}</b></td>
        <td><b style="color:#60a5fa;">${tb.stage || '-'}</b></td>
        <td>${tb.title || '-'}</td>
        <td><input type="text" class="sm-anchor-row-input" data-idx="${idx}" value="${tb.anchor_object_id || ''}" style="background:#0f172a; border:1px solid #334155; color:#38bdf8; padding:2px 6px; border-radius:4px; width:75px; font-family:monospace; font-size:12px;" /></td>
        <td>${tb.item_count || 0} items</td>
        <td><b>${tb.total_qty || 0}</b></td>
        <td><input type="text" class="sm-assignee-row-input" data-idx="${idx}" value="${assignee === '-' ? '' : assignee}" placeholder="ID Người nhận" style="background:#0f172a; border:1px solid #334155; color:#38bdf8; padding:2px 6px; border-radius:4px; width:90px; font-family:monospace; font-size:12px;" /></td>
        <td><span style="color:${serverStatus === 'assigned' ? '#34d399' : (serverStatus === 'collected' ? '#f87171' : (serverStatus === 'created' ? '#fde047' : '#94a3b8'))}; font-weight:600;">${serverStatus}</span></td>
        <td><span class="sm-badge ${badgeClass}">${actionLabel}</span>${lifecycleActionBtn}</td>
      `;
      tbody.appendChild(tr);
    });

    attachPreviewRowEvents();
    updateSelectionSummary();
    updateTab1SortIcons();
  }

  function attachPreviewRowEvents() {
    const tbody = document.getElementById('sm-preview-tbody');
    if (!tbody) return;

    // Add single assign button listeners
    tbody.querySelectorAll('.sm-single-assign-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const item = comparisonResults[idx];
        if (!item || !item.serverBoxId) return;
        
        btn.disabled = true;
        btn.textContent = '⏳...';
        try {
          const trData = await safeFetchJson(`/api/boxes/${encodeURIComponent(item.serverBoxId)}/transition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: 'assigned', assignee: item.assignee })
          });
          alert(`✅ Đã gán "${item.tb.title}" cho ${item.assignee} thành công!`);
          document.getElementById('sm-btn-preview')?.click();
        } catch (err) {
          alert('Lỗi kết nối: ' + err.message);
          btn.disabled = false;
          btn.textContent = 'Gán';
        }
      });
    });

    // Add single borrow button listeners
    tbody.querySelectorAll('.sm-single-borrow-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const item = comparisonResults[idx];
        if (!item || !item.serverBoxId) return;

        btn.disabled = true;
        btn.textContent = '⏳...';
        try {
          const trData = await safeFetchJson(`/api/boxes/${encodeURIComponent(item.serverBoxId)}/transition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: 'collected', borrower: item.assignee, assignee: item.assignee, note: 'Borrowed via Tool' })
          });
          alert(`✅ Đã mượn "${item.tb.title}" (collected) thành công!`);
          document.getElementById('sm-btn-preview')?.click();
        } catch (err) {
          alert('Lỗi kết nối: ' + err.message);
          btn.disabled = false;
          btn.textContent = 'Mượn';
        }
      });
    });

    // Add single return button listeners
    tbody.querySelectorAll('.sm-single-return-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const item = comparisonResults[idx];
        if (!item || !item.serverBoxId) return;

        btn.disabled = true;
        btn.textContent = '⏳...';
        try {
          const trData = await safeFetchJson(`/api/boxes/${encodeURIComponent(item.serverBoxId)}/transition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: 'deactivated', returned_by: item.assignee, note: 'Returned via Tool' })
          });
          alert(`✅ Đã trả "${item.tb.title}" (deactivated) thành công!`);
          document.getElementById('sm-btn-preview')?.click();
        } catch (err) {
          alert('Lỗi kết nối: ' + err.message);
          btn.disabled = false;
          btn.textContent = 'Trả';
        }
      });
    });

    // Add single QR button listeners
    tbody.querySelectorAll('.sm-single-qr-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const item = comparisonResults[idx];
        if (!item || !item.serverBoxId) return;
        openQRPrintWindow([item]);
      });
    });

    // Add change event listeners to row checkboxes
    tbody.querySelectorAll('.sm-row-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const idx = parseInt(cb.getAttribute('data-idx'), 10);
        if (comparisonResults[idx]) comparisonResults[idx].isSelected = cb.checked;
        updateSelectionSummary();
      });
    });

    // Add change listeners to editable anchor inputs
    tbody.querySelectorAll('.sm-anchor-row-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'), 10);
        if (comparisonResults[idx] && comparisonResults[idx].tb) {
          comparisonResults[idx].tb.anchor_object_id = e.target.value.trim();
        }
      });
    });

    // Add change listeners to editable assignee inputs
    tbody.querySelectorAll('.sm-assignee-row-input').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(inp.getAttribute('data-idx'), 10);
        if (comparisonResults[idx]) {
          comparisonResults[idx].assignee = e.target.value.trim();
        }
      });
    });
  }

  // --- PREVIEW LOGIC ---
  document.getElementById('sm-btn-preview').addEventListener('click', async () => {
    triggerStartFresh();
    const urlInput = document.getElementById('sm-sheet-url').value.trim();
    if (!urlInput) {
      alert('Vui lòng nhập Link URL Google Sheet Tab!');
      return;
    }
    localStorage.setItem('sm_sync_sheet_url', urlInput);

    const btn = document.getElementById('sm-btn-preview');
    btn.disabled = true;
    btn.innerHTML = '⏳ Đang quét dữ liệu...';

    try {
      // 1. Fetch Sheet CSV
      const rows = await fetchSheetCSV(urlInput);
      parsedBoxesCache = parseTaskboxesFromRows(rows);

      // Render any new detected modules into Assignee inputs
      const detectedModules = Array.from(new Set(parsedBoxesCache.map(b => b.module)));
      renderAssigneeInputs(detectedModules);

      // 2. Fetch Server Boxes
      const data = await safeFetchJson('/api/boxes?limit=500');
      serverBoxesCache = data.boxes || data || [];
      // Sort newest first
      serverBoxesCache.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      // 3. Compare & Populate comparisonResults (Matching strictly with boxes created TODAY to prevent overwriting past days' boxes)
      comparisonResults = [];
      const todayStr = getBoxLocalDateStr(new Date());

      for (let i = 0; i < parsedBoxesCache.length; i++) {
        const tb = parsedBoxesCache[i];
        const assignee = getAssigneeForBox(tb);

        if (!tb.is_active) {
          comparisonResults.push({ tb, action: 'SKIP', reason: 'Checkbox FALSE / Nghỉ', isSelected: false, originalIndex: i });
          continue;
        }

        // Match server box (Exact Module & Stage Match, created TODAY)
        const matches = serverBoxesCache.filter(b => {
          const bt = (b.title || '').trim().toUpperCase();
          const mod = tb.module.toUpperCase();
          const st = tb.stage.toUpperCase();
          
          // Exact module prefix regex (matches 'M12-01 - ...', 'M12-01( ...', 'M12-01B2')
          const escapedMod = mod.replace(/[-/\^$*+?.()|[\]{}]/g, '\\$&');
          const modRegex = new RegExp(`^${escapedMod}(\\s|\\(|-|_|${st}|$)`, 'i');
          
          if (!modRegex.test(bt) || !bt.endsWith(st) || b.status === 'deactivated') return false;

          // Date check: Only match boxes created TODAY so we do NOT overwrite historical boxes from past days
          const boxDateStr = getBoxLocalDateStr(b.created_at);
          return boxDateStr === todayStr;
        });

        const activeMatch = matches.find(b => b.status === 'assigned' || b.status === 'created');
        const collectedMatch = matches.find(b => b.status === 'collected');

        let action = 'CREATE';
        let serverStatus = 'Chưa có';
        let matchedBoxId = null;
        let serverCreatedAt = null;
        let defaultChecked = true;

        if (activeMatch) {
          matchedBoxId = activeMatch.box_id || activeMatch.id;
          serverStatus = activeMatch.status;
          serverCreatedAt = activeMatch.created_at || null;
          
          // Check if identical
          const sContents = activeMatch.contents || [];
          const isIdentical = sContents.length === tb.contents.length && tb.contents.every(c => {
            const sc = sContents.find(x => x.object_id === c.object_id);
            return sc && sc.quantity === c.quantity;
          });

          if (isIdentical && activeMatch.assignee === assignee) {
            action = 'MATCH';
            defaultChecked = false; // By default don't re-sync already matched boxes
          } else {
            action = 'UPDATE';
            defaultChecked = true;
          }
        } else if (collectedMatch) {
          matchedBoxId = collectedMatch.box_id || collectedMatch.id;
          serverStatus = 'collected';
          serverCreatedAt = collectedMatch.created_at || null;
          action = 'SKIP_COLLECTED';
          defaultChecked = false; // Collected boxes skipped by default
        }

        comparisonResults.push({ tb, action, serverBoxId: matchedBoxId, serverStatus, assignee, serverCreatedAt, isSelected: defaultChecked, originalIndex: i });
      }

      sortTab1Results();
      renderPreviewTable();
    } catch (err) {
      alert('Lỗi: ' + err.message);
      console.error(err);
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        Quét dữ liệu
      `;
    }
  });

  // --- START FRESH & DRAFT RESET HELPER ---
  function triggerStartFresh() {
    // Clear all taskbox draft keys in localStorage to prevent restoring stale form data
    try {
      Object.keys(localStorage).forEach(k => {
        if (k.toLowerCase().includes('taskboxdraft') || k.toLowerCase().includes('draft')) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) {
      console.warn('Could not clear localStorage drafts:', e);
    }
  }

  // --- SYNC EXECUTION LOGIC (CREATE & UPDATE) ---
  document.getElementById('sm-btn-sync').addEventListener('click', async () => {
    if (!comparisonResults.length) return;

    // Filter only boxes that are checked by user
    const toSync = comparisonResults.filter(r => r.isSelected && r.action !== 'SKIP' && r.action !== 'SKIP_COLLECTED');
    if (toSync.length === 0) {
      alert('Chưa có taskbox nào được chọn hoặc các box được chọn không thể đồng bộ!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn Đồng bộ ${toSync.length} Taskbox đã chọn lên hệ thống?`)) return;

    // Trigger Start Fresh before sync to clear stale drafts
    triggerStartFresh();

    const btnSync = document.getElementById('sm-btn-sync');
    const btnPreview = document.getElementById('sm-btn-preview');
    const progressBar = document.getElementById('sm-sync-progress');
    const progressFill = document.getElementById('sm-progress-fill');
    const logBox = document.getElementById('sm-log-box');

    btnSync.disabled = true;
    btnPreview.disabled = true;
    progressBar.style.display = 'block';
    logBox.style.display = 'block';
    logBox.innerHTML = '';

    const log = (msg) => {
      const p = document.createElement('div');
      p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logBox.appendChild(p);
      logBox.scrollTop = logBox.scrollHeight;
    };

    log(`🧹 Đã bấm "Start fresh" & dọn sạch cache nháp cũ.`);
    log(`🚀 Bắt đầu đồng bộ ${toSync.length} Taskbox...`);

    let done = 0;
    let success = 0;
    let failed = 0;

    for (const item of toSync) {
      const { tb, action, serverBoxId, assignee } = item;
      done++;
      progressFill.style.width = `${(done / toSync.length) * 100}%`;

      try {
        if (action === 'CREATE') {
          const autoAssign = document.getElementById('sm-auto-assign-check')?.checked || false;
          log(`[${tb.module} ${tb.stage}] Đang tạo mới "${tb.title}" (${tb.item_count} items)...`);
          const createPayload = {
            title: tb.title,
            anchor_object_id: tb.anchor_object_id,
            note: `Created for ${tb.title} from Sheet`,
            contents: tb.contents,
            borrow_now: false
          };
          if (autoAssign && assignee) {
            createPayload.borrower = assignee;
            createPayload.assignee = assignee;
          }
          const cr = await fetch('/api/boxes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(createPayload)
          });
          const cd = await cr.json();
          const newBoxId = cd.box_id || cd.id;

          if (newBoxId) {
            if (autoAssign && assignee) {
              await fetch(`/api/boxes/${encodeURIComponent(newBoxId)}/transition`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to: 'assigned', assignee: assignee })
              });
              log(`✅ [${tb.module} ${tb.stage}] Tạo & đã Assign cho ${assignee}! (Box ID: ${newBoxId})`);
            } else {
              log(`✅ [${tb.module} ${tb.stage}] Tạo mới thành công ở trạng thái "created" (Dễ dàng chỉnh sửa tiếp)! (Box ID: ${newBoxId})`);
            }
            success++;
          } else {
            throw new Error(cd.detail || 'Không lấy được ID box mới');
          }
        } else if (action === 'UPDATE') {
          log(`[${tb.module} ${tb.stage}] Đang cập nhật nội dung box ${serverBoxId}...`);
          const updatePayload = {
            title: tb.title,
            anchor_object_id: tb.anchor_object_id,
            note: `Updated for ${tb.title} from Sheet`,
            contents: tb.contents,
            borrow_now: false
          };
          const ur = await fetch(`/api/boxes/${encodeURIComponent(serverBoxId)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
          });
          const ud = await ur.json();

          if (ur.ok) {
            log(`✅ [${tb.module} ${tb.stage}] Cập nhật thành công! (${tb.item_count} items)`);
            success++;
          } else {
            throw new Error(ud.detail || 'Lỗi khi cập nhật box');
          }
        }
      } catch (e) {
        log(`❌ [${tb.module} ${tb.stage}] Thất bại: ${e.message}`);
        failed++;
      }

      // Small delay to prevent network flood
      await new Promise(r => setTimeout(r, 120));
    }

    log(`🎉 HOÀN TẤT ĐỒNG BỘ: ${success} thành công, ${failed} lỗi.`);
    btnPreview.disabled = false;
    btnPreview.click(); // Re-audit to update table
  });

  // --- INDEPENDENT ASSIGN EXECUTION LOGIC ---
  document.getElementById('sm-btn-assign-only')?.addEventListener('click', async () => {
    if (!comparisonResults.length) return;
    const toAssign = comparisonResults.filter(r => r.isSelected && r.serverBoxId && (r.serverStatus === 'created' || r.serverStatus === 'assigned'));
    if (toAssign.length === 0) {
      alert('Vui lòng chọn ít nhất 1 Taskbox ở trạng thái "created" để gán Assignee!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn Gán Assignee cho ${toAssign.length} Taskbox đã chọn?`)) return;

    const btnSync = document.getElementById('sm-btn-sync');
    const btnAssign = document.getElementById('sm-btn-assign-only');
    const btnPreview = document.getElementById('sm-btn-preview');
    const progressBar = document.getElementById('sm-sync-progress');
    const progressFill = document.getElementById('sm-progress-fill');
    const logBox = document.getElementById('sm-log-box');

    if (btnSync) btnSync.disabled = true;
    if (btnAssign) btnAssign.disabled = true;
    if (btnPreview) btnPreview.disabled = true;
    progressBar.style.display = 'block';
    logBox.style.display = 'block';
    logBox.innerHTML = '';

    const log = (msg) => {
      const p = document.createElement('div');
      p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logBox.appendChild(p);
      logBox.scrollTop = logBox.scrollHeight;
    };

    log(`👤 Bắt đầu gán Assignee cho ${toAssign.length} Taskbox...`);

    let done = 0;
    let success = 0;
    let failed = 0;

    for (const item of toAssign) {
      const { tb, serverBoxId, assignee } = item;
      done++;
      progressFill.style.width = `${(done / toAssign.length) * 100}%`;

      try {
        log(`[${tb.module} ${tb.stage}] Đang gán box ${serverBoxId} cho người lấy ID: ${assignee}...`);
        await safeFetchJson(`/api/boxes/${encodeURIComponent(serverBoxId)}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: 'assigned', assignee: assignee })
        });
        log(`✅ [${tb.module} ${tb.stage}] Đã gán thành công cho ${assignee}!`);
        success++;
      } catch (e) {
        log(`❌ [${tb.module} ${tb.stage}] Thất bại: ${e.message}`);
        failed++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    log(`🎉 HOÀN TẤT GÁN ASSIGNEE: ${success} thành công, ${failed} lỗi.`);
    if (btnPreview) btnPreview.disabled = false;
    btnPreview?.click(); // Re-audit to update table
  });

  // --- INDEPENDENT BORROW EXECUTION LOGIC (MƯỢN ĐỒ -> COLLECTED) ---
  document.getElementById('sm-btn-borrow-only')?.addEventListener('click', async () => {
    if (!comparisonResults.length) return;
    const toBorrow = comparisonResults.filter(r => r.isSelected && r.serverBoxId && r.serverStatus === 'assigned');
    if (toBorrow.length === 0) {
      alert('Vui lòng chọn ít nhất 1 Taskbox ở trạng thái "assigned" để Mượn đồ!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn MƯỢN ${toBorrow.length} Taskbox đã chọn?`)) return;

    const btnSync = document.getElementById('sm-btn-sync');
    const btnBorrow = document.getElementById('sm-btn-borrow-only');
    const btnPreview = document.getElementById('sm-btn-preview');
    const progressBar = document.getElementById('sm-sync-progress');
    const progressFill = document.getElementById('sm-progress-fill');
    const logBox = document.getElementById('sm-log-box');

    if (btnSync) btnSync.disabled = true;
    if (btnBorrow) btnBorrow.disabled = true;
    if (btnPreview) btnPreview.disabled = true;
    progressBar.style.display = 'block';
    logBox.style.display = 'block';
    logBox.innerHTML = '';

    const log = (msg) => {
      const p = document.createElement('div');
      p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logBox.appendChild(p);
      logBox.scrollTop = logBox.scrollHeight;
    };

    log(`📦 Bắt đầu chuyển trạng thái MƯỢN ĐỒ (collected) cho ${toBorrow.length} Taskbox...`);

    let done = 0;
    let success = 0;
    let failed = 0;

    for (const item of toBorrow) {
      const { tb, serverBoxId, assignee } = item;
      done++;
      progressFill.style.width = `${(done / toBorrow.length) * 100}%`;

      try {
        log(`[${tb.module} ${tb.stage}] Đang mượn box ${serverBoxId} (người lấy: ${assignee})...`);
        await safeFetchJson(`/api/boxes/${encodeURIComponent(serverBoxId)}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'collected',
            borrower: assignee,
            assignee: assignee,
            note: 'Borrowed via Tool'
          })
        });
        log(`✅ [${tb.module} ${tb.stage}] Đã mượn thành công!`);
        success++;
      } catch (e) {
        log(`❌ [${tb.module} ${tb.stage}] Thất bại: ${e.message}`);
        failed++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    log(`🎉 HOÀN TẤT MƯỢN ĐỒ: ${success} thành công, ${failed} lỗi.`);
    if (btnPreview) btnPreview.disabled = false;
    btnPreview?.click();
  });

  // --- INDEPENDENT RETURN EXECUTION LOGIC (TRẢ ĐỒ -> DEACTIVATED) ---
  document.getElementById('sm-btn-return-only')?.addEventListener('click', async () => {
    if (!comparisonResults.length) return;
    const toReturn = comparisonResults.filter(r => r.isSelected && r.serverBoxId && r.serverStatus === 'collected');
    if (toReturn.length === 0) {
      alert('Vui lòng chọn ít nhất 1 Taskbox ở trạng thái "collected" để Trả đồ!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn TRẢ ${toReturn.length} Taskbox đã chọn?`)) return;

    const btnSync = document.getElementById('sm-btn-sync');
    const btnReturn = document.getElementById('sm-btn-return-only');
    const btnPreview = document.getElementById('sm-btn-preview');
    const progressBar = document.getElementById('sm-sync-progress');
    const progressFill = document.getElementById('sm-progress-fill');
    const logBox = document.getElementById('sm-log-box');

    if (btnSync) btnSync.disabled = true;
    if (btnReturn) btnReturn.disabled = true;
    if (btnPreview) btnPreview.disabled = true;
    progressBar.style.display = 'block';
    logBox.style.display = 'block';
    logBox.innerHTML = '';

    const log = (msg) => {
      const p = document.createElement('div');
      p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logBox.appendChild(p);
      logBox.scrollTop = logBox.scrollHeight;
    };

    log(`↩️ Bắt đầu TRẢ ĐỒ (deactivated) cho ${toReturn.length} Taskbox...`);

    let done = 0;
    let success = 0;
    let failed = 0;

    for (const item of toReturn) {
      const { tb, serverBoxId, assignee } = item;
      done++;
      progressFill.style.width = `${(done / toReturn.length) * 100}%`;

      try {
        log(`[${tb.module} ${tb.stage}] Đang trả box ${serverBoxId}...`);
        await safeFetchJson(`/api/boxes/${encodeURIComponent(serverBoxId)}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'deactivated',
            returned_by: assignee,
            note: 'Returned via Tool'
          })
        });
        log(`✅ [${tb.module} ${tb.stage}] Đã trả thành công!`);
        success++;
      } catch (e) {
        log(`❌ [${tb.module} ${tb.stage}] Thất bại: ${e.message}`);
        failed++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    log(`🎉 HOÀN TẤT TRẢ ĐỒ: ${success} thành công, ${failed} lỗi.`);
    if (btnPreview) btnPreview.disabled = false;
    btnPreview?.click();
  });

  // --- QR CODE PRINTING POPUP WINDOW GENERATOR ---
  function formatDateVN(dateVal) {
    if (!dateVal) {
      const now = new Date();
      return now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function openQRPrintWindow(items) {
    if (!items || items.length === 0) {
      alert('Không có Taskbox nào có sẵn ID trên Scenario Manager để in mã QR! Vui lòng bấm "🚀 Đồng bộ Đồ" trước.');
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('Trình duyệt đã chặn cửa sổ bật lên (Pop-up). Vui lòng cho phép Pop-up để xem trang in!');
      return;
    }

    const cardsHtml = items.map((item, idx) => {
      const boxId = item.serverBoxId || (item.tb && item.tb.box_id) || '';
      const boxUrl = `https://sm.config.inc/boxes/${encodeURIComponent(boxId)}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(boxUrl)}`;
      const title = (item.tb && item.tb.title) || 'TaskBox';
      const module = (item.tb && item.tb.module) || '';
      const stage = (item.tb && item.tb.stage) || '';
      const anchor = (item.tb && item.tb.anchor_object_id) || '';
      const totalQty = (item.tb && item.tb.total_qty) || 0;
      const itemCount = (item.tb && item.tb.item_count) || 0;
      const assignee = item.assignee || '';
      const dateStr = formatDateVN(item.serverCreatedAt);

      return `
        <div class="label-card">
          <div class="label-qr-wrap">
            <img src="${qrUrl}" alt="QR for ${title}" loading="eager" />
          </div>
          <div class="label-info">
            <div class="label-title">${title}</div>
            <div class="label-badge-row">
              <span class="label-badge label-badge-stage">${stage}</span>
              <span class="label-badge">Mod: ${module}</span>
              ${anchor ? `<span class="label-badge">Anchor: ${anchor}</span>` : ''}
              ${assignee ? `<span class="label-badge" style="background:#e0e7ff; color:#3730a3;">👤 ${assignee}</span>` : ''}
            </div>
            <div class="label-meta-text">
              <span><b>${totalQty}</b> đồ (${itemCount} loại)</span>
            </div>
            <div class="label-date">📅 Ngày tạo: <b>${dateStr}</b></div>
            <div class="label-id">ID: ${boxId}</div>
            <div class="label-link">${boxUrl}</div>
          </div>
        </div>
      `;
    }).join('');

    const pageHtml = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>In Nhãn Mã QR TaskBoxes (${items.length} Box)</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            margin: 0;
            padding: 16px;
            background: #f8fafc;
            color: #0f172a;
          }
          .toolbar {
            background: #0f172a;
            color: #ffffff;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          }
          .toolbar-title {
            font-size: 16px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .toolbar-actions {
            display: flex;
            gap: 10px;
            align-items: center;
          }
          .btn-print {
            background: #16a34a;
            color: white;
            border: none;
            padding: 8px 18px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          }
          .btn-print:hover { background: #15803d; }
          .grid-toggle-btn {
            background: #334155;
            color: #e2e8f0;
            border: 1px solid #475569;
            padding: 7px 14px;
            border-radius: 6px;
            font-size: 13px;
            cursor: pointer;
          }
          .grid-toggle-btn:hover { background: #475569; }

          .label-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .label-grid.cols-3 {
            grid-template-columns: repeat(3, 1fr);
          }
          .label-card {
            background: #ffffff;
            border: 1.5px dashed #64748b;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            gap: 14px;
            align-items: center;
            page-break-inside: avoid;
            break-inside: avoid;
            min-height: 145px;
          }
          .label-qr-wrap {
            flex-shrink: 0;
            width: 110px;
            height: 110px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 3px;
          }
          .label-qr-wrap img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
          }
          .label-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 4px;
            overflow: hidden;
          }
          .label-title {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.25;
            margin: 0;
            word-break: break-word;
          }
          .label-badge-row {
            display: flex;
            gap: 5px;
            align-items: center;
            flex-wrap: wrap;
            margin: 2px 0;
          }
          .label-badge {
            background: #f1f5f9;
            color: #334155;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 700;
            border: 1px solid #e2e8f0;
          }
          .label-badge-stage {
            background: #dbeafe;
            color: #1e40af;
            border-color: #bfdbfe;
          }
          .label-meta-text {
            font-size: 12px;
            color: #475569;
          }
          .label-date {
            font-size: 11px;
            color: #334155;
          }
          .label-id {
            font-size: 10px;
            font-family: monospace;
            color: #64748b;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .label-link {
            font-size: 9px;
            color: #2563eb;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          @media print {
            body {
              background: #fff;
              padding: 0;
              margin: 0;
            }
            .no-print { display: none !important; }
            .label-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 8mm !important;
            }
            .label-grid.cols-3 {
              grid-template-columns: repeat(3, 1fr) !important;
              gap: 5mm !important;
            }
            .label-card {
              border: 1px dashed #475569 !important;
              box-shadow: none !important;
              padding: 8px 10px !important;
              min-height: 130px !important;
            }
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
          }
        </style>
      </head>
      <body>
        <div class="toolbar no-print">
          <div class="toolbar-title">
            <span>🏷️ Nhãn Mã QR TaskBoxes (${items.length} Box)</span>
          </div>
          <div class="toolbar-actions">
            <button class="grid-toggle-btn" onclick="document.getElementById('grid').classList.toggle('cols-3')">
              🔄 Đổi 2 Cột / 3 Cột
            </button>
            <button class="btn-print" onclick="window.print()">
              🖨️ Bấm In Ngay (Print / PDF)
            </button>
          </div>
        </div>

        <div class="label-grid" id="grid">
          ${cardsHtml}
        </div>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(pageHtml);
    printWin.document.close();
  }

  // --- BATCH QR PRINT BUTTON LISTENER ---
  document.getElementById('sm-btn-print-qr')?.addEventListener('click', () => {
    if (!comparisonResults.length) return;
    const toPrint = comparisonResults.filter(r => r.isSelected && r.serverBoxId);
    if (toPrint.length === 0) {
      alert('Vui lòng chọn ít nhất 1 Taskbox đã có trên hệ thống để in mã QR!');
      return;
    }
    openQRPrintWindow(toPrint);
  });

  // ==========================================
  // --- TAB SWITCHING & WEB MANAGER LOGIC ---
  // ==========================================
  const tabBtnSheet = document.getElementById('sm-tab-btn-sheet');
  const tabBtnWeb = document.getElementById('sm-tab-btn-web');
  const tabPaneSheet = document.getElementById('sm-tab-pane-sheet');
  const tabPaneWeb = document.getElementById('sm-tab-pane-web');

  tabBtnSheet?.addEventListener('click', () => {
    tabBtnSheet.classList.add('sm-tab-active');
    tabBtnWeb.classList.remove('sm-tab-active');
    if (tabPaneSheet) tabPaneSheet.style.display = 'flex';
    if (tabPaneWeb) tabPaneWeb.style.display = 'none';
  });

  tabBtnWeb?.addEventListener('click', () => {
    tabBtnWeb.classList.add('sm-tab-active');
    tabBtnSheet.classList.remove('sm-tab-active');
    if (tabPaneWeb) tabPaneWeb.style.display = 'flex';
    if (tabPaneSheet) tabPaneSheet.style.display = 'none';

    if (rawWebBoxesCache.length === 0) {
      fetchWebBoxes();
    }
  });

  // --- LIVE WEB TASKBOX MANAGER STATE & HELPERS ---
  let rawWebBoxesCache = [];
  let filteredWebBoxes = [];
  let currentWebDateFilter = 'today';
  let currentWebStatusFilter = 'active';
  let currentWebUserFilter = 'all';
  let currentWebStageFilter = 'all';
  let currentWebModuleFilter = 'all';

  function extractModuleAndStage(title) {
    let mod = '-';
    let stage = '-';
    const mMatch = (title || '').match(/M\d+(?:-\d+)?/i);
    if (mMatch) mod = mMatch[0].toUpperCase();
    const sMatch = (title || '').match(/(?:A\d|B\d)/i);
    if (sMatch) stage = sMatch[0].toUpperCase();
    return { mod, stage };
  }

  function getBoxLocalDateStr(dateVal) {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async function fetchWebBoxes() {
    triggerStartFresh();
    const btnFetch = document.getElementById('sm-web-btn-fetch');
    if (btnFetch) {
      btnFetch.disabled = true;
      btnFetch.innerHTML = '⏳ Đang quét Web...';
    }

    try {
      const currentMe = getLoggedInUser();
      const meBtn = document.getElementById('sm-web-user-me-btn');
      if (meBtn && currentMe) {
        meBtn.textContent = `Chỉ của tôi (${currentMe})`;
      }

      const data = await safeFetchJson('/api/boxes?limit=500');
      rawWebBoxesCache = data.boxes || data || [];
      // Sort newest first
      rawWebBoxesCache.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      renderWebModulePills();
      filterWebBoxes();
    } catch (err) {
      alert('Lỗi khi tải TaskBox từ Scenario Manager: ' + err.message);
    } finally {
      if (btnFetch) {
        btnFetch.disabled = false;
        btnFetch.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Quét TaskBox từ Web
        `;
      }
    }
  }

  
  function renderWebModulePills() {
    const container = document.getElementById('sm-web-module-pills-container');
    if (!container) return;

    // Extract only Base Modules (e.g. M2, M3, M4, M12, M13...)
    const moduleSet = new Set();
    rawWebBoxesCache.forEach(b => {
      const { mod } = extractModuleAndStage(b.title);
      if (mod && mod !== '-') {
        const base = mod.split(/[-_]/)[0].toUpperCase();
        if (base) moduleSet.add(base);
      }
    });

    // Natural numerical sorting: M2 -> M3 -> M4 -> M8 -> M9 -> M10 -> M11 -> M12 -> M13 -> M14 -> M15
    const modules = Array.from(moduleSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    container.innerHTML = `
      <button type="button" class="sm-pill-btn sm-web-module-pill ${currentWebModuleFilter === 'all' ? 'sm-pill-active' : ''}" data-module="all">Tất cả</button>
    `;

    modules.forEach(mod => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sm-pill-btn sm-web-module-pill ${currentWebModuleFilter === mod ? 'sm-pill-active' : ''}`;
      btn.setAttribute('data-module', mod);
      btn.textContent = mod;
      container.appendChild(btn);
    });

    container.querySelectorAll('.sm-web-module-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        container.querySelectorAll('.sm-web-module-pill').forEach(p => p.classList.remove('sm-pill-active'));
        pill.classList.add('sm-pill-active');
        currentWebModuleFilter = pill.getAttribute('data-module');
        filterWebBoxes();
      });
    });
  }

  // --- TAB 2 SORT STATE & HELPERS ---
  let currentWebSortKey = 'created_at';
  let currentWebSortOrder = 'desc';

  function updateWebSortIcons() {
    document.querySelectorAll('#sm-sync-modal th[data-sort-tab2]').forEach(th => {
      const key = th.getAttribute('data-sort-tab2');
      const icon = th.querySelector('.sm-sort-icon');
      if (!icon) return;
      if (key === currentWebSortKey) {
        icon.textContent = currentWebSortOrder === 'asc' ? '▲' : '▼';
        icon.classList.add('sm-sort-active');
      } else {
        icon.textContent = '↕';
        icon.classList.remove('sm-sort-active');
      }
    });
  }

  function sortWebBoxesList(list) {
    if (!list || list.length === 0) return;
    list.sort((a, b) => {
      let cmp = 0;
      if (currentWebSortKey === 'id') {
        cmp = naturalCompare(a.id || a.box_id, b.id || b.box_id);
      } else if (currentWebSortKey === 'title') {
        cmp = naturalCompare(a.title, b.title);
      } else if (currentWebSortKey === 'module_stage') {
        const ma = extractModuleAndStage(a.title);
        const mb = extractModuleAndStage(b.title);
        cmp = naturalCompare(ma.mod, mb.mod);
        if (cmp === 0) {
          cmp = naturalCompare(ma.stage, mb.stage);
        }
      } else if (currentWebSortKey === 'anchor') {
        cmp = naturalCompare(a.anchor_object_id, b.anchor_object_id);
      } else if (currentWebSortKey === 'total_qty') {
        const qtyA = (a.contents || []).reduce((sum, c) => sum + (c.quantity || 1), 0);
        const qtyB = (b.contents || []).reduce((sum, c) => sum + (c.quantity || 1), 0);
        cmp = qtyA - qtyB;
      } else if (currentWebSortKey === 'holder') {
        const hA = a.current_holder || a.borrower || a.assignee || '';
        const hB = b.current_holder || b.borrower || b.assignee || '';
        cmp = naturalCompare(hA, hB);
      } else if (currentWebSortKey === 'created_at') {
        const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
        cmp = tA - tB;
      } else if (currentWebSortKey === 'status') {
        cmp = naturalCompare(a.status, b.status);
      }
      return currentWebSortOrder === 'asc' ? cmp : -cmp;
    });
  }

  function handleTab2Sort(sortKey) {
    if (!filteredWebBoxes || filteredWebBoxes.length === 0) return;
    if (currentWebSortKey === sortKey) {
      currentWebSortOrder = currentWebSortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      currentWebSortKey = sortKey;
      currentWebSortOrder = (sortKey === 'created_at' || sortKey === 'total_qty') ? 'desc' : 'asc';
    }
    sortWebBoxesList(filteredWebBoxes);
    renderWebTable();
  }

  function filterWebBoxes() {
    const customDate = document.getElementById('sm-web-date-picker')?.value;
    const searchTerm = (document.getElementById('sm-web-search-input')?.value || '').trim().toLowerCase();

    const todayStr = getBoxLocalDateStr(new Date());
    const yesterdayStr = getBoxLocalDateStr(new Date(Date.now() - 86400000));
    const threeDaysAgoMs = Date.now() - (3 * 86400000);

    filteredWebBoxes = rawWebBoxesCache.filter(b => {
      // 1. Status Filter
      if (currentWebStatusFilter === 'active' && b.status === 'deactivated') return false;
      if (currentWebStatusFilter === 'collected' && b.status !== 'collected') return false;
      if (currentWebStatusFilter === 'assigned' && b.status !== 'assigned') return false;
      if (currentWebStatusFilter === 'created' && b.status !== 'created') return false;

      // 1b. User Filter (My Boxes vs All)
      if (currentWebUserFilter === 'me') {
        const me = (getLoggedInUser() || '').toLowerCase();
        if (me) {
          const createdBy = (b.created_by || '').toLowerCase();
          const assignee = (b.assignee || '').toLowerCase();
          const holder = (b.current_holder || b.borrower || '').toLowerCase();
          const people = (b.people || []).map(p => (p.user_id || '').toLowerCase());
          const isMyBox = (createdBy === me || assignee === me || holder === me || people.includes(me));
          if (!isMyBox) return false;
        }
      }

      const { mod: boxMod, stage: boxStage } = extractModuleAndStage(b.title);

      // 1c. Stage Filter (B2, B3, A1, all)
      if (currentWebStageFilter !== 'all') {
        if (boxStage !== currentWebStageFilter) return false;
      }

      // 1d. Module Filter (M2, M3, M12, M13... matching base prefix)
      if (currentWebModuleFilter !== 'all') {
        const baseMod = boxMod.split(/[-_]/)[0].toUpperCase();
        if (baseMod !== currentWebModuleFilter) return false;
      }

      // 2. Date Filter
      const boxDateStr = getBoxLocalDateStr(b.created_at);
      const boxTimeMs = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (currentWebDateFilter === 'today' && boxDateStr !== todayStr) return false;
      if (currentWebDateFilter === 'yesterday' && boxDateStr !== yesterdayStr) return false;
      if (currentWebDateFilter === 'last3days' && (!boxTimeMs || boxTimeMs < threeDaysAgoMs)) return false;
      if (currentWebDateFilter === 'custom' && customDate && boxDateStr !== customDate) return false;

      // 3. Search Filter
      if (searchTerm) {
        const title = (b.title || '').toLowerCase();
        const id = (b.id || b.box_id || '').toLowerCase();
        const holder = (b.current_holder || b.borrower || b.assignee || '').toLowerCase();
        const anchor = (b.anchor_object_id || '').toLowerCase();
        if (!title.includes(searchTerm) && !id.includes(searchTerm) && !holder.includes(searchTerm) && !anchor.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });

    // Default select state
    filteredWebBoxes.forEach(b => {
      if (typeof b.isSelected === 'undefined') b.isSelected = false;
    });

    sortWebBoxesList(filteredWebBoxes);
    renderWebTable();
  }

  function renderWebTable() {
    const tbody = document.getElementById('sm-web-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (filteredWebBoxes.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align:center; color:#64748b; padding:24px;">
            Không tìm thấy TaskBox nào phù hợp với bộ lọc hiện tại.
          </td>
        </tr>
      `;
      updateWebSelectionSummary();
      return;
    }

    filteredWebBoxes.forEach((b, idx) => {
      const boxId = b.id || b.box_id || '';
      const title = b.title || 'TaskBox';
      const status = b.status || 'unknown';
      const holder = b.current_holder || b.borrower || b.assignee || '-';
      const anchor = b.anchor_object_id || '-';
      const contents = b.contents || [];
      const totalQty = contents.reduce((sum, c) => sum + (c.quantity || 1), 0);
      const itemCount = contents.length;
      const dateStr = formatDateVN(b.created_at);

      let mod = '-';
      let stage = '-';
      const mMatch = title.match(/M\d+(?:-\d+)?/i);
      if (mMatch) mod = mMatch[0].toUpperCase();
      const sMatch = title.match(/(?:A\d|B\d)/i);
      if (sMatch) stage = sMatch[0].toUpperCase();

      let statusBadge = 'sm-badge-skip';
      if (status === 'collected') { statusBadge = 'sm-badge-collected'; }
      else if (status === 'assigned') { statusBadge = 'sm-badge-create'; }
      else if (status === 'created') { statusBadge = 'sm-badge-update'; }
      else if (status === 'deactivated') { statusBadge = 'sm-badge-skip'; }

      let actionBtns = '';
      if (status === 'created' || status === 'assigned') {
        actionBtns += `<button type="button" class="sm-pill-btn sm-web-row-assign-btn" data-idx="${idx}" style="background:#4338ca; color:#c7d2fe; margin-left:4px; border:none; padding:2px 7px; font-size:11px;" title="Gán / Chỉnh sửa Assignee">${status === 'created' ? 'Gán' : 'Đổi Gán'}</button>`;
      }
      if (status === 'collected' || status === 'active') {
        actionBtns += `<button type="button" class="sm-pill-btn sm-web-row-handover-btn" data-idx="${idx}" style="background:#2563eb; color:#fff; margin-left:4px; border:none; padding:2px 7px; font-size:11px;" title="Bàn giao ca">Bàn giao</button>`;
      }
      if (status === 'collected') {
        actionBtns += `<button type="button" class="sm-pill-btn sm-web-row-return-btn" data-idx="${idx}" style="background:#b91c1c; color:#fecaca; margin-left:4px; border:none; padding:2px 7px; font-size:11px;" title="Trả đồ">Trả</button>`;
      }
      if (status === 'assigned') {
        actionBtns += `<button type="button" class="sm-pill-btn sm-web-row-borrow-btn" data-idx="${idx}" style="background:#0284c7; color:#e0f2fe; margin-left:4px; border:none; padding:2px 7px; font-size:11px;" title="Mượn đồ">Mượn</button>`;
      }
      actionBtns += `<button type="button" class="sm-pill-btn sm-web-row-qr-btn" data-idx="${idx}" style="background:#059669; color:#d1fae5; margin-left:4px; border:none; padding:2px 7px; font-size:11px;" title="In mã QR">Mã QR</button>`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align:center;"><input type="checkbox" class="sm-web-row-check" data-idx="${idx}" ${b.isSelected ? 'checked' : ''} /></td>
        <td><a href="/boxes/${encodeURIComponent(boxId)}" target="_blank" style="color:#38bdf8; text-decoration:none; font-family:monospace; font-size:11px;" title="Mở chi tiết Box">${boxId} ↗</a></td>
        <td><a href="/boxes/${encodeURIComponent(boxId)}" target="_blank" style="color:#f8fafc; text-decoration:none; font-weight:700;" title="Mở chi tiết Box">${title}</a></td>
        <td><span style="color:#60a5fa; font-weight:600;">${mod}</span> <span style="color:#38bdf8; font-weight:700;">${stage}</span></td>
        <td><code>${anchor}</code></td>
        <td><b>${totalQty}</b> (${itemCount} items)</td>
        <td><span style="background:#1e293b; padding:2px 6px; border-radius:4px; color:#38bdf8; font-weight:600;">👤 ${holder}</span></td>
        <td style="font-size:11px; color:#94a3b8;">${dateStr}</td>
        <td><span class="sm-badge ${statusBadge}">${status}</span></td>
        <td style="text-align:center; white-space:nowrap;">${actionBtns}</td>
      `;
      tbody.appendChild(tr);
    });

    attachWebRowEvents();
    updateWebSelectionSummary();
    updateWebSortIcons();
  }

  function attachWebRowEvents() {
    const tbody = document.getElementById('sm-web-tbody');
    if (!tbody) return;

    // Checkboxes
    tbody.querySelectorAll('.sm-web-row-check').forEach(cb => {
      cb.addEventListener('change', () => {
        const idx = parseInt(cb.getAttribute('data-idx'), 10);
        if (filteredWebBoxes[idx]) filteredWebBoxes[idx].isSelected = cb.checked;
        updateWebSelectionSummary();
      });
    });

    // Single Assign / Re-assign
    tbody.querySelectorAll('.sm-web-row-assign-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const b = filteredWebBoxes[idx];
        if (!b) return;

        let assignee = (document.getElementById('sm-web-assign-input')?.value || '').trim();
        if (!assignee) {
          assignee = prompt(`Nhập ID Assignee mới cho box "${b.title}":`, b.assignee || b.current_holder || getLoggedInUser() || '');
        }
        if (!assignee) return;

        const boxId = b.id || b.box_id;
        btn.disabled = true;
        btn.textContent = '⏳...';

        try {
          const resData = await safeFetchJson(`/api/boxes/${encodeURIComponent(boxId)}/transition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: 'assigned',
              assignee: assignee.trim()
            })
          });
          alert(`✅ Đã gán "${b.title}" cho ${assignee} thành công!`);
          fetchWebBoxes();
        } catch (err) {
          alert('Lỗi kết nối: ' + err.message);
          btn.disabled = false;
          btn.textContent = b.status === 'created' ? 'Gán' : 'Đổi Gán';
        }
      });
    });

    // Single Handover
    tbody.querySelectorAll('.sm-web-row-handover-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const b = filteredWebBoxes[idx];
        if (!b) return;

        let receiver = (document.getElementById('sm-web-handover-receiver')?.value || '').trim();
        if (!receiver) {
          receiver = prompt(`Nhập ID người nhận mới cho "${b.title}":`, b.assignee || '');
          if (!receiver) return;
          receiver = receiver.trim();
        }
        const note = (document.getElementById('sm-web-handover-note')?.value || '').trim() || 'Bàn giao ca qua Tool';

        btn.disabled = true;
        btn.textContent = '⏳...';
        try {
          const boxId = b.id || b.box_id;
          const r = await fetch(`/api/boxes/${encodeURIComponent(boxId)}/handover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiver, note })
          });
          const data = await r.json();
          if (r.ok) {
            alert(`✅ Đã bàn giao "${b.title}" cho ${receiver} thành công!`);
            await fetchWebBoxes();
          } else {
            alert(`❌ Lỗi: ${data.detail || data.error || 'Không thể bàn giao'}`);
            btn.disabled = false;
            btn.textContent = 'Bàn giao';
          }
        } catch (err) {
          alert('Lỗi kết nối: ' + err.message);
          btn.disabled = false;
          btn.textContent = 'Bàn giao';
        }
      });
    });

    // Single Return
    tbody.querySelectorAll('.sm-web-row-return-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const b = filteredWebBoxes[idx];
        if (!b) return;
        const boxId = b.id || b.box_id;
        const holder = b.current_holder || b.borrower || b.assignee || '';

        if (!confirm(`Bạn có chắc muốn TRẢ đồ cho "${b.title}"?`)) return;

        btn.disabled = true;
        btn.textContent = '⏳...';
        try {
          const trResp = await fetch(`/api/boxes/${encodeURIComponent(boxId)}/transition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: 'deactivated', returned_by: holder, note: 'Returned via Tool' })
          });
          const trData = await trResp.json();
          if (trResp.ok) {
            alert(`✅ Đã trả "${b.title}" thành công!`);
            await fetchWebBoxes();
          } else {
            alert(`❌ Lỗi: ${trData.detail || 'Không thể trả đồ'}`);
            btn.disabled = false;
            btn.textContent = 'Trả';
          }
        } catch (err) {
          alert('Lỗi kết nối: ' + err.message);
          btn.disabled = false;
          btn.textContent = 'Trả';
        }
      });
    });

    // Single Borrow
    tbody.querySelectorAll('.sm-web-row-borrow-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const b = filteredWebBoxes[idx];
        if (!b) return;
        const boxId = b.id || b.box_id;
        const assignee = b.assignee || b.current_holder || '';

        btn.disabled = true;
        btn.textContent = '⏳...';
        try {
          const trResp = await fetch(`/api/boxes/${encodeURIComponent(boxId)}/transition`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ to: 'collected', borrower: assignee, assignee: assignee, note: 'Borrowed via Tool' })
          });
          const trData = await trResp.json();
          if (trResp.ok) {
            alert(`✅ Đã mượn "${b.title}" thành công!`);
            await fetchWebBoxes();
          } else {
            alert(`❌ Lỗi: ${trData.detail || 'Không thể mượn đồ'}`);
            btn.disabled = false;
            btn.textContent = 'Mượn';
          }
        } catch (err) {
          alert('Lỗi kết nối: ' + err.message);
          btn.disabled = false;
          btn.textContent = 'Mượn';
        }
      });
    });

    // Single QR
    tbody.querySelectorAll('.sm-web-row-qr-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const b = filteredWebBoxes[idx];
        if (!b) return;
        const contents = b.contents || [];
        let mod = '-';
        let stage = '-';
        const mMatch = (b.title || '').match(/M\d+(?:-\d+)?/i);
        if (mMatch) mod = mMatch[0].toUpperCase();
        const sMatch = (b.title || '').match(/(?:A\d|B\d)/i);
        if (sMatch) stage = sMatch[0].toUpperCase();

        openQRPrintWindow([{
          serverBoxId: b.id || b.box_id,
          serverCreatedAt: b.created_at,
          assignee: b.current_holder || b.borrower || b.assignee || '',
          tb: {
            title: b.title || 'TaskBox',
            module: mod,
            stage: stage,
            anchor_object_id: b.anchor_object_id || '',
            total_qty: contents.reduce((sum, c) => sum + (c.quantity || 1), 0),
            item_count: contents.length
          }
        }]);
      });
    });
  }

  function updateWebSelectionSummary() {
    const checkboxes = Array.from(document.querySelectorAll('.sm-web-row-check'));
    checkboxes.forEach(cb => {
      const idx = parseInt(cb.getAttribute('data-idx'), 10);
      if (filteredWebBoxes[idx]) filteredWebBoxes[idx].isSelected = cb.checked;
    });

    const selectedBoxes = filteredWebBoxes.filter(b => b.isSelected);
    const selectedCount = selectedBoxes.length;
    const totalCount = filteredWebBoxes.length;

    const countDisplay = document.getElementById('sm-web-selection-count');
    const handoverBtn = document.getElementById('sm-web-btn-handover');
    const handoverText = document.getElementById('sm-web-handover-text');
    const returnBtn = document.getElementById('sm-web-btn-return');
    const returnText = document.getElementById('sm-web-return-text');
    const borrowBtn = document.getElementById('sm-web-btn-borrow');
    const borrowText = document.getElementById('sm-web-borrow-text');
    const printBtn = document.getElementById('sm-web-btn-print-qr');
    const printText = document.getElementById('sm-web-print-text');

    const selectedForHandover = selectedBoxes.filter(b => b.status === 'collected' || b.status === 'active');
    const selectedForAssign = selectedBoxes.filter(b => b.status === 'created' || b.status === 'assigned');
    const selectedCollected = selectedBoxes.filter(b => b.status === 'collected');
    const selectedAssigned = selectedBoxes.filter(b => b.status === 'assigned');

    const assignBtn = document.getElementById('sm-web-btn-assign');
    const assignText = document.getElementById('sm-web-assign-text');
    if (assignText) {
      assignText.textContent = `Gán / Đổi Assign (${selectedForAssign.length})`;
    }
    if (assignBtn) {
      assignBtn.disabled = (selectedForAssign.length === 0);
    }

    if (countDisplay) {
      countDisplay.textContent = `Đã chọn: ${selectedCount} / ${totalCount} box`;
    }
    if (handoverText) {
      handoverText.textContent = `Bàn giao (${selectedForHandover.length})`;
    }
    if (handoverBtn) {
      handoverBtn.disabled = (selectedForHandover.length === 0);
    }
    if (returnText) {
      returnText.textContent = `Trả đồ (${selectedCollected.length})`;
    }
    if (returnBtn) {
      returnBtn.disabled = (selectedCollected.length === 0);
    }
    if (borrowText) {
      borrowText.textContent = `Mượn đồ (${selectedAssigned.length})`;
    }
    if (borrowBtn) {
      borrowBtn.disabled = (selectedAssigned.length === 0);
    }
    if (printText) {
      printText.textContent = `In QR (${selectedCount})`;
    }
    if (printBtn) {
      printBtn.disabled = (selectedCount === 0);
    }

    const thSelectAll = document.getElementById('sm-web-th-select-all');
    if (thSelectAll && totalCount > 0) {
      thSelectAll.checked = (selectedCount === totalCount);
      thSelectAll.indeterminate = (selectedCount > 0 && selectedCount < totalCount);
    }
  }

  function setWebRowSelections(predicate) {
    const checkboxes = Array.from(document.querySelectorAll('.sm-web-row-check'));
    checkboxes.forEach((cb) => {
      const idx = parseInt(cb.getAttribute('data-idx'), 10);
      const item = filteredWebBoxes[idx];
      const shouldCheck = !!predicate(item, idx);
      cb.checked = shouldCheck;
      if (item) item.isSelected = shouldCheck;
    });
    updateWebSelectionSummary();
  }

  // --- WEB FILTER & ACTION EVENT LISTENERS ---
  // Date filter pills
  document.querySelectorAll('.sm-web-date-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.sm-web-date-pill').forEach(p => p.classList.remove('sm-pill-active'));
      pill.classList.add('sm-pill-active');
      currentWebDateFilter = pill.getAttribute('data-range');
      if (document.getElementById('sm-web-date-picker')) {
        document.getElementById('sm-web-date-picker').value = '';
      }
      filterWebBoxes();
    });
  });

  document.getElementById('sm-web-date-picker')?.addEventListener('change', (e) => {
    if (e.target.value) {
      document.querySelectorAll('.sm-web-date-pill').forEach(p => p.classList.remove('sm-pill-active'));
      currentWebDateFilter = 'custom';
      filterWebBoxes();
    }
  });

  // Status filter pills
  document.querySelectorAll('.sm-web-status-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.sm-web-status-pill').forEach(p => p.classList.remove('sm-pill-active'));
      pill.classList.add('sm-pill-active');
      currentWebStatusFilter = pill.getAttribute('data-status');
      filterWebBoxes();
    });
  });

  // User filter pills
  document.querySelectorAll('.sm-web-user-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.sm-web-user-pill').forEach(p => p.classList.remove('sm-pill-active'));
      pill.classList.add('sm-pill-active');
      currentWebUserFilter = pill.getAttribute('data-user');
      filterWebBoxes();
    });
  });

  // Stage filter pills
  document.querySelectorAll('.sm-web-stage-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.sm-web-stage-pill').forEach(p => p.classList.remove('sm-pill-active'));
      pill.classList.add('sm-pill-active');
      currentWebStageFilter = pill.getAttribute('data-stage');
      filterWebBoxes();
    });
  });

  // Search Input (Debounced to eliminate flickering during typing)
  let searchDebounceTimer = null;
  document.getElementById('sm-web-search-input')?.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      filterWebBoxes();
    }, 150);
  });

  // Fetch Button
  document.getElementById('sm-web-btn-fetch')?.addEventListener('click', () => {
    fetchWebBoxes();
  });

  // Quick Selection Pills
  document.getElementById('sm-web-sel-all')?.addEventListener('click', () => setWebRowSelections(() => true));
  document.getElementById('sm-web-sel-none')?.addEventListener('click', () => setWebRowSelections(() => false));
  document.getElementById('sm-web-sel-collected')?.addEventListener('click', () => setWebRowSelections(item => item && item.status === 'collected'));
  document.getElementById('sm-web-sel-assigned')?.addEventListener('click', () => setWebRowSelections(item => item && item.status === 'assigned'));

  document.getElementById('sm-web-th-select-all')?.addEventListener('change', (e) => {
    const checked = e.target.checked;
    setWebRowSelections(() => checked);
  });

  // Batch Assign / Re-assign Execution
  document.getElementById('sm-web-btn-assign')?.addEventListener('click', async () => {
    const toAssign = filteredWebBoxes.filter(b => b.isSelected && (b.status === 'created' || b.status === 'assigned'));
    if (toAssign.length === 0) {
      alert('Vui lòng chọn ít nhất 1 TaskBox ở trạng thái "created" hoặc "assigned" để gán!');
      return;
    }

    let assignee = (document.getElementById('sm-web-assign-input')?.value || '').trim();
    if (!assignee) {
      assignee = prompt(`Nhập ID Assignee mới cho ${toAssign.length} box đã chọn:`, getLoggedInUser() || '');
    }
    if (!assignee) return;

    if (!confirm(`Bạn có chắc chắn muốn gán ${toAssign.length} Taskbox đã chọn cho "${assignee}"?`)) return;

    const btnAssign = document.getElementById('sm-web-btn-assign');
    const pBar = document.getElementById('sm-web-progress');
    const pFill = document.getElementById('sm-web-progress-fill');
    const logBox = document.getElementById('sm-web-log-box');

    btnAssign.disabled = true;
    pBar.style.display = 'block';
    logBox.style.display = 'block';
    logBox.innerHTML = '';

    const log = (msg) => {
      const line = document.createElement('div');
      line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logBox.appendChild(line);
      logBox.scrollTop = logBox.scrollHeight;
    };

    let successCount = 0;
    for (let i = 0; i < toAssign.length; i++) {
      const b = toAssign[i];
      const boxId = b.id || b.box_id;
      pFill.style.width = `${Math.round(((i + 1) / toAssign.length) * 100)}%`;

      log(`[${i + 1}/${toAssign.length}] Đang gán "${b.title}" cho ${assignee}...`);
      try {
        await safeFetchJson(`/api/boxes/${encodeURIComponent(boxId)}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: 'assigned', assignee: assignee.trim() })
        });
        log(`✅ Gán thành công!`);
        successCount++;
      } catch (err) {
        log(`❌ Thất bại: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 100));
    }

    btnAssign.disabled = false;
    log(`🎉 Hoàn tất gán ${successCount}/${toAssign.length} Taskbox!`);
    await fetchWebBoxes();
  });

  // Batch Handover Button
  document.getElementById('sm-web-btn-handover')?.addEventListener('click', async () => {
    const selectedBoxes = filteredWebBoxes.filter(b => b.isSelected && (b.status === 'collected' || b.status === 'active'));
    if (selectedBoxes.length === 0) {
      alert('Vui lòng chọn ít nhất 1 TaskBox ở trạng thái "Đang mượn" (collected) để Bàn giao ca!');
      return;
    }

    let receiver = (document.getElementById('sm-web-handover-receiver')?.value || '').trim();
    if (!receiver) {
      receiver = prompt(`Nhập ID người nhận mới cho ${selectedBoxes.length} TaskBox đã chọn:`);
      if (!receiver) return;
      receiver = receiver.trim();
      if (document.getElementById('sm-web-handover-receiver')) {
        document.getElementById('sm-web-handover-receiver').value = receiver;
      }
    }

    const note = (document.getElementById('sm-web-handover-note')?.value || '').trim() || 'Bàn giao ca qua Tool';

    if (!confirm(`Bạn có chắc chắn muốn BÀN GIAO ${selectedBoxes.length} TaskBox đã chọn cho người nhận ID: "${receiver}"?`)) return;

    const btnHandover = document.getElementById('sm-web-btn-handover');
    const btnReturn = document.getElementById('sm-web-btn-return');
    const progressBar = document.getElementById('sm-web-progress');
    const progressFill = document.getElementById('sm-web-progress-fill');
    const logBox = document.getElementById('sm-web-log-box');

    if (btnHandover) btnHandover.disabled = true;
    if (btnReturn) btnReturn.disabled = true;
    if (progressBar) progressBar.style.display = 'block';
    if (logBox) {
      logBox.style.display = 'block';
      logBox.innerHTML = '';
    }

    const log = (msg) => {
      if (!logBox) return;
      const p = document.createElement('div');
      p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logBox.appendChild(p);
      logBox.scrollTop = logBox.scrollHeight;
    };

    log(`🤝 Bắt đầu bàn giao ${selectedBoxes.length} TaskBox cho ${receiver}...`);
    let done = 0;
    let success = 0;
    let failed = 0;

    for (const b of selectedBoxes) {
      const boxId = b.id || b.box_id;
      done++;
      if (progressFill) progressFill.style.width = `${(done / selectedBoxes.length) * 100}%`;

      try {
        log(`Đang bàn giao box ${boxId} ("${b.title}")...`);
        const r = await fetch(`/api/boxes/${encodeURIComponent(boxId)}/handover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receiver: receiver,
            note: note
          })
        });
        const data = await r.json();
        if (r.ok) {
          log(`✅ Box ${boxId} đã bàn giao thành công cho ${receiver}!`);
          success++;
        } else {
          throw new Error(data.detail || data.error || 'Lỗi bàn giao');
        }
      } catch (e) {
        log(`❌ Box ${boxId} thất bại: ${e.message}`);
        failed++;
      }
      await new Promise(res => setTimeout(res, 100));
    }

    log(`🎉 HOÀN TẤT BÀN GIAO: ${success} thành công, ${failed} lỗi.`);
    if (btnHandover) btnHandover.disabled = false;
    if (btnReturn) btnReturn.disabled = false;

    await fetchWebBoxes();
  });

  // Batch Return Button
  document.getElementById('sm-web-btn-return')?.addEventListener('click', async () => {
    const selectedBoxes = filteredWebBoxes.filter(b => b.isSelected && b.status === 'collected');
    if (selectedBoxes.length === 0) {
      alert('Vui lòng chọn ít nhất 1 TaskBox ở trạng thái "collected" (Đang mượn) để Trả đồ!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn TRẢ ${selectedBoxes.length} TaskBox đã chọn?`)) return;

    const btnHandover = document.getElementById('sm-web-btn-handover');
    const btnReturn = document.getElementById('sm-web-btn-return');
    const progressBar = document.getElementById('sm-web-progress');
    const progressFill = document.getElementById('sm-web-progress-fill');
    const logBox = document.getElementById('sm-web-log-box');

    if (btnHandover) btnHandover.disabled = true;
    if (btnReturn) btnReturn.disabled = true;
    if (progressBar) progressBar.style.display = 'block';
    if (logBox) {
      logBox.style.display = 'block';
      logBox.innerHTML = '';
    }

    const log = (msg) => {
      if (!logBox) return;
      const p = document.createElement('div');
      p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logBox.appendChild(p);
      logBox.scrollTop = logBox.scrollHeight;
    };

    log(`↩️ Bắt đầu TRẢ ĐỒ (deactivated) cho ${selectedBoxes.length} TaskBox...`);
    let done = 0;
    let success = 0;
    let failed = 0;

    for (const b of selectedBoxes) {
      const boxId = b.id || b.box_id;
      const holder = b.current_holder || b.borrower || b.assignee || '';
      done++;
      if (progressFill) progressFill.style.width = `${(done / selectedBoxes.length) * 100}%`;

      try {
        log(`Đang trả box ${boxId} ("${b.title}")...`);
        const trResp = await fetch(`/api/boxes/${encodeURIComponent(boxId)}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'deactivated',
            returned_by: holder,
            note: 'Returned via Web Manager'
          })
        });
        const trData = await trResp.json();
        if (trResp.ok) {
          log(`✅ Box ${boxId} đã trả thành công!`);
          success++;
        } else {
          throw new Error(trData.detail || trData.error || 'Lỗi trả đồ');
        }
      } catch (e) {
        log(`❌ Box ${boxId} thất bại: ${e.message}`);
        failed++;
      }
      await new Promise(res => setTimeout(res, 100));
    }

    log(`🎉 HOÀN TẤT TRẢ ĐỒ: ${success} thành công, ${failed} lỗi.`);
    if (btnHandover) btnHandover.disabled = false;
    if (btnReturn) btnReturn.disabled = false;

    await fetchWebBoxes();
  });

  // Batch Borrow Button
  document.getElementById('sm-web-btn-borrow')?.addEventListener('click', async () => {
    const selectedBoxes = filteredWebBoxes.filter(b => b.isSelected && b.status === 'assigned');
    if (selectedBoxes.length === 0) {
      alert('Vui lòng chọn ít nhất 1 TaskBox ở trạng thái "assigned" (Đã gán) để Mượn đồ!');
      return;
    }

    if (!confirm(`Bạn có chắc chắn muốn MƯỢN ${selectedBoxes.length} TaskBox đã chọn?`)) return;

    const btnBorrow = document.getElementById('sm-web-btn-borrow');
    const progressBar = document.getElementById('sm-web-progress');
    const progressFill = document.getElementById('sm-web-progress-fill');
    const logBox = document.getElementById('sm-web-log-box');

    if (btnBorrow) btnBorrow.disabled = true;
    if (progressBar) progressBar.style.display = 'block';
    if (logBox) {
      logBox.style.display = 'block';
      logBox.innerHTML = '';
    }

    const log = (msg) => {
      if (!logBox) return;
      const p = document.createElement('div');
      p.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
      logBox.appendChild(p);
      logBox.scrollTop = logBox.scrollHeight;
    };

    log(`📦 Bắt đầu MƯỢN ĐỒ (collected) cho ${selectedBoxes.length} TaskBox...`);
    let done = 0;
    let success = 0;
    let failed = 0;

    for (const b of selectedBoxes) {
      const boxId = b.id || b.box_id;
      const assignee = b.assignee || b.current_holder || '';
      done++;
      if (progressFill) progressFill.style.width = `${(done / selectedBoxes.length) * 100}%`;

      try {
        log(`Đang mượn box ${boxId} ("${b.title}")...`);
        const trResp = await fetch(`/api/boxes/${encodeURIComponent(boxId)}/transition`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'collected',
            borrower: assignee,
            assignee: assignee,
            note: 'Borrowed via Web Manager'
          })
        });
        const trData = await trResp.json();
        if (trResp.ok) {
          log(`✅ Box ${boxId} đã mượn thành công!`);
          success++;
        } else {
          throw new Error(trData.detail || trData.error || 'Lỗi mượn đồ');
        }
      } catch (e) {
        log(`❌ Box ${boxId} thất bại: ${e.message}`);
        failed++;
      }
      await new Promise(res => setTimeout(res, 100));
    }

    log(`🎉 HOÀN TẤT MƯỢN ĐỒ: ${success} thành công, ${failed} lỗi.`);
    if (btnBorrow) btnBorrow.disabled = false;

    await fetchWebBoxes();
  });

  // Batch Print QR Button
  document.getElementById('sm-web-btn-print-qr')?.addEventListener('click', () => {
    const selectedBoxes = filteredWebBoxes.filter(b => b.isSelected);
    if (selectedBoxes.length === 0) {
      alert('Vui lòng chọn ít nhất 1 TaskBox để in mã QR!');
      return;
    }

    const qrItems = selectedBoxes.map(b => {
      const contents = b.contents || [];
      let mod = '-';
      let stage = '-';
      const mMatch = (b.title || '').match(/M\d+(?:-\d+)?/i);
      if (mMatch) mod = mMatch[0].toUpperCase();
      const sMatch = (b.title || '').match(/(?:A\d|B\d)/i);
      if (sMatch) stage = sMatch[0].toUpperCase();

      return {
        serverBoxId: b.id || b.box_id,
        serverCreatedAt: b.created_at,
        assignee: b.current_holder || b.borrower || b.assignee || '',
        tb: {
          title: b.title || 'TaskBox',
          module: mod,
          stage: stage,
          anchor_object_id: b.anchor_object_id || '',
          total_qty: contents.reduce((sum, c) => sum + (c.quantity || 1), 0),
          item_count: contents.length
        }
      };
    });

    openQRPrintWindow(qrItems);
  });

})();


