import { useState, useEffect, useRef, useMemo } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

// ─── Phases ────────────────────────────────────────────────────────────────────
const PHASES = [
    {
        text: "Hello, I am Rhiddhit Paul.\nI am a product designer, music producer and DJ.\n\nKnow more about me?",
        prompt: true,
    },
    {
        input: "Y",
        text: "I care about inclusivity and accessibility, and believe that as designers our duty is to help people experience deeper, richer emotions.",
    },
    {
        text: "I have designed for Microsoft, Amazon, HP and more.",
        logos: true,
    },
]

const SASSY_RESPONSE = "Too bad. I'll tell you anyway."
const AUDIO_URL = "https://files.catbox.moe/myys1b.mp3"
const GLITCH_CHARS = "▓░▒█▄▀▌▐■□◆◇▲▼◉⊕⊗01╗╝╔╚╬╠╣║═"
const STUTTER_BPM = 128

// ─── CV Data ───────────────────────────────────────────────────────────────────
const EXPERIENCE = [
    { role: "Founder", company: "Transient", dates: "2026 – Now", note: "Music analysis desktop app for producers. Electron + WebAssembly audio pipeline (4× faster than Python/librosa), real-time BPM / key / chord analysis, hardware synth-themed UI." },
    { role: "Senior Product Designer L2", company: "HumanX", dates: "2024 – Now", note: "Amazon Now (launched across 7 markets), HP kiosk. Built NIMITH design system from scratch." },
    { role: "Senior Product Designer", company: "Yellowchalk", dates: "2023 – 2024", note: "Finhaat, Augmatrix, QNu Labs, Infinity Learn." },
    { role: "Product Design Intern", company: "Microsoft India (R&D)", dates: "2022 – 2023", note: "Teams Activity Feed — mental-health-centric AI to reduce digital fatigue." },
    { role: "Design Researcher", company: "Tata Digital + NID", dates: "2022", note: "Future of zero-inventory mixed-reality shopping environments." },
]
const EDUCATION = [
    { degree: "M.Des Information Design", school: "National Institute of Design", dates: "2020 – 2023" },
    { degree: "Bachelor of Architecture", school: "School of Planning & Architecture", dates: "2015 – 2020" },
]
const RECOGNITION = [
    { title: "ADPList Top 1% Mentor (Global)", detail: "Awarded 6 consecutive months · 2023" },
    { title: "Berkeley Prize Essay — Global Winner", detail: "'Nests for A Phoenix' · 2020" },
    { title: "Obvious Design Hackathon — Runner Up", detail: "'S-Park' · 2023" },
    { title: "Volume Zero Micro Housing — Global Top 10", detail: "International competition · 2019" },
]

// ─── Projects ──────────────────────────────────────────────────────────────────
const PROJECTS = [
    {
        index: "01",
        company: "Amazon Now",
        title: "Savings — helping customers spend less on every order",
        tags: ["case-study", "e-commerce", "ux"],
        link: "/amazonsavings",
    },
    {
        index: "02",
        company: "Finhaat",
        title: "Claims UX — helping agents know policyholders better",
        tags: ["case-study", "fintech"],
        link: "/cpi",
    },
    {
        index: "03",
        company: "Microsoft India R&D",
        title: "Teams Activity Feed — mental-health-centric AI",
        tags: ["internship", "ai", "wellbeing"],
        link: "/project-3",
    },
    {
        index: "04",
        company: "HP",
        title: "Self-service retail kiosk experience",
        tags: ["product", "hardware", "retail"],
        link: "/project-4",
    },
]

// ─── Panel line type ───────────────────────────────────────────────────────────
type PanelLine = {
    text: string; color: string; opacity?: number
    letterSpacing?: string; textTransform?: React.CSSProperties["textTransform"]
    marginBottom?: number; paddingBottom?: number; borderBottom?: string; isBlank?: boolean
}

function buildLines(accentColor: string): PanelLine[] {
    const acc = accentColor
    const lines: PanelLine[] = []
    const header = (text: string): PanelLine => ({
        text, color: acc, opacity: 0.5, letterSpacing: "0.18em", textTransform: "uppercase",
        marginBottom: 6, paddingBottom: 8, borderBottom: "1px solid rgba(245,245,245,0.08)",
    })
    const blank = (): PanelLine => ({ text: "", color: "transparent", isBlank: true })

    lines.push(header("experience")); lines.push(blank())
    for (let i = 0; i < EXPERIENCE.length; i++) {
        const e = EXPERIENCE[i]
        lines.push({ text: `${e.role}  ·  ${e.dates}`, color: "rgba(245,245,245,0.9)" })
        lines.push({ text: e.company, color: acc, opacity: 0.85 })
        lines.push({ text: e.note, color: "rgba(245,245,245,0.38)", marginBottom: 14 })
        if (i < EXPERIENCE.length - 1) lines.push(blank())
    }
    lines.push(blank()); lines.push(blank())
    lines.push(header("education")); lines.push(blank())
    for (let i = 0; i < EDUCATION.length; i++) {
        const e = EDUCATION[i]
        lines.push({ text: e.degree, color: "rgba(245,245,245,0.9)" })
        lines.push({ text: e.school, color: acc, opacity: 0.85 })
        lines.push({ text: e.dates, color: "rgba(245,245,245,0.3)", marginBottom: 14 })
        if (i < EDUCATION.length - 1) lines.push(blank())
    }
    lines.push(blank()); lines.push(blank())
    lines.push(header("recognition")); lines.push(blank())
    for (let i = 0; i < RECOGNITION.length; i++) {
        const r = RECOGNITION[i]
        lines.push({ text: r.title, color: "rgba(245,245,245,0.9)" })
        lines.push({ text: r.detail, color: "rgba(245,245,245,0.35)", marginBottom: 14 })
        if (i < RECOGNITION.length - 1) lines.push(blank())
    }
    return lines
}

