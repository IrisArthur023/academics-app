import { useEffect, useRef, useState } from "react";
import { askAI } from "../lib/ai.js";

// Uses the :root variables from your stylesheet: --bg --panel --line --text --dim --clay --lit --math --bio --late
const modes = {
  study: {
    label: "Study",
    hint: "Explain a topic, make flashcards, or quiz me on…",
    tint: "var(--bio)",
  },
  research: {
    label: "Research",
    hint: "Find and summarise sources about…",
    tint: "var(--lit)",
  },
  write: {
    label: "Write",
    hint: "Help me outline or draft an essay on…",
    tint: "var(--math)",
  },
  present: {
    label: "Presentations",
    hint: "Build a slide outline for…",
    tint: "var(--late)",
  },
};

const ring =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--clay)]";
const btn = `rounded-xl px-4 py-2 text-sm bg-[color:var(--clay)] text-[color:var(--bg)] font-medium hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition ${ring}`;
const ghost = `rounded-xl px-4 py-2 text-sm border border-[color:var(--line)] text-[color:var(--text)] hover:bg-[color:var(--line)] transition ${ring}`;
const round = `grid h-10 w-10 shrink-0 place-items-center rounded-full text-[color:var(--text)] hover:bg-[color:var(--line)] transition ${ring}`;
const menuBox =
  "absolute bottom-full mb-3 min-w-[200px] rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-1.5 shadow-xl shadow-black/40";
const menuItem = `flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-[color:var(--text)] hover:bg-[color:var(--line)] disabled:opacity-40 disabled:hover:bg-transparent ${ring}`;

const SR =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const Icon = ({ d, ...p }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    {d}
  </svg>
);
const PlusIcon = () => <Icon d={<path d="M12 5v14M5 12h14" />} />;
const MicIcon = () => (
  <Icon
    d={
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </>
    }
  />
);
const SendIcon = () => <Icon d={<path d="M12 19V5M5 12l7-7 7 7" />} />;
const ChevIcon = () => (
  <Icon width="14" height="14" d={<path d="m6 9 6 6 6-6" />} />
);

