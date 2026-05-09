/* global React, ReactDOM, TetrisEngine, SetupModule */
const { useState, useEffect, useRef, useCallback, useMemo } = React;
const E = TetrisEngine;
const { Header, SafetyStrip, AdSlot, ToastHost, Lobby, Setup, fakeAddressFromWords, TARGET_ADDRESS, loadStats, saveStats } = SetupModule;

// ============================================================
// bitcointetris — Game / Verify / Trust pages
// SAFETY: Tickets are educational gameplay phrases (not real BIP-39 mnemonics).
// We never derive real keys, never call Math.random for secret material,
// never store mnemonic data, never send seeds anywhere.
// ============================================================

// ---------- Game Arena ----------
function Arena({ config, onGameOver, gameStatus, setGameStatus, pushToast }) {
  const [board, setBoard] = useState(E.emptyBoard());
  const [piece, setPiece] = useState(() => E.spawnPiece(config.pool));
  const [next, setNext] = useState(() => E.spawnPiece(config.pool));
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState(4);
  const [collectedWords, setCollectedWords] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [flashRows, setFlashRows] = useState([]);

  const wordsPerTicket = config.resolvedMode === "12" ? 12 : 24;
  const ticketsCount = tickets.length;

  // ----- piece movement -----
  const tryMove = useCallback((dx, dy, newShape) => {
    setPiece(p => {
      const np = { ...p, c: p.c + dx, r: p.r + dy, shape: newShape || p.shape };
      if (E.collides(board, np)) return p;
      return np;
    });
  }, [board]);

  const rotate = useCallback(() => {
    setPiece(p => {
      const np = { ...p, shape: E.rotateShape(p.shape) };
      // wall kicks
      for (const dx of [0, -1, 1, -2, 2]) {
        const test = { ...np, c: np.c + dx };
        if (!E.collides(board, test)) return test;
      }
      return p;
    });
  }, [board]);

  const lockAndAdvance = useCallback((p) => {
    const newBoard = E.lockPiece(board, p);
    const { board: cleared, cleared: nLines, collectedWords: gotWords } = E.clearLines(newBoard);
    if (nLines > 0) {
      const rowsCleared = [];
      for (let r = 0; r < E.ROWS; r++) if (newBoard[r].every(c => c)) rowsCleared.push(r);
      setFlashRows(rowsCleared);
      setTimeout(() => setFlashRows([]), 350);
    }
    setBoard(cleared);
    if (nLines > 0) {
      setLines(l => {
        const nl = l + nLines;
        setLevel(Math.floor(nl / 10) + 1);
        return nl;
      });
      setScore(s => s + E.scoreFor(nLines, level));
    }
    if (gotWords.length > 0) {
      setCollectedWords(prev => {
        const updated = [...prev, ...gotWords];
        // create tickets
        while (updated.length >= wordsPerTicket * (tickets.length + 1)) {
          // handled below by recompute
          break;
        }
        return updated;
      });
      gotWords.forEach(w => pushToast(`Word collected: ${w.toUpperCase()}`));
    }
    // spawn next
    const newPiece = { ...next, r: -1, c: Math.floor(E.COLS/2) - Math.ceil(next.shape[0].length/2) };
    if (E.collides(cleared, newPiece)) {
      setGameStatus("gameOver");
      onGameOver({ reason: "blocks", score, lines, tickets, collectedWords: collectedWords.concat(gotWords) });
      return;
    }
    setPiece(newPiece);
    setNext(E.spawnPiece(config.pool));
  }, [board, level, next, config.pool, score, lines, tickets, collectedWords, wordsPerTicket, onGameOver, pushToast, setGameStatus]);

  // ticket creation when collectedWords reaches multiples
  useEffect(() => {
    const completedTickets = Math.floor(collectedWords.length / wordsPerTicket);
    if (completedTickets > tickets.length) {
      const newTicketWords = collectedWords.slice(tickets.length * wordsPerTicket, completedTickets * wordsPerTicket);
      const newTicket = {
        id: crypto.randomUUID(),
        number: tickets.length + 1,
        mode: config.resolvedMode,
        words: newTicketWords,
        score,
        verified: false,
        // SAFETY: NOT a real BIP-39 mnemonic — collected gameplay words don't carry a checksum.
        validBip39: false,
      };
      setTickets(t => [...t, newTicket]);
      pushToast(`🎟 ${wordsPerTicket}-word ticket completed!`);
    }
  }, [collectedWords, wordsPerTicket, tickets.length, config.resolvedMode, score, pushToast]);

  const softDrop = useCallback(() => {
    setPiece(p => {
      const np = { ...p, r: p.r + 1 };
      if (E.collides(board, np)) {
        // lock
        setTimeout(() => lockAndAdvance(p), 0);
        return p;
      }
      setScore(s => s + 1);
      return np;
    });
  }, [board, lockAndAdvance]);

  const hardDrop = useCallback(() => {
    setPiece(p => {
      let test = p;
      let dist = 0;
      while (!E.collides(board, { ...test, r: test.r + 1 })) {
        test = { ...test, r: test.r + 1 }; dist++;
      }
      setScore(s => s + dist * 2);
      setTimeout(() => lockAndAdvance(test), 0);
      return test;
    });
  }, [board, lockAndAdvance]);

  // ----- gravity loop -----
  useEffect(() => {
    if (gameStatus !== "playing") return;
    const speed = Math.max(80, 700 - difficulty * 60 - (level - 1) * 30);
    const id = setInterval(() => softDrop(), speed);
    return () => clearInterval(id);
  }, [gameStatus, difficulty, level, softDrop]);

  // ----- keyboard -----
  useEffect(() => {
    if (gameStatus !== "playing") return;
    const handle = (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); tryMove(-1, 0); }
      else if (e.key === "ArrowRight") { e.preventDefault(); tryMove(1, 0); }
      else if (e.key === "ArrowDown") { e.preventDefault(); softDrop(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); rotate(); }
      else if (e.key === " ") { e.preventDefault(); hardDrop(); }
      else if (e.key === "p" || e.key === "P") { setGameStatus(g => g === "playing" ? "paused" : "playing"); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [gameStatus, tryMove, rotate, softDrop, hardDrop, setGameStatus]);

  // ----- render board with current piece overlay -----
  const renderCells = useMemo(() => {
    const view = board.map(r => [...r]);
    for (const cell of E.getCells(piece)) {
      if (cell.r >= 0 && cell.r < E.ROWS && cell.c >= 0 && cell.c < E.COLS) {
        view[cell.r][cell.c] = {
          color: piece.color,
          letter: piece.letters[cell.letterIdx],
          word: piece.word,
          pieceId: piece.pieceId,
          live: true,
        };
      }
    }
    return view;
  }, [board, piece]);

  const onHTP = () => {
    // High Time Preference — end immediately
    let finalTickets = tickets;
    if (tickets.length === 0) {
      // generate one emergency ticket from random 4-letter words
      const words = Array.from({length: wordsPerTicket}, () => {
        const arr = new Uint32Array(1); crypto.getRandomValues(arr);
        return config.pool[arr[0] % config.pool.length];
      });
      finalTickets = [{
        id: crypto.randomUUID(), number: 1, mode: config.resolvedMode,
        words, score, verified: false, validBip39: false, emergency: true,
      }];
      pushToast("🛑 High time preference — 1 emergency ticket generated");
    } else {
      pushToast("🛑 High time preference — keeping your tickets");
    }
    setGameStatus("gameOver");
    onGameOver({ reason: "htp", score, lines, tickets: finalTickets, collectedWords });
  };

  return (
    <div className="arena">
      {/* LEFT: word bank + categories */}
      <div className="col">
        <div className="panel-soft">
          <strong>📚 Word Bank</strong>
          <div className="small muted">Mode: <strong>{config.resolvedMode}-word</strong> tickets</div>
          <div style={{ marginTop: 8 }}>
            <div className="small">Progress: {collectedWords.length % wordsPerTicket} / {wordsPerTicket}</div>
            <div style={{ background: "#eee", height: 8, borderRadius: 4, overflow: "hidden", marginTop: 4 }}>
              <div style={{ width: `${(collectedWords.length % wordsPerTicket) / wordsPerTicket * 100}%`, height: "100%", background: "var(--btc)" }} />
            </div>
            <div className="small" style={{ marginTop: 6 }}>🎟 Tickets: <strong>{tickets.length}</strong></div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8, maxHeight: 180, overflow: "auto" }}>
            {collectedWords.slice(-30).map((w, i) => (
              <span key={i} className="word-chip"><span className="num">{collectedWords.length - 30 + i + 1 > 0 ? collectedWords.length - 30 + i + 1 : i + 1}</span>{w}</span>
            ))}
          </div>
        </div>
        <div className="panel-soft">
          <strong>🎮 Controls</strong>
          <div className="small muted" style={{ marginTop: 4 }}>
            <div><span className="kbd">←</span> <span className="kbd">→</span> move</div>
            <div><span className="kbd">↑</span> rotate</div>
            <div><span className="kbd">↓</span> soft drop</div>
            <div><span className="kbd">Space</span> hard drop</div>
            <div><span className="kbd">P</span> pause</div>
          </div>
        </div>
      </div>

      {/* CENTER: Board */}
      <div className="center">
        <div className="row" style={{ width: "100%", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div className="small"><strong>{config.name}</strong></div>
          <div className="small">Score <strong>{score.toLocaleString()}</strong> · Lines <strong>{lines}</strong> · Lvl <strong>{level}</strong></div>
          <button className="btn btn-sm" onClick={() => setGameStatus(g => g === "playing" ? "paused" : "playing")}>
            {gameStatus === "paused" ? "▶ Resume" : "⏸ Pause"}
          </button>
        </div>
        <div className="board-wrap">
          <div className="board">
            {renderCells.flatMap((row, r) => row.map((cell, c) => (
              <div key={`${r}-${c}`}
                className={"cell " + (cell ? "filled " : "") + (flashRows.includes(r) ? "flash" : "")}
                style={cell ? { "--c": cell.color } : {}}>
                {cell?.letter?.toUpperCase()}
              </div>
            )))}
          </div>
          {gameStatus === "paused" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", display: "grid", placeItems: "center", borderRadius: 14, color: "white", fontSize: 32, fontWeight: 900 }}>
              PAUSED
            </div>
          )}
        </div>
        <button className="btn btn-danger" onClick={onHTP} title="End now. Keep what you collected.">
          🛑 High Time Preference
        </button>
      </div>

      {/* RIGHT: Next + difficulty + safety */}
      <div className="col">
        <div className="panel-soft">
          <strong>⏭ Next Word</strong>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <NextPreview piece={next} />
            <div>
              <div className="small">Current</div>
              <div style={{ fontFamily: "ui-monospace", fontWeight: 900, fontSize: 18 }}>{piece.word.toUpperCase()}</div>
              <div className="small" style={{ marginTop: 4 }}>Next</div>
              <div style={{ fontFamily: "ui-monospace", fontWeight: 900, fontSize: 14 }}>{next.word.toUpperCase()}</div>
            </div>
          </div>
        </div>
        <div className="panel-soft">
          <strong>⚡ Falling Speed</strong>
          <input type="range" min="1" max="10" value={difficulty} onChange={e => setDifficulty(+e.target.value)} style={{ width: "100%" }} />
          <div className="small">Difficulty: <strong>{difficulty}</strong></div>
        </div>
        <div className="panel-soft">
          <strong>🛡 Trust</strong>
          <div className="trust-row" style={{ marginTop: 6 }}>
            <span className="trust-pill">No real seed input</span>
            <span className="trust-pill">No seed storage</span>
            <span className="trust-pill">Local-first</span>
          </div>
        </div>
        {/* Mobile controls */}
        <div className="mobile-controls" style={{ display: "none" }} id="mobile-ctrls">
          <button className="mc-btn" onTouchStart={() => tryMove(-1,0)}>◀</button>
          <button className="mc-btn" onTouchStart={() => tryMove(1,0)}>▶</button>
          <button className="mc-btn" onTouchStart={() => rotate()}>↻</button>
          <button className="mc-btn" onTouchStart={() => softDrop()}>▼</button>
          <button className="mc-btn" onTouchStart={() => hardDrop()} style={{ gridColumn: "1 / span 2" }}>⬇⬇ Drop</button>
        </div>
      </div>
    </div>
  );
}