// ─── Audio helpers ─────────────────────────────────────────────────────────────
// ─── Window singleton ──────────────────────────────────────────────────────────
const AUDIO_CHAIN_VERSION = 6
declare global {
    interface Window {
        __pf_audio?: HTMLAudioElement; __pf_ctx?: AudioContext
        __pf_analyser?: AnalyserNode; __pf_filter?: BiquadFilterNode
        __pf_stutter?: GainNode; __pf_connected?: boolean
        __pf_chain_version?: number
    }
}

function getAudio(): HTMLAudioElement {
    if (!window.__pf_audio) {
        // No crossOrigin — catbox.moe has no CORS headers, setting it would block the load entirely
        const a = new Audio(); a.src = AUDIO_URL; a.loop = true; a.volume = 0
        window.__pf_audio = a
    }
    return window.__pf_audio
}
function getAnalyser(): AnalyserNode | null { return window.__pf_analyser ?? null }

function ensureAnalyser(): AnalyserNode | null {
    if (window.__pf_chain_version !== AUDIO_CHAIN_VERSION) {
        try { window.__pf_ctx?.close() } catch {}
        window.__pf_audio = undefined; window.__pf_ctx = undefined
        window.__pf_analyser = undefined; window.__pf_filter = undefined
        window.__pf_stutter = undefined; window.__pf_connected = undefined
    }
    if (window.__pf_connected) return window.__pf_analyser ?? null

    const audio = getAudio()
    try {
        const ctx = new AudioContext(); window.__pf_ctx = ctx
        const analyser = ctx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.55
        const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 18000; filter.Q.value = 1.2
        const stutter = ctx.createGain(); stutter.gain.value = 1

        window.__pf_analyser = analyser; window.__pf_filter = filter; window.__pf_stutter = stutter

        // createMediaElementSource requires CORS headers; throws SecurityError without them
        const src = ctx.createMediaElementSource(audio)
        src.connect(analyser)
        analyser.connect(filter)
        filter.connect(stutter)
        stutter.connect(ctx.destination)

        window.__pf_connected = true; window.__pf_chain_version = AUDIO_CHAIN_VERSION
        return analyser
    } catch {
        // No CORS headers — effects unavailable, audio still plays directly
        try { window.__pf_ctx?.close() } catch {}
        window.__pf_ctx = undefined; window.__pf_analyser = undefined
        window.__pf_connected = true; window.__pf_chain_version = AUDIO_CHAIN_VERSION
        return null
    }
}

function fadeIn(audio: HTMLAudioElement, ms = 3000) {
    const steps = 60, target = 0.22, delta = target / steps; let cur = 0; audio.volume = 0
    const t = setInterval(() => { cur = Math.min(target, cur + delta); audio.volume = cur; if (cur >= target) clearInterval(t) }, ms / steps)
}
async function startPlayback(): Promise<{ analyser: AnalyserNode | null } | null> {
    const audio = getAudio(); const node = ensureAnalyser(); window.__pf_ctx?.resume()
    try { await audio.play(); fadeIn(audio); return { analyser: node } } catch { return null }
}
function stopPlayback() { const audio = getAudio(); audio.pause(); audio.volume = 0 }

// ─── Logo icons ────────────────────────────────────────────────────────────────
function MsftIcon({ color }: { color: string }) {
    return (
        <svg width="13" height="13" viewBox="0 0 13 13" style={{ display: "inline-block", verticalAlign: "text-bottom", marginRight: "3px", opacity: 0.7 }}>
            <rect x="0" y="0" width="6" height="6" fill={color} /><rect x="7" y="0" width="6" height="6" fill={color} />
            <rect x="0" y="7" width="6" height="6" fill={color} /><rect x="7" y="7" width="6" height="6" fill={color} />
        </svg>
    )
}
function AmazonIcon({ color }: { color: string }) {
    return (
        <svg width="18" height="13" viewBox="0 0 18 13" style={{ display: "inline-block", verticalAlign: "text-bottom", marginRight: "3px", opacity: 0.7 }}>
            <path d="M1 8 Q9 14 17 8" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M14.5 6 L17 8 L14.5 10" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    )
}
function HpIcon({ color }: { color: string }) {
    return (
        <svg width="22" height="13" viewBox="0 0 22 13" style={{ display: "inline-block", verticalAlign: "text-bottom", marginRight: "3px", opacity: 0.7 }}>
            <rect x="0.5" y="0.5" width="21" height="12" rx="2.5" fill="none" stroke={color} strokeWidth="1" />
            <text x="11" y="9.5" textAnchor="middle" fontSize="7.5" fill={color} fontFamily="'SF Mono',monospace">hp</text>
        </svg>
    )
}
function LogoLine({ accentColor }: { accentColor: string }) {
    const ic = "rgba(245,245,245,0.55)"
    return (
        <span>
            {"I have designed for "}
            <MsftIcon color={ic} />{"Microsoft, "}
            <AmazonIcon color={ic} />{"Amazon, "}
            <HpIcon color={ic} />{"HP and more."}
        </span>
    )
}

// ─── Project listing ───────────────────────────────────────────────────────────
function ProjectRow({ project, accentColor, delay }: { project: typeof PROJECTS[0]; accentColor: string; delay: number }) {
    const [visible, setVisible] = useState(false)
    const [hovered, setHovered] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay)
        return () => clearTimeout(t)
    }, [delay])

    return (
        <a href={project.link}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: "block", textDecoration: "none", cursor: "pointer",
                padding: "10px 0", borderBottom: "1px solid rgba(245,245,245,0.05)",
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(6px)",
                transition: "opacity 0.35s ease, transform 0.35s ease",
            }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <span style={{ color: accentColor, opacity: 0.4, fontSize: "13px", width: "22px", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>
                    {project.index}
                </span>
                <span style={{ flex: 1, fontSize: "13px", color: hovered ? "rgba(245,245,245,0.95)" : "rgba(245,245,245,0.85)", transition: "color 0.12s" }}>
                    {project.company}
                    <span style={{ color: "rgba(245,245,245,0.3)", fontWeight: 400 }}> — {project.title}</span>
                </span>
                <span style={{ fontSize: "13px", color: hovered ? accentColor : "rgba(245,245,245,0.18)", transition: "color 0.12s", flexShrink: 0 }}>↗</span>
            </div>
            <div style={{ paddingLeft: "32px", marginTop: "4px" }}>
                {project.tags.map((tag, i) => (
                    <span key={i} style={{ color: "rgba(245,245,245,0.22)", fontSize: "13px", marginRight: "10px" }}>
                        [{tag}]
                    </span>
                ))}
            </div>
        </a>
    )
}

