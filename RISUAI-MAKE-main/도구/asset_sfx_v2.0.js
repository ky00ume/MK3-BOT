//@name asset_sfx
//@display-name 에셋 SFX
//@api 3.0
//@version 2.0.0
//@description 이미지 에셋에 효과음과 시각 이펙트를 매핑하여 클릭 및 키보드 단축키로 재생합니다.
//@author 안티그래비티

// ── 사용법 ──────────────────────────────────────────────
// 캐릭터 에셋에 아래 규격으로 등록:
//   🖼️ "에셋명"              — 이미지 에셋
//   🔊 "에셋명.sfx"          — 효과음 (클릭 재생)
//   🔊 "에셋명.a.sfx"        — 효과음 + A키 단축키
//   🔊 "에셋명.press.sfx"    — 효과음 + 눌림 이펙트
//   🔊 "에셋명.a.press.sfx"  — 효과음 + A키 + 눌림 이펙트
// 이펙트: press(눌림), glow(글로우), pulse(맥동), shake(흔들기), flash(반짝)
// <img src> 및 CSS background-image 양쪽 지원.
// 키 단축키: 액션 버튼(⌨️)으로 ON/OFF 전환. 최근 챗 한정.
// 지원 오디오: mp3
// ────────────────────────────────────────────────────────

