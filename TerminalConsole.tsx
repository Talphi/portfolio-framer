import { useState, useEffect, useRef, useMemo } from "react"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

const PHASES = [
    { text: "Hello, I am Rhiddhit Paul.\nI am a product designer, music producer and DJ.\n\nKnow more about me?", prompt: true },
    { input: "Y", text: "I care about inclusivity and accessibility, and believe that as designers our duty is to help people experience deeper, richer emotions." },
    { text: "I have designed for Microsoft, Amazon, HP and more.", logos: true },
]

const SASSY_RESPONSE = "Too bad. I'll tell you anyway."
const AUDIO_URL = "https://files.catbox.moe/myys1b.mp3"
const GLITCH_CHARS = "▓░▒█▄▀▌▐■□◆◇▲▼◉⊕⊗01╗╝╔╚╬╠╣║═"
const STUTTER_BPM = 128

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

type PanelLine = {
    text: string; color: string; opacity?: number; letterSpacing?: string
    textTransform?: React.CSSProperties["textTransform"]; marginBottom?: number
    paddingBottom?: number; borderBottom?: string; isBlank?: boolean
}

function buildLines(accentColor: string): PanelLine[] {
    const acc = accentColor
    const lines: PanelLine[] = []
    const header = (text: string): PanelLine => ({ text, color: acc, opacity: 0.5, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6, paddingBottom: 8, borderBottom: "1px solid rgba(245,245,245,0.08)" })
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

declare global {
    interface Window {
        __pf_audio?: HTMLAudioElement; __pf_ctx?: AudioContext
        __pf_analyser?: AnalyserNode; __pf_filter?: BiquadFilterNode
        __pf_stutter?: GainNode; __pf_connected?: boolean
    }
}

function getAudio(): HTMLAudioElement {
    if (!window.__pf_audio) {
        const a = new Audio(); a.crossOrigin = "anonymous"; a.src = AUDIO_URL; a.loop = true; a.volume = 0
        window.__pf_audio = a
    }
    return window.__pf_audio
}
function getAnalyser(): AnalyserNode | null { return window.__pf_analyser ?? null }

function ensureAnalyser(): AnalyserNode {
    if (window.__pf_connected && window.__pf_analyser) return window.__pf_analyser
    const audio = getAudio()
    const ctx = new AudioContext(); window.__pf_ctx = ctx
    const analyser = ctx.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.75
    const filter = ctx.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 18000; filter.Q.value = 0.8
    window.__pf_filter = filter
    const stutter = ctx.createGain(); stutter.gain.value = 1; window.__pf_stutter = stutter
    const src = ctx.createMediaElementSource(audio)
    src.connect(analyser); analyser.connect(filter); filter.connect(stutter); stutter.connect(ctx.destination)
    window.__pf_analyser = analyser; window.__pf_connected = true
    return analyser
}

function fadeIn(audio: HTMLAudioElement, ms = 3000) {
    const steps = 60, target = 0.18, delta = target / steps; let cur = 0; audio.volume = 0
    const t = setInterval(() => { cur = Math.min(target, cur + delta); audio.volume = cur; if (cur >= target) clearInterval(t) }, ms / steps)
}
async function startPlayback(): Promise<AnalyserNode | null> {
    const audio = getAudio(); const node = ensureAnalyser(); window.__pf_ctx?.resume()
    try { await audio.play(); fadeIn(audio); return node } catch { return null }
}
function stopPlayback() { const audio = getAudio(); audio.pause(); audio.volume = 0 }

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
        <span>{"I have designed for "}<MsftIcon color={ic} />{"Microsoft, "}<AmazonIcon color={ic} />{"Amazon, "}<HpIcon color={ic} />{"HP and more."}</span>
    )
}

function Cursor({ visible }: { visible: boolean }) {
    return <span style={{ display: "inline-block", width: "8px", height: "1em", backgroundColor: "rgba(245,245,245,0.85)", verticalAlign: "text-bottom", marginLeft: "2px", opacity: visible ? 1 : 0, transition: "opacity 0.05s" }} />
}