function ProjectListing({ visible, accentColor }: { visible: boolean; accentColor: string }) {
    return (
        <div style={{ marginTop: "28px", opacity: visible ? 1 : 0, transition: "opacity 0.3s ease" }}>
            <div style={{ color: "rgba(245,245,245,0.25)", fontSize: "13px", marginBottom: "12px", letterSpacing: "0.01em" }}>
                <span style={{ color: accentColor, opacity: 0.4 }}>{">"}</span>
                {" ls ./work"}
            </div>
            <div style={{ borderTop: "1px solid rgba(245,245,245,0.05)" }}>
                {PROJECTS.map((p, i) => (
                    <ProjectRow key={i} project={p} accentColor={accentColor} delay={i * 120} />
                ))}
            </div>
        </div>
    )
}

// ─── Cursor ────────────────────────────────────────────────────────────────────
function Cursor({ visible }: { visible: boolean }) {
    return (
        <span style={{
            display: "inline-block", width: "8px", height: "1em",
            backgroundColor: "rgba(245,245,245,0.85)", verticalAlign: "text-bottom",
            marginLeft: "2px", opacity: visible ? 1 : 0, transition: "opacity 0.05s",
        }} />
    )
}

// ─── Music toggle ──────────────────────────────────────────────────────────────
function MusicToggle({ playing, onToggle, accentColor }: { playing: boolean; onToggle: () => void; accentColor: string }) {
    return (
        <button onClick={onToggle} title={playing ? "Pause music" : "Play music"} style={{
            position: "fixed", bottom: "28px", right: "32px", background: "none",
            border: "1px solid rgba(245,245,245,0.15)", borderRadius: "4px",
            padding: "8px 14px", cursor: "pointer", display: "flex",
            alignItems: "flex-end", gap: "3px", height: "38px",
            opacity: 0.7, transition: "opacity 0.2s, border-color 0.2s", zIndex: 20,
        }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "rgba(245,245,245,0.4)" }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.borderColor = "rgba(245,245,245,0.15)" }}
        >
            {[0.4, 1, 0.6, 0.85, 0.5].map((h, i) => (
                <span key={i} style={{
                    display: "block", width: "3px", borderRadius: "1px",
                    backgroundColor: playing ? accentColor : "rgba(245,245,245,0.4)",
                    height: playing ? `${h * 18}px` : "5px",
                    transition: "height 0.4s ease, background-color 0.3s",
                }} />
            ))}
        </button>
    )
}

// ─── Biosphere tuning ──────────────────────────────────────────────────────────
const BIO = {
    INIT_COUNT:        100,
    CLUSTER_COUNT:     6,
    MAX_ALIVE:         220,
    REPLENISH_MIN:     40,
    REPLENISH_BATCH:   6,
    CELL_SPEED:        0.7,
    CELL_LIFE_MIN:     700,
    CELL_LIFE_MAX:     1800,
    BOUNDARY_X:        0.47,
    BOUNDARY_Y:        0.47,
    BOUNDARY_FORCE:    0.055,
    FRICTION:          0.991,
    BASS_THRESHOLD:    0.035,  // low threshold — reacts to subtle beats
    SPAWN_COUNT_BASE:  3,
    SPAWN_COUNT_BASS:  10,     // big bursts on hits
    SPAWN_DIST_MIN:    30,
    SPAWN_DIST_MAX:    200,
    SPAWN_COOLDOWN:    14,
    CONNECT_DIST:      110,
    CONNECT_ENERGY:    200,    // connections stretch dramatically with audio energy
    MOUSE_FIELD_STR:   0.006,
}

// ─── Audio Biosphere ───────────────────────────────────────────────────────────
type CellType = "cell" | "active" | "spore" | "decay"
type Cell = {
    x: number; y: number; vx: number; vy: number
    life: number; maxLife: number; energy: number
    type: CellType; sporeRadius: number; decayAlpha: number
}

function makeCell(x: number, y: number, type: CellType = "cell"): Cell {
    return {
        x, y,
        vx: (Math.random() - 0.5) * BIO.CELL_SPEED,
        vy: (Math.random() - 0.5) * BIO.CELL_SPEED,
        life: type === "spore" ? 1 : 0.6 + Math.random() * 0.4,
        maxLife: BIO.CELL_LIFE_MIN + Math.random() * (BIO.CELL_LIFE_MAX - BIO.CELL_LIFE_MIN),
        energy: 0, type,
        sporeRadius: type === "spore" ? 5 + Math.random() * 8 : 0,
        decayAlpha: 1,
    }
}