function NextPreview({ piece }) {
  const grid = Array.from({length: 4}, () => Array(4).fill(null));
  for (const cell of E.getCells({ ...piece, r: 0, c: 0 })) {
    grid[cell.localR][cell.localC] = { color: piece.color, letter: piece.letters[cell.letterIdx] };
  }
  return (
    <div className="mini-board" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
      {grid.flat().map((c, i) => (
        <div key={i} className={"mini-cell " + (c ? "filled" : "")} style={c ? { "--c": c.color } : {}} />
      ))}
    </div>
  );
}

// ---------- Game Over + Verify ----------
function GameOverScreen({ result, onPlayAgain, onNewPlayer, onVerify }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div className="panel" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 40, margin: 0 }}>Game Over</h1>
        <div className="muted" style={{ marginBottom: 12 }}>
          {result.reason === "htp" ? "High time preference activated." : "Blocks reached the top."}
        </div>
        <div className="row" style={{ justifyContent: "center", flexWrap: "wrap", gap: 24 }}>
          <Stat label="Final Score" value={result.score.toLocaleString()} />
          <Stat label="Lines Cleared" value={result.lines} />
          <Stat label="Tickets" value={result.tickets.length} />
          <Stat label="Words Collected" value={result.collectedWords.length} />
        </div>
        <p className="muted" style={{ maxWidth: 500, margin: "16px auto" }}>
          Now verify your tickets and see why random guessing returns <strong>0 BTC</strong>.
        </p>
        <div className="row" style={{ justifyContent: "center", flexWrap: "wrap" }}>
          <button className="btn btn-btc" onClick={onVerify}>🔍 Enter Verify Mode</button>
          <button className="btn" onClick={onPlayAgain}>🔁 Play Again</button>
          <button className="btn" onClick={onNewPlayer}>👤 New Player</button>
        </div>
      </div>
      <div style={{ marginTop: 16 }}><AdSlot position="post" /></div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="small muted">{label}</div>
      <div style={{ fontSize: 32, fontWeight: 900 }}>{value}</div>
    </div>
  );
}