function AIView({ openDrive }) {
  const [mode, setMode] = useState("study");
  const [chats, setChats] = useState({
    study: [],
    research: [],
    write: [],
    present: [],
  });
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [menu, setMenu] = useState(null); // null | 'plus' | 'mode'
  const [listening, setListening] = useState(false);
  const box = useRef();
  const end = useRef();
  const dock = useRef();
  const rec = useRef();
  const msgs = chats[mode];

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  // Grow the textarea with its content, up to ~6 lines
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [text]);

  // Close menus on outside click or Escape
  useEffect(() => {
    if (!menu) return;
    const away = (e) => {
      if (!dock.current?.contains(e.target)) setMenu(null);
    };
    const esc = (e) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);

  async function send() {
    const q = text.trim();
    if (!q || busy) return;
    rec.current?.stop();
    const next = [...msgs, { role: "user", content: q }];
    setChats((c) => ({ ...c, [mode]: next }));
    setText("");
    setBusy(true);
    setErr("");
    try {
      const reply = await askAI({ mode, messages: next });
      setChats((c) => ({
        ...c,
        [mode]: [...next, { role: "assistant", content: reply }],
      }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  function toggleMic() {
    if (listening) {
      rec.current?.stop();
      return;
    }
    const r = new SR();
    r.lang = "en-US";
    r.interimResults = true;
    r.continuous = false;
    const base = text.trim() ? text.trim() + " " : "";
    r.onresult = (e) =>
      setText(
        base +
          Array.from(e.results)
            .map((x) => x[0].transcript)
            .join(""),
      );
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    r.start();
    setListening(true);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 pb-44 pt-8">
        {msgs.length === 0 && (
          <p className="m-auto max-w-md text-center font-serif text-xl text-[color:var(--dim)]">
            {modes[mode].hint}
          </p>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "max-w-[85%] self-end whitespace-pre-wrap rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3 text-[color:var(--text)]"
                : "max-w-[92%] self-start whitespace-pre-wrap px-1 py-1 font-serif leading-relaxed text-[color:var(--text)]"
            }
          >
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="self-start px-1 text-[color:var(--dim)]">
            Thinking…
          </div>
        )}
        {err && (
          <div className="self-start rounded-xl border border-[color:var(--late)] bg-[color:var(--late)]/40 px-4 py-3 text-sm text-[color:var(--text)]">
            {err}. Check that your AI endpoint is running, then send again.
          </div>
        )}
        <div ref={end} />
      </div>

      {/* Composer pinned to the bottom centre */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-[color:var(--bg)] via-[color:var(--bg)]/90 to-transparent px-4 pb-6 pt-10">
        <div
          ref={dock}
          className="pointer-events-auto relative w-full max-w-3xl"
        >
          {menu === "plus" && (
            <div className={`${menuBox} left-0`} role="menu">
              <button
                role="menuitem"
                className={menuItem}
                onClick={() => {
                  setMenu(null);
                  openDrive();
                }}
              >
                Open Google Drive
              </button>
              <button
                role="menuitem"
                className={menuItem}
                disabled={!msgs.length}
                onClick={() => {
                  setChats((c) => ({ ...c, [mode]: [] }));
                  setErr("");
                  setMenu(null);
                }}
              >
                Clear this chat
              </button>
            </div>
          )}
          {menu === "mode" && (
            <div className={`${menuBox} right-0`} role="menu">
              {Object.entries(modes).map(([k, v]) => (
                <button
                  key={k}
                  role="menuitemradio"
                  aria-checked={mode === k}
                  className={menuItem}
                  onClick={() => {
                    setMode(k);
                    setMenu(null);
                    box.current?.focus();
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-[color:var(--dim)]"
                    style={{ background: v.tint }}
                  />
                  <span className="grow">{v.label}</span>
                  {mode === k && (
                    <span
                      className="text-[color:var(--clay)]"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-end gap-1 rounded-[28px] border border-[color:var(--line)] bg-[color:var(--panel)] p-2 shadow-lg shadow-black/40 transition focus-within:border-[color:var(--dim)]">
            <button
              className={round}
              aria-label="More options"
              aria-haspopup="menu"
              aria-expanded={menu === "plus"}
              onClick={() => setMenu(menu === "plus" ? null : "plus")}
            >
              <PlusIcon />
            </button>
            <textarea
              ref={box}
              rows={1}
              value={text}
              placeholder={modes[mode].hint}
              aria-label="Message"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              className="min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-base text-[color:var(--text)] outline-none placeholder:text-[color:var(--dim)]"
            />
            {SR && (
              <button
                className={`${round} ${listening ? "bg-[color:var(--late)]" : ""}`}
                onClick={toggleMic}
                aria-label={listening ? "Stop dictation" : "Dictate message"}
                aria-pressed={listening}
              >
                <MicIcon />
              </button>
            )}
            <button
              className={`flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm text-[color:var(--text)] transition hover:brightness-125 ${ring}`}
              style={{ background: modes[mode].tint }}
              aria-haspopup="menu"
              aria-expanded={menu === "mode"}
              onClick={() => setMenu(menu === "mode" ? null : "mode")}
            >
              {modes[mode].label}
              <ChevIcon />
            </button>
            <button
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[color:var(--clay)] text-[color:var(--bg)] transition hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed ${ring}`}
              onClick={send}
              disabled={busy || !text.trim()}
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriveView({ back }) {
  const [link, setLink] = useState(localStorage.getItem("driveLink") || "");
  const [folderId, setFolderId] = useState(
    localStorage.getItem("driveFolder") || "",
  );
  const [uploads, setUploads] = useState([]);
  const fileRef = useRef();

  function connect() {
    // Accepts a folder URL (…/folders/ID) or a bare ID
    const m = link.match(/folders\/([\w-]+)/) || link.match(/[?&]id=([\w-]+)/);
    const id = m ? m[1] : link.trim();
    setFolderId(id);
    localStorage.setItem("driveFolder", id);
    localStorage.setItem("driveLink", link);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 pb-8 pt-6">
      <div>
        <button className={ghost} onClick={back}>
          ← Back to chat
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Paste your Google Drive folder link"
          aria-label="Google Drive folder link"
          className={`min-w-[220px] flex-1 rounded-xl border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-2 text-sm text-[color:var(--text)] placeholder:text-[color:var(--dim)] ${ring}`}
        />
        <button className={btn} onClick={connect}>
          Open in this page
        </button>
        <a className={ghost} href="https://drive.google.com" target="_self">
          Open Drive in this tab
        </a>
        <a
          className={ghost}
          href="https://docs.new"
          target="_blank"
          rel="noreferrer"
        >
          New Google Doc
        </a>
      </div>

      {folderId ? (
        <iframe
          title="Google Drive folder"
          className="h-[420px] w-full rounded-2xl border border-[color:var(--line)] bg-white"
          src={`https://drive.google.com/embeddedfolderview?id=${folderId}#list`}
        />
      ) : (
        <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--panel)] px-6 text-center text-sm text-[color:var(--dim)]">
          Paste a Drive folder link above (set sharing to "Anyone with the
          link") to browse it here.
        </div>
      )}

      <section className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-5">
        <h4 className="font-serif text-lg text-[color:var(--text)]">
          Add to the app
        </h4>
        <p className="mt-1 text-sm text-[color:var(--dim)]">
          Save your work in Drive, download it, then upload it here to use it
          with the AI.
        </p>
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) =>
            setUploads((u) => [...u, ...Array.from(e.target.files)])
          }
        />
        <button
          className={`${btn} mt-4`}
          onClick={() => fileRef.current.click()}
        >
          Upload files
        </button>
        <ul className="mt-4 divide-y divide-[color:var(--line)]">
          {uploads.map((f, i) => (
            <li
              key={i}
              className="flex items-center gap-3 py-2 text-sm text-[color:var(--text)]"
            >
              <span className="grow truncate">{f.name}</span>
              <span className="text-[color:var(--dim)]">
                {(f.size / 1024).toFixed(0)} KB
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default function AIWorkspace() {
  const [view, setView] = useState("ai");
  return (
    <main className="flex min-h-screen flex-col bg-[color:var(--bg)] text-[color:var(--text)]">
      {view === "ai" ? (
        <AIView openDrive={() => setView("drive")} />
      ) : (
        <DriveView back={() => setView("ai")} />
      )}
    </main>
  );
}