function AudioBiosphere({ analyser, active }: { analyser: AnalyserNode | null; active: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rafRef = useRef<number>(0)
    const mouseRef = useRef({ x: -9999, y: -9999, inside: false })
    // smoothed bass for pulse glow
    const bassSmooth = useRef(0)

    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return
        const ctx = canvas.getContext("2d")!
        let cells: Cell[] = [], W = 0, H = 0, spawnCd = 0, maxAlive = BIO.MAX_ALIVE

        const init = () => {
            W = canvas.offsetWidth; H = canvas.offsetHeight
            canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio
            ctx.scale(devicePixelRatio, devicePixelRatio)
            const viewScale = Math.sqrt((W * H) / (1080 * 1080))
            const initCount = Math.round(BIO.INIT_COUNT * viewScale)
            maxAlive = Math.round(BIO.MAX_ALIVE * viewScale)
            cells = []
            const perCluster = Math.floor(initCount / BIO.CLUSTER_COUNT)
            for (let cl = 0; cl < BIO.CLUSTER_COUNT; cl++) {
                const ax = W * 0.1 + Math.random() * W * 0.8
                const ay = H * 0.1 + Math.random() * H * 0.8
                for (let i = 0; i < perCluster; i++) {
                    const ang = Math.random() * Math.PI * 2, d = Math.random() * 70
                    cells.push(makeCell(ax + Math.cos(ang) * d, ay + Math.sin(ang) * d))
                }
            }
        }
        init()

        const onMove = (e: MouseEvent) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY; mouseRef.current.inside = true }
        const onLeave = () => { mouseRef.current.inside = false }
        window.addEventListener("mousemove", onMove); window.addEventListener("mouseleave", onLeave)

        let lastTime = performance.now()
        const draw = (now: number) => {
            rafRef.current = requestAnimationFrame(draw)
            const dt = Math.min(now - lastTime, 50); lastTime = now

            let bass = 0, mids = 0, totalE = 0
            if (analyser) {
                const bins = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(bins)
                const n = bins.length, be = Math.floor(n * 0.12), me = Math.floor(n * 0.5)
                for (let i = 0; i < be; i++) bass += bins[i]; bass /= be * 255
                for (let i = be; i < me; i++) mids += bins[i]; mids /= (me - be) * 255
                for (let i = 0; i < n; i++) totalE += bins[i]; totalE /= n * 255
            }

            // Fast-attack, slow-release bass envelope for punchy pulse
            bassSmooth.current = bass > bassSmooth.current
                ? bassSmooth.current + (bass - bassSmooth.current) * 0.7
                : bassSmooth.current * 0.88
            const pulse = bassSmooth.current

            // Trail alpha: thinner trail during bass hits = longer ghost streaks
            const trailAlpha = 0.18 - pulse * 0.1
            ctx.fillStyle = `rgba(10,10,10,${trailAlpha})`; ctx.fillRect(0, 0, W, H)

            const mx = mouseRef.current.x, my = mouseRef.current.y, mInside = mouseRef.current.inside
            const nmx = mx < 0 ? 0.5 : Math.max(0, Math.min(1, mx / W))
            const nmy = my < 0 ? 0.5 : Math.max(0, Math.min(1, my / H))
            // Hue sweeps with mouse X, lightness with mouse Y; bass brightens everything
            const hue = Math.round(nmx * 240 + 80)
            const lum = Math.round(48 - nmy * 14 + pulse * 18)
            const sat = Math.round(65 + pulse * 20)
            const clrConn = (a: number) => `hsla(${hue},${sat}%,${lum}%,${a})`
            const clrMain = (a: number) => `hsla(${hue},${sat + 10}%,${lum + 18}%,${a})`
            const clrGlow = (a: number) => `hsla(${hue},${sat}%,${lum + 28}%,${a})`
            const clrDim  = (a: number) => `hsla(${hue},${sat - 15}%,${lum - 8}%,${a})`

            const ATTRACT_R = 200, ACTIVATE_R = 100, PULL_STR = 0.032
            spawnCd -= dt

            // Burst-spawn on bass transients
            const alive = cells.filter(c => c.type !== "decay")
            if (bass > BIO.BASS_THRESHOLD && spawnCd <= 0 && alive.length < maxAlive) {
                const count = BIO.SPAWN_COUNT_BASE + Math.floor(bass * BIO.SPAWN_COUNT_BASS)
                for (let i = 0; i < count; i++) {
                    const p = alive[Math.floor(Math.random() * alive.length)]
                    const ang = Math.random() * Math.PI * 2
                    const d = BIO.SPAWN_DIST_MIN + Math.random() * (BIO.SPAWN_DIST_MAX - BIO.SPAWN_DIST_MIN)
                    const spx = p ? p.x + Math.cos(ang) * d : W / 2 + (Math.random() - 0.5) * W * 0.6
                    const spy = p ? p.y + Math.sin(ang) * d : H / 2 + (Math.random() - 0.5) * H * 0.6
                    const s = makeCell(spx, spy, "spore")
                    const speed = 0.8 + bass * 3.5
                    s.vx = Math.cos(ang) * speed; s.vy = Math.sin(ang) * speed; s.energy = bass
                    cells.push(s)
                }
                spawnCd = BIO.SPAWN_COOLDOWN + (1 - bass) * 30
            }

            // Connections — reach and brightness scale with energy and pulse
            const connD = BIO.CONNECT_DIST + totalE * BIO.CONNECT_ENERGY
            const connWidth = 0.5 + pulse * 1.8
            for (let i = 0; i < cells.length - 1; i++) {
                const a = cells[i]; if (a.type === "decay") continue
                for (let j = i + 1; j < cells.length; j++) {
                    const b = cells[j]; if (b.type === "decay") continue
                    const dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < connD) {
                        const t = 1 - dist / connD
                        const alpha = t * t * (0.5 + pulse * 0.5) * Math.min(a.life, b.life)
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
                        ctx.strokeStyle = clrConn(alpha); ctx.lineWidth = connWidth; ctx.stroke()
                    }
                }
            }

            for (let i = cells.length - 1; i >= 0; i--) {
                const c = cells[i]
                if (c.type !== "decay") {
                    c.x += c.vx * (dt / 16); c.y += c.vy * (dt / 16)
                    c.vx *= BIO.FRICTION; c.vy *= BIO.FRICTION

                    // Elliptical boundary nudge
                    const cx = W / 2, cy = H / 2
                    const bx = W * BIO.BOUNDARY_X, by = H * BIO.BOUNDARY_Y
                    const nx2 = (c.x - cx) / bx, ny2 = (c.y - cy) / by
                    const norm = Math.sqrt(nx2 * nx2 + ny2 * ny2)
                    if (norm > 1) {
                        const cdist = Math.sqrt((c.x - cx) ** 2 + (c.y - cy) ** 2)
                        const pull = (norm - 1) * BIO.BOUNDARY_FORCE
                        c.vx += (cx - c.x) / cdist * pull * (dt / 16)
                        c.vy += (cy - c.y) / cdist * pull * (dt / 16)
                    }

                    // Mouse: global field drift + close-range pull
                    if (mInside) {
                        const ddx = mx - c.x, ddy = my - c.y, dd = Math.sqrt(ddx * ddx + ddy * ddy)
                        if (dd > 1) { c.vx += (ddx / dd) * BIO.MOUSE_FIELD_STR * (dt / 16); c.vy += (ddy / dd) * BIO.MOUSE_FIELD_STR * (dt / 16) }
                        if (dd < ATTRACT_R && dd > 1) { const falloff = (1 - dd / ATTRACT_R) ** 2; c.vx += (ddx / dd) * PULL_STR * falloff * (dt / 16); c.vy += (ddy / dd) * PULL_STR * falloff * (dt / 16) }
                        if (dd < ACTIVATE_R && c.type === "cell") c.type = "active"
                        if (dd < ATTRACT_R) c.energy = Math.min(1, c.energy + (1 - dd / ATTRACT_R) * 0.5 * (dt / 16) * 0.06)
                    }

                    // Energy: mids + bass pulse both drive it
                    const targetE = mids * 1.2 + pulse * 0.8
                    c.energy += (targetE - c.energy) * 0.22
                    c.energy = Math.min(1, Math.max(0, c.energy))

                    // Cells live longer when music is energetic
                    c.life -= (dt / 16) / c.maxLife * Math.max(0.3, 1 - totalE * 0.7)

                    if (c.type === "spore") {
                        c.sporeRadius -= (dt / 16) * 0.12
                        if (c.sporeRadius <= 0.5) c.type = c.energy > 0.15 ? "active" : "cell"
                    } else {
                        if (c.type === "cell" && c.energy > 0.2) c.type = "active"
                        else if (c.type === "active" && c.energy < 0.08 && (!mInside || Math.sqrt((mx - c.x) ** 2 + (my - c.y) ** 2) > ACTIVATE_R)) c.type = "cell"
                    }
                    if (c.life <= 0) { c.type = "decay"; c.decayAlpha = 1 }
                } else {
                    c.decayAlpha -= (dt / 16) * 0.045
                    if (c.decayAlpha <= 0) { cells.splice(i, 1); continue }
                }

                const a = c.type === "decay" ? c.decayAlpha : Math.max(0, c.life)
                if (c.type === "spore") {
                    // Ring expands outward, shrinking to a bright core
                    ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(1, c.sporeRadius), 0, Math.PI * 2)
                    ctx.strokeStyle = clrMain(a * (0.8 + pulse * 0.4)); ctx.lineWidth = 1.4; ctx.stroke()
                    ctx.beginPath(); ctx.arc(c.x, c.y, 2.2, 0, Math.PI * 2)
                    ctx.fillStyle = clrGlow(a); ctx.fill()
                } else if (c.type === "active") {
                    // Large glow that pulses with bass
                    const glowR = 14 + pulse * 12
                    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, glowR)
                    g.addColorStop(0, clrGlow(a * (0.4 + pulse * 0.5 + c.energy * 0.2)))
                    g.addColorStop(1, "rgba(0,0,0,0)")
                    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, glowR, 0, Math.PI * 2); ctx.fill()
                    // Solid bright core
                    ctx.beginPath(); ctx.arc(c.x, c.y, 2.5 + pulse * 1.5, 0, Math.PI * 2)
                    ctx.fillStyle = clrMain(a); ctx.fill()
                } else if (c.type === "cell") {
                    ctx.beginPath(); ctx.arc(c.x, c.y, 2 + pulse * 0.8, 0, Math.PI * 2)
                    ctx.fillStyle = clrConn(a * 0.75); ctx.fill()
                } else if (c.type === "decay") {
                    const s = 4.5; ctx.strokeStyle = clrDim(c.decayAlpha * 0.5); ctx.lineWidth = 1
                    ctx.beginPath(); ctx.moveTo(c.x - s, c.y - s); ctx.lineTo(c.x + s, c.y + s)
                    ctx.moveTo(c.x + s, c.y - s); ctx.lineTo(c.x - s, c.y + s); ctx.stroke()
                }
            }

            // Replenish population
            if (cells.filter(c => c.type !== "decay").length < BIO.REPLENISH_MIN) {
                const alivePop = cells.filter(c => c.type !== "decay")
                for (let i = 0; i < BIO.REPLENISH_BATCH; i++) {
                    if (alivePop.length > 0) {
                        const ref = alivePop[Math.floor(Math.random() * alivePop.length)]
                        const ang = Math.random() * Math.PI * 2, d = 30 + Math.random() * 80
                        cells.push(makeCell(ref.x + Math.cos(ang) * d, ref.y + Math.sin(ang) * d))
                    } else {
                        cells.push(makeCell(W * 0.1 + Math.random() * W * 0.8, H * 0.1 + Math.random() * H * 0.8))
                    }
                }
            }
        }

        rafRef.current = requestAnimationFrame(draw)
        const ro = new ResizeObserver(init); ro.observe(canvas)
        return () => {
            cancelAnimationFrame(rafRef.current); ro.disconnect()
            window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseleave", onLeave)
        }
    }, [analyser])

    return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", opacity: active ? 1 : 0.1, transition: "opacity 2.5s ease", pointerEvents: "none", zIndex: 0 }} />
}

