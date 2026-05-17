// app.jsx — Tells: AI writing tell detector.

const { useState, useMemo, useRef, useEffect, useCallback } = React;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const TIER_LABEL = { strong: "strong", medium: "medium", soft: "soft" };
const TIER_BADGE = { strong: "!!!", medium: "!!", soft: "!" };
const TIER_ORDER = ["strong", "medium", "soft"];

function buildPrompt(template, markedText) {
  return template.replace(/\{\{TEXT\}\}/g, markedText);
}

function buildFlagList(matches) {
  // Group by phrase + category for a clean dedup'd list.
  const groups = new Map();
  for (const m of matches) {
    const key = `${m.tier}\u0000${m.category}\u0000${m.text.toLowerCase()}`;
    const cur = groups.get(key) || { tier: m.tier, category: m.category, text: m.text, count: 0 };
    cur.count++;
    groups.set(key, cur);
  }
  const items = Array.from(groups.values());
  items.sort((a, b) => {
    const tw = ({ strong: 3, medium: 2, soft: 1 })[b.tier] - ({ strong: 3, medium: 2, soft: 1 })[a.tier];
    if (tw !== 0) return tw;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return b.count - a.count;
  });
  const lines = ["Flagged phrases (" + items.length + " unique, " + matches.length + " total)", ""];
  let currentTier = null;
  for (const it of items) {
    if (it.tier !== currentTier) {
      lines.push("─── " + TIER_LABEL[it.tier].toUpperCase() + " ───");
      currentTier = it.tier;
    }
    const countLabel = it.count > 1 ? ` ×${it.count}` : "";
    lines.push(`  [${TIER_BADGE[it.tier]}] ${it.text}${countLabel}  — ${it.category}`);
  }
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline flag (the highlighted span)
// ─────────────────────────────────────────────────────────────────────────────

function FlagSpan({ seg, onHover, onLeave }) {
  return (
    <span
      className={`tell tell-${seg.tier}`}
      data-tier={seg.tier}
      onMouseEnter={(e) => onHover(e, seg)}
      onMouseMove={(e) => onHover(e, seg)}
      onMouseLeave={onLeave}
    >
      <span className="tell-bracket tell-open">{seg.tier === "strong" ? "[!!!" : seg.tier === "medium" ? "[!!" : "[!"}</span>
      <span className="tell-text">{seg.text}</span>
      <span className="tell-bracket tell-close">]</span>
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────────────────────

function Tooltip({ pos, seg }) {
  if (!pos || !seg) return null;
  const style = {
    left: Math.min(pos.x + 14, window.innerWidth - 280),
    top: pos.y + 18,
  };
  return (
    <div className="tt" style={style} role="tooltip">
      <div className="tt-head">
        <span className={`tt-pill tt-pill-${seg.tier}`}>{TIER_BADGE[seg.tier]} {TIER_LABEL[seg.tier]}</span>
        <span className="tt-cat">{seg.category}</span>
      </div>
      <div className="tt-why">{seg.why}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy button (with success flash)
// ─────────────────────────────────────────────────────────────────────────────

function CopyBtn({ label, getText, kind = "default", title }) {
  const [state, setState] = useState("idle");
  const onClick = async () => {
    const text = getText();
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        ok = true;
      }
    } catch (e) { /* fall through to legacy path */ }
    if (!ok) {
      // Fallback for sandboxed iframes / non-secure contexts.
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.top = "0";
        ta.style.left = "-9999px";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, ta.value.length);
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch (e) { ok = false; }
    }
    setState(ok ? "copied" : "err");
    setTimeout(() => setState("idle"), 1400);
  };
  return (
    <button
      className={`copybtn copybtn-${kind} copybtn-${state}`}
      onClick={onClick}
      title={title || label}
    >
      <span className="copybtn-label">
        {state === "copied" ? "Copied ✓" : state === "err" ? "Failed" : label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Counts strip
// ─────────────────────────────────────────────────────────────────────────────

function CountsStrip({ result }) {
  const entries = useMemo(() => {
    if (!result) return [];
    return Object.entries(result.counts).sort((a, b) => b[1] - a[1]);
  }, [result]);

  if (!result || result.total === 0) {
    return (
      <div className="counts counts-empty">
        <span className="counts-clean">No tells detected. Suspiciously clean — or genuinely so.</span>
      </div>
    );
  }

  // Find the tier for each category by looking up first match.
  const tierFor = useMemo(() => {
    const map = {};
    for (const m of result.matches) if (!map[m.category]) map[m.category] = m.tier;
    return map;
  }, [result]);

  return (
    <div className="counts">
      <div className="counts-totals">
        <span className="counts-total">{result.total} <span className="counts-totallabel">tell{result.total === 1 ? "" : "s"}</span></span>
        <span className="counts-tiers">
          {TIER_ORDER.map((t) => result.tierCounts[t] ? (
            <span key={t} className={`counts-tier counts-tier-${t}`}>
              <span className="counts-tier-dot" />
              {result.tierCounts[t]} {TIER_LABEL[t]}
            </span>
          ) : null)}
        </span>
      </div>
      <div className="counts-cats">
        {entries.map(([cat, n]) => (
          <span key={cat} className={`counts-cat counts-cat-${tierFor[cat]}`}>
            <span className="counts-cat-n">{n}</span>
            <span className="counts-cat-label">{cat}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Rendered marked text (read mode)
// ─────────────────────────────────────────────────────────────────────────────

function MarkedView({ segments, onHover, onLeave }) {
  return (
    <div className="marked" onMouseLeave={onLeave}>
      {segments.map((seg, i) =>
        seg.kind === "plain" ? (
          <span key={i}>{seg.text}</span>
        ) : (
          <FlagSpan key={i} seg={seg} onHover={onHover} onLeave={onLeave} />
        )
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main app
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null); // null = input mode; otherwise analyze() result
  const [hover, setHover] = useState({ pos: null, seg: null });
  const taRef = useRef(null);

  // Apply theme to <body> so backgrounds + fonts respond.
  useEffect(() => {
    document.body.dataset.theme = t.theme;
    document.body.dataset.density = t.density || "regular";
  }, [t.theme, t.density]);

  const doAnalyze = useCallback(() => {
    const text = (taRef.current?.value ?? input).trim();
    if (!text) return;
    setInput(taRef.current?.value ?? input);
    setResult(window.Tells.analyze(taRef.current?.value ?? input));
  }, [input]);

  const doReset = useCallback(() => {
    setResult(null);
    setTimeout(() => taRef.current?.focus(), 0);
  }, []);

  const loadSample = useCallback(() => {
    setInput(window.Tells.SAMPLE_TEXT);
    if (taRef.current) taRef.current.value = window.Tells.SAMPLE_TEXT;
  }, []);

  // ⌘/Ctrl+Enter to analyze
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (result) doReset();
        else doAnalyze();
      }
      if (e.key === "Escape" && result) {
        doReset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doAnalyze, doReset, result]);

  const onHover = useCallback((e, seg) => setHover({ pos: { x: e.clientX, y: e.clientY }, seg }), []);
  const onLeave = useCallback(() => setHover({ pos: null, seg: null }), []);

  // Derived strings for copy actions
  const markedText = useMemo(
    () => (result ? window.Tells.toMarkedText(result.segments) : ""),
    [result]
  );
  const promptText = useMemo(
    () => (result ? buildPrompt(t.promptTemplate, markedText) : ""),
    [result, markedText, t.promptTemplate]
  );
  const flagListText = useMemo(
    () => (result ? buildFlagList(result.matches) : ""),
    [result]
  );

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-name">Tells</span>
          <span className="brand-mark">[!!]</span>
          <span className="brand-sep">·</span>
          <span className="brand-tag">AI writing tells, surfaced.</span>
        </div>
        <div className="topbar-actions">
          {!result && !input.trim() && (
            <button className="btn btn-ghost" onClick={loadSample} title="Load sample text">
              <span>Try a sample</span>
            </button>
          )}
          {result ? (
            <button className="btn btn-primary" onClick={doReset} title="Back to editor (Esc)">
              <span>← Edit</span>
              <kbd className="btn-kbd">Esc</kbd>
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={doAnalyze}
              disabled={!input.trim()}
              title="Analyze (⌘/Ctrl+Enter)"
            >
              <span>Analyze</span>
              <kbd className="btn-kbd">⌘↵</kbd>
            </button>
          )}
        </div>
      </header>

      <main className="surface">
        {result ? (
          <>
            {result.total === 0 && (
              <div className="clean-banner">
                <span className="clean-banner-icon">✓</span>
                <div className="clean-banner-body">
                  <div className="clean-banner-title">No AI tells detected.</div>
                  <div className="clean-banner-sub">
                    None of the {window.Tells.RULES.length} patterns we look for showed up. Read it back once more — but as far as our heuristics can tell, you're clean.
                  </div>
                </div>
              </div>
            )}
            <MarkedView segments={result.segments} onHover={onHover} onLeave={onLeave} />
          </>
        ) : (
          <textarea
            ref={taRef}
            className="input"
            placeholder={"Paste the text you want to sniff for AI tells.\n\nWhen you’re ready, hit Analyze (or ⌘/Ctrl+Enter)."}
            defaultValue={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            autoFocus
          />
        )}
      </main>

      <footer className="footer">
        {result ? (
          <>
            {result.total > 0 && <CountsStrip result={result} />}
            <div className="actions">
              {result.total === 0 ? (
                <CopyBtn
                  label="Copy text"
                  kind="primary"
                  title="Copy the text back out (no markup needed)"
                  getText={() => input}
                />
              ) : (
                <>
                  <CopyBtn
                    label="Copy marked text"
                    kind="primary"
                    title="Plain text with [!!!] / [!!] / [!] wrappers around flagged phrases"
                    getText={() => markedText}
                  />
                  <CopyBtn
                    label="Copy LLM rewrite handoff"
                    kind="primary"
                    title="Marked text + instructions, ready to paste into any LLM"
                    getText={() => promptText}
                  />
                  <CopyBtn
                    label="Copy flag list"
                    kind="ghost"
                    title="Just the list of flagged phrases, grouped by tier"
                    getText={() => flagListText}
                  />
                </>
              )}
            </div>
          </>
        ) : (
          <div className="legend">
            <span className="legend-item legend-strong"><b>[!!!strong]</b> very likely worth rewriting</span>
            <span className="legend-item legend-medium"><b>[!!medium]</b> worth examining in context</span>
            <span className="legend-item legend-soft"><b>[!soft]</b> context-dependent</span>
          </div>
        )}
      </footer>

      <Tooltip pos={hover.pos} seg={hover.seg} />

      <TweaksPanel>
        <TweakSection label="Aesthetic" />
        <TweakRadio
          label="Theme"
          value={t.theme}
          options={["editorial", "mono", "sans"]}
          onChange={(v) => setTweak("theme", v)}
        />
        <TweakRadio
          label="Density"
          value={t.density}
          options={["compact", "regular", "roomy"]}
          onChange={(v) => setTweak("density", v)}
        />
        <TweakSection label="LLM handoff" />
        <div className="twk-row">
          <div className="twk-lbl"><span>Rewrite prompt template</span></div>
          <textarea
            className="twk-field twk-textarea"
            rows={12}
            value={t.promptTemplate}
            onChange={(e) => setTweak("promptTemplate", e.target.value)}
            spellCheck={false}
          />
          <div className="twk-hint">
            Use <code>{"{{TEXT}}"}</code> as the placeholder for the marked-up text.
          </div>
        </div>
        <TweakButton
          label="Reset prompt to default"
          secondary
          onClick={() => setTweak("promptTemplate", DEFAULT_PROMPT)}
        />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
