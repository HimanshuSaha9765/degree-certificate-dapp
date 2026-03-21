// ================================================================
//  audit-log.js — Activity Logging System
//  Stores all actions in localStorage per wallet + role
// ================================================================

const AuditLog = {
  MAX_ENTRIES: 50, // Max log entries per user

  // ──────────────────────────────────────────
  //  BUILD STORAGE KEY
  //  Key format: "auditlog_issuer_0x1234" or "auditlog_verifier_0x1234"
  // ──────────────────────────────────────────
  _getKey(role, wallet) {
    const w = wallet || WalletManager.currentAccount || "unknown";
    return `auditlog_${role}_${w.toLowerCase()}`;
  },

  // ──────────────────────────────────────────
  //  ADD LOG ENTRY
  // ──────────────────────────────────────────
  add(role, action, data = {}) {
    const key = this._getKey(role);
    const logs = this.getAll(role);

    const entry = {
      id: Date.now(),
      action, // "issued" | "revoked" | "verified"
      data,
      timestamp: new Date().toISOString(),
      wallet: WalletManager.currentAccount || "unknown",
    };

    logs.unshift(entry); // newest first

    // Keep only last MAX_ENTRIES
    const trimmed = logs.slice(0, this.MAX_ENTRIES);
    localStorage.setItem(key, JSON.stringify(trimmed));

    return entry;
  },

  // ──────────────────────────────────────────
  //  GET ALL LOGS FOR ROLE
  // ──────────────────────────────────────────
  getAll(role, wallet) {
    const key = this._getKey(role, wallet);
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  },

  // ──────────────────────────────────────────
  //  GET RECENT LOGS (last N entries)
  // ──────────────────────────────────────────
  getRecent(role, count = 10) {
    return this.getAll(role).slice(0, count);
  },

  // ──────────────────────────────────────────
  //  CLEAR LOGS
  // ──────────────────────────────────────────
  clear(role) {
    const key = this._getKey(role);
    localStorage.removeItem(key);
  },

  // ──────────────────────────────────────────
  //  FORMAT LOG ENTRY FOR DISPLAY
  // ──────────────────────────────────────────
  formatEntry(entry) {
    const time = new Date(entry.timestamp).toLocaleString();
    const icons = {
      issued: "📜",
      revoked: "🚫",
      verified: "🔍",
    };
    const icon = icons[entry.action] || "📋";

    let detail = "";
    if (entry.data.certId) detail += ` — ID: ${entry.data.certId}`;
    if (entry.data.studentName) detail += ` (${entry.data.studentName})`;
    if (entry.data.txHash)
      detail += ` <a href="https://sepolia.etherscan.io/tx/${entry.data.txHash}" 
                                             target="_blank" 
                                             style="color:#3b82f6;font-size:11px">
                                             View TX ↗</a>`;
    return `${icon} <strong>${entry.action.toUpperCase()}</strong>${detail} 
            <span style="color:#9ca3af;font-size:11px;float:right">${time}</span>`;
  },

  // ──────────────────────────────────────────
  //  RENDER LOG INTO HTML ELEMENT
  // ──────────────────────────────────────────
  renderTo(elementId, role, count = 10) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const logs = this.getRecent(role, count);

    if (logs.length === 0) {
      el.innerHTML = `<p style="color:#9ca3af;text-align:center;padding:20px">
                        No activity yet</p>`;
      return;
    }

    el.innerHTML = logs
      .map(
        (entry) => `
      <div style="
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
        font-size: 13px;
        line-height: 1.6;
      ">
        ${this.formatEntry(entry)}
      </div>
    `,
      )
      .join("");
  },

  // ──────────────────────────────────────────
  //  SEARCH HISTORY (for public + verifier)
  // ──────────────────────────────────────────
  addSearch(certId) {
    const key = "search_history";
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      history = [];
    }

    // Remove duplicate
    history = history.filter((id) => id !== certId);
    history.unshift(certId);

    // Keep last 5
    localStorage.setItem(key, JSON.stringify(history.slice(0, 5)));
  },

  getSearchHistory() {
    try {
      return JSON.parse(localStorage.getItem("search_history")) || [];
    } catch {
      return [];
    }
  },

  clearSearchHistory() {
    localStorage.removeItem("search_history");
  },
};