function MusicToggle({ playing, onToggle, accentColor }: { playing: boolean; onToggle: () => void; accentColor: string }) {
    return (
        <button onClick={onToggle} title={playing ? "Pause music" : "Play music"} style={{ position: "fixed", bottom: "28px", right: "32px", background: "none", border: "1px solid rgba(245,245,245,0.15)", borderRadius: "4px", padding: "8px 14px", cursor: "pointer", display: "flex", alignItems: "flex-end", gap: "3px", height: "38px", opacity: 0.7, transition: "opacity 0.2s, border-color 0.2s", zIndex: 20 }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "rgba(245,245,245,0.4)" }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.borderColor = "rgba(245,245,245,0.15)" }}
        >
            {[0.4, 1, 0.6, 0.85, 0.5].map((h, i) => (
                <span key={i} style={{ display: "block", width: "3px", borderRadius: "1px", backgroundColor: playing ? accentColor : "rgba(245,245,245,0.4)", height: playing ? `${h * 18}px` : "5px", transition: "height 0.4s ease, background-color 0.3s" }} />
            ))}
        </button>
    )
}

// ─── Rec Button ────────────────────────────────────────────────────────────────
function RecButton({ isRecording, time, onStart, onStop }: { isRecording: boolean; time: number; onStart: () => void; onStop: () => void }) {
    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
    return (
        <button
            onClick={isRecording ? onStop : onStart}
            style={{
                position: "fixed", top: "28px", left: "32px", zIndex: 30,
                display: "flex", alignItems: "center", gap: "8px",
                background: "none", border: "1px solid rgba(245,245,245,0.15)", borderRadius: "4px",
                padding: "7px 14px", cursor: "pointer",
                fontFamily: "'SF Mono','Courier New',monospace", fontSize: "11px",
                letterSpacing: "0.14em",
                color: isRecording ? "rgba(245,245,245,0.85)" : "rgba(245,245,245,0.45)",
                transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(245,245,245,0.35)"; e.currentTarget.style.color = "rgba(245,245,245,0.9)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(245,245,245,0.15)"; e.currentTarget.style.color = isRecording ? "rgba(245,245,245,0.85)" : "rgba(245,245,245,0.45)" }}
        >
            <span style={{
                display: "inline-block", width: "7px", height: "7px", borderRadius: "50%",
                backgroundColor: "#ff3b30", flexShrink: 0,
                animation: isRecording ? "recBlink 1s ease-in-out infinite" : "recPulse 1.6s ease-in-out infinite",
            }} />
            {isRecording ? `${fmt(time)}  ■ stop` : "rec"}
        </button>
    )
}

// ─── Download Modal ────────────────────────────────────────────────────────────
function DownloadModal({ url, duration, onClose, accentColor }: { url: string; duration: number; onClose: () => void; accentColor: string }) {
    const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
    const ts = new Date()
    const filename = `biosphere-${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, "0")}${String(ts.getDate()).padStart(2, "0")}-${String(ts.getHours()).padStart(2, "0")}${String(ts.getMinutes()).padStart(2, "0")}.webm`
    return (
        <div
            style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.72)", backdropFilter: "blur(14px)", fontFamily: "'SF Mono','Courier New',monospace" }}
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
        >
            <div style={{ background: "rgb(12,12,12)", border: "1px solid rgba(245,245,245,0.12)", padding: "52px 48px", minWidth: "300px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ color: accentColor, opacity: 0.45, fontSize: "10px", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: "10px" }}>your biosphere</div>
                <div style={{ color: "rgba(245,245,245,0.28)", fontSize: "12px", letterSpacing: "0.06em", marginBottom: "40px" }}>recorded · {fmt(duration)}</div>
                <a
                    href={url} download={filename}
                    style={{ display: "block", width: "100%", boxSizing: "border-box", border: "1px solid rgba(245,245,245,0.22)", color: "rgba(245,245,245,0.8)", padding: "11px 28px", textDecoration: "none", fontSize: "12px", letterSpacing: "0.1em", marginBottom: "20px", transition: "border-color 0.15s, color 0.15s" }}
                    onMouseEnter={e => { const a = e.currentTarget; a.style.borderColor = accentColor; a.style.color = accentColor }}
                    onMouseLeave={e => { const a = e.currentTarget; a.style.borderColor = "rgba(245,245,245,0.22)"; a.style.color = "rgba(245,245,245,0.8)" }}
                >↓  download .webm</a>
                <button
                    onClick={onClose}
                    style={{ background: "none", border: "none", color: "rgba(245,245,245,0.22)", fontSize: "11px", letterSpacing: "0.1em", cursor: "pointer", transition: "color 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.color = "rgba(245,245,245,0.6)" }}
                    onMouseLeave={e => { e.currentTarget.style.color = "rgba(245,245,245,0.22)" }}
                >× close</button>
            </div>
        </div>
    )
}

// ─── Audio Biosphere ───────────────────────────────────────────────────────────
type CellType = "cell" | "active" | "spore" | "decay"
type Cell = {
    x: number; y: number; vx: number; vy: number
    life: number; maxLife: number; energy: number
    type: CellType; sporeRadius: number; decayAlpha: number
    driftPhase: number       // unique oscillation phase for organic float
    filterAffected: boolean  // 80% of spores respond to filter position
}

function makeCell(x: number, y: number, type: CellType = "cell"): Cell {
    return {
        x, y,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        life: type === "spore" ? 1 : 0.6 + Math.random() * 0.4,
        maxLife: 500 + Math.random() * 700, energy: 0, type,
        sporeRadius: type === "spore" ? 8 + Math.random() * 12 : 0,
        decayAlpha: 1,
        driftPhase: Math.random() * Math.PI * 2,
        filterAffected: Math.random() < 0.8,
    }
}

const ZONE_COLS = 6
const ZONE_ROWS = 4
const MIN_PER_ZONE = 2

function AudioBiosphere({ analyser, active, canvasRefOut }: {
    analyser: AnalyserNode | null
    active: boolean
    canvasRefOut?: React.MutableRefObject<HTMLCanvasElement | null>
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const rafRef = useRef<number>(0)
    const mouseRef = useRef({ x: -9999, y: -9999, inside: false })
    const frameCount = useRef(0)
    const bassSmooth = useRef(0)

    const assignCanvas = (el: HTMLCanvasElement | null) => {
        canvasRef.current = el
        if (canvasRefOut) canvasRefOut.current = el
    }

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")!
        let cells: Cell[] = [], W = 0, H = 0, spawnCd = 0

        const init = () => {
            W = canvas.offsetWidth; H = canvas.offsetHeight
            canvas.width = W * devicePixelRatio; canvas.height = H * devicePixelRatio
            ctx.scale(devicePixelRatio, devicePixelRatio)
            cells = []
            const cellW = W / ZONE_COLS, cellH = H / ZONE_ROWS
            for (let row = 0; row < ZONE_ROWS; row++) {
                for (let col = 0; col < ZONE_COLS; col++) {
                    for (let k = 0; k < 2; k++) {
                        cells.push(makeCell(
                            col * cellW + cellW * 0.15 + Math.random() * cellW * 0.7,
                            row * cellH + cellH * 0.15 + Math.random() * cellH * 0.7
                        ))
                    }
                }
            }
            for (let i = 0; i < 9; i++) cells.push(makeCell(Math.random() * W, Math.random() * H))
        }
        init()

        const onMove = (e: MouseEvent) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY; mouseRef.current.inside = true }
        const onLeave = () => { mouseRef.current.inside = false }
        window.addEventListener("mousemove", onMove)
        window.addEventListener("mouseleave", onLeave)

        let lastTime = performance.now()
        const draw = (now: number) => {
            rafRef.current = requestAnimationFrame(draw)
            frameCount.current++
            const dt = Math.min(now - lastTime, 50); lastTime = now

            let bass = 0, mids = 0, totalE = 0
            if (analyser) {
                const bins = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(bins)
                const n = bins.length, be = Math.floor(n * 0.12), me = Math.floor(n * 0.5)
                for (let i = 0; i < be; i++) bass += bins[i]; bass /= be * 255
                for (let i = be; i < me; i++) mids += bins[i]; mids /= (me - be) * 255
                for (let i = 0; i < n; i++) totalE += bins[i]; totalE /= n * 255
            }

            bassSmooth.current = bass > bassSmooth.current
                ? bassSmooth.current + (bass - bassSmooth.current) * 0.7
                : bassSmooth.current * 0.88
            const pulse = bassSmooth.current

            const mx = mouseRef.current.x, my = mouseRef.current.y
            const mInside = mouseRef.current.inside
            const nmx = mx < 0 ? 0.5 : Math.max(0, Math.min(1, mx / W))
            const nmy = my < 0 ? 0.5 : Math.max(0, Math.min(1, my / H))

            // filterOpen: 1 = fully open (18kHz, bright), 0 = fully closed (100Hz, dark)
            const filterOpen = 1 - nmy
            // stutterDepth: 0 = no stutter, 1 = max stutter (matches audio stutter formula)
            const stutterDepth = nmx > 0.06 ? (nmx - 0.06) / (1 - 0.06) : 0

            const trailAlpha = Math.max(0.1, 0.2 - pulse * 0.08)
            ctx.fillStyle = `rgba(10,10,10,${trailAlpha})`
            ctx.fillRect(0, 0, W, H)

            // Color palette from mouse X (hue) and Y (lightness)
            const hue = Math.round(nmx * 260 + 80)
            const sat = Math.round(72 + pulse * 22)
            const lum = Math.round(50 - nmy * 14 + pulse * 16)
            const clrConn   = (a: number) => `hsla(${hue},${sat}%,${lum}%,${a})`
            const clrCell   = (a: number) => `hsla(${hue},${sat}%,${lum - 6}%,${a})`
            const clrSpore  = (a: number) => `hsla(${hue},${sat + 8}%,${lum + 12}%,${a})`
            const clrGlow   = (a: number) => `hsla(${hue},${sat + 10}%,${lum + 28}%,${a})`
            const clrActive = (a: number) => `hsla(${hue},${sat + 12}%,${lum + 22}%,${a})`
            const clrDecay  = (a: number) => `hsla(${hue},${sat - 20}%,${lum - 12}%,${a})`

            const ATTRACT_R = 160, ACTIVATE_R = 70, PULL_STR = 0.018

            spawnCd -= dt
            const alive = cells.filter(c => c.type !== "decay")
            if (bass > 0.12 && spawnCd <= 0 && alive.length < 160) {
                const count = 2 + Math.floor(bass * 6)
                for (let i = 0; i < count; i++) {
                    const p = alive[Math.floor(Math.random() * alive.length)]
                    const ang = Math.random() * Math.PI * 2, d = 20 + Math.random() * 80
                    const s = makeCell(
                        p ? p.x + Math.cos(ang) * d : Math.random() * W,
                        p ? p.y + Math.sin(ang) * d : Math.random() * H,
                        "spore"
                    )
                    s.vx = Math.cos(ang) * 0.3; s.vy = Math.sin(ang) * 0.3; s.energy = bass
                    cells.push(s)
                }
                spawnCd = 100 + (1 - bass) * 100
            }

            const connD = 70 + totalE * 80
            const connWidth = 0.5 + pulse * 1.5
            for (let i = 0; i < cells.length - 1; i++) {
                const a = cells[i]; if (a.type === "decay") continue
                for (let j = i + 1; j < cells.length; j++) {
                    const b = cells[j]; if (b.type === "decay") continue
                    const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy)
                    if (d < connD) {
                        const t = 1 - d / connD
                        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
                        ctx.strokeStyle = clrConn(t * t * (0.35 + pulse * 0.4) * Math.min(a.life, b.life))
                        ctx.lineWidth = connWidth; ctx.stroke()
                    }
                }
            }

            for (let i = cells.length - 1; i >= 0; i--) {
                const c = cells[i]
                if (c.type !== "decay") {
                    c.x += c.vx * (dt / 16); c.y += c.vy * (dt / 16)

                    // Reduced friction so cells keep drifting (was 0.993)
                    c.vx *= 0.995; c.vy *= 0.995

                    // Organic floating: each cell oscillates on its own phase
                    const driftStr = 0.013
                    c.vx += Math.sin(now * 0.00065 + c.driftPhase) * driftStr * (dt / 16)
                    c.vy += Math.cos(now * 0.00088 + c.driftPhase * 1.7) * driftStr * (dt / 16)

                    // Gentle global field: all cells nudge slightly toward mouse quadrant
                    if (mInside) {
                        c.vx += (nmx - 0.5) * 0.006 * (dt / 16)
                        c.vy += (nmy - 0.5) * 0.006 * (dt / 16)
                    }

                    // Filter constriction: pull all cells toward centre as filter closes
                    const constriction = (1 - filterOpen) * 0.014
                    if (constriction > 0.0001) {
                        const toCx = W / 2 - c.x, toCy = H / 2 - c.y
                        const distToC = Math.sqrt(toCx * toCx + toCy * toCy)
                        if (distToC > 1) {
                            c.vx += (toCx / distToC) * constriction * (dt / 16)
                            c.vy += (toCy / distToC) * constriction * (dt / 16)
                        }
                    }

                    if (c.x < 0) { c.x = 0; c.vx *= -0.5 } if (c.x > W) { c.x = W; c.vx *= -0.5 }
                    if (c.y < 0) { c.y = 0; c.vy *= -0.5 } if (c.y > H) { c.y = H; c.vy *= -0.5 }

                    if (mInside) {
                        const ddx = mx - c.x, ddy = my - c.y, dd = Math.sqrt(ddx * ddx + ddy * ddy)
                        if (dd < ATTRACT_R && dd > 1) {
                            const falloff = (1 - dd / ATTRACT_R) * (1 - dd / ATTRACT_R)
                            c.vx += (ddx / dd) * PULL_STR * falloff * (dt / 16)
                            c.vy += (ddy / dd) * PULL_STR * falloff * (dt / 16)
                        }
                        if (dd < ACTIVATE_R && c.type === "cell") c.type = "active"
                        if (dd < ATTRACT_R) c.energy = Math.min(1, c.energy + (1 - dd / ATTRACT_R) * 0.5 * (dt / 16) * 0.04)
                    }

                    c.energy += (mids * 1.4 + pulse * 0.6 - c.energy) * 0.14
                    c.energy = Math.min(1, Math.max(0, c.energy))
                    c.life -= (dt / 16) / c.maxLife * (1 + (1 - totalE) * 0.8)

                    if (c.type === "spore") {
                        c.sporeRadius -= (dt / 16) * 0.08
                        if (c.sporeRadius <= 0.5) c.type = c.energy > 0.15 ? "active" : "cell"
                    } else {
                        if (c.type === "cell" && c.energy > 0.15) c.type = "active"
                        else if (c.type === "active" && c.energy < 0.06 && (!mInside || Math.sqrt((mx - c.x) ** 2 + (my - c.y) ** 2) > ACTIVATE_R)) c.type = "cell"
                    }
                    if (c.life <= 0) { c.type = "decay"; c.decayAlpha = 1 }
                } else {
                    c.decayAlpha -= (dt / 16) * 0.04
                    if (c.decayAlpha <= 0) { cells.splice(i, 1); continue }
                }

                const a = c.type === "decay" ? c.decayAlpha : Math.max(0, c.life)

                if (c.type === "spore") {
                    // Filter maps to size and brightness for 80% of spores
                    const filterScale = c.filterAffected ? (0.25 + filterOpen * 0.75) : 1
                    const effectiveR = Math.max(0.5, c.sporeRadius * filterScale)
                    const baseAlpha = a * (0.7 + pulse * 0.5)

                    ctx.strokeStyle = clrSpore(baseAlpha)
                    ctx.lineWidth = 1.2 + pulse * 0.8

                    if (stutterDepth > 0.04 && effectiveR > 0.5) {
                        // Jittered polygon — jaggedness scales with stutter depth
                        const jitterAmt = stutterDepth * effectiveR * 0.45
                        const segments = 20
                        ctx.beginPath()
                        for (let seg = 0; seg <= segments; seg++) {
                            const angle = (seg / segments) * Math.PI * 2
                            const jitter = (Math.random() - 0.5) * 2 * jitterAmt
                            const r = Math.max(0.3, effectiveR + jitter)
                            const px = c.x + Math.cos(angle) * r
                            const py = c.y + Math.sin(angle) * r
                            seg === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
                        }
                        ctx.closePath()
                        ctx.stroke()
                    } else {
                        ctx.beginPath()
                        ctx.arc(c.x, c.y, effectiveR, 0, Math.PI * 2)
                        ctx.stroke()
                    }

                    ctx.beginPath(); ctx.arc(c.x, c.y, 1.8, 0, Math.PI * 2)
                    ctx.fillStyle = clrGlow(a); ctx.fill()

                } else if (c.type === "active") {
                    const glowR = 12 + pulse * 14
                    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, glowR)
                    g.addColorStop(0, clrGlow(a * (0.45 + pulse * 0.55))); g.addColorStop(1, "rgba(0,0,0,0)")
                    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, glowR, 0, Math.PI * 2); ctx.fill()
                    ctx.beginPath(); ctx.arc(c.x, c.y, 2.5 + pulse * 1.5, 0, Math.PI * 2)
                    ctx.fillStyle = clrActive(a); ctx.fill()
                } else if (c.type === "cell") {
                    ctx.beginPath(); ctx.arc(c.x, c.y, 1.5 + pulse * 0.8, 0, Math.PI * 2)
                    ctx.fillStyle = clrCell(a * 0.7); ctx.fill()
                } else if (c.type === "decay") {
                    const s = 3.5; ctx.strokeStyle = clrDecay(c.decayAlpha * 0.55); ctx.lineWidth = 1
                    ctx.beginPath()
                    ctx.moveTo(c.x - s, c.y - s); ctx.lineTo(c.x + s, c.y + s)
                    ctx.moveTo(c.x + s, c.y - s); ctx.lineTo(c.x - s, c.y + s)
                    ctx.stroke()
                }
            }

            if (frameCount.current % 90 === 0) {
                const zoneW = W / ZONE_COLS, zoneH = H / ZONE_ROWS
                const counts = new Array(ZONE_COLS * ZONE_ROWS).fill(0)
                for (const c of cells) {
                    if (c.type === "decay") continue
                    const zc = Math.min(ZONE_COLS - 1, Math.floor(c.x / zoneW))
                    const zr = Math.min(ZONE_ROWS - 1, Math.floor(c.y / zoneH))
                    counts[zr * ZONE_COLS + zc]++
                }
                for (let zr = 0; zr < ZONE_ROWS; zr++) {
                    for (let zc = 0; zc < ZONE_COLS; zc++) {
                        if (counts[zr * ZONE_COLS + zc] < MIN_PER_ZONE) {
                            cells.push(makeCell(
                                zc * zoneW + zoneW * 0.15 + Math.random() * zoneW * 0.7,
                                zr * zoneH + zoneH * 0.15 + Math.random() * zoneH * 0.7
                            ))
                        }
                    }
                }
            }
        }

        rafRef.current = requestAnimationFrame(draw)
        const ro = new ResizeObserver(init); ro.observe(canvas)
        return () => {
            cancelAnimationFrame(rafRef.current); ro.disconnect()
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("mouseleave", onLeave)
        }
    }, [analyser])

    return <canvas ref={assignCanvas} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", opacity: active ? 1 : 0.12, transition: "opacity 2.5s ease", pointerEvents: "none", zIndex: 0 }} />
}

