/* global React, ReactDOM, TetrisEngine */
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const E = TetrisEngine;

// ============================================================
// SAFETY: This app NEVER asks for, sends, or stores real seed phrases.
// All "tickets" are educational gameplay phrases.
// localStorage holds only player names + non-sensitive stats.
// ============================================================

const TARGET_ADDRESS = "bc1qgdjqv0av3q56jvd82tkdjpy7gdp9ut8tlqmgrpmv24sq90ecnvqqjwvw97";
const STORAGE_KEY = "btct_state_v1";

// ---------- helpers ----------
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveStats(p) {
  const s = loadStats();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...s, ...p }));
}

function fakeAddressFromWords(words) {
  // PROTOTYPE-ONLY: this is NOT a real BIP-39 -> address derivation.
  // A real derivation requires PBKDF2 + BIP32. We deterministically hash
  // the word list with SubtleCrypto and base58-ish encode for display only.
  // This is clearly labeled in the UI.
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(words.join(" ")))
    .then(buf => {
      const bytes = new Uint8Array(buf);
      const hex = [...bytes].map(b => b.toString(16).padStart(2,"0")).join("");
      return "bc1q" + hex.slice(0, 38);
    });
}

// ---------- Toast ----------
function ToastHost({ toasts }) {
  return (<div className="toast-wrap">{toasts.map(t => <div key={t.id} className="toast">{t.text}</div>)}</div>);
}

// ---------- Header ----------
function Header({ page, setPage }) {
  const links = ["Play", "How it works", "Safety", "Trust", "Privacy", "About"];
  return (
    <header className="header">
      <div className="brand">
        <div className="brand-logo">₿</div>
        <div>
          <h1>bitcointetris</h1>
          <div className="tag">play entropy. verify zero.</div>
        </div>
      </div>
      <nav className="nav">
        {links.map(l => (
          <button key={l} className={page === l ? "active" : ""} onClick={() => setPage(l)}>{l}</button>
        ))}
      </nav>
    </header>
  );
}

function SafetyStrip() {
  return (
    <div className="safety-strip">
      <span className="pill">🛡 Educational demo only</span>
      <span>Never enter your real seed phrase. Demo verification always reveals 0 BTC.</span>
      <span className="pill">Not gambling • Not financial advice</span>
    </div>
  );
}

// ---------- AdSlot ----------
function AdSlot({ position = "banner", format = "responsive", disabledDuringGameplay, gameStatus }) {
  // ADS: skeleton placeholder. Real Google AdSense code would mount here.
  // Ads are HIDDEN during active gameplay to avoid interrupting controls.
  if (disabledDuringGameplay && gameStatus === "playing") return null;
  const sizes = { banner: { h: 90 }, sidebar: { h: 250 }, post: { h: 120 }, article: { h: 150 }, footer: { h: 90 } };
  const h = sizes[position]?.h || 90;
  return (
    <div className="ad-slot" style={{ minHeight: h }}>
      <div className="ad-label">Advertisement</div>
      <div>Ad placeholder ({position}) — reserved for Google AdSense</div>
    </div>
  );
}

// ---------- Lobby ----------
function Lobby({ onEnter, stats }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <div className="row" style={{ flexWrap: "wrap", alignItems: "stretch" }}>
        <div className="panel" style={{ flex: "1 1 360px", textAlign: "center" }}>
          <div className="portal">
            <div className="ring"><div className="ring-inner">
              <div style={{ fontSize: 40 }}>🧱</div>
            </div></div>
            <h2 style={{ marginTop: 16, fontSize: 28 }}>Stack blocks. Learn Bitcoin.</h2>
            <p className="muted" style={{ maxWidth: 380, margin: "8px auto" }}>
              A Bitcoin probability arcade where every ticket teaches why Bitcoin is secure.
            </p>
            <button className="btn btn-btc" style={{ fontSize: 18, padding: "16px 28px" }} onClick={onEnter}>
              ▶ Enter Tetris Arena
            </button>
          </div>
        </div>
        <div className="col" style={{ flex: "1 1 320px" }}>
          <div className="panel">
            <h3 style={{ margin: "0 0 8px" }}>🏆 Weekly Leaderboard</h3>
            <div className="small muted">Resets every Monday 00:00 UTC</div>
            <ol style={{ paddingLeft: 20, marginTop: 8 }}>
              {["satoshi_kid","entropy_ace","verify_queen","blockstacker","0btc_legend"].map((n,i) => (
                <li key={n} style={{ padding: "4px 0", fontWeight: 700 }}>
                  {n} <span className="muted small">— {(15000 - i * 1800).toLocaleString()} pts</span>
                </li>
              ))}
            </ol>
            <div className="small muted" style={{ marginTop: 8 }}>👑 Top player chooses next week's target address.</div>
          </div>
          <div className="panel">
            <h3 style={{ margin: "0 0 8px" }}>🎯 Weekly Public Target</h3>
            <code style={{ fontSize: 11, wordBreak: "break-all" }}>{TARGET_ADDRESS}</code>
            <div className="small muted" style={{ marginTop: 6 }}>Tickets are compared locally. No funds, no API calls.</div>
          </div>
          <div className="panel">
            <h3 style={{ margin: "0 0 8px" }}>📅 Daily Challenge</h3>
            <div className="small">12-word mode • Difficulty 6 • Verify 5 tickets</div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <AdSlot position="banner" />
      </div>
    </div>
  );
}

