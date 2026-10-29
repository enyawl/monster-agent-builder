"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { DndContext, DragOverlay, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import Logo from "@/ui/Logo";
import { BLOCKS, activeRecipe, blockById, canPlace, type BlockManifest, type Lane } from "@/blocks/registry";
import { MONSTERS, type Monster, type Rect } from "@/monsters/monsters";
import { PART_INFO, STATE_STYLE } from "@/ui/theme";
import { run } from "@/engine";
import { doHands, type Result } from "@/blocks/hands";
import * as mem from "@/memory/store";
import type { MemoryProfile, MonsterState, Recipe, RunInputData } from "@/events";

const PARTS: Lane[] = ["head", "brain", "mouth", "hands"];
const Icon = ({ d, s = 20 }: { d: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);
const PLUS = "M12 5v14M5 12h14", X = "M6 6l12 12M18 6L6 18", BACK = "M15 5l-7 7 7 7", PLAY = "M7 4l13 8-13 8z", CHAT = "M4 5h16v11H9l-5 4z", CAM = "M4 8h3l2-3h6l2 3h3v11H4zM12 11a3.500 3.500 0 1 0 0 7 3.500 3.500 0 0 0 0-7z", WAND = "M5 19L17 7M15 5l1-2 1 2 2 1-2 1-1 2-1-2-2-1z";

async function fileToDataUrl(f: File): Promise<string> { // small JPEG so the request stays tiny
  const bmp = await createImageBitmap(f); const s = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height); return c.toDataURL("image/jpeg", 0.8);
}
const box = (r: Rect): CSSProperties => ({ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` });

function Badge({ state }: { state: MonsterState }) {
  const s = STATE_STYLE[state];
  return <span className="badge" style={{ background: s.color }} title={s.label}><Icon d={s.icon} s={18} /></span>;
}
function Hot({ id, label, rect, on, onClick }: { id: string; label: string; rect: Rect; on: boolean; onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <button ref={setNodeRef} className={`hot ${on ? "on" : ""} ${isOver ? "over" : ""}`} style={box(rect)} aria-label={label} onClick={onClick} />;
}
function Piece({ b, onTap }: { b: BlockManifest; onTap: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: b.id });
  return (
    <button ref={setNodeRef} {...listeners} {...attributes} onClick={onTap} className="piece" style={{ background: b.color, opacity: isDragging ? 0.4 : 1 }}>
      <b>{b.label}</b><small>{b.detail}</small>
    </button>
  );
}
function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className={`sw ${on ? "on" : ""}`} onClick={onChange}><span /></button>;
}

export default function MonsterApp() {
  const [roster, setRoster] = useState<string[]>(["chef", "trip", "circuit"]);
  const [recipes, setRecipes] = useState<Record<string, Recipe>>(() => Object.fromEntries(MONSTERS.map((m) => [m.id, m.recipe])));
  const [states, setStates] = useState<Record<string, MonsterState>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [part, setPart] = useState<Lane | null>(null);
  const [inputs, setInputs] = useState<RunInputData>({});
  const [log, setLog] = useState("");
  const [result, setResult] = useState<(Result & { notes: string[] }) | null>(null);
  const [ask, setAsk] = useState<{ text: string; res: (ok: boolean) => void } | null>(null);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState({ text: "", n: 0 });
  const [dragId, setDragId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<null | "add" | "memory">(null);
  const [loaded, setLoaded] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => { // restore this browser's monsters, then allow saving
    try {
      const r = JSON.parse(localStorage.getItem("myta:roster") ?? "null");
      if (Array.isArray(r)) setRoster(r.filter((id) => MONSTERS.some((m) => m.id === id)));
      const c = JSON.parse(localStorage.getItem("myta:recipes") ?? "null");
      if (c && typeof c === "object") setRecipes((p) => ({ ...p, ...c }));
    } catch {}
    setLoaded(true);
    if (new URLSearchParams(location.search).get("debug") === "1") { // on-page console for iPad testing
      const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/eruda";
      s.onload = () => (window as unknown as { eruda: { init: () => void } }).eruda.init(); document.body.appendChild(s);
    }
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("myta:roster", JSON.stringify(roster)); localStorage.setItem("myta:recipes", JSON.stringify(recipes)); } catch {}
  }, [roster, recipes, loaded]);

  const m = MONSTERS.find((x) => x.id === sel) ?? null;
  const recipe = m ? recipes[m.id] : null;
  const stateOf = (id: string): MonsterState => states[id] ?? "idle";
  const say = (text: string) => setNote((p) => ({ text, n: p.n + 1 }));
  const laneKey = (l: Lane) => (l === "head" ? null : l);
  const itemsOf = (r: Recipe, l: Lane) => { const k = laneKey(l); return k ? r[k] : []; };

  function edit(id: string, fn: (r: Recipe) => Recipe) { setRecipes((p) => ({ ...p, [id]: fn(p[id]) })); }
  function tryAdd(b: BlockManifest, id = m?.id) {
    if (!id) return; const r = recipes[id]; const mm = MONSTERS.find((x) => x.id === id)!;
    if (b.lane === "head") { edit(id, (x) => ({ ...x, heart: b.heart ?? x.heart })); mem.clearExpertise(id); say(`${mm.name} is now ${b.label}.`); return; }
    const k = b.lane as "mouth" | "brain" | "hands";
    if (r[k].some((x) => x.block === b.id)) { say(`${b.label} is already there.`); return; }
    const c = canPlace(b, r); if (!c.ok) { say(c.why ?? "That piece does not fit."); return; }
    edit(id, (x) => ({ ...x, [k]: [...x[k], { block: b.id, on: true }] }) as Recipe); say(`${b.label} added.`);
  }
  const toggle = (k: "mouth" | "brain" | "hands", id: string) => m && edit(m.id, (x) => ({ ...x, [k]: x[k].map((i) => (i.block === id ? { ...i, on: i.on === false } : i)) }) as Recipe);
  const remove = (k: "mouth" | "brain" | "hands", id: string) => m && edit(m.id, (x) => ({ ...x, [k]: x[k].filter((i) => i.block !== id) }) as Recipe);

  function onDragEnd(e: DragEndEvent) {
    setDragId(null);
    const b = blockById(String(e.active.id)); const over = e.over ? String(e.over.id) : "";
    if (!b || !over.startsWith("part:")) return;
    const target = over.split(":")[1];
    if (target !== b.lane) { say(`${b.label} goes on the ${PART_INFO[b.lane].title.toLowerCase()}.`); return; }
    tryAdd(b);
  }

  async function onRun() {
    if (!m || !recipe || running) return;
    const id = m.id; setRunning(true); setResult(null); setLog(""); let allowed = false;
    const memory: MemoryProfile = mem.loadMemory(id);
    const active = activeRecipe(recipe);
    try {
      for await (const ev of run(recipe, { input: inputs, memory, sample: m.sample, confirm: (what) => new Promise<boolean>((res) => setAsk({ text: what, res: (ok) => { allowed = ok; res(ok); } })) })) {
        if (ev.type === "state_changed") setStates((p) => ({ ...p, [id]: ev.state }));
        else if (ev.type === "tool_called") setLog(blockById(ev.block)?.label ?? ev.block);
        else if (ev.type === "guard_checked" && ev.verdict === "blocked") setLog(ev.reason);
        else if (ev.type === "error") { setStates((p) => ({ ...p, [id]: "error" })); setLog(ev.message); }
        else if (ev.type === "result_ready") {
          const r: Result = { title: ev.title, lines: ev.lines, sources: ev.sources }; const notes: string[] = [];
          if (allowed) for (const h of active.hands) { try { const s = await doHands(h.block, r); if (s) notes.push(s); } catch { notes.push("Cancelled."); } }
          setResult({ ...r, notes }); mem.addHistory(id, ev.title);
        }
      }
    } finally { setRunning(false); }
  }

  const stage = m && recipe && (
    <div className="view">
      <div className="stagecol">
        <div className="stagewrap" style={{ ["--ring" as string]: STATE_STYLE[stateOf(m.id)].color } as CSSProperties}>
          <div className={`stage a-${STATE_STYLE[stateOf(m.id)].anim}`} style={{ aspectRatio: `${m.size.w}/${m.size.h}` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.image} alt={`${m.name}, ${STATE_STYLE[stateOf(m.id)].label}`} draggable={false} />
            <Hot id="part:head" label="Head" rect={m.parts.head} on={part === "head"} onClick={() => setPart("head")} />
            <Hot id="part:mouth" label="Mouth" rect={m.parts.mouth} on={part === "mouth"} onClick={() => setPart("mouth")} />
            <Hot id="part:hands:L" label="Left hand" rect={m.parts.handL} on={part === "hands"} onClick={() => setPart("hands")} />
            <Hot id="part:hands:R" label="Right hand" rect={m.parts.handR} on={part === "hands"} onClick={() => setPart("hands")} />
          </div>
          <BrainBubble on={part === "brain"} onClick={() => setPart("brain")} />
          <Badge state={stateOf(m.id)} />
        </div>
        <div className="runrow">
          <button className="run" onClick={onRun} disabled={running} aria-label="Run"><Icon d={PLAY} s={22} />{running ? "…" : "Run"}</button>
          <span className="log" aria-live="polite">{STATE_STYLE[stateOf(m.id)].label}{log ? ` · ${log}` : ""}</span>
        </div>
      </div>
      <aside className="panel">
        {part ? PartPanel() : <p className="hint">Tap my head, mouth, hands or the thought bubble.</p>}
        {note.text && <p key={note.n} className="note" aria-live="polite">{note.text}</p>}
        {result && (
          <div className="result">
            <h3>{result.title}</h3>
            <ul>{result.lines.map((t, i) => <li key={i}>{t}</li>)}</ul>
            {result.sources?.length ? <ul className="src">{result.sources.map((s, i) => <li key={i}>{s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> : s.title}</li>)}</ul> : null}
            {result.notes.map((n, i) => <small key={i}>{n} </small>)}
          </div>
        )}
      </aside>
    </div>
  );

  function PartPanel() {
    if (!m || !recipe || !part) return null;
    const info = PART_INFO[part]; const k = laneKey(part);
    const mine = k ? recipe[k] : [];
    const tray = BLOCKS.filter((b) => b.lane === part && (part === "head" ? b.heart !== recipe.heart : !mine.some((x) => x.block === b.id)));
    const on = (id: string) => mine.find((x) => x.block === id)?.on !== false;
    return (
      <div className="pp">
        <div className="pp-h"><Icon d={info.icon} /><h2>{info.title}</h2><button className="x" aria-label="Close" onClick={() => setPart(null)}><Icon d={X} /></button></div>
        {part === "head" && <p className="chip pink">{blockById(`heart_${recipe.heart}`)?.label ?? recipe.heart}</p>}
        {k && mine.map((i) => { const b = blockById(i.block); if (!b) return null; return (
          <div key={i.block} className="row" style={{ background: b.color }}><b>{b.label}</b>
            <Switch on={on(i.block)} label={`${b.label} on or off`} onChange={() => toggle(k, i.block)} />
            <button className="x" aria-label={`Remove ${b.label}`} onClick={() => remove(k, i.block)}><Icon d={X} s={18} /></button></div>); })}
        {part === "mouth" && (
          <div className="feed">
            {recipe.mouth.some((x) => x.block === "chat" && x.on !== false) && <input className="in" placeholder="Type here" value={inputs.text ?? ""} maxLength={4000} onChange={(e) => setInputs((p) => ({ ...p, text: e.target.value }))} />}
            {recipe.mouth.some((x) => x.block === "link" && x.on !== false) && <input className="in" inputMode="url" placeholder="Paste a link" value={inputs.url ?? ""} maxLength={1000} onChange={(e) => setInputs((p) => ({ ...p, url: e.target.value }))} />}
            {recipe.mouth.some((x) => x.block === "picture" && x.on !== false) && (
              <label className="photo"><Icon d={CAM} />{inputs.image ? "Picture ready" : "Add a picture"}
                <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { const url = await fileToDataUrl(f); setInputs((p) => ({ ...p, image: url })); } catch { say("I could not read that picture."); } } }} />
              </label>)}
            {inputs.image && <small>The picture is sent to the AI so it can look at it.</small>}
          </div>
        )}
        <h3 className="tray-h">Add</h3>
        <div className="tray">{tray.map((b) => <Piece key={b.id} b={b} onTap={() => tryAdd(b)} />)}</div>
      </div>
    );
  }

  return (
    <main className="app">
      <DndContext sensors={sensors} onDragStart={(e) => setDragId(String(e.active.id))} onDragEnd={onDragEnd} onDragCancel={() => setDragId(null)}>
        <header className="top">
          {m ? <button className="round" aria-label="Back" onClick={() => { setSel(null); setPart(null); setResult(null); setLog(""); }}><Icon d={BACK} /></button> : <Logo />}
          {m && <h1 className="mname">{m.name}</h1>}
          <div className="topr">
            {m && <button className="round" aria-label="Memory" onClick={() => setSheet("memory")}><Icon d={CHAT} /></button>}
            <button className="round add" aria-label="Add" onClick={() => setSheet("add")}><Icon d={PLUS} /></button>
          </div>
        </header>
        {!m ? (
          <section className="crew">
            {roster.map((id) => { const x = MONSTERS.find((k) => k.id === id)!; const st = stateOf(id); return (
              <button key={id} className="mon" aria-label={x.name} style={{ ["--ring" as string]: STATE_STYLE[st].color } as CSSProperties} onClick={() => { setSel(id); setPart(null); setInputs({}); setResult(null); setLog(""); }}>
                <div className={`a-${STATE_STYLE[st].anim}`}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={x.image} alt="" draggable={false} /></div>
                <Badge state={st} /><span className="nm">{x.name}</span>
              </button>); })}
          </section>
        ) : stage}
        <DragOverlay>{dragId ? <div className="piece ghosting" style={{ background: blockById(dragId)?.color }}><b>{blockById(dragId)?.label}</b></div> : null}</DragOverlay>
      </DndContext>

      {ask && m && (
        <div className="modal" role="dialog" aria-modal="true"><div className="card perm">
          <div className="permart a-pause">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={m.image} alt="" /><Badge state="needs_permission" /></div>
          <p>{ask.text}</p>
          <div className="btns"><button className="run" onClick={() => { ask.res(true); setAsk(null); }}>Allow</button><button className="ghost" onClick={() => { ask.res(false); setAsk(null); }}>Not now</button></div>
        </div></div>
      )}
      {sheet === "add" && <AddSheet roster={roster} sel={sel} onClose={() => setSheet(null)} onMonster={(id) => { setRoster((r) => (r.includes(id) || r.length >= 5 ? r : [...r, id])); }} onBlock={(b, id) => tryAdd(b, id)} />}
      {sheet === "memory" && m && <MemorySheet id={m.id} name={m.name} onClose={() => setSheet(null)} onWipeAll={() => { mem.wipeEverything(); setRecipes(Object.fromEntries(MONSTERS.map((x) => [x.id, x.recipe]))); setRoster(["chef", "trip", "circuit"]); setSheet(null); setSel(null); }} />}
    </main>
  );
}

function BrainBubble({ on, onClick }: { on: boolean; onClick: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: "part:brain" });
  return <button ref={setNodeRef} className={`bubble ${on ? "on" : ""} ${isOver ? "over" : ""}`} aria-label="Brain" onClick={onClick}><Icon d={PART_INFO.brain.icon} s={26} /></button>;
}

function AddSheet(p: { roster: string[]; sel: string | null; onClose: () => void; onMonster: (id: string) => void; onBlock: (b: BlockManifest, id: string) => void }) {
  const [step, setStep] = useState<"root" | "monster" | "parts" | "blocks">("root");
  const [lane, setLane] = useState<Lane>("brain");
  const [target, setTarget] = useState(p.sel ?? p.roster[0] ?? "chef");
  const [msg, setMsg] = useState("");
  const [gen, setGen] = useState("");
  const extras = MONSTERS.filter((x) => x.extra && !p.roster.includes(x.id));
  async function post(url: string, body: object) { try { const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); setMsg((await r.json()).message ?? ""); } catch { setMsg("Could not reach the server."); } }
  return (
    <div className="modal" role="dialog" aria-modal="true"><div className="card sheet">
      <div className="pp-h">{step !== "root" && <button className="x" aria-label="Back" onClick={() => { setMsg(""); setStep(step === "blocks" ? "parts" : "root"); }}><Icon d={BACK} /></button>}<h2>Add</h2><button className="x" aria-label="Close" onClick={p.onClose}><Icon d={X} /></button></div>
      {step === "root" && <div className="two">
        <button className="big" onClick={() => setStep("monster")}><Icon d={PART_INFO.head.icon} s={36} />Monster</button>
        <button className="big" onClick={() => setStep("parts")}><Icon d="M4 8h6V4h4v4h6v4h-4v4h-4v4h-4v-4H6V8z" s={36} />Block</button></div>}
      {step === "monster" && <div className="list">
        {extras.length === 0 && <p className="hint">No more monsters to add.</p>}
        {p.roster.length >= 5 && <p className="hint">You have 5 monsters already.</p>}
        {extras.map((x) => (<div className="row" key={x.id}>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="thumb" src={x.image} alt="" /><b>{x.name}</b>
          <button className="ghost sm" onClick={() => post("/api/icon", { job: x.name })}><Icon d={WAND} s={18} />Icon</button>
          <button className="run sm" onClick={() => { p.onMonster(x.id); p.onClose(); }}>Add</button></div>))}
        {msg && <p className="note">{msg}</p>}</div>}
      {step === "parts" && <div className="two">{(["head", "brain", "mouth", "hands"] as const).map((l) => (
        <button key={l} className="big" onClick={() => { setLane(l); setStep("blocks"); }}><Icon d={PART_INFO[l].icon} s={34} />{PART_INFO[l].title}</button>))}</div>}
      {step === "blocks" && <div className="list">
        <div className="who">{p.roster.map((id) => { const x = MONSTERS.find((k) => k.id === id)!; return (
          <button key={id} className={`mini ${target === id ? "on" : ""}`} aria-label={x.name} onClick={() => setTarget(id)}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={x.image} alt="" /></button>); })}</div>
        <div className="tray">{BLOCKS.filter((b) => b.lane === lane).map((b) => <button key={b.id} className="piece" style={{ background: b.color }} onClick={() => { p.onBlock(b, target); p.onClose(); }}><b>{b.label}</b><small>{b.detail}</small></button>)}</div>
        <div className="gen"><input className="in" placeholder="Describe a new block" value={gen} maxLength={300} onChange={(e) => setGen(e.target.value)} /><button className="ghost sm" onClick={() => post("/api/generate-block", { request: gen })}><Icon d={WAND} s={18} />Make</button></div>
        {msg && <p className="note">{msg}</p>}</div>}
    </div></div>
  );
}

function MemorySheet({ id, name, onClose, onWipeAll }: { id: string; name: string; onClose: () => void; onWipeAll: () => void }) {
  const [tick, setTick] = useState(0); const [text, setText] = useState("");
  void tick; const mm = mem.loadMemory(id);
  return (
    <div className="modal" role="dialog" aria-modal="true"><div className="card sheet">
      <div className="pp-h"><h2>{name}</h2><button className="x" aria-label="Close" onClick={onClose}><Icon d={X} /></button></div>
      <p className="hint">How can I do better next time? These are saved notes, not training.</p>
      <div className="gen"><input className="in" placeholder="Make it shorter" value={text} maxLength={300} onChange={(e) => setText(e.target.value)} />
        <button className="run sm" onClick={() => { if (text.trim()) { mem.addPreference(id, text.trim()); setText(""); setTick((t) => t + 1); } }}>Save</button></div>
      {mm.preferences.map((t, i) => (<div className="row" key={i}><span>{t}</span><button className="x" aria-label="Delete" onClick={() => { mem.removePreference(id, i); setTick((t2) => t2 + 1); }}><Icon d={X} s={18} /></button></div>))}
      <div className="btns"><button className="ghost" onClick={() => { if (confirm(`Forget everything about ${name}?`)) { mem.wipeMonster(id); setTick((t) => t + 1); } }}>Forget this monster</button>
        <button className="ghost danger" onClick={() => { if (confirm("Forget everything and reset all monsters?")) onWipeAll(); }}>Forget everything</button></div>
    </div></div>
  );
}
