//@name Heritage Phone
//@display-name 📱 도괴 — 헤리티지 ��양 스마트폰
//@api 3.0
//@version 3.1

(async () => {
try {

const PLUGIN_NAME  = "[Heritage Phone]";
const UI_ID        = "heritage-phone-root";
const STYLE_ID     = "heritage-phone-style";
const KEY_VISIBLE  = "heritage_phone_visible";
const KEY_TAB      = "heritage_phone_tab";

var _hasRisu = (typeof Risuai !== 'undefined');
var _ls = _hasRisu ? Risuai.safeLocalStorage : null;

async function lsGet(key) {
    try { return _ls ? await _ls.getItem(key) : localStorage.getItem(key); }
    catch(e) { return null; }
}
async function lsSet(key, val) {
    try { _ls ? await _ls.setItem(key, String(val)) : localStorage.setItem(key, String(val)); }
    catch(e) { console.warn(PLUGIN_NAME, e); }
}

var isVisible   = false;
var currentTab  = "home";
var msgRoom     = "list";
var _localGalTab = "scene";

function isHeritageChar() {
    if (!_hasRisu) return true;
    try {
        var v = Risuai.getChatVar ? Risuai.getChatVar("cv_step") : undefined;
        if (v && typeof v.then === 'function') return true; // Promise = var exists
        return v !== null && v !== undefined;
    } catch(e) { return false; }
}

// ── cv(): 비동기 chatVar 읽기 (핵심 수정) ──
async function cv(key, fallback) {
    var def = fallback !== undefined ? fallback : "";
    if (!_hasRisu) return def;
    try {
        var v = Risuai.getChatVar ? Risuai.getChatVar(key) : null;
        // Promise인 경우 await
        if (v && typeof v.then === 'function') {
            v = await v;
        }
        if (v === null || v === undefined) return def;
        var s = String(v);
        if (s === "" || s === "null" || s === "undefined") return def;
        return s;
    } catch(e) { return def; }
}

function safeSplit(raw, sep) {
    if (!raw) return [];
    var s = String(raw);
    if (!s || s === "null" || s === "undefined") return [];
    return s.split(sep).filter(Boolean);
}

// ─────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────
function injectStyles() {
    var existing = document.getElementById(STYLE_ID);
    if (existing) existing.remove();

    var css = `
#heritage-phone-root {
    position: fixed; bottom: 0; left: 0; right: 0; top: 0;
    z-index: 99999; display: flex; align-items: flex-end; justify-content: center;
    pointer-events: none; font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
}
#heritage-phone-root.hp-hidden { display: none; }
#hp-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.55);
    backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
    pointer-events: all; cursor: pointer; opacity: 0; transition: opacity 0.25s ease;
}
#heritage-phone-root:not(.hp-hidden) #hp-overlay { opacity: 1; }
#hp-panel {
    position: relative; width: 390px; max-width: 100vw; height: 844px; max-height: 95vh;
    background: #0a0a0f; border-radius: 48px 48px 0 0; overflow: hidden;
    pointer-events: all; display: flex; flex-direction: column;
    transform: translateY(100%); transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
    box-shadow: 0 -8px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08);
}
#heritage-phone-root:not(.hp-hidden) #hp-panel { transform: translateY(0); }
#hp-statusbar {
    flex-shrink: 0; height: 50px; display: flex; align-items: center;
    justify-content: space-between; padding: 0 28px;
    background: linear-gradient(180deg, #0a0a0f 0%, transparent 100%);
    position: relative; z-index: 10;
}
#hp-island {
    position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
    width: 120px; height: 34px; background: #000; border-radius: 20px;
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 10px; color: rgba(255,255,255,0.5); letter-spacing: 0.5px;
}
#hp-island-time { font-size: 11px; font-weight: 600; color: #fff; letter-spacing: 0.5px; }
.hp-status-left { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.9); min-width: 40px; }
.hp-status-right { display: flex; align-items: center; gap: 6px; min-width: 60px; justify-content: flex-end; }
.hp-signal { display: flex; align-items: flex-end; gap: 2px; height: 12px; }
.hp-signal span { width: 3px; background: rgba(255,255,255,0.9); border-radius: 1px; transition: opacity 0.3s; }
.hp-signal span:nth-child(1) { height: 4px; }
.hp-signal span:nth-child(2) { height: 6px; }
.hp-signal span:nth-child(3) { height: 9px; }
.hp-signal span:nth-child(4) { height: 12px; }
.hp-signal[data-sig="0"] span { opacity: 0.2; }
.hp-signal[data-sig="1"] span:nth-child(1) { opacity: 1; }
.hp-signal[data-sig="1"] span:nth-child(2),
.hp-signal[data-sig="1"] span:nth-child(3),
.hp-signal[data-sig="1"] span:nth-child(4) { opacity: 0.2; }
.hp-signal[data-sig="2"] span:nth-child(1),
.hp-signal[data-sig="2"] span:nth-child(2) { opacity: 1; }
.hp-signal[data-sig="2"] span:nth-child(3),
.hp-signal[data-sig="2"] span:nth-child(4) { opacity: 0.2; }
.hp-signal[data-sig="3"] span:nth-child(1),
.hp-signal[data-sig="3"] span:nth-child(2),
.hp-signal[data-sig="3"] span:nth-child(3) { opacity: 1; }
.hp-signal[data-sig="3"] span:nth-child(4) { opacity: 0.2; }
.hp-signal[data-sig="4"] span { opacity: 1; }
.hp-battery { display: flex; align-items: center; gap: 3px; font-size: 10px; color: rgba(255,255,255,0.7); }
.hp-battery-icon {
    width: 22px; height: 11px; border: 1.5px solid rgba(255,255,255,0.5);
    border-radius: 2px; position: relative; padding: 1.5px;
}
.hp-battery-icon::after {
    content: ''; position: absolute; right: -4px; top: 50%; transform: translateY(-50%);
    width: 2px; height: 5px; background: rgba(255,255,255,0.4); border-radius: 0 1px 1px 0;
}
.hp-battery-fill { height: 100%; border-radius: 1px; transition: width 0.3s, background 0.3s; }
#hp-header {
    flex-shrink: 0; padding: 0 24px 12px; display: flex;
    align-items: flex-end; justify-content: space-between;
}
#hp-header-title { font-size: 28px; font-weight: 700; color: #fff; letter-spacing: -0.5px; line-height: 1; }
#hp-header-sub { font-size: 12px; color: rgba(255,255,255,0.35); margin-bottom: 2px; }
#hp-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 0 20px 16px; scrollbar-width: none; }
#hp-content::-webkit-scrollbar { display: none; }
#hp-tabbar {
    flex-shrink: 0; height: 82px; display: flex; align-items: center;
    justify-content: space-around; padding: 8px 4px 0;
    background: rgba(10,10,15,0.95); backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px); border-top: 1px solid rgba(255,255,255,0.06);
}
.hp-tab {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 3px; padding: 6px 0; cursor: pointer; border-radius: 12px;
    transition: background 0.2s; -webkit-tap-highlight-color: transparent;
    position: relative; flex: 1;
}
.hp-tab:active { background: rgba(255,255,255,0.06); }
.hp-tab-icon { font-size: 21px; line-height: 1; transition: transform 0.15s; }
.hp-tab.active .hp-tab-icon { transform: scale(1.08); }
.hp-tab-label {
    font-size: 9px; font-weight: 500; color: rgba(255,255,255,0.35);
    letter-spacing: 0.2px; transition: color 0.2s; white-space: nowrap;
}
.hp-tab.active .hp-tab-label { color: #fff; }
.hp-tab-badge {
    position: absolute; top: 2px; right: 8px; min-width: 16px; height: 16px;
    background: #ff3b30; border-radius: 8px; font-size: 9px; font-weight: 700;
    color: #fff; display: flex; align-items: center; justify-content: center; padding: 0 4px;
}
#hp-close-btn {
    position: absolute; top: 14px; right: 20px; width: 30px; height: 30px;
    border-radius: 50%; background: rgba(255,255,255,0.1); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center; font-size: 14px;
    color: rgba(255,255,255,0.6); z-index: 20; -webkit-tap-highlight-color: transparent;
    transition: background 0.15s, color 0.15s;
}
#hp-close-btn:active { background: rgba(255,255,255,0.2); color: #fff; }
#hp-emergency-toast {
    position: absolute; top: 60px; left: 12px; right: 12px;
    background: rgba(20, 6, 6, 0.97); border: 1px solid rgba(255,59,48,0.5);
    border-radius: 14px; padding: 13px 14px; display: flex; gap: 10px;
    align-items: flex-start; z-index: 50; box-shadow: 0 4px 24px rgba(255,59,48,0.2);
    animation: hp-toast-in 0.3s cubic-bezier(0.32,0.72,0,1) forwards; cursor: pointer;
}
#hp-emergency-toast.hp-toast-hiding { animation: hp-toast-out 0.3s ease-in forwards; }
@keyframes hp-toast-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes hp-toast-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-10px); } }
.hp-toast-icon { font-size: 20px; flex-shrink: 0; }
.hp-toast-body { flex: 1; min-width: 0; }
.hp-toast-title { font-size: 10px; font-weight: 700; color: #ff6961; letter-spacing: 0.6px; margin-bottom: 3px; }
.hp-toast-text { font-size: 12px; color: rgba(255,255,255,0.75); line-height: 1.45; }
.hp-toast-time { font-size: 10px; color: rgba(255,100,90,0.5); margin-top: 3px; }
.hp-toast-dismiss { font-size: 14px; color: rgba(255,255,255,0.3); flex-shrink: 0; align-self: center; }
.hp-card {
    background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 16px; margin-bottom: 12px;
}
.hp-card-title {
    font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35);
    text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px;
}
.hp-widget-time {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
    border: 1px solid rgba(255,255,255,0.08); border-radius: 20px;
    padding: 20px 20px 16px; margin-bottom: 12px; position: relative; overflow: hidden;
}
.hp-widget-time::before {
    content: ''; position: absolute; top: -30px; right: -30px;
    width: 120px; height: 120px;
    background: radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%);
    pointer-events: none;
}
.hp-time-big {
    font-size: 52px; font-weight: 200; color: #fff; letter-spacing: -2px;
    line-height: 1; font-variant-numeric: tabular-nums;
}
.hp-time-date { font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 4px; }
.hp-time-weather { margin-top: 12px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.6); }
.hp-phase-banner {
    border-radius: 14px; padding: 12px 16px; margin-bottom: 12px;
    display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 14px;
}
.hp-phase-1 { background: rgba(52,199,89,0.12); border: 1px solid rgba(52,199,89,0.25); color: #34c759; }
.hp-phase-2 { background: rgba(255,214,10,0.12); border: 1px solid rgba(255,214,10,0.25); color: #ffd60a; }
.hp-phase-3 { background: rgba(255,59,48,0.12); border: 1px solid rgba(255,59,48,0.3); color: #ff3b30; animation: hp-phase3-pulse 1.5s ease-in-out infinite; }
@keyframes hp-phase3-pulse {
    0%, 100% { border-color: rgba(255,59,48,0.3); box-shadow: none; }
    50% { border-color: rgba(255,59,48,0.7); box-shadow: 0 0 16px rgba(255,59,48,0.2); }
}
.hp-phase-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.hp-phase-1 .hp-phase-dot { background: #34c759; }
.hp-phase-2 .hp-phase-dot { background: #ffd60a; animation: hp-blink 1s ease-in-out infinite; }
.hp-phase-3 .hp-phase-dot { background: #ff3b30; animation: hp-blink 0.6s ease-in-out infinite; }
@keyframes hp-blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
.hp-location-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 4px; }
.hp-situation-text { font-size: 13px; color: rgba(255,255,255,0.75); line-height: 1.6; }
.hp-companion-chip {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.07); border-radius: 20px; padding: 6px 12px;
    font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 8px;
}
.hp-inv-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 8px; }
.hp-inv-item {
    aspect-ratio: 1; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 4px; font-size: 22px; position: relative; transition: background 0.15s;
}
.hp-inv-item.has-item { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.15); }
.hp-inv-item-label { font-size: 8px; color: rgba(255,255,255,0.4); text-align: center; line-height: 1.2; padding: 0 3px; }
.hp-timeline { display: flex; flex-direction: column; gap: 0; }
.hp-timeline-item { display: flex; gap: 12px; position: relative; padding-bottom: 16px; }
.hp-timeline-item:last-child { padding-bottom: 0; }
.hp-timeline-line { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 16px; }
.hp-timeline-dot {
    width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.2);
    border: 2px solid rgba(255,255,255,0.1); flex-shrink: 0; margin-top: 2px;
}
.hp-timeline-dot.active { background: #ffd60a; border-color: rgba(255,214,10,0.4); box-shadow: 0 0 8px rgba(255,214,10,0.4); }
.hp-timeline-dot.resolved { background: rgba(52,199,89,0.6); border-color: rgba(52,199,89,0.3); }
.hp-timeline-vline { width: 1px; flex: 1; background: rgba(255,255,255,0.07); margin-top: 3px; }
.hp-timeline-text { flex: 1; }
.hp-timeline-title { font-size: 13px; color: rgba(255,255,255,0.8); line-height: 1.4; }
.hp-timeline-time { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 2px; }
.hp-chat-list { display: flex; flex-direction: column; gap: 2px; }
.hp-chat-room {
    display: flex; align-items: center; gap: 12px; padding: 12px 4px;
    border-radius: 12px; cursor: pointer; transition: background 0.15s;
    -webkit-tap-highlight-color: transparent;
}
.hp-chat-room:active { background: rgba(255,255,255,0.05); }
.hp-chat-avatar {
    width: 46px; height: 46px; border-radius: 50%; background: rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center; font-size: 20px;
    flex-shrink: 0; position: relative;
}
.hp-chat-info { flex: 1; min-width: 0; }
.hp-chat-name { font-size: 14px; font-weight: 600; color: #fff; }
.hp-chat-preview {
    font-size: 12px; color: rgba(255,255,255,0.35); white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; margin-top: 2px;
}
.hp-chat-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.hp-chat-time { font-size: 10px; color: rgba(255,255,255,0.25); }
.hp-chat-unread {
    background: #ff3b30; color: #fff; font-size: 10px; font-weight: 700;
    border-radius: 8px; min-width: 18px; height: 18px; display: flex;
    align-items: center; justify-content: center; padding: 0 5px;
}
#hp-msg-back {
    display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.7);
    font-size: 14px; cursor: pointer; padding: 4px 0 12px; -webkit-tap-highlight-color: transparent;
}
.hp-msg-bubbles { display: flex; flex-direction: column; gap: 12px; }
.hp-bubble-wrap { display: flex; gap: 8px; align-items: flex-end; }
.hp-bubble-wrap.right { flex-direction: row-reverse; }
.hp-bubble-avatar {
    width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,0.08);
    display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;
}
.hp-bubble { max-width: 70%; padding: 10px 14px; border-radius: 18px; font-size: 13px; line-height: 1.5; }
.hp-bubble.left { background: rgba(255,255,255,0.09); border-bottom-left-radius: 4px; color: rgba(255,255,255,0.9); }
.hp-bubble.right { background: #6366f1; border-bottom-right-radius: 4px; color: #fff; }
.hp-bubble-sender { font-size: 10px; color: rgba(255,255,255,0.35); margin-bottom: 3px; margin-left: 2px; }
.hp-bubble-time { font-size: 9px; color: rgba(255,255,255,0.2); margin-top: 2px; }
.hp-chat-locked { text-align: center; padding: 32px 16px; color: rgba(255,255,255,0.3); font-size: 13px; }
.hp-chat-locked-icon { font-size: 32px; margin-bottom: 8px; }
.hp-sns-feed { display: flex; flex-direction: column; gap: 1px; }
.hp-sns-post {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px; padding: 14px; margin-bottom: 10px;
}
.hp-sns-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.hp-sns-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.hp-sns-name { font-size: 13px; font-weight: 600; color: #fff; }
.hp-sns-handle { font-size: 10px; color: rgba(255,255,255,0.35); }
.hp-sns-time { font-size: 10px; color: rgba(255,255,255,0.25); margin-left: auto; }
.hp-sns-body { font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.6; }
.hp-sns-keyword {
    display: inline-block; margin-top: 8px; background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3); color: #818cf8; font-size: 10px;
    border-radius: 20px; padding: 2px 8px;
}
.hp-sns-empty { text-align: center; padding: 48px 16px; color: rgba(255,255,255,0.25); font-size: 13px; }
.hp-map { display: flex; flex-direction: column; gap: 4px; }
.hp-map-floor {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); transition: all 0.15s;
}
.hp-map-floor.current { background: rgba(99,102,241,0.12); border-color: rgba(99,102,241,0.35); }
.hp-map-floor.danger { background: rgba(255,59,48,0.06); border-color: rgba(255,59,48,0.15); }
.hp-map-floor.locked { opacity: 0.35; }
.hp-floor-num { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.25); width: 20px; text-align: center; flex-shrink: 0; }
.hp-map-floor.current .hp-floor-num { color: #818cf8; }
.hp-floor-bar { width: 3px; height: 28px; border-radius: 2px; background: rgba(255,255,255,0.06); flex-shrink: 0; }
.hp-map-floor.current .hp-floor-bar { background: #6366f1; }
.hp-map-floor.danger .hp-floor-bar { background: rgba(255,59,48,0.4); }
.hp-floor-info { flex: 1; }
.hp-floor-name { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); line-height: 1; }
.hp-map-floor.current .hp-floor-name { color: #c7d2fe; }
.hp-floor-desc { font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 2px; }
.hp-floor-tag { font-size: 10px; padding: 2px 8px; border-radius: 20px; flex-shrink: 0; }
.hp-tag-here { background: rgba(99,102,241,0.2); color: #818cf8; }
.hp-tag-danger { background: rgba(255,59,48,0.15); color: #ff6961; }
.hp-tag-lock { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.2); }
.hp-gallery-tabs {
    display: flex; gap: 6px; margin-bottom: 16px; background: rgba(255,255,255,0.04);
    border-radius: 10px; padding: 3px;
}
.hp-gtab {
    flex: 1; text-align: center; padding: 6px 4px; border-radius: 8px;
    font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.4);
    cursor: pointer; transition: all 0.15s; -webkit-tap-highlight-color: transparent;
}
.hp-gtab.active { background: rgba(255,255,255,0.1); color: #fff; }
.hp-gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.hp-gallery-item {
    aspect-ratio: 1; border-radius: 10px; background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06); display: flex; flex-direction: column;
    align-items: center; justify-content: center; font-size: 24px; gap: 4px; transition: background 0.15s;
}
.hp-gallery-item.unlocked { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.12); }
.hp-gallery-item.locked-item { opacity: 0.3; }
.hp-gallery-label { font-size: 8px; color: rgba(255,255,255,0.4); text-align: center; padding: 0 4px; line-height: 1.3; }
.hp-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 16px 0; }
.hp-empty { text-align: center; padding: 40px 16px; color: rgba(255,255,255,0.25); font-size: 13px; }
.hp-lock-contact { font-size: 11px; color: rgba(255,255,255,0.3); text-align: center; padding: 8px 0 4px; }
.hp-aff-row { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; color: rgba(255,255,255,0.7); }
.hp-sus-row { display: flex; align-items: center; gap: 8px; padding: 6px 0 2px; font-size: 11px; color: #ff6961; }
    `;

    var el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
}

// ─────────────────────────────────────────
//  데이터
// ─────────────────────────────────────────
var FLOOR_DATA = [
    { floor: 8,  tag: "8F", name: "루프탑 스카이라운지", desc: "접근 가능", type: "normal" },
    { floor: 7,  tag: "7F", name: "스위트룸 (내 객실)", desc: "시작 지점", type: "normal" },
    { floor: 6,  tag: "6F", name: "인도어 풀·스파",     desc: "붕괴 진원지", type: "danger" },
    { floor: 5,  tag: "5F", name: "게스트 라운지",       desc: "생존자 집결", type: "normal" },
    { floor: 4,  tag: "4F", name: "일반 객실",           desc: "접근 가능", type: "normal" },
    { floor: 3,  tag: "3F", name: "파손 객실",           desc: "2회차 해금", type: "lock" },
    { floor: 2,  tag: "2F", name: "연회장",              desc: "위험 구역", type: "danger" },
    { floor: 1,  tag: "1F", name: "로비·지배인실",       desc: "탈출 목표", type: "normal" },
    { floor: -1, tag: "B1", name: "주차장",              desc: "부분 접근", type: "normal" },
    { floor: -2, tag: "B2", name: "기계실·숨겨진 공간",  desc: "2회차 해금", type: "lock" },
];

var CHARACTERS = {
    oh:   { name: "오하은",  emoji: "📰", role: "프리랜서 기자",  contactKey: "cv_contact_oh",   msgKey: "cv_msg_oh",   unreadKey: "cv_unread_oh" },
    kang: { name: "강태오",  emoji: "🔒", role: "형사",          contactKey: "cv_contact_kang", msgKey: "cv_msg_kang", unreadKey: "cv_unread_kang" },
    seo:  { name: "서준혁",  emoji: "🎩", role: "지배인",         contactKey: "cv_contact_seo",  msgKey: "cv_msg_seo",  unreadKey: "cv_unread_seo" },
    lee:  { name: "이나경",  emoji: "🌸", role: "프런트 직원",    contactKey: "cv_contact_lee",  msgKey: "cv_msg_lee",  unreadKey: "cv_unread_lee" },
    jung: { name: "정나비",  emoji: "🦋", role: "사진작가",       contactKey: "cv_contact_jung", msgKey: "cv_msg_jung", unreadKey: "cv_unread_jung" },
};

var INVENTORY = [
    { key: "cv_inv_keycard",    emoji: "🗝️", name: "키카드" },
    { key: "cv_inv_water",      emoji: "💧", name: "생수" },
    { key: "cv_inv_doc_approval", emoji: "📄", name: "승인서" },
    { key: "cv_inv_doc_pool",   emoji: "📋", name: "풀 도면" },
    { key: "cv_inv_panel",      emoji: "🔧", name: "전기패널" },
    { key: "cv_inv_wallpaper",  emoji: "🖼️", name: "벽지" },
    { key: "cv_inv_no_exit",    emoji: "🚪", name: "비상구 메모" },
    { key: "cv_inv_sprinkler",  emoji: "🚿", name: "스프링클러" },
    { key: "cv_inv_doorframe",  emoji: "🔩", name: "문틀" },
    { key: "cv_inv_no_pillar",  emoji: "⚠️", name: "기둥 메모" },
    { key: "cv_inv_hidden_room",emoji: "🕳️", name: "숨겨진 방" },
    { key: "cv_inv_camera",     emoji: "📷", name: "카메라" },
];

var AFF_DATA = [
    { code: "oh",   name: "하은", emoji: "📰" },
    { code: "kang", name: "태오", emoji: "🔒" },
    { code: "seo",  name: "준혁", emoji: "🎩" },
    { code: "lee",  name: "나경", emoji: "🌸" },
    { code: "jung", name: "나비", emoji: "🦋" },
];

function parseMsgs(raw) {
    return safeSplit(raw, '\n').map(function(line) {
        var p = line.split('|');
        return { sender: p[0]||'', side: p[1]||'left', text: p[2]||'', time: p[3]||'' };
    });
}
function parseSns(raw) {
    return safeSplit(raw, '\n').map(function(line) {
        var p = line.split('|');
        return { nick: p[0]||'', text: p[1]||'', time: p[2]||'', kw: p[3]||'' };
    });
}
function parseSituationLog(raw) {
    return safeSplit(raw, '\n').map(function(line) {
        var idx = line.lastIndexOf('|');
        if (idx < 0) return { text: line, resolved: false };
        return { text: line.slice(0, idx), resolved: line.slice(idx+1) === '1' };
    });
}

// ─────────────────────────────────────────
//  렌더 (async — 핵심 수정)
// ─────────────────────────────────────────
async function render() {
    var root = document.getElementById(UI_ID);
    if (!root) return;

    // 모든 cv() 호출을 await
    var battery  = parseInt(await cv("cv_battery", "82")) || 82;
    var signal   = parseInt(await cv("cv_signal", "2")) || 2;
    var hour     = parseInt(await cv("cv_game_hour", "22")) || 22;
    var min      = parseInt(await cv("cv_game_min", "39")) || 39;
    var floor    = parseInt(await cv("cv_floor", "7")) || 7;
    var phase    = parseInt(await cv("cv_phase", "1")) || 1;
    var weather  = await cv("cv_weather", "fog");
    var locName  = await cv("cv_location_name", "7F 스위트룸 701");
    var situation= await cv("cv_situation", "건물에서 이상한 진동이 느껴진다.");
    var sitLogRaw= await cv("cv_situation_log", "");
    var sitLog   = parseSituationLog(sitLogRaw);
    var companion= await cv("cv_companion", "none");

    var timeStr  = (hour < 10 ? "0"+hour : hour) + ":" + (min < 10 ? "0"+min : min);
    var weatherEmoji = { clear:"☀️", rain:"🌧️", fog:"🌫️", storm:"⛈️" }[weather] || "🌫️";
    var weatherLabel = { clear:"맑음", rain:"비", fog:"안개", storm:"폭풍" }[weather] || "안개";
    var batColor = battery > 20 ? "#34c759" : battery > 10 ? "#ffd60a" : "#ff3b30";

    var totalUnread = 0;
    for (var ck of Object.keys(CHARACTERS)) {
        totalUnread += parseInt(await cv(CHARACTERS[ck].unreadKey, "0")) || 0;
    }
    totalUnread += parseInt(await cv("cv_unread_group", "0")) || 0;

    var contentHtml = "";

    if (currentTab === "home") {
        var compInfo = CHARACTERS[companion];

        // 호감도 별 표시
        var affHtml = '<div class="hp-card"><div class="hp-card-title">👥 관계</div>';
        for (var a of AFF_DATA) {
            var val = parseInt(await cv("cv_aff_" + a.code, "0")) || 0;
            var stars = Math.min(5, Math.floor(val / 20));
            var starStr = "★".repeat(stars) + "☆".repeat(5 - stars);
            affHtml += '<div class="hp-aff-row">';
            affHtml += '<span style="font-size:16px;">' + a.emoji + '</span>';
            affHtml += '<span style="min-width:32px;">' + a.name + '</span>';
            affHtml += '<span style="color:#ffd60a;letter-spacing:2px;">' + starStr + '</span>';
            affHtml += '<span style="color:rgba(255,255,255,0.3);font-size:10px;margin-left:auto;">' + val + '</span>';
            affHtml += '</div>';
        }
        var susVal = parseInt(await cv("cv_sus_kang", "0")) || 0;
        if (susVal > 0) {
            affHtml += '<div class="hp-sus-row">⚠️ 강태오 의심도: ' + susVal + '/5</div>';
        }
        affHtml += '</div>';

        contentHtml = `
<div class="hp-widget-time">
    <div class="hp-time-big">${timeStr}</div>
    <div class="hp-time-date">더 헤리티지 한양 호텔 · ${floor > 0 ? floor+"F" : "B"+Math.abs(floor)}</div>
    <div class="hp-time-weather">${weatherEmoji} ${weatherLabel} · ${locName}</div>
</div>
<div class="hp-phase-banner hp-phase-${phase}">
    <div class="hp-phase-dot"></div>
    ${phase === 1 ? "Phase 1 — 전조" : phase === 2 ? "Phase 2 — 사고" : "Phase 3 — 고립"}
</div>
<div class="hp-card">
    <div class="hp-card-title">📍 현재 위치</div>
    <div class="hp-location-row">${locName}</div>
    ${compInfo ? '<div class="hp-companion-chip">' + compInfo.emoji + ' ' + compInfo.name + ' 동행 중</div>' : ""}
</div>
<div class="hp-card">
    <div class="hp-card-title">⚠�� 현재 상황</div>
    <div class="hp-situation-text">${situation}</div>
</div>
${sitLog.length > 0 ? `
<div class="hp-card">
    <div class="hp-card-title">📝 상황 로그</div>
    <div class="hp-timeline">
        ${sitLog.slice().reverse().map(function(item, i) {
            var dotClass = item.resolved ? "resolved" : (i === 0 ? "active" : "");
            return '<div class="hp-timeline-item"><div class="hp-timeline-line"><div class="hp-timeline-dot ' + dotClass + '"></div>' + (i < sitLog.length - 1 ? '<div class="hp-timeline-vline"></div>' : "") + '</div><div class="hp-timeline-text"><div class="hp-timeline-title">' + item.text + '</div></div></div>';
        }).join("")}
    </div>
</div>` : ""}
${affHtml}`;

    } else if (currentTab === "memo") {
        var invChecks = [];
        for (var it of INVENTORY) {
            invChecks.push({ item: it, has: (await cv(it.key, "0")) === "1" });
        }
        var hasCount = invChecks.filter(function(x) { return x.has; }).length;
        contentHtml = `
<div class="hp-card">
    <div class="hp-card-title">🎒 소지품</div>
    <div class="hp-inv-grid">
        ${invChecks.map(function(x) {
            return '<div class="hp-inv-item ' + (x.has ? "has-item" : "") + '">' + (x.has ? x.item.emoji : "·") + '<div class="hp-inv-item-label">' + (x.has ? x.item.name : "") + '</div></div>';
        }).join("")}
    </div>
    <div style="font-size:10px;color:rgba(255,255,255,0.3);text-align:center;margin-top:4px;">${hasCount} / ${INVENTORY.length} 수집</div>
</div>`;

    } else if (currentTab === "messenger") {
        if (msgRoom === "list") {
            var rooms = [
                { key: "group", name: "비상연락망", emoji: "👥", msgVar: "cv_msg_group", unreadVar: "cv_unread_group", alwaysShow: true }
            ];
            for (var k of Object.keys(CHARACTERS)) {
                var c = CHARACTERS[k];
                if ((await cv(c.contactKey, "0")) === "1") {
                    rooms.push({ key: k, name: c.name, emoji: c.emoji, role: c.role, msgVar: c.msgKey, unreadVar: c.unreadKey });
                }
            }
            var roomsHtml = '';
            for (var room of rooms) {
                var msgs = parseMsgs(await cv(room.msgVar, ""));
                var lastMsg = msgs.length ? msgs[msgs.length-1] : null;
                var unread = parseInt(await cv(room.unreadVar, "0")) || 0;
                roomsHtml += '<div class="hp-chat-room" onclick="heritagePhoneTab(\'msg:' + room.key + '\')">' +
                    '<div class="hp-chat-avatar">' + room.emoji + '</div>' +
                    '<div class="hp-chat-info"><div class="hp-chat-name">' + room.name + (room.role ? ' <span style="font-size:11px;color:rgba(255,255,255,0.3)">· ' + room.role + '</span>' : '') + '</div>' +
                    '<div class="hp-chat-preview">' + (lastMsg ? lastMsg.text : "대화 없음") + '</div></div>' +
                    '<div class="hp-chat-meta"><div class="hp-chat-time">' + (lastMsg ? lastMsg.time : "") + '</div>' +
                    (unread > 0 ? '<div class="hp-chat-unread">' + unread + '</div>' : "") + '</div></div>';
            }
            var lockedCount = 0;
            for (var lk of Object.keys(CHARACTERS)) {
                if ((await cv(CHARACTERS[lk].contactKey, "0")) !== "1") lockedCount++;
            }
            contentHtml = '<div class="hp-chat-list">' + roomsHtml + '</div>';
            if (lockedCount > 0) {
                contentHtml += '<div class="hp-lock-contact">🔒 연락처 미해금 ' + lockedCount + '명</div>';
            }
        } else {
            var isGroup = msgRoom === "group";
            var roomLabel = isGroup ? "비상연락망" : (CHARACTERS[msgRoom] ? CHARACTERS[msgRoom].name : msgRoom);
            var msgVar = isGroup ? "cv_msg_group" : (CHARACTERS[msgRoom] ? CHARACTERS[msgRoom].msgKey : "");
            var msgs = parseMsgs(await cv(msgVar, ""));
            contentHtml = '<div id="hp-msg-back" onclick="heritagePhoneTab(\'messenger\')">‹ ' + roomLabel + '</div><div class="hp-msg-bubbles">';
            if (msgs.length === 0) {
                contentHtml += '<div class="hp-chat-locked"><div class="hp-chat-locked-icon">💬</div>아직 메시지가 없습니다.</div>';
            } else {
                msgs.forEach(function(m) {
                    var isRight = m.side === "right";
                    if (!isRight && m.sender) contentHtml += '<div class="hp-bubble-sender">' + m.sender + '</div>';
                    contentHtml += '<div class="hp-bubble-wrap ' + (isRight ? "right" : "") + '">';
                    if (!isRight) contentHtml += '<div class="hp-bubble-avatar">👤</div>';
                    contentHtml += '<div class="hp-bubble ' + (isRight ? "right" : "left") + '">' + m.text + '</div></div>';
                    if (m.time) contentHtml += '<div class="hp-bubble-time" style="text-align:' + (isRight ? "right" : "left") + '">' + m.time + '</div>';
                });
            }
            contentHtml += '</div>';
        }

    } else if (currentTab === "sns") {
        var feed = parseSns(await cv("cv_sns_feed", "")).reverse();
        if (feed.length === 0) {
            contentHtml = '<div class="hp-sns-empty">📡 수신 중...<br>외부 신호 없음</div>';
        } else {
            contentHtml = '<div class="hp-sns-feed">' + feed.map(function(p) {
                return '<div class="hp-sns-post"><div class="hp-sns-header"><div class="hp-sns-avatar">📡</div><div><div class="hp-sns-name">' + p.nick + '</div><div class="hp-sns-handle">@헤리티지라이브</div></div><div class="hp-sns-time">' + p.time + '</div></div><div class="hp-sns-body">' + p.text + '</div>' + (p.kw ? '<span class="hp-sns-keyword">#' + p.kw + '</span>' : "") + '</div>';
            }).join("") + '</div>';
        }

    } else if (currentTab === "map") {
        var unlock3 = (await cv("cv_unlock_floor3", "0")) === "1";
        var unlockB2 = (await cv("cv_unlock_b2", "0")) === "1";
        contentHtml = '<div class="hp-map">' + FLOOR_DATA.map(function(f) {
            var isCurrent = f.floor === floor;
            var isLocked = (f.floor === 3 && !unlock3) || (f.floor === -2 && !unlockB2);
            var isDanger = f.type === "danger";
            var cls = isCurrent ? "current" : isDanger ? "danger" : isLocked ? "locked" : "";
            var tag = isCurrent ? "hp-tag-here" : isDanger ? "hp-tag-danger" : isLocked ? "hp-tag-lock" : "";
            var tagLabel = isCurrent ? "현재" : isDanger ? "위험" : isLocked ? "🔒" : "";
            return '<div class="hp-map-floor ' + cls + '"><div class="hp-floor-num">' + f.tag + '</div><div class="hp-floor-bar"></div><div class="hp-floor-info"><div class="hp-floor-name">' + f.name + '</div><div class="hp-floor-desc">' + f.desc + '</div></div>' + (tagLabel ? '<div class="hp-floor-tag ' + tag + '">' + tagLabel + '</div>' : "") + '</div>';
        }).join("") + '</div>';

    } else if (currentTab === "gallery") {
        var galTab = _localGalTab || (await cv("cv_gallery_tab", "scene"));
        var scenes = [
            { key: "cv_scene_oh_1", label: "하은 씬 1", emoji: "📰" },
            { key: "cv_scene_oh_2", label: "하은 씬 2", emoji: "📰" },
            { key: "cv_scene_oh_3", label: "하은 씬 3", emoji: "📰" },
            { key: "cv_scene_kang_1", label: "태오 씬 1", emoji: "🔒" },
            { key: "cv_scene_kang_2", label: "태오 씬 2", emoji: "🔒" },
            { key: "cv_scene_seo_1", label: "준혁 씬 1", emoji: "🎩" },
            { key: "cv_scene_seo_2", label: "준혁 씬 2", emoji: "🎩" },
            { key: "cv_scene_seo_3", label: "준혁 씬 3", emoji: "🎩" },
            { key: "cv_scene_lee_1", label: "나경 씬 1", emoji: "🌸" },
            { key: "cv_scene_lee_2", label: "나경 씬 2", emoji: "🌸" },
            { key: "cv_scene_jung_1", label: "나비 씬 1", emoji: "🦋" },
            { key: "cv_scene_jung_2", label: "나비 씬 2", emoji: "🦋" },
            { key: "cv_scene_group_1", label: "전체 씬 1", emoji: "👥" },
        ];
        var endings = [
            { key: "cv_end_electrocution", label: "감전사", emoji: "⚡" },
            { key: "cv_end_drowning", label: "익사", emoji: "💧" },
            { key: "cv_end_fall", label: "추락사", emoji: "🕳️" },
            { key: "cv_end_silenced", label: "입막음", emoji: "🔇" },
            { key: "cv_end_accomplice", label: "공범", emoji: "🤝" },
            { key: "cv_end_crush", label: "압사", emoji: "🏚️" },
            { key: "cv_end_fire", label: "화재", emoji: "🔥" },
            { key: "cv_end_alone", label: "고독사", emoji: "🪫" },
            { key: "cv_end_betrayal", label: "배신", emoji: "🗡️" },
            { key: "cv_end_normal_a", label: "단독 탈출", emoji: "🚪" },
            { key: "cv_end_normal_b", label: "동반 탈출", emoji: "🤝" },
            { key: "cv_end_true", label: "진 엔딩", emoji: "🌅" },
            { key: "cv_end_hidden", label: "???", emoji: "❓" },
        ];
        var achievements = [
            { key: "cv_ach_blade", label: "날카로운 선택", emoji: "⚔️" },
            { key: "cv_ach_electrician", label: "전기 기술자", emoji: "🔌" },
            { key: "cv_ach_witness", label: "목격자", emoji: "👁️" },
            { key: "cv_ach_allsafe", label: "전원 생존", emoji: "🛡️" },
            { key: "cv_ach_truth", label: "진실 폭로", emoji: "📣" },
            { key: "cv_ach_accomplice", label: "공범자", emoji: "🤫" },
            { key: "cv_ach_collector", label: "수집가", emoji: "🗂️" },
            { key: "cv_ach_ghost", label: "유령", emoji: "👻" },
        ];

        var items = galTab === "scene" ? scenes : galTab === "ending" ? endings : achievements;
        var galItemsHtml = '';
        for (var gi of items) {
            var unlocked = (await cv(gi.key, "0")) === "1";
            galItemsHtml += '<div class="hp-gallery-item ' + (unlocked ? "unlocked" : "locked-item") + '">' + (unlocked ? gi.emoji : "🔒") + '<div class="hp-gallery-label">' + (unlocked ? gi.label : "???") + '</div></div>';
        }

        contentHtml = `
<div class="hp-gallery-tabs">
    <div class="hp-gtab ${galTab==='scene'?'active':''}" onclick="heritagePhoneGalTab('scene')">씬</div>
    <div class="hp-gtab ${galTab==='ending'?'active':''}" onclick="heritagePhoneGalTab('ending')">엔딩</div>
    <div class="hp-gtab ${galTab==='achieve'?'active':''}" onclick="heritagePhoneGalTab('achieve')">업적</div>
</div>
<div class="hp-gallery-grid">${galItemsHtml}</div>`;
    }

    // 탭 헤더
    var tabTitles = { home: "홈", memo: "메모", messenger: "메시지", sns: "SNS", map: "지도", gallery: "갤러리" };

    // invCount for subtitle (need await)
    var invCount = 0;
    for (var ic of INVENTORY) { if ((await cv(ic.key, "0")) === "1") invCount++; }

    var tabSubtitles = {
        home: weatherEmoji + " " + locName,
        memo: invCount + "개 수집",
        messenger: totalUnread > 0 ? "안읽은 메시지 " + totalUnread : "연락처",
        sns: "헤리티지라이브",
        map: "현재 " + (floor > 0 ? floor+"F" : "B"+Math.abs(floor)),
        gallery: "기록"
    };

    root.innerHTML = `
<div id="hp-overlay" onclick="heritagePhoneClose()"></div>
<div id="hp-panel">
    <div id="hp-statusbar">
        <div class="hp-status-left">${timeStr}</div>
        <div id="hp-island"><span id="hp-island-time">${phase === 3 ? '⚠️' : '📶'}</span></div>
        <div class="hp-status-right">
            <div class="hp-signal" data-sig="${signal}"><span></span><span></span><span></span><span></span></div>
            <div class="hp-battery"><div class="hp-battery-icon"><div class="hp-battery-fill" style="width:${battery}%;background:${batColor}"></div></div>${battery}%</div>
        </div>
    </div>
    <div id="hp-header">
        <div>
            <div id="hp-header-title">${tabTitles[currentTab] || ""}</div>
            <div id="hp-header-sub">${tabSubtitles[currentTab] || ""}</div>
        </div>
        <button id="hp-close-btn" onclick="heritagePhoneClose()">✕</button>
    </div>
    <div id="hp-content">${contentHtml}</div>
    <div id="hp-tabbar">
        ${[
            {key:"home", icon:"🏠", label:"홈"},
            {key:"memo", icon:"📋", label:"메모"},
            {key:"messenger", icon:"💬", label:"메시지", badge: totalUnread},
            {key:"sns", icon:"📡", label:"SNS"},
            {key:"map", icon:"🗺️", label:"지도"},
            {key:"gallery", icon:"🗂️", label:"갤러리"},
        ].map(function(t) {
            return '<div class="hp-tab ' + (currentTab===t.key?'active':'') + '" onclick="heritagePhoneTab(\'' + t.key + '\')">' +
                '<div class="hp-tab-icon">' + t.icon + '</div>' +
                '<div class="hp-tab-label">' + t.label + '</div>' +
                (t.badge > 0 ? '<div class="hp-tab-badge">' + (t.badge > 99 ? '99+' : t.badge) + '</div>' : "") +
                '</div>';
        }).join("")}
    </div>
</div>`;
}

// ─────────────────────────────────────────
//  글로벌 핸들러
// ─────────────────────────────────────────
var _toastTimer = null;
function showEmergencyToast(phase, timeStr) {
    var panel = document.getElementById('hp-panel');
    if (!panel) return;
    var existing = document.getElementById('hp-emergency-toast');
    if (existing) existing.remove();
    if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
    var msg = phase >= 3
        ? "건물 붕괴 위험 최고 단계. 즉시 대피하십시오. 엘리베이터 사용 금지."
        : "건물 이상 감지. 안전한 장소로 이동하십시오.";
    var toast = document.createElement('div');
    toast.id = 'hp-emergency-toast';
    toast.innerHTML = '<div class="hp-toast-icon">🚨</div><div class="hp-toast-body"><div class="hp-toast-title">[긴급재난문자] 행정안전부</div><div class="hp-toast-text">' + msg + '</div><div class="hp-toast-time">' + timeStr + '</div></div><div class="hp-toast-dismiss">✕</div>';
    toast.onclick = function() { dismissToast(toast); };
    panel.appendChild(toast);
    _toastTimer = setTimeout(function() { dismissToast(toast); }, 5000);
}
function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
    toast.classList.add('hp-toast-hiding');
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
}

window.heritagePhoneClose = async function() {
    isVisible = false;
    await lsSet(KEY_VISIBLE, "false");
    var root = document.getElementById(UI_ID);
    if (root) root.classList.add("hp-hidden");
    if (_hasRisu) await Risuai.hideContainer();
};

window.heritagePhoneTab = async function(tab) {
    if (tab.startsWith("msg:")) {
        currentTab = "messenger";
        msgRoom = tab.slice(4);
    } else {
        currentTab = tab;
        if (tab === "messenger") msgRoom = "list";
    }
    await lsSet(KEY_TAB, currentTab);
    await render();
};

window.heritagePhoneGalTab = async function(sub) {
    _localGalTab = sub;
    if (_hasRisu && Risuai.setChatVar) {
        try { Risuai.setChatVar("cv_gallery_tab", sub); } catch(e) {}
    }
    await render();
};

// ─────────────────────────────────────────
//  UI 마운트
// ─────────────────────────────────────────
async function createUI() {
    var existing = document.getElementById(UI_ID);
    if (existing) existing.remove();
    var root = document.createElement('div');
    root.id = UI_ID;
    root.className = "hp-hidden";
    document.body.appendChild(root);
    injectStyles();
    await render();
}

// ─────────────────────────────────────────
//  초기화
// ─────────────────────────────────────────
async function init() {
    console.log(PLUGIN_NAME + " 초기화 (API 3.0, v3.1)");

    if (!isHeritageChar()) {
        console.log(PLUGIN_NAME + " — 도괴 봇 아님, 스킵.");
        return;
    }

    if (_hasRisu) {
        Risuai.registerButton({
            name: '📱 폰',
            icon: '📱',
            iconType: 'html',
            location: 'action'
        }, async () => {
            isVisible = !isVisible;
            await lsSet(KEY_VISIBLE, String(isVisible));
            var root = document.getElementById(UI_ID);
            if (!root) { await createUI(); root = document.getElementById(UI_ID); }

            if (isVisible) {
                root.classList.remove("hp-hidden");
                await render();
                var _ph = parseInt(await cv("cv_phase", "1")) || 1;
                var _hr = parseInt(await cv("cv_game_hour","22")), _mn = parseInt(await cv("cv_game_min","39"));
                var _ts = (_hr<10?"0"+_hr:_hr)+":"+(_mn<10?"0"+_mn:_mn);
                if (_ph >= 2) showEmergencyToast(_ph, _ts);
                await Risuai.showContainer('fullscreen');
            } else {
                root.classList.add("hp-hidden");
                await Risuai.hideContainer();
            }
        });
    }

    var savedVisible = await lsGet(KEY_VISIBLE);
    var savedTab     = await lsGet(KEY_TAB);
    isVisible = savedVisible === "true";
    if (savedTab) currentTab = savedTab;

    await createUI();

    if (isVisible && _hasRisu) {
        var root = document.getElementById(UI_ID);
        if (root) root.classList.remove("hp-hidden");
        await Risuai.showContainer('fullscreen');
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isVisible) {
            window.heritagePhoneClose();
        }
    });

    console.log(PLUGIN_NAME + " 준비 ���료!");
}

await init();

} catch(error) {
    console.error("[Heritage Phone] 초기화 오류:", error.message || error, error.stack || "");
}
})();