(async () => {
    try {
        // ─────────────────────────────────────────────
        // 상수 및 상태
        // ─────────────────────────────────────────────
        const audioCache = {};
        const spriteMap = new Map();
        let audioUnlocked = false;
        let mapBuilt = false;
        let mapBuildTime = 0;
        let lastCharName = '';
        let globalVolume = 0.8;
        let globalMuted = false;

        const keyBindings = new Map();
        const keyConflicts = [];
        let keyboardEnabled = true;
        let hasKeyBindings = false;
        let toggleBtnId = null;

        const MAP_COOLDOWN_MS = 1500;
        const SV_ATTR = 'x-sv-tagged';
        const SV_OLD = 'x-sv-old';
        const IMAGE_CACHE_TTL = 800;
        let lastKnownChatCount = 0;

        const MIME_MAP = {
            mp3: 'audio/mpeg',
        };

        const ICON_OFF_NONE = '🔇';
        const ICON_OFF_READY = '⌨️';
        const ICON_ON = '🎹';

        // ─────────────────────────────────────────────
        // 이펙트 프리셋 정의
        // ─────────────────────────────────────────────
        const FX_NAMES = ['press', 'glow', 'pulse', 'shake', 'flash'];
        const FX_LABELS = { press: '눌림', glow: '글로우', pulse: '맥동', shake: '흔들기', flash: '반짝' };

        const GLOW_COLORS = [
            '0 0 16px 4px rgba(0,255,200,0.7)',
            '0 0 16px 4px rgba(255,100,255,0.7)',
            '0 0 16px 4px rgba(100,200,255,0.7)',
            '0 0 16px 4px rgba(255,255,100,0.7)',
            '0 0 16px 4px rgba(255,130,60,0.7)',
        ];

        async function applyEffect(el, fxName) {
            if (!el || !fxName) return;
            try {
                const origStyle = await el.getStyleAttribute();

                switch (fxName) {
                    case 'press':
                        await el.setStyle('transition', 'transform 0.08s ease');
                        await el.setStyle('transform', 'scale(0.88)');
                        setTimeout(async () => {
                            try {
                                await el.setStyle('transform', 'scale(1)');
                                setTimeout(async () => {
                                    try { await el.setStyle('transition', ''); } catch (e) { }
                                }, 150);
                            } catch (e) { }
                        }, 120);
                        break;

                    case 'glow':
                        const color = GLOW_COLORS[Math.floor(Math.random() * GLOW_COLORS.length)];
                        await el.setStyle('transition', 'box-shadow 0.12s ease, filter 0.12s ease');
                        await el.setStyle('boxShadow', color);
                        await el.setStyle('filter', 'brightness(1.3)');
                        setTimeout(async () => {
                            try {
                                await el.setStyle('boxShadow', 'none');
                                await el.setStyle('filter', '');
                                setTimeout(async () => {
                                    try { await el.setStyle('transition', ''); } catch (e) { }
                                }, 150);
                            } catch (e) { }
                        }, 250);
                        break;

                    case 'pulse':
                        await el.setStyle('transition', 'opacity 0.1s ease');
                        await el.setStyle('opacity', '0.4');
                        setTimeout(async () => {
                            try {
                                await el.setStyle('opacity', '1');
                                setTimeout(async () => {
                                    try { await el.setStyle('transition', ''); } catch (e) { }
                                }, 150);
                            } catch (e) { }
                        }, 120);
                        break;

                    case 'shake':
                        const steps = [
                            { t: 'translateX(-4px)', d: 40 },
                            { t: 'translateX(4px)', d: 40 },
                            { t: 'translateX(-3px)', d: 35 },
                            { t: 'translateX(3px)', d: 35 },
                            { t: 'translateX(0)', d: 0 },
                        ];
                        await el.setStyle('transition', 'transform 0.04s linear');
                        let delay = 0;
                        for (const step of steps) {
                            const d = delay;
                            setTimeout(async () => {
                                try { await el.setStyle('transform', step.t); } catch (e) { }
                            }, d);
                            delay += step.d;
                        }
                        setTimeout(async () => {
                            try { await el.setStyle('transition', ''); } catch (e) { }
                        }, delay + 100);
                        break;

                    case 'flash':
                        await el.setStyle('transition', 'filter 0.06s ease');
                        await el.setStyle('filter', 'brightness(2.5)');
                        setTimeout(async () => {
                            try {
                                await el.setStyle('filter', 'brightness(1)');
                                setTimeout(async () => {
                                    try {
                                        await el.setStyle('filter', '');
                                        await el.setStyle('transition', '');
                                    } catch (e) { }
                                }, 150);
                            } catch (e) { }
                        }, 100);
                        break;
                }
            } catch (e) { }
        }

        // ─────────────────────────────────────────────
        // 유틸리티
        // ─────────────────────────────────────────────
        function strToHex(str) {
            let hex = '';
            for (let i = 0; i < str.length; i++)
                hex += str.charCodeAt(i).toString(16).padStart(2, '0');
            return hex;
        }

        function extractHashFile(uri) {
            if (!uri) return '';
            const idx = uri.lastIndexOf('/');
            return idx >= 0 ? uri.substring(idx + 1) : uri;
        }

        function bytesToBase64(bytes) {
            let bin = '';
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            return btoa(bin);
        }

        function convertToAudioUrl(data, ext) {
            const mime = MIME_MAP[(ext || 'mp3').toLowerCase()] || 'audio/mpeg';
            if (typeof data === 'string') {
                if (data.startsWith('data:') || data.startsWith('http') || data.startsWith('blob:')) return data;
                if (/^\d+(,\d+)+/.test(data.substring(0, 60))) {
                    try {
                        const p = data.split(','), b = new Uint8Array(p.length);
                        for (let i = 0; i < p.length; i++) b[i] = parseInt(p[i], 10);
                        return `data:${mime};base64,${bytesToBase64(b)}`;
                    } catch (e) { return null; }
                }
                return `data:${mime};base64,${data}`;
            }
            if (data && typeof data === 'object') {
                const str = String(data);
                if (/^\d+(,\d+)+/.test(str.substring(0, 60))) {
                    try {
                        const p = str.split(','), b = new Uint8Array(p.length);
                        for (let i = 0; i < p.length; i++) b[i] = parseInt(p[i], 10);
                        return `data:${mime};base64,${bytesToBase64(b)}`;
                    } catch (e) { return null; }
                }
            }
            return null;
        }

        // sfx명에서 베이스 이름, 키, 이펙트 추출
        // "kick.sfx"            → { baseName: "kick",  key: null, fx: null }
        // "kick.a.sfx"          → { baseName: "kick",  key: "a",  fx: null }
        // "kick.press.sfx"      → { baseName: "kick",  key: null, fx: "press" }
        // "kick.a.press.sfx"    → { baseName: "kick",  key: "a",  fx: "press" }
        // "a.b.c.s.glow.sfx"    → { baseName: "a.b.c", key: "s",  fx: "glow" }
        function parseSfxName(rawSfxName) {
            if (!rawSfxName.endsWith('.sfx')) return { baseName: rawSfxName, key: null, fx: null };
            const withoutSfx = rawSfxName.slice(0, -4);
            const parts = withoutSfx.split('.');

            let fx = null;
            let key = null;

            // 맨 뒤에서 이펙트 체크
            if (parts.length >= 2 && FX_NAMES.includes(parts[parts.length - 1].toLowerCase())) {
                fx = parts.pop().toLowerCase();
            }

            // 그 다음 맨 뒤에서 키 체크 (1글자 a-z/0-9)
            if (parts.length >= 2) {
                const candidate = parts[parts.length - 1].toLowerCase();
                if (candidate.length === 1 && /[a-z0-9]/.test(candidate)) {
                    key = candidate;
                    parts.pop();
                }
            }

            return { baseName: parts.join('.'), key, fx };
        }

        // ─────────────────────────────────────────────
        // 에셋 매핑 빌드
        // ─────────────────────────────────────────────
        async function buildSpriteMap() {
            try {
                const char = await risuai.getCharacter();
                if (!char) return false;

                const charName = char.name || '';
                if (charName !== lastCharName) {
                    if (lastCharName) {
                        spriteMap.clear();
                        keyBindings.clear();
                        keyConflicts.length = 0;
                        Object.keys(audioCache).forEach(k => delete audioCache[k]);
                    }
                    lastCharName = charName;
                }

                if (!char.additionalAssets || char.additionalAssets.length === 0) return false;
                if (mapBuilt && spriteMap.size > 0) return true;

                const assetMap = {};
                for (const a of char.additionalAssets) {
                    let rawName, uri, ext;
                    if (Array.isArray(a)) {
                        rawName = a[0]; uri = a[1]; ext = a[2] || '';
                    } else if (typeof a === 'object' && a !== null) {
                        rawName = a.name || a[0]; uri = a.uri || a.src || a[1]; ext = a.ext || '';
                    }
                    if (rawName && uri) assetMap[rawName] = { uri, ext };
                }

                let count = 0;
                const tempKeyMap = new Map();
                keyBindings.clear();
                keyConflicts.length = 0;

                for (const rawSfxName of Object.keys(assetMap)) {
                    if (!rawSfxName.endsWith('.sfx')) continue;

                    const { baseName, key: boundKey, fx } = parseSfxName(rawSfxName);
                    const imgAsset = assetMap[baseName];
                    if (!imgAsset) continue;

                    const hashFile = extractHashFile(imgAsset.uri);
                    const hexHash = strToHex(hashFile.substring(0, 16));

                    const info = {
                        imgName: baseName,
                        sfxName: rawSfxName,
                        sfxUri: assetMap[rawSfxName].uri,
                        sfxExt: assetMap[rawSfxName].ext,
                        hashFile, hexHash,
                        boundKey, fx,
                    };

                    spriteMap.set(hashFile, info);
                    count++;

                    if (boundKey) {
                        if (tempKeyMap.has(boundKey)) {
                            keyConflicts.push({ key: boundKey, assets: [tempKeyMap.get(boundKey).imgName, info.imgName] });
                        } else {
                            tempKeyMap.set(boundKey, info);
                        }
                    }
                }

                const conflictKeys = new Set(keyConflicts.map(c => c.key));
                for (const [key, info] of tempKeyMap) {
                    if (!conflictKeys.has(key)) keyBindings.set(key, info);
                }

                hasKeyBindings = keyBindings.size > 0;

                if (count > 0) {
                    mapBuilt = true;
                    mapBuildTime = Date.now();
                    for (const [, info] of spriteMap) {
                        loadSfxAudio(info.sfxName, info.sfxUri, info.sfxExt).catch(() => { });
                    }
                    updateToggleButton();
                    return true;
                }
                return false;
            } catch (err) { return false; }
        }

        // ─────────────────────────────────────────────
        // 에셋 요소 찾기
        // ─────────────────────────────────────────────
        let imageCache = [];
        let imageCacheTime = 0;

        async function findAllSpriteElements(doc, info, scope) {
            const elements = [];
            const tagVal = 'sv-' + Date.now();
            const matchers = [info.hashFile, info.hexHash];
            const searchRoot = scope || doc;

            const selectorFns = [
                (m, tv) => `img[src*="${m}"]:not([${SV_ATTR}="${tv}"])`,
                (m, tv) => `[style*="${m}"]:not([${SV_ATTR}="${tv}"])`,
            ];

            for (const mkSelector of selectorFns) {
                for (const m of matchers) {
                    if (elements.length > 0) break;
                    for (let i = 0; i < 50; i++) {
                        try {
                            const el = await searchRoot.querySelector(mkSelector(m, tagVal));
                            if (!el) break;
                            await el.setAttribute(SV_ATTR, tagVal);
                            elements.push(el);
                        } catch (e) { break; }
                    }
                }
                if (elements.length > 0) break;
            }
            return elements;
        }

        async function refreshImageCache(doc) {
            const now = Date.now();
            if (imageCache.length > 0 && (now - imageCacheTime) < IMAGE_CACHE_TTL) return;
            imageCache = [];
            imageCacheTime = now;
            for (const [, info] of spriteMap) {
                try {
                    const els = await findAllSpriteElements(doc, info);
                    for (const el of els) {
                        try {
                            const rect = await el.getBoundingClientRect();
                            imageCache.push({ el, info, rect });
                        } catch (e) { }
                    }
                } catch (e) { }
            }
        }

        // ─────────────────────────────────────────────
        // SFX 로딩 & 재생 (+ 이펙트 트리거)
        // ─────────────────────────────────────────────
        async function loadSfxAudio(sfxName, sfxUri, sfxExt) {
            if (audioCache[sfxName]) return audioCache[sfxName];
            try {
                const data = await risuai.readImage(sfxUri);
                if (!data) return null;
                const url = convertToAudioUrl(data, sfxExt || 'mp3');
                if (!url) return null;
                audioCache[sfxName] = url;
                return url;
            } catch (err) { return null; }
        }

        async function playSpriteVoice(info) {
            if (globalMuted) return false;
            const url = await loadSfxAudio(info.sfxName, info.sfxUri, info.sfxExt);
            if (!url) return false;
            try {
                const audio = new Audio(url);
                audio.volume = globalVolume;
                await audio.play();
                audioUnlocked = true;
                return true;
            } catch (err) { return false; }
        }

        // 재생 + 이펙트 결합
        async function triggerSfx(info, el) {
            const playPromise = playSpriteVoice(info);
            if (info.fx && el) {
                applyEffect(el, info.fx);
            }
            return await playPromise;
        }

        // ─────────────────────────────────────────────
        // 클릭 핸들러
        // ─────────────────────────────────────────────
        let clickHandlerRegistered = false;

        async function setupClickHandler() {
            if (clickHandlerRegistered) return;
            const doc = await risuai.getRootDocument();
            if (!doc) return;

            await doc.addEventListener('click', async (event) => {
                if (!mapBuilt) { await buildSpriteMap(); return; }
                if (spriteMap.size === 0 || globalMuted) return;
                if (Date.now() - mapBuildTime < MAP_COOLDOWN_MS) return;

                const cx = event.clientX, cy = event.clientY;
                await refreshImageCache(doc);

                let bestMatch = null, bestArea = Infinity;
                for (const entry of imageCache) {
                    try { entry.rect = await entry.el.getBoundingClientRect(); } catch (e) { continue; }
                    const r = entry.rect;
                    if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
                        const area = (r.right - r.left) * (r.bottom - r.top);
                        if (area < bestArea) { bestArea = area; bestMatch = entry; }
                    }
                }
                if (bestMatch) await triggerSfx(bestMatch.info, bestMatch.el);
            });

            clickHandlerRegistered = true;
        }

        await setupClickHandler();

        // ─────────────────────────────────────────────
        // 키보드 핸들러 (세대 태깅 — 최근 챗 제한)
        // ─────────────────────────────────────────────
        let keyHandlerRegistered = false;

        async function setupKeyHandler() {
            if (keyHandlerRegistered) return;
            const doc = await risuai.getRootDocument();
            if (!doc) return;

            await doc.addEventListener('keydown', async (event) => {
                if (!keyboardEnabled || !mapBuilt || globalMuted) return;
                if (keyBindings.size === 0) return;

                const pressedKey = (event.key || '').toLowerCase();
                if (!keyBindings.has(pressedKey)) return;
                if (event.ctrlKey || event.altKey || event.metaKey) return;

                const info = keyBindings.get(pressedKey);

                try {
                    const freshSprites = await findFreshSprites(doc, info);
                    if (freshSprites.length > 0) {
                        await triggerSfx(info, freshSprites[0]);
                    }
                } catch (e) { }
            });

            keyHandlerRegistered = true;
        }

        await setupKeyHandler();

        // ─────────────────────────────────────────────
        // ON/OFF 토글 버튼
        // ─────────────────────────────────────────────
        function getCurrentIcon() {
            if (keyboardEnabled) return ICON_ON;
            if (hasKeyBindings) return ICON_OFF_READY;
            return ICON_OFF_NONE;
        }

        function getCurrentBtnName() {
            if (keyboardEnabled) return 'SFX 단축키 ON';
            if (hasKeyBindings) return 'SFX 단축키 OFF';
            return 'SFX 단축키';
        }

        async function updateToggleButton() {
            try {
                if (toggleBtnId) {
                    try { await risuai.unregisterUIPart(toggleBtnId); } catch (e) { }
                    toggleBtnId = null;
                }
                const result = await risuai.registerButton({
                    name: getCurrentBtnName(),
                    icon: getCurrentIcon(),
                    iconType: 'html',
                    location: 'action',
                }, async () => {
                    if (!hasKeyBindings) return;
                    keyboardEnabled = !keyboardEnabled;
                    await updateToggleButton();
                });
                if (result && result.id) toggleBtnId = result.id;
            } catch (e) { }
        }

        await updateToggleButton();

        // ─────────────────────────────────────────────
        // 지연 빌드 & 자동 감지
        // ─────────────────────────────────────────────
        async function retryBuildMap() {
            for (let i = 0; i < 10; i++) {
                if (mapBuilt) return;
                await new Promise(r => setTimeout(r, 1000 + i * 500));
                await buildSpriteMap();
            }
        }

        await buildSpriteMap();
        if (!mapBuilt) retryBuildMap();

        setInterval(async () => {
            try {
                const char = await risuai.getCharacter();
                const name = char ? (char.name || '') : '';
                if (name !== lastCharName) { mapBuilt = false; await buildSpriteMap(); }
            } catch (e) { }
        }, 5000);

        // ─────────────────────────────────────────────
        // 세대 태깅
        // ─────────────────────────────────────────────
        async function findFreshSprites(doc, info) {
            const fresh = [];
            const matchers = [info.hashFile, info.hexHash];
            const selectorFns = [
                (m) => `img[src*="${m}"]:not([${SV_OLD}="1"])`,
                (m) => `[style*="${m}"]:not([${SV_OLD}="1"])`,
            ];
            for (const mkSel of selectorFns) {
                for (const m of matchers) {
                    if (fresh.length > 0) break;
                    try {
                        const el = await doc.querySelector(mkSel(m));
                        if (el) fresh.push(el);
                    } catch (e) { }
                }
                if (fresh.length > 0) break;
            }
            return fresh;
        }

        async function markAllSpritesOld(doc) {
            for (const [, info] of spriteMap) {
                const matchers = [info.hashFile, info.hexHash];
                for (const m of matchers) {
                    for (let i = 0; i < 100; i++) {
                        try {
                            const el = await doc.querySelector(`img[src*="${m}"]:not([${SV_OLD}="1"])`);
                            if (!el) break;
                            await el.setAttribute(SV_OLD, '1');
                        } catch (e) { break; }
                    }
                    for (let i = 0; i < 100; i++) {
                        try {
                            const el = await doc.querySelector(`[style*="${m}"]:not([${SV_OLD}="1"])`);
                            if (!el) break;
                            await el.setAttribute(SV_OLD, '1');
                        } catch (e) { break; }
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        // MutationObserver
        // ─────────────────────────────────────────────
        try {
            const doc = await risuai.getRootDocument();
            if (doc) {
                const observer = await risuai.createMutationObserver(async () => {
                    if (!mapBuilt) { await buildSpriteMap(); return; }
                    try {
                        const chats = await doc.querySelectorAll('.risu-chat[data-chat-index]');
                        const currentCount = chats ? chats.length : 0;
                        if (currentCount > lastKnownChatCount && lastKnownChatCount > 0) {
                            await markAllSpritesOld(doc);
                        }
                        lastKnownChatCount = currentCount;
                    } catch (e) { }
                });
                const body = await doc.querySelector('body');
                if (body) await observer.observe(body, { childList: true, subtree: true });
                try {
                    const initialChats = await doc.querySelectorAll('.risu-chat[data-chat-index]');
                    lastKnownChatCount = initialChats ? initialChats.length : 0;
                } catch (e) { }
            }
        } catch (err) { }

        // ─────────────────────────────────────────────
        // 설정 UI
        // ─────────────────────────────────────────────
        try {
            await risuai.registerSetting('에셋 SFX 설정', async () => {
                try { await risuai.showContainer('fullscreen'); } catch (e) { return; }
                if (!mapBuilt) await buildSpriteMap();

                let mappingHtml = '';
                if (spriteMap.size > 0) {
                    const rows = [];
                    for (const [, info] of spriteMap) {
                        const safeName = info.imgName.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                        const keyBadge = info.boundKey
                            ? `<span style="background:rgba(100,180,255,0.15);color:#64b4ff;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;margin-left:8px">${info.boundKey.toUpperCase()}</span>`
                            : '';
                        const fxBadge = info.fx
                            ? `<span style="background:rgba(255,200,60,0.15);color:#ffc83c;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;margin-left:4px">✨${FX_LABELS[info.fx] || info.fx}</span>`
                            : '';
                        const isConflict = keyConflicts.some(c => c.key === info.boundKey);
                        const conflictBadge = isConflict
                            ? '<span style="background:rgba(255,100,100,0.15);color:#f88;padding:2px 6px;border-radius:4px;font-size:10px;margin-left:4px">⚠️ 충돌</span>'
                            : '';

                        rows.push(`<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.04)">
              <div>
                <span style="font-size:14px;color:#d0d0e0">🖼️ ${info.imgName}</span>
                <span style="font-size:12px;color:#666;margin-left:8px">→ 🔊 ${info.sfxName}</span>
                ${keyBadge}${fxBadge}${conflictBadge}
              </div>
              <button class="test-btn" data-sfx="${safeName}" style="background:rgba(100,255,160,0.1);border:1px solid rgba(100,255,160,0.2);color:#64ffb4;padding:4px 12px;border-radius:6px;font-size:12px;cursor:pointer">▶ 테스트</button>
            </div>`);
                    }
                    mappingHtml = rows.join('');
                } else {
                    mappingHtml = '<p style="color:#666;font-size:13px;padding:16px">매핑 없음 — 에셋에 "이름.sfx" 효과음을 등록하세요</p>';
                }

                let allAssetsHtml = '';
                try {
                    const char = await risuai.getCharacter();
                    if (char && char.additionalAssets && char.additionalAssets.length > 0) {
                        allAssetsHtml = char.additionalAssets.map(a => {
                            const name = Array.isArray(a) ? a[0] : (a.name || '?');
                            const isSfx = name.endsWith('.sfx');
                            return `<div style="padding:6px 16px;color:${isSfx ? '#64ffb4' : '#888'};font-size:13px">${isSfx ? '🔊' : '🖼️'} ${name}</div>`;
                        }).join('');
                    } else {
                        allAssetsHtml = '<p style="color:#666;padding:16px;font-size:12px">에셋 없음</p>';
                    }
                } catch (e) { allAssetsHtml = `<p style="color:#f88;padding:16px">${e.message}</p>`; }

                const volPct = Math.round(globalVolume * 100);
                const muteColor = globalMuted ? '#f88' : '#64ffb4';

                document.body.style.cssText = 'background:#0f0f14;margin:0;min-height:100vh';
                document.body.innerHTML = `
          <div style="max-width:600px;margin:0 auto;padding:32px 20px;font-family:sans-serif;color:#e0e0e8">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:28px">
              <h1 style="font-size:22px;font-weight:700;margin:0">🔊 에셋 SFX 설정</h1>
              <button id="close-btn" style="background:rgba(255,255,255,0.08);border:none;color:#aaa;font-size:18px;width:36px;height:36px;border-radius:8px;cursor:pointer">✕</button>
            </div>

            <button id="activate-audio" style="width:100%;padding:14px;margin-bottom:20px;border-radius:10px;border:1px solid rgba(100,255,160,0.3);background:rgba(100,255,160,0.08);color:#64ffb4;font-size:15px;font-weight:600;cursor:pointer">
              🔈 오디오 활성화 (Chrome/Whale 필수)
            </button>

            <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px;margin-bottom:24px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                <h3 style="font-size:15px;color:#b0b0c0;margin:0">🔊 볼륨</h3>
                <button id="mute-btn" style="background:${globalMuted ? 'rgba(255,100,100,0.12)' : 'rgba(100,255,160,0.12)'};border:1px solid ${muteColor}44;color:${muteColor};padding:6px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer">
                  ${globalMuted ? '🔇 OFF' : '🔊 ON'}
                </button>
              </div>
              <div style="display:flex;align-items:center;gap:12px">
                <span style="font-size:20px;color:#888">${globalMuted ? '🔇' : (globalVolume > 0.5 ? '🔊' : '🔉')}</span>
                <input id="vol-slider" type="range" min="0" max="100" value="${volPct}" style="flex:1;height:6px;accent-color:#64ffb4;cursor:pointer" ${globalMuted ? 'disabled' : ''}>
                <span id="vol-label" style="font-size:14px;color:#aaa;min-width:40px;text-align:right">${volPct}%</span>
              </div>
            </div>

            <div style="background:rgba(100,180,255,0.08);border:1px solid rgba(100,180,255,0.15);border-radius:12px;padding:20px;margin-bottom:24px">
              <h3 style="font-size:15px;color:#64b4ff;margin:0 0 10px">에셋 규격</h3>
              <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:12px;font-family:monospace;font-size:13px;color:#7ec8e3">
                🖼️ <span style="color:#fbbf24">에셋명</span> — 이미지 에셋<br>
                🔊 <span style="color:#64ffb4">에셋명.sfx</span> — 효과음 (클릭)<br>
                🔊 <span style="color:#64ffb4">에셋명.<span style="color:#f0a0ff">a</span>.sfx</span> — 효과음 + <span style="color:#f0a0ff">A</span>키<br>
                🔊 <span style="color:#64ffb4">에셋명.<span style="color:#ffc83c">press</span>.sfx</span> — 효과음 + <span style="color:#ffc83c">눌림</span> 이펙트<br>
                🔊 <span style="color:#64ffb4">에셋명.<span style="color:#f0a0ff">a</span>.<span style="color:#ffc83c">glow</span>.sfx</span> — 효과음 + <span style="color:#f0a0ff">A</span>키 + <span style="color:#ffc83c">글로우</span>
              </div>
              <div style="font-size:11px;color:#555;margin-top:8px">이펙트: press(눌림) · glow(글로우) · pulse(맥동) · shake(흔들기) · flash(반짝)</div>
            </div>

            <h3 style="font-size:15px;color:#b0b0c0;margin:0 0 12px">매핑 현황</h3>
            <div style="background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:20px">${mappingHtml}</div>

            <div id="key-test-area" tabindex="0" style="background:rgba(100,180,255,0.06);border:2px dashed rgba(100,180,255,0.2);border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;cursor:pointer;outline:none;transition:border-color 0.2s">
              <div style="font-size:14px;color:#64b4ff;margin-bottom:8px">⌨️ 키보드 테스트</div>
              <div style="font-size:12px;color:#666;margin-bottom:12px">이 영역을 클릭 후 키를 눌러보세요</div>
              <div id="key-test-result" style="font-size:18px;color:#888;min-height:32px">—</div>
            </div>

            <details style="margin-bottom:20px">
              <summary style="color:#888;font-size:13px;cursor:pointer;padding:8px 0">전체 에셋 목록</summary>
              <div style="background:rgba(255,255,255,0.02);border-radius:8px;margin-top:8px">${allAssetsHtml}</div>
            </details>

            <p style="font-size:12px;color:#555;margin-top:20px">v2.0.0</p>
          </div>`;

                document.getElementById('close-btn').addEventListener('click', () => risuai.hideContainer());

                document.getElementById('activate-audio').addEventListener('click', async () => {
                    try {
                        const s = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=');
                        await s.play(); s.pause();
                        audioUnlocked = true;
                        const btn = document.getElementById('activate-audio');
                        btn.textContent = '✅ 오디오 활성화 완료!';
                        btn.style.borderColor = 'rgba(100,255,160,0.6)';
                        btn.style.background = 'rgba(100,255,160,0.15)';
                    } catch (e) {
                        document.getElementById('activate-audio').textContent = '❌ ' + e.message;
                    }
                });

                document.getElementById('vol-slider').addEventListener('input', (e) => {
                    const val = parseInt(e.target.value, 10);
                    globalVolume = val / 100;
                    document.getElementById('vol-label').textContent = val + '%';
                });

                document.getElementById('mute-btn').addEventListener('click', () => {
                    globalMuted = !globalMuted;
                    const btn = document.getElementById('mute-btn');
                    const slider = document.getElementById('vol-slider');
                    if (globalMuted) {
                        btn.textContent = '🔇 OFF';
                        btn.style.color = '#f88';
                        btn.style.borderColor = 'rgba(255,100,100,0.3)';
                        btn.style.background = 'rgba(255,100,100,0.12)';
                        slider.disabled = true;
                    } else {
                        btn.textContent = '🔊 ON';
                        btn.style.color = '#64ffb4';
                        btn.style.borderColor = 'rgba(100,255,160,0.3)';
                        btn.style.background = 'rgba(100,255,160,0.12)';
                        slider.disabled = false;
                    }
                });

                document.querySelectorAll('.test-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        const sfxBase = btn.getAttribute('data-sfx');
                        if (!sfxBase) return;
                        for (const [, info] of spriteMap) {
                            if (info.imgName === sfxBase) {
                                const ok = await playSpriteVoice(info);
                                if (!ok) alert('재생 실패 — "오디오 활성화"를 먼저 눌러주세요');
                                return;
                            }
                        }
                    });
                });

                const testArea = document.getElementById('key-test-area');
                const testResult = document.getElementById('key-test-result');
                if (testArea && testResult) {
                    testArea.addEventListener('focus', () => {
                        testArea.style.borderColor = 'rgba(100,180,255,0.5)';
                    });
                    testArea.addEventListener('blur', () => {
                        testArea.style.borderColor = 'rgba(100,180,255,0.2)';
                    });
                    testArea.addEventListener('keydown', async (e) => {
                        e.preventDefault();
                        const k = (e.key || '').toLowerCase();
                        if (keyBindings.has(k)) {
                            const info = keyBindings.get(k);
                            const fxLabel = info.fx ? ` ✨${FX_LABELS[info.fx]}` : '';
                            testResult.innerHTML = `<span style="color:#64ffb4;font-weight:700">${k.toUpperCase()}</span> → 🔊 ${info.imgName}${fxLabel}`;
                            await playSpriteVoice(info);
                        } else {
                            const isConflict = keyConflicts.some(c => c.key === k);
                            if (isConflict) {
                                testResult.innerHTML = `<span style="color:#f88;font-weight:700">${k.toUpperCase()}</span> ⚠️ 충돌 키`;
                            } else {
                                testResult.innerHTML = `<span style="color:#888">${k.toUpperCase()}</span> — 미할당`;
                            }
                        }
                    });
                }
            }, '🔊', 'html');
        } catch (err) { }

    } catch (error) { }
})();