// ─── Legend ────────────────────────────────────────────────────────────────────
function Legend() {
    return (
        <div style={{ position: "fixed", bottom: "28px", left: "32px", zIndex: 20, fontFamily: "'SF Mono','Courier New',monospace", fontSize: "13px", lineHeight: "1.8", color: "rgba(0,175,70,0.4)", pointerEvents: "none" }}>
            {[["·", "cell"], ["•", "active cell"], ["o", "spore / new cell"], ["—", "connection"], ["×", "decay"]].map(([s, l]) => (
                <div key={l}><span style={{ display: "inline-block", width: "16px" }}>{s}</span><span style={{ opacity: 0.7 }}>{l}</span></div>
            ))}
        </div>
    )
}

// ─── Audio hint ────────────────────────────────────────────────────────────────
function AudioHint({ playing }: { playing: boolean }) {
    return (
        <div style={{
            position: "fixed", bottom: "78px", right: "32px", zIndex: 20,
            fontFamily: "'SF Mono','Courier New',monospace", fontSize: "11px", lineHeight: "1.75",
            color: "rgba(245,245,245,0.22)", pointerEvents: "none", textAlign: "right",
            opacity: playing ? 1 : 0, transition: "opacity 1.2s ease",
            maxWidth: "340px",
        }}>
            <div style={{ marginBottom: "4px", opacity: 0.5, letterSpacing: "0.12em", textTransform: "uppercase", fontSize: "10px" }}>mouse → audio</div>
            <div>Y — lowpass filter · top = open (18kHz) · bottom = closed (100Hz)</div>
            <div>X — 16th-note stutter · left = off · right = 65% chop @ 128 BPM</div>
        </div>
    )
}