function VerifyMode({ result, onShare, onPlayAgain }) {
  const [tickets, setTickets] = useState(result.tickets);

  const verifyTicket = async (id) => {
    const t = tickets.find(x => x.id === id);
    const addr = await fakeAddressFromWords(t.words);
    setTickets(ts => ts.map(x => x.id === id ? { ...x, verified: true, generatedAddress: addr, balance: 0, match: false } : x));
    // analytics: ticket_verified (NEVER includes mnemonic words)
  };

  const verifyAll = async () => {
    for (const t of tickets) if (!t.verified) await verifyTicket(t.id);
  };

  const allVerified = tickets.length > 0 && tickets.every(t => t.verified);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 16 }}>
      <div className="panel">
        <h2 style={{ margin: "0 0 4px" }}>🔍 Verify Mode</h2>
        <div className="small muted">
          Compare your gameplay tickets locally against the weekly public target address. Demo verification — always returns 0 BTC.
        </div>
        <div className="row" style={{ marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span className="trust-pill">Local-first</span>
          <span className="trust-pill">No mnemonic sent</span>
          <span className="trust-pill">No keys derived</span>
          <button className="btn btn-sm btn-btc" onClick={verifyAll}>Verify All</button>
          {allVerified && <button className="btn btn-sm btn-mint" onClick={onShare}>📤 Share Result</button>}
          <button className="btn btn-sm" onClick={onPlayAgain}>🔁 Play Again</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12, marginTop: 16 }}>
        {tickets.length === 0 && <div className="panel">No tickets collected. Try again!</div>}
        {tickets.map(t => <TicketCard key={t.id} ticket={t} onVerify={() => verifyTicket(t.id)} />)}
      </div>

      {allVerified && (
        <div className="panel" style={{ marginTop: 16, textAlign: "center" }}>
          <div className="stamp">VERIFIED ZERO</div>
          <h3 style={{ margin: "12px 0 4px" }}>0 BTC, as expected.</h3>
          <p className="muted">Bitcoin is secure because random guessing fails. You joined the <strong>0 BTC Club</strong>.</p>
        </div>
      )}
      <div style={{ marginTop: 16 }}><AdSlot position="article" /></div>
    </div>
  );
}