// ---------- Setup ----------
function Setup({ onStart, stats }) {
  const [name, setName] = useState(stats.lastName || "");
  const [mode, setMode] = useState("12");
  const [selected, setSelected] = useState(new Set());

  const allWords = window.BIP39_4LETTER;
  const pool = useMemo(() => {
    if (selected.size === 0) return allWords;
    return allWords.filter(w => selected.has(w[0]));
  }, [selected, allWords]);

  // letters that have at least one 4-letter word
  const validLetters = useMemo(() => {
    const s = new Set();
    allWords.forEach(w => s.add(w[0]));
    return s;
  }, [allWords]);

  const nameTaken = (stats.players || []).includes(name) && name !== stats.lastName;
  const validName = /^[A-Za-z0-9_-]{1,20}$/.test(name) && !nameTaken;

  const startDisabled = !validName || pool.length === 0;

  const toggle = (l) => {
    if (!validLetters.has(l)) return;
    const s = new Set(selected);
    if (s.has(l)) s.delete(l); else s.add(l);
    setSelected(s);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <div className="row" style={{ flexWrap: "wrap" }}>
        <div className="panel col" style={{ flex: "1 1 360px" }}>
          <h2 style={{ margin: 0 }}>👤 Player Setup</h2>
          <label style={{ fontWeight: 800 }}>Player name</label>
          <input value={name} onChange={e => setName(e.target.value.slice(0, 20))}
            placeholder="satoshi_kid"
            style={{ padding: 10, border: "3px solid var(--ink)", borderRadius: 10, fontSize: 16, fontWeight: 700 }} />
          {nameTaken && <div style={{ color: "#c0392b", fontSize: 12 }}>This player name is already taken.</div>}
          {!validName && name && !nameTaken && <div style={{ color: "#c0392b", fontSize: 12 }}>Letters, numbers, _ and - only (max 20).</div>}

          <label style={{ fontWeight: 800, marginTop: 8 }}>Seed phrase mode</label>
          <div className="row">
            {["12","24","random"].map(m => (
              <button key={m} className={"btn btn-sm " + (mode === m ? "btn-btc" : "")}
                onClick={() => setMode(m)}>{m === "random" ? "🎲 Random" : `${m} words`}</button>
            ))}
          </div>

          <div className="panel-soft">
            <strong>🎒 Avatar</strong>
            <div className="row" style={{ alignItems: "center", marginTop: 8 }}>
              <div className="avatar" />
              <div className="small muted">Your blocky alter-ego. <br/>No login required.</div>
            </div>
          </div>
        </div>

        <div className="panel col" style={{ flex: "2 1 500px" }}>
          <h2 style={{ margin: 0 }}>🔤 Choose BIP-39 Word Categories</h2>
          <div className="small muted">Categories control which 4-letter BIP-39 words appear in the arena. Each falling piece carries one 4-letter word.</div>
          <div className="cube-grid">
            {ALPHABET.map(l => (
              <div key={l}
                className={"cube " + (selected.has(l) ? "selected " : "") + (!validLetters.has(l) ? "disabled" : "")}
                onClick={() => toggle(l)} title={validLetters.has(l) ? `Words starting with ${l.toUpperCase()}` : "No 4-letter BIP-39 words"}>
                {l.toUpperCase()}
              </div>
            ))}
          </div>
          <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
            <div className="small">
              {selected.size === 0 ? <span>No categories selected — <strong>Full alphabet mode</strong></span>
                : <span>Selected: <strong>{[...selected].join(", ").toUpperCase()}</strong></span>}
            </div>
            <div className="small muted">Pool size: <strong>{pool.length}</strong> words</div>
          </div>
          {pool.length > 0 && pool.length < 8 && <div className="small" style={{ color: "#c0392b" }}>This category has very few 4-letter BIP-39 words. Add more for better gameplay.</div>}
          {pool.length === 0 && <div className="small" style={{ color: "#c0392b" }}>No 4-letter BIP-39 words found for this selection.</div>}
        </div>

        <div className="panel col" style={{ flex: "1 1 240px", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>🍯 Entropy Jar</h3>
          <div className={"jar " + (selected.size > 0 ? "" : "")}>
            <div className="liquid" style={{ height: `${Math.min(90, selected.size * 4)}%` }} />
            <div className="letters">
              {[...selected].map(l => <div key={l} className="lblock">{l.toUpperCase()}</div>)}
            </div>
          </div>
          <div className="small muted" style={{ textAlign: "center" }}>Selected categories drop into the entropy jar.</div>
          <button className="btn btn-btc" disabled={startDisabled}
            onClick={() => onStart({ name, mode, selected: [...selected], pool })}>
            🚀 Start Round
          </button>
          <button className="btn btn-sm" onClick={() => { setSelected(new Set()); }}>Reset</button>
        </div>
      </div>
      <div style={{ marginTop: 16 }}><AdSlot position="banner" /></div>
    </div>
  );
}

window.SetupModule = { Setup, Lobby, Header, SafetyStrip, AdSlot, ToastHost, fakeAddressFromWords, TARGET_ADDRESS, ALPHABET, loadStats, saveStats };