// ─── Right Panel ───────────────────────────────────────────────────────────────
function RightPanel({ visible, accentColor, typingSpeed }: { visible: boolean; accentColor: string; typingSpeed: number }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [atBottom, setAtBottom] = useState(false)
    const [revealedLines, setRevealedLines] = useState<PanelLine[]>([])
    const [partialText, setPartialText] = useState("")
    const [currentLine, setCurrentLine] = useState<PanelLine | null>(null)
    const [isTypingPanel, setIsTypingPanel] = useState(false)
    const lines = useMemo(() => buildLines(accentColor), [accentColor])

    useEffect(() => {
        const el = scrollRef.current; if (!el) return
        const check = () => setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 16)
        check(); el.addEventListener("scroll", check, { passive: true }); return () => el.removeEventListener("scroll", check)
    }, [visible])

    useEffect(() => {
        if (!isTypingPanel) return
        const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight
    }, [revealedLines.length, isTypingPanel])

    useEffect(() => {
        if (!visible) return
        setRevealedLines([]); setPartialText(""); setCurrentLine(null); setIsTypingPanel(true)
        let lineIdx = 0, timer: ReturnType<typeof setTimeout> | null = null, cancelled = false
        const nextLine = () => {
            if (cancelled) return
            if (lineIdx >= lines.length) { setCurrentLine(null); setIsTypingPanel(false); return }
            const line = lines[lineIdx]; setCurrentLine(line)
            if (line.isBlank) {
                timer = setTimeout(() => { if (cancelled) return; setRevealedLines(prev => [...prev, line]); lineIdx++; nextLine() }, 30)
                return
            }
            let charIdx = 0; setPartialText("")
            const typeChar = () => {
                if (cancelled) return; charIdx++; setPartialText(line.text.slice(0, charIdx))
                if (charIdx < line.text.length) { timer = setTimeout(typeChar, typingSpeed) }
                else { timer = setTimeout(() => { if (cancelled) return; setRevealedLines(prev => [...prev, line]); setPartialText(""); lineIdx++; nextLine() }, 40) }
            }
            timer = setTimeout(typeChar, typingSpeed)
        }
        nextLine()
        return () => { cancelled = true; if (timer) clearTimeout(timer) }
    }, [visible]) // eslint-disable-line react-hooks/exhaustive-deps

    const renderLine = (line: PanelLine, text: string, key: string | number) => (
        <div key={key} style={{ fontSize: "13px", lineHeight: "1.6", color: line.color, opacity: line.isBlank ? 0 : (line.opacity ?? 1), letterSpacing: line.letterSpacing, textTransform: line.textTransform, marginBottom: line.isBlank ? "8px" : `${line.marginBottom ?? 3}px`, paddingBottom: line.paddingBottom ? `${line.paddingBottom}px` : undefined, borderBottom: line.borderBottom, minHeight: line.isBlank ? "8px" : undefined, whiteSpace: "pre-wrap" }}>
            {line.isBlank ? " " : text}
        </div>
    )

    return (
        <div style={{ opacity: visible ? 1 : 0, transition: "opacity 0.2s ease", pointerEvents: visible ? "auto" : "none", width: "340px", flexShrink: 0, position: "relative", maxHeight: "80vh", zIndex: 4, fontFamily: "'SF Mono','Fira Code','JetBrains Mono','Courier New',monospace" }}>
            <div ref={scrollRef} style={{ overflowY: "auto", maxHeight: "80vh", paddingRight: "8px", scrollbarWidth: "none" }}>
                {revealedLines.map((line, i) => renderLine(line, line.text, i))}
                {currentLine && !currentLine.isBlank && renderLine(currentLine, partialText, "current")}
            </div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "80px", pointerEvents: "none", background: "linear-gradient(to bottom, transparent, rgb(10,10,10))", opacity: atBottom ? 0 : 1, transition: "opacity 0.4s ease" }} />
        </div>
    )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function TerminalConsole({ typingSpeed = 35, accentColor = "#b5f0a5" }: { typingSpeed?: number; accentColor?: string }) {
    const isCanvas = RenderTarget.current() === RenderTarget.canvas
    const [phaseIndex, setPhaseIndex] = useState(0)
    const [displayed, setDisplayed] = useState("")
    const [glitchedText, setGlitchedText] = useState<string | null>(null)
    const [isTyping, setIsTyping] = useState(true)
    const [cursorOn, setCursorOn] = useState(true)
    const [nState, setNState] = useState<"idle" | "sassy" | "main">("idle")
    const [sassyDisplayed, setSassyDisplayed] = useState("")
    const [history, setHistory] = useState<{ text: string; dim?: boolean }[]>([])
    const [musicPlaying, setMusicPlaying] = useState(false)
    const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
    const [panelVisible, setPanelVisible] = useState(false)
    const [projectsVisible, setProjectsVisible] = useState(false)

    const charIndex = useRef(0)
    const audioVals = useRef({ bass: 0, energy: 0 })
    const terminalRef = useRef<HTMLDivElement>(null)
    const vignetteRef = useRef<HTMLDivElement>(null)
    const shakeRef = useRef({ x: 0, y: 0, decay: 0, prevBass: 0 })
    const glitchCooldown = useRef(0)
    const mouseAudioRef = useRef({ x: 0.5, y: 0.5 })
    const stutterGateRef = useRef(true)
    const phase = PHASES[phaseIndex]

    useEffect(() => { if (!isCanvas) return; stopPlayback() }, [])
    useEffect(() => { if (phaseIndex >= 1) { const t = setTimeout(() => setPanelVisible(true), 400); return () => clearTimeout(t) } }, [phaseIndex])

    useEffect(() => {
        if (phaseIndex === 1 && !isTyping) {
            const t = setTimeout(() => { setHistory(h => [...h, { text: PHASES[1].text }]); setPhaseIndex(2) }, 1400)
            return () => clearTimeout(t)
        }
    }, [phaseIndex, isTyping])

    useEffect(() => {
        if (phaseIndex === 2 && !isTyping) {
            const t = setTimeout(() => setProjectsVisible(true), 1200)
            return () => clearTimeout(t)
        }
    }, [phaseIndex, isTyping])

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            mouseAudioRef.current.x = e.clientX / window.innerWidth
            mouseAudioRef.current.y = e.clientY / window.innerHeight
        }
        window.addEventListener("mousemove", onMove, { passive: true })
        return () => window.removeEventListener("mousemove", onMove)
    }, [])

    // Audio effect loop: Y = filter cutoff, X = 16th-note gate depth
    useEffect(() => {
        if (!analyser) return
        let raf = 0
        const loop = () => {
            raf = requestAnimationFrame(loop)
            const bins = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(bins)
            const n = bins.length, bassEnd = Math.floor(n * 0.12)
            let bassRaw = 0, totalRaw = 0
            for (let i = 0; i < bassEnd; i++) bassRaw += bins[i]; bassRaw /= bassEnd * 255
            for (let i = 0; i < n; i++) totalRaw += bins[i]; totalRaw /= n * 255
            audioVals.current.bass += (bassRaw - audioVals.current.bass) * 0.25
            audioVals.current.energy += (totalRaw - audioVals.current.energy) * 0.1
            const { bass, energy } = audioVals.current

            // Screen shake on transients
            const sk = shakeRef.current
            const transient = bass - sk.prevBass; sk.prevBass = bass
            if (transient > 0.08 && sk.decay <= 0) { sk.x = (Math.random() - 0.5) * bass * 5; sk.y = (Math.random() - 0.5) * bass * 3; sk.decay = 10 }
            if (sk.decay > 0) { sk.decay--; sk.x *= 0.65; sk.y *= 0.65 }
            const el = terminalRef.current
            if (el) { el.style.transform = `translate(${sk.x.toFixed(2)}px,${sk.y.toFixed(2)}px)`; el.style.textShadow = `0 0 ${(energy * 10).toFixed(1)}px rgba(245,245,245,${(energy * 0.35).toFixed(2)})` }
            const vg = vignetteRef.current
            if (vg) { const sz = 48 + energy * 8; vg.style.background = `radial-gradient(ellipse ${sz}% ${sz + 5}% at 50% 50%, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.45) 60%, transparent 100%)` }

            // Glitch on hard bass
            glitchCooldown.current -= 16
            if (bass > 0.4 && glitchCooldown.current <= 0 && Math.random() < bass * 0.4) {
                glitchCooldown.current = 300 + Math.random() * 400; setGlitchedText("TRIGGER")
            }

            const pCtx = window.__pf_ctx; if (!pCtx) return
            const filter = window.__pf_filter; const stutter = window.__pf_stutter
            const mx = mouseAudioRef.current.x, my = mouseAudioRef.current.y, now = pCtx.currentTime

            // Y axis → filter cutoff (top = open, bottom = closed)
            if (filter) filter.frequency.setTargetAtTime(80 * Math.pow(220, 1 - my), now, 0.06)

            // X axis → 16th-note gate depth (left = no stutter, right = full chop)
            if (stutter) {
                const dead = 0.05
                if (mx > dead) {
                    const depth = (mx - dead) / (1 - dead)
                    const sixteenth = 60 / STUTTER_BPM / 4
                    const ph = (now % sixteenth) / sixteenth
                    const gateOpen = ph < (1 - depth * 0.7)
                    if (gateOpen !== stutterGateRef.current) {
                        stutterGateRef.current = gateOpen
                        stutter.gain.cancelScheduledValues(now)
                        stutter.gain.setValueAtTime(stutter.gain.value, now)
                        stutter.gain.linearRampToValueAtTime(gateOpen ? 1 : Math.max(0, 1 - depth), now + 0.004)
                    }
                } else if (!stutterGateRef.current) {
                    stutterGateRef.current = true
                    stutter.gain.cancelScheduledValues(now)
                    stutter.gain.setValueAtTime(stutter.gain.value, now)
                    stutter.gain.linearRampToValueAtTime(1, now + 0.025)
                }
            }
        }
        raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf)
    }, [analyser])

    useEffect(() => {
        if (glitchedText !== "TRIGGER") return
        if (!displayed || isTyping) { setGlitchedText(null); return }
        const chars = displayed.split("")
        for (let i = 0; i < 1 + Math.floor(Math.random() * 4); i++) {
            const idx = Math.floor(Math.random() * chars.length)
            if (chars[idx] !== "\n" && chars[idx] !== " ") chars[idx] = GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        }
        setGlitchedText(chars.join(""))
        const t = setTimeout(() => setGlitchedText(null), 60 + Math.random() * 80); return () => clearTimeout(t)
    }, [glitchedText])

    useEffect(() => { const t = setInterval(() => setCursorOn(v => !v), 520); return () => clearInterval(t) }, [])

    useEffect(() => {
        charIndex.current = 0; setDisplayed(""); setIsTyping(true)
        const target = phase.text
        const t = setInterval(() => {
            charIndex.current++; setDisplayed(target.slice(0, charIndex.current))
            if (charIndex.current >= target.length) { clearInterval(t); setIsTyping(false) }
        }, typingSpeed)
        return () => clearInterval(t)
    }, [phaseIndex])

    useEffect(() => {
        if (nState !== "sassy") return
        let i = 0; setSassyDisplayed("")
        const t = setInterval(() => {
            i++; setSassyDisplayed(SASSY_RESPONSE.slice(0, i))
            if (i >= SASSY_RESPONSE.length) {
                clearInterval(t)
                setTimeout(() => { setNState("main"); setHistory(h => [...h, { text: SASSY_RESPONSE, dim: true }]); setSassyDisplayed(""); setPhaseIndex(1) }, 900)
            }
        }, typingSpeed)
        return () => clearInterval(t)
    }, [nState])

    const handleToggleMusic = () => {
        if (musicPlaying) { stopPlayback(); setMusicPlaying(false) }
        else { startPlayback().then(result => { if (result) { setAnalyser(result.analyser); setMusicPlaying(true) } }) }
    }
    const ensureAudioStarted = () => {
        if (isCanvas) return
        const audio = getAudio()
        if (!audio.paused) { if (!analyser) setAnalyser(getAnalyser()); return }
        startPlayback().then(result => { if (result) { setAnalyser(result.analyser); setMusicPlaying(true) } })
    }

    const handleY = () => {
        if (isTyping || phaseIndex >= PHASES.length - 1) return
        ensureAudioStarted(); setHistory(h => [...h, { text: phase.text }, { text: "> Y", dim: true }]); setPhaseIndex(1)
    }
    const handleN = () => {
        if (isTyping) return
        ensureAudioStarted(); setHistory(h => [...h, { text: phase.text }, { text: "> N", dim: true }]); setNState("sassy")
    }

    const lineBase: React.CSSProperties = { fontSize: "13px", lineHeight: "1.7", color: "rgba(245,245,245,0.92)", whiteSpace: "pre-wrap", marginBottom: "4px" }
    const dimLine: React.CSSProperties = { ...lineBase, color: "rgba(245,245,245,0.3)" }
    const btnBase: React.CSSProperties = { background: "none", border: "1px solid rgba(245,245,245,0.25)", color: "rgba(245,245,245,0.9)", fontFamily: "inherit", fontSize: "13px", padding: "3px 18px", cursor: "pointer", borderRadius: "2px", letterSpacing: "0.08em", transition: "border-color 0.15s, color 0.15s" }
    const activeText = glitchedText && glitchedText !== "TRIGGER" ? glitchedText : displayed

    return (
        <div style={{ width: "100%", minHeight: "100vh", backgroundColor: "rgb(10,10,10)", display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 24px", boxSizing: "border-box", fontFamily: "'SF Mono','Fira Code','JetBrains Mono','Courier New',monospace", position: "relative" }}>
            <AudioBiosphere analyser={analyser} active={musicPlaying} />
            <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 3, backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1px, transparent 4px)" }} />
            <div ref={vignetteRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1, background: "radial-gradient(ellipse 48% 53% at 50% 50%, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.45) 60%, transparent 100%)" }} />

            <div style={{ display: "flex", alignItems: "flex-start", gap: "72px", width: "100%", maxWidth: "1100px", zIndex: 4, justifyContent: panelVisible ? "flex-start" : "center" }}>
                <div ref={terminalRef} style={{ width: "560px", flexShrink: 0, willChange: "transform" }}>
                    {history.map((line, i) => <p key={i} style={line.dim ? dimLine : { ...lineBase, marginBottom: "12px" }}>{line.text}</p>)}

                    {phaseIndex === 0 && nState === "idle" && (
                        <div>
                            <p style={{ ...lineBase, marginBottom: "20px" }}>{activeText}{isTyping && <Cursor visible={cursorOn} />}</p>
                            {!isTyping && phase.prompt && (
                                <div style={{ display: "flex", gap: "10px", alignItems: "center", marginTop: "4px" }}>
                                    <span style={{ color: "rgba(245,245,245,0.4)", fontSize: "13px" }}>&gt;</span>
                                    <button style={btnBase} onClick={handleY} onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,245,245,0.25)"; e.currentTarget.style.color = "rgba(245,245,245,0.9)" }}>Y</button>
                                    <button style={btnBase} onClick={handleN} onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,100,100,0.7)"; e.currentTarget.style.color = "rgba(245,100,100,0.9)" }} onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,245,245,0.25)"; e.currentTarget.style.color = "rgba(245,245,245,0.9)" }}>N</button>
                                    <Cursor visible={cursorOn} />
                                </div>
                            )}
                        </div>
                    )}

                    {nState === "sassy" && <p style={{ ...lineBase, color: "rgba(245,245,245,0.55)", marginBottom: "20px" }}>{sassyDisplayed}<Cursor visible={cursorOn} /></p>}

                    {phaseIndex >= 1 && nState !== "sassy" && (
                        <div>
                            {PHASES[phaseIndex].input && <p style={dimLine}>&gt; {PHASES[phaseIndex].input}</p>}
                            <p style={{ ...lineBase, marginBottom: "20px" }}>
                                {phaseIndex === 2 && !isTyping
                                    ? <LogoLine accentColor={accentColor} />
                                    : <>{activeText}{isTyping && <Cursor visible={cursorOn} />}</>
                                }
                            </p>
                            {!isTyping && phaseIndex < 2 && <Cursor visible={cursorOn} />}
                            {phaseIndex === 2 && !projectsVisible && !isTyping && <Cursor visible={cursorOn} />}
                        </div>
                    )}

                    <ProjectListing visible={projectsVisible} accentColor={accentColor} />
                </div>

                <RightPanel visible={panelVisible} accentColor={accentColor} typingSpeed={typingSpeed} />
            </div>

            <Legend />
            {!isCanvas && <AudioHint playing={musicPlaying} />}
            {!isCanvas && <MusicToggle playing={musicPlaying} onToggle={handleToggleMusic} accentColor={accentColor} />}
        </div>
    )
}

addPropertyControls(TerminalConsole, {
    typingSpeed: { type: ControlType.Number, title: "Typing speed (ms)", defaultValue: 35, min: 10, max: 150, step: 5 },
    accentColor: { type: ControlType.Color, title: "Accent colour", defaultValue: "#b5f0a5" },
})