function TicketCard({ ticket, onVerify }) {
  return (
    <div className={"ticket " + (ticket.verified ? "verified" : "")}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <strong>BIP-39 Ticket #{String(ticket.number).padStart(3, "0")}</strong>
        <span className="small muted">{ticket.mode}-word {ticket.emergency && "· emergency"}</span>
      </div>
      <div className="barcode" />
      <div className="small muted" style={{ marginBottom: 6 }}>Educational gameplay phrase — checksum not validated</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, marginBottom: 8 }}>
        {ticket.words.map((w, i) => (
          <div key={i} className="word-chip" style={{ justifyContent: "flex-start" }}>
            <span className="num">{String(i+1).padStart(2,"0")}</span>{w}
          </div>
        ))}
      </div>
      {!ticket.verified ? (
        <div className="reveal" onClick={onVerify}>🪙 don't trust, verify</div>
      ) : (
        <div className="panel-soft" style={{ background: "rgba(123,228,149,.2)" }}>
          <div className="small">Generated address (demo):</div>
          <code style={{ fontSize: 10, wordBreak: "break-all" }}>{ticket.generatedAddress}</code>
          <div className="small" style={{ marginTop: 6 }}>Target match: <strong>NO</strong></div>
          <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>Verified balance: 0 BTC ✓</div>
          <div className="small muted">0 BTC, as expected.</div>
        </div>
      )}
      <div className="small muted" style={{ marginTop: 6 }}>⚠ Demo phrase. Never use for real funds.</div>
    </div>
  );
}

