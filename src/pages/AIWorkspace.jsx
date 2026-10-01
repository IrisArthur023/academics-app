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

function AIView({ name }) {
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
  const box = useRef();
  const end = useRef();
  const msgs = chats[mode];
  const started = msgs.length > 0;

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy]);

  async function send() {
    const q = text.trim();
    if (!q || busy) return;
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

  const composer = (
    <div className="w-full max-w-3xl rounded-3xl border border-[color:var(--line)] bg-[color:var(--panel)] p-4 transition focus-within:border-[color:var(--dim)]">
      <textarea
        ref={box}
        rows={2}
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
        className="w-full resize-none bg-transparent px-1 text-base text-[color:var(--text)] outline-none placeholder:text-[color:var(--dim)]"
      />
      <div className="mt-3 flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1 text-xs text-[color:var(--text)]"
          style={{ background: modes[mode].tint }}
        >
          {modes[mode].label}
        </span>
        <button className={btn} onClick={send} disabled={busy || !text.trim()}>
          Send
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 flex-col items-center px-4">
      {!started && (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-8 pb-24">
          <h1 className="text-center font-serif text-4xl text-[color:var(--text)] sm:text-5xl">
            <span className="mr-3 text-[color:var(--clay)]" aria-hidden="true">
              ✺
            </span>
            Back at it, {name}
          </h1>
          {composer}
          <div
            className="flex flex-wrap justify-center gap-3"
            role="tablist"
            aria-label="Mode"
          >
            {Object.entries(modes).map(([k, v]) => (
              <button
                key={k}
                role="tab"
                aria-selected={mode === k}
                onClick={() => {
                  setMode(k);
                  box.current?.focus();
                }}
                className={`rounded-xl border px-4 py-2 text-sm text-[color:var(--text)] transition ${ring} ${mode === k ? "border-[color:var(--clay)]" : "border-[color:var(--line)] hover:bg-[color:var(--panel)]"}`}
                style={mode === k ? { background: v.tint } : undefined}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {started && (
        <>
          <div className="flex w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto py-6">
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
          <div className="sticky bottom-0 flex w-full justify-center bg-[color:var(--bg)] pb-5 pt-2">
            {composer}
          </div>
        </>
      )}
    </div>
  );
}

function DriveView() {
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
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-5 px-4 pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="Paste your Google Drive folder link"
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

export default function AIWorkspace({
  name = "Pixel",
  plan = "Free plan",
  onUpgrade,
}) {
  const [view, setView] = useState("ai");
  const tab = (k, label) => (
    <button
      role="tab"
      aria-selected={view === k}
      onClick={() => setView(k)}
      className={`rounded-lg px-4 py-1.5 text-sm transition ${ring} ${view === k ? "bg-[color:var(--bg)] text-[color:var(--text)]" : "text-[color:var(--dim)] hover:text-[color:var(--text)]"}`}
    >
      {label}
    </button>
  );

  return (
    <main className="flex min-h-screen flex-col bg-[color:var(--bg)] text-[color:var(--text)]">
      <header className="flex flex-col items-center gap-4 px-4 pb-4 pt-6">
        <div className="rounded-xl bg-[color:var(--panel)] px-4 py-2 text-sm text-[color:var(--dim)]">
          {plan}
          <span className="mx-2">·</span>
          <button
            onClick={onUpgrade}
            className={`text-[color:var(--clay)] underline hover:brightness-125 ${ring}`}
          >
            Upgrade
          </button>
        </div>
        <div
          className="inline-flex gap-1 rounded-xl bg-[color:var(--panel)] p-1"
          role="tablist"
          aria-label="Workspace view"
        >
          {tab("ai", "AI page")}
          {tab("drive", "Google Drive")}
        </div>
      </header>
      {view === "ai" ? <AIView name={name} /> : <DriveView />}
    </main>
  );
}