function Legend() {
    return (
        <div style={{ position: "fixed", bottom: "28px", left: "32px", zIndex: 20, fontFamily: "'SF Mono','Courier New',monospace", fontSize: "13px", lineHeight: "1.8", color: "rgba(0,175,70,0.4)", pointerEvents: "none" }}>
            {[["·", "cell"], ["•", "active cell"], ["o", "spore / new cell"], ["—", "connection"], ["×", "decay"]].map(([s, l]) => (
                <div key={l}><span style={{ display: "inline-block", width: "16px" }}>{s}</span><span style={{ opacity: 0.7 }}>{l}</span></div>
            ))}
        </div>
    )
}

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

    // ── Recording state ──
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [showModal, setShowModal] = useState(false)
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
    const [recordedDuration, setRecordedDuration] = useState(0)

    const charIndex = useRef(0)
    const audioVals = useRef({ bass: 0, energy: 0 })
    const terminalRef = useRef<HTMLDivElement>(null)
    const vignetteRef = useRef<HTMLDivElement>(null)
    const shakeRef = useRef({ x: 0, y: 0, decay: 0, prevBass: 0 })
    const glitchCooldown = useRef(0)
    const mouseAudioRef = useRef({ x: 0.5, y: 0.5 })
    const stutterGateRef = useRef(true)

    // ── Recording refs ──
    const biosphereCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const recRafRef = useRef<number>(0)
    const audioDstRef = useRef<MediaStreamAudioDestinationNode | null>(null)
    const recordingTimeRef = useRef(0)

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
        const onMove = (e: MouseEvent) => { mouseAudioRef.current.x = e.clientX / window.innerWidth; mouseAudioRef.current.y = e.clientY / window.innerHeight }
        window.addEventListener("mousemove", onMove, { passive: true }); return () => window.removeEventListener("mousemove", onMove)
    }, [])

    // ── Recording cleanup ──
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop()
            cancelAnimationFrame(recRafRef.current)
            if (recTimerRef.current) clearInterval(recTimerRef.current)
        }
    }, [])

    const startRecording = () => {
        const biosphereCanvas = biosphereCanvasRef.current
        if (!biosphereCanvas) return

        const recCanvas = document.createElement("canvas")
        recCanvas.width = 800; recCanvas.height = 800
        const recCtx = recCanvas.getContext("2d")!

        const composite = () => {
            const bW = biosphereCanvas.width, bH = biosphereCanvas.height
            const side = Math.min(bW, bH)
            const sx = (bW - side) / 2, sy = (bH - side) / 2
            recCtx.drawImage(biosphereCanvas, sx, sy, side, side, 0, 0, 800, 800)
            recRafRef.current = requestAnimationFrame(composite)
        }
        recRafRef.current = requestAnimationFrame(composite)

        const videoStream = recCanvas.captureStream(30)

        let combinedStream: MediaStream
        const pCtx = window.__pf_ctx
        const stutterNode = window.__pf_stutter
        if (pCtx && stutterNode) {
            const dst = pCtx.createMediaStreamDestination()
            stutterNode.connect(dst)
            audioDstRef.current = dst
            combinedStream = new MediaStream([
                ...videoStream.getVideoTracks(),
                ...dst.stream.getAudioTracks(),
            ])
        } else {
            combinedStream = videoStream
        }

        chunksRef.current = []
        const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
            ? "video/webm;codecs=vp9,opus"
            : "video/webm"

        const recorder = new MediaRecorder(combinedStream, { mimeType })
        recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
        recorder.onstop = () => {
            cancelAnimationFrame(recRafRef.current)
            const dst = audioDstRef.current
            if (window.__pf_stutter && dst) { try { window.__pf_stutter.disconnect(dst) } catch {} }
            audioDstRef.current = null
            const blob = new Blob(chunksRef.current, { type: mimeType })
            const url = URL.createObjectURL(blob)
            setDownloadUrl(url)
            setShowModal(true)
        }

        mediaRecorderRef.current = recorder
        recorder.start(250)
        recordingTimeRef.current = 0
        setIsRecording(true)
        setRecordingTime(0)
        recTimerRef.current = setInterval(() => {
            recordingTimeRef.current++
            setRecordingTime(recordingTimeRef.current)
        }, 1000)

        // Auto-stop at 60s
        setTimeout(() => {
            if (mediaRecorderRef.current?.state === "recording") stopRecording()
        }, 60000)
    }

    const stopRecording = () => {
        if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null }
        setRecordedDuration(recordingTimeRef.current)
        setIsRecording(false)
        mediaRecorderRef.current?.stop()
    }

    const handleToggleMusic = () => {
        if (musicPlaying) { stopPlayback(); setMusicPlaying(false) }
        else { startPlayback().then(node => { if (node) { setAnalyser(node); setMusicPlaying(true) } }) }
    }
    const ensureAudioStarted = () => {
        if (isCanvas) return
        const audio = getAudio()
        if (!audio.paused) { if (!analyser) setAnalyser(getAnalyser()); return }
        startPlayback().then(node => { if (node) { setAnalyser(node); setMusicPlaying(true) } })
    }

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
            const sk = shakeRef.current
            const transient = bass - sk.prevBass; sk.prevBass = bass
            if (transient > 0.08 && sk.decay <= 0) { sk.x = (Math.random() - 0.5) * bass * 5; sk.y = (Math.random() - 0.5) * bass * 3; sk.decay = 10 }
            if (sk.decay > 0) { sk.decay--; sk.x *= 0.65; sk.y *= 0.65 }
            const el = terminalRef.current
            if (el) { el.style.transform = `translate(${sk.x.toFixed(2)}px,${sk.y.toFixed(2)}px)`; el.style.textShadow = `0 0 ${(energy * 10).toFixed(1)}px rgba(245,245,245,${(energy * 0.35).toFixed(2)})` }
            const vg = vignetteRef.current
            if (vg) { const sz = 48 + energy * 8; vg.style.background = `radial-gradient(ellipse ${sz}% ${sz + 5}% at 50% 50%, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.45) 60%, transparent 100%)` }
            glitchCooldown.current -= 16
            if (bass > 0.4 && glitchCooldown.current <= 0 && Math.random() < bass * 0.4) { glitchCooldown.current = 300 + Math.random() * 400; setGlitchedText("TRIGGER") }
            const pCtx = window.__pf_ctx; const filter = window.__pf_filter; const stutter = window.__pf_stutter
            if (!pCtx) return
            const mx = mouseAudioRef.current.x, my = mouseAudioRef.current.y, now = pCtx.currentTime
            if (filter) { const freq = 100 * Math.pow(180, 1 - my); filter.frequency.setTargetAtTime(freq, now, 0.08) }
            if (stutter) {
                const dead = 0.06
                if (mx > dead) {
                    const depth = (mx - dead) / (1 - dead)
                    const sixteenth = 60 / STUTTER_BPM / 4
                    const ph = (now % sixteenth) / sixteenth
                    const gateOpen = ph < (1 - depth * 0.65)
                    if (gateOpen !== stutterGateRef.current) {
                        stutterGateRef.current = gateOpen
                        stutter.gain.cancelScheduledValues(now); stutter.gain.setValueAtTime(stutter.gain.value, now)
                        stutter.gain.linearRampToValueAtTime(gateOpen ? 1 : Math.max(0, 1 - depth), now + 0.004)
                    }
                } else if (!stutterGateRef.current) {
                    stutterGateRef.current = true
                    stutter.gain.cancelScheduledValues(now); stutter.gain.setValueAtTime(stutter.gain.value, now)
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
        const t = setInterval(() => { charIndex.current++; setDisplayed(target.slice(0, charIndex.current)); if (charIndex.current >= target.length) { clearInterval(t); setIsTyping(false) } }, typingSpeed)
        return () => clearInterval(t)
    }, [phaseIndex])
    useEffect(() => {
        if (nState !== "sassy") return
        let i = 0; setSassyDisplayed("")
        const t = setInterval(() => {
            i++; setSassyDisplayed(SASSY_RESPONSE.slice(0, i))
            if (i >= SASSY_RESPONSE.length) { clearInterval(t); setTimeout(() => { setNState("main"); setHistory(h => [...h, { text: SASSY_RESPONSE, dim: true }]); setSassyDisplayed(""); setPhaseIndex(1) }, 900) }
        }, typingSpeed)
        return () => clearInterval(t)
    }, [nState])

    const handleY = () => { if (isTyping || phaseIndex >= PHASES.length - 1) return; ensureAudioStarted(); setHistory(h => [...h, { text: phase.text }, { text: "> Y", dim: true }]); setPhaseIndex(1) }
    const handleN = () => { if (isTyping) return; ensureAudioStarted(); setHistory(h => [...h, { text: phase.text }, { text: "> N", dim: true }]); setNState("sassy") }

    const lineBase: React.CSSProperties = { fontSize: "13px", lineHeight: "1.7", color: "rgba(245,245,245,0.92)", whiteSpace: "pre-wrap", marginBottom: "4px" }
    const dimLine: React.CSSProperties = { ...lineBase, color: "rgba(245,245,245,0.3)" }
    const btnBase: React.CSSProperties = { background: "none", border: "1px solid rgba(245,245,245,0.25)", color: "rgba(245,245,245,0.9)", fontFamily: "inherit", fontSize: "13px", padding: "3px 18px", cursor: "pointer", borderRadius: "2px", letterSpacing: "0.08em", transition: "border-color 0.15s, color 0.15s" }
    const activeText = glitchedText && glitchedText !== "TRIGGER" ? glitchedText : displayed

    return (
        <div style={{ width: "100%", minHeight: "100vh", backgroundColor: "rgb(10,10,10)", display: "flex", alignItems: "center", justifyContent: "center", padding: "64px 24px", boxSizing: "border-box", fontFamily: "'SF Mono','Fira Code','JetBrains Mono','Courier New',monospace", position: "relative" }}>
            <style>{`
                @keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:0.12} }
                @keyframes recBlink { 0%,100%{opacity:1} 50%{opacity:0.35} }
            `}</style>

            <AudioBiosphere analyser={analyser} active={musicPlaying} canvasRefOut={biosphereCanvasRef} />
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
                                {phaseIndex === 2 && !isTyping ? <LogoLine accentColor={accentColor} /> : <>{activeText}{isTyping && <Cursor visible={cursorOn} />}</>}
                            </p>
                            {!isTyping && <Cursor visible={cursorOn} />}
                        </div>
                    )}
                </div>
                <RightPanel visible={panelVisible} accentColor={accentColor} typingSpeed={typingSpeed} />
            </div>
            <Legend />
            <MusicToggle playing={musicPlaying} onToggle={handleToggleMusic} accentColor={accentColor} />
            {!isCanvas && <RecButton isRecording={isRecording} time={recordingTime} onStart={startRecording} onStop={stopRecording} />}
            {showModal && downloadUrl && (
                <DownloadModal
                    url={downloadUrl}
                    duration={recordedDuration}
                    onClose={() => setShowModal(false)}
                    accentColor={accentColor}
                />
            )}
        </div>
    )
}

addPropertyControls(TerminalConsole, {
    typingSpeed: { type: ControlType.Number, title: "Typing speed (ms)", defaultValue: 35, min: 10, max: 150, step: 5 },
    accentColor: { type: ControlType.Color, title: "Accent colour", defaultValue: "#b5f0a5" },
})