// ---------- Share Card ----------
function ShareCard({ result, onClose }) {
  const text = `I played bitcointetris, scored ${result.score.toLocaleString()}, collected ${result.tickets.length} BIP-39 tickets, and verified 0 BTC — exactly as expected. Random guessing got cooked. play entropy. verify zero.`;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "grid", placeItems: "center", zIndex: 100, padding: 16 }}>
      <div className="panel" style={{ maxWidth: 480, width: "100%" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>📤 Share Result</h3>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="panel-soft" style={{ background: "linear-gradient(135deg, var(--btc2), var(--pink))", color: "white", marginTop: 12 }}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>bitcointetris</div>
          <div className="small">play entropy. verify zero.</div>
          <div className="row" style={{ marginTop: 12, alignItems: "center" }}>
            <div className="avatar" style={{ width: 64, height: 64 }} />
            <div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>{result.name || "player"}</div>
              <div className="small">Score {result.score.toLocaleString()} · {result.lines} lines · {result.tickets.length} tickets</div>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 12, background: "rgba(0,0,0,.3)", borderRadius: 8, textAlign: "center" }}>
            <div className="stamp" style={{ borderColor: "white", color: "white" }}>0 BTC CLUB</div>
            <div style={{ fontWeight: 900, marginTop: 4 }}>0 BTC, as expected.</div>
          </div>
        </div>
        <div className="row" style={{ marginTop: 12, flexWrap: "wrap" }}>
          <button className="btn btn-sm" onClick={() => { navigator.clipboard.writeText(text); }}>📋 Copy</button>
          <a className="btn btn-sm btn-sky" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`} target="_blank">𝕏 Share</a>
          <a className="btn btn-sm" href={`https://reddit.com/submit?title=${encodeURIComponent("bitcointetris result")}&text=${encodeURIComponent(text)}`} target="_blank">Reddit</a>
          <a className="btn btn-sm btn-mint" href={`https://t.me/share/url?url=${encodeURIComponent("https://bitcointetris.app")}&text=${encodeURIComponent(text)}`} target="_blank">Telegram</a>
        </div>
      </div>
    </div>
  );
}

// ---------- Static / Trust pages ----------
function StaticPage({ page }) {
  const content = {
    "How it works": {
      title: "How bitcointetris Works",
      body: [
        ["What is BIP-39?", "BIP-39 is a Bitcoin standard. It defines a 2048-word English wordlist. A 12 or 24-word phrase represents random entropy plus a small checksum. Generating a valid phrase requires cryptographically secure randomness."],
        ["Why is finding BTC basically impossible?", "The number of valid Bitcoin addresses is astronomically larger than the number of seconds since the Big Bang multiplied by every grain of sand on Earth. Random guessing always fails. That's why Bitcoin self-custody is secure when you protect your seed."],
        ["What does 'don't trust, verify' mean?", "Bitcoin culture: never trust claims about a transaction or balance. Verify it yourself. In bitcointetris you verify locally — every demo verification returns 0 BTC, exactly as expected."],
        ["Are these real seed phrases?", "No. Collected gameplay words don't carry a valid BIP-39 checksum, so they are NOT real seed phrases. They are educational gameplay tickets."],
      ],
    },
    "Safety": {
      title: "Seed Phrase Safety",
      body: [
        ["Never paste your real seed phrase", "Not into bitcointetris, not into any website, not into any chat or app. Anyone with your seed has full control of your funds."],
        ["Don't use demo phrases for real funds", "Gameplay tickets are educational. Never load them into a real wallet."],
        ["Refreshing erases tickets", "We keep tickets in memory only. Refresh = gone. That's intentional."],
        ["Why we don't store seeds", "We don't ever want to. Even by accident. Real wallets store seeds locally on a device under user control — not in a website's database."],
      ],
    },
    "Trust": {
      title: "Trust Center",
      body: [
        ["What this app does", "Generates educational gameplay BIP-39 word tickets, lets you play a Tetris-inspired arcade, and demonstrates that random guesses always verify to 0 BTC."],
        ["What this app does NOT do", "It does not ask for your real seed. It does not store seeds. It does not send seeds to a server. It does not check real wallet balances. It does not award real BTC."],
        ["Verification model", "Tickets are compared locally against a public target address. The result is always 0 BTC."],
        ["Open & auditable", "Code comments mark every place where seed safety, ad rules, and analytics constraints apply."],
      ],
    },
    "Privacy": {
      title: "Privacy Policy",
      body: [
        ["No account required", "You play anonymously. No login, no email."],
        ["Local data only", "We store your player name and non-sensitive stats in your browser's localStorage. You can clear it anytime."],
        ["No mnemonic ever leaves your device", "Tickets live in memory only. We never log, store, or transmit them."],
        ["Ads", "Future versions may show Google AdSense. Ads can use cookies per Google's policies. Ads never see secret data."],
      ],
    },
    "About": {
      title: "About bitcointetris",
      body: [
        ["What is it?", "A playful Bitcoin probability arcade that teaches BIP-39, entropy, and self-custody safety through Tetris-inspired gameplay."],
        ["Why?", "Most people learn about Bitcoin from scams and hype. We wanted a fun way to internalize 'don't trust, verify' and to feel why random guessing always fails."],
        ["Not financial advice", "Not gambling. Not a money-making tool. Just a game that happens to teach you something true."],
      ],
    },
  }[page];
  if (!content) return null;
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>{content.title}</h1>
        {content.body.map(([h, p], i) => (
          <div key={i} style={{ marginBottom: 16 }}>
            <h3 style={{ marginBottom: 4 }}>{h}</h3>
            <p style={{ margin: 0 }} className="muted">{p}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}><AdSlot position="article" /></div>
    </div>
  );
}

function Footer({ stats }) {
  return (
    <footer className="foot">
      <div className="row" style={{ justifyContent: "center", flexWrap: "wrap", gap: 24 }}>
        <div><strong>{(stats.verifies || 0).toLocaleString()}</strong><div className="small muted">Total demo verifies</div></div>
        <div><strong>0 BTC</strong><div className="small muted">Total BTC found</div></div>
        <div><strong>{(stats.games || 0).toLocaleString()}</strong><div className="small muted">Games played</div></div>
      </div>
      <div className="small muted" style={{ marginTop: 12 }}>Local demo stats only · Not gambling · Not financial advice</div>
      <div style={{ marginTop: 16 }}><AdSlot position="footer" /></div>
      <div className="small muted" style={{ marginTop: 16 }}>© bitcointetris — educational demo. Bitcoin is a public protocol; this app is not affiliated with any company.</div>
    </footer>
  );
}

// ---------- Root App ----------
function App() {
  const [page, setPage] = useState("Play");
  const [phase, setPhase] = useState("lobby"); // lobby | setup | playing | gameOver | verify
  const [config, setConfig] = useState(null);
  const [gameStatus, setGameStatus] = useState("setup");
  const [result, setResult] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [stats, setStats] = useState(loadStats());
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((text) => {
    const id = Math.random();
    setToasts(t => [...t, { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2200);
  }, []);

  const onStart = (cfg) => {
    const resolvedMode = cfg.mode === "random" ? (Math.random() < 0.5 ? "12" : "24") : cfg.mode;
    pushToast(`This round: ${resolvedMode}-word mode`);
    setConfig({ ...cfg, resolvedMode });
    setGameStatus("playing");
    setPhase("playing");
    saveStats({
      lastName: cfg.name,
      players: [...new Set([...(stats.players || []), cfg.name])],
      games: (stats.games || 0) + 1,
    });
    setStats(loadStats());
  };

  const onGameOver = (r) => {
    setResult({ ...r, name: config.name });
    setPhase("gameOver");
    setGameStatus("gameOver");
  };

  const onPlayAgain = () => { setPhase("setup"); setGameStatus("setup"); setResult(null); };
  const onNewPlayer = () => { setPhase("setup"); setGameStatus("setup"); setResult(null); };

  // Page nav: if user clicks nav while playing, just show static page (game state preserved)
  const showStatic = page !== "Play";

  return (
    <div>
      <Header page={page} setPage={setPage} />
      <SafetyStrip />
      {showStatic ? (
        <StaticPage page={page} />
      ) : (
        <>
          {phase === "lobby" && <Lobby onEnter={() => setPhase("setup")} stats={stats} />}
          {phase === "setup" && <Setup onStart={onStart} stats={stats} />}
          {(phase === "playing" || gameStatus === "paused") && config && (
            <Arena config={config} onGameOver={onGameOver}
              gameStatus={gameStatus} setGameStatus={setGameStatus} pushToast={pushToast} />
          )}
          {phase === "gameOver" && result && (
            <GameOverScreen result={result}
              onPlayAgain={onPlayAgain} onNewPlayer={onNewPlayer}
              onVerify={() => setPhase("verify")} />
          )}
          {phase === "verify" && result && (
            <VerifyMode result={result} onShare={() => setShowShare(true)} onPlayAgain={onPlayAgain} />
          )}
        </>
      )}
      <Footer stats={stats} />
      {showShare && result && <ShareCard result={result} onClose={() => setShowShare(false)} />}
      <ToastHost toasts={toasts} />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
