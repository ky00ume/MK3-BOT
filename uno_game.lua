-- ============================================================
-- UNO GAME FOR RISUAI - 미무카와 나이스 트라이 전용
-- Version 1.0 — 기본 판정 엔진 + 판정 중계(Log) 시스템
--
-- [설정 방법]
--   1. CHAR_ID 를 이 스크립트를 사용할 캐릭터 ID 로 교체하세요.
--   2. 아래 Lua 코드 전체를 RisuAI 스크립트(triggerlua) 칸에 붙여 넣으세요.
--
-- [플레이 방법]
--   · uno        → 게임 시작
--   · play red7  → 패에서 red7 카드를 내기  (낼 카드 이름 붙여쓰기 가능: playred7)
--   · draw       → 덱에서 카드 한 장 뽑기
--   · hand       → 현재 내 패 확인
--   · red/blue/green/yellow → 와일드카드 내고 나서 색상 선택
--
-- [카드 이름 형식]
--   색상+숫자 : red0 ~ red9, blue0 ~ blue9, green0 ~ green9, yellow0 ~ yellow9
--   와일드    : wild (색상 변경), wild4 (색상 변경 + 상대 4장 뽑기)
-- ============================================================

-- ★ 사용할 캐릭터 ID 를 여기에 입력하세요 (RisuAI 캐릭터 식별자).
--   예: local CHAR_ID = "mimukawa_nice_try"
--   비워 두면 getChatVar / setChatVar 호출 시 빈 문자열이 ID 로 사용됩니다.
--   RisuAI 환경에 따라 현재 캐릭터를 가리킬 수도 있지만, 반드시 확인 후 사용하세요.
local CHAR_ID = ""

-- 셔플 시드의 최후 폴백값 (os.time / os.clock 모두 사용 불가일 때)
local DEFAULT_RANDOM_SEED = 12345

-- ============================================================
-- 1. 유틸리티 함수
-- ============================================================

-- 텍스트 정규화: 소문자 변환 + 공백 제거 (오탐 원천 차단)
local function norm(s)
    if not s then return "" end
    s = string.lower(s)
    s = string.gsub(s, "%s", "")
    return s
end

-- 쉼표(,)로 구분된 문자열 → 테이블
local function splitCards(s)
    local cards = {}
    if not s or s == "" then return cards end
    for card in string.gmatch(s, "[^,]+") do
        table.insert(cards, card)
    end
    return cards
end

-- 테이블 → 쉼표(,)로 구분된 문자열
local function joinCards(t)
    return table.concat(t, ",")
end

-- 카드에서 색상 부분 추출 ("red7" → "red", "wild" → "wild")
local function getColor(card)
    card = norm(card)
    if card == "wild" or card == "wild4" then
        return "wild"
    end
    local color = string.match(card, "^[a-z]+")
    return color or ""
end

-- 카드에서 숫자 부분 추출 ("red7" → "7", "wild" → nil)
local function getNumber(card)
    card = norm(card)
    if card == "wild" or card == "wild4" then
        return nil
    end
    local num = string.match(card, "%d+$")
    return num
end

-- 와일드카드 여부 판별
local function isWild(card)
    card = norm(card)
    return card == "wild" or card == "wild4"
end

-- 패(테이블)를 보기 좋게 출력
local function handDisplay(cards)
    if #cards == 0 then return "(없음)" end
    return table.concat(cards, ", ")
end

-- ============================================================
-- 2. 판정 엔진 (Stage 1)
--    canPlay(handCard, topCard, currentColor) → ok(bool), reason(string)
-- ============================================================

-- [판정 우선순위]
--   1) 와일드카드 → 항상 낼 수 있음
--   2) 현재 유효 색상과 일치 → 가능
--   3) 바닥 카드의 숫자와 일치 → 가능
--   4) 위 모두 불일치 → 불가
local function canPlay(handCard, topCard, currentColor)
    handCard    = norm(handCard)
    topCard     = norm(topCard)
    currentColor = norm(currentColor)

    local hColor = getColor(handCard)
    local hNum   = getNumber(handCard)
    local tNum   = getNumber(topCard)

    -- [판정 1] 와일드카드는 언제나 낼 수 있음
    if isWild(handCard) then
        return true, "와일드카드"
    end

    -- [판정 2] 현재 유효 색상 일치
    if hColor ~= "" and hColor == currentColor then
        return true, "색상일치(" .. hColor .. ")"
    end

    -- [판정 3] 숫자 일치 (양쪽 모두 숫자가 있을 때)
    if hNum and tNum and hNum == tNum then
        return true, "숫자일치(" .. hNum .. ")"
    end

    return false, "불일치"
end

-- ============================================================
-- 3. 덱 구성 및 셔플
-- ============================================================

local COLORS = { "red", "blue", "green", "yellow" }

-- 표준 UNO 덱 생성 (각 색상 0×1장 + 1~9×2장, 와일드 4장 + wild4 4장)
local function makeDeck()
    local deck = {}
    for _, color in ipairs(COLORS) do
        table.insert(deck, color .. "0")                -- 0 은 1장
        for n = 1, 9 do
            table.insert(deck, color .. n)              -- 1~9 각 2장
            table.insert(deck, color .. n)
        end
    end
    for _ = 1, 4 do
        table.insert(deck, "wild")
        table.insert(deck, "wild4")
    end
    return deck
end

-- Fisher-Yates 셔플 (math.random 사용)
local function shuffleDeck(deck)
    local n = #deck
    for i = n, 2, -1 do
        local j = math.random(1, i)
        deck[i], deck[j] = deck[j], deck[i]
    end
    return deck
end

-- 덱 앞에서 n장 뽑아 패로 분리 → (hand, remainingDeck)
local function deal(deck, n)
    local hand = {}
    for _ = 1, n do
        if #deck > 0 then
            table.insert(hand, table.remove(deck, 1))
        end
    end
    return hand, deck
end

-- ============================================================
-- 4. 게임 상태 저장/불러오기 (getChatVar / setChatVar)
-- ============================================================

local function getState()
    local s = getChatVar(CHAR_ID, "uno_state")
    return (s and s ~= "") and s or "idle"
end
local function setState(s) setChatVar(CHAR_ID, "uno_state", s) end

local function getPlayerHand()
    return splitCards(getChatVar(CHAR_ID, "uno_player_hand") or "")
end
local function setPlayerHand(t) setChatVar(CHAR_ID, "uno_player_hand", joinCards(t)) end

local function getAIHand()
    return splitCards(getChatVar(CHAR_ID, "uno_ai_hand") or "")
end
local function setAIHand(t) setChatVar(CHAR_ID, "uno_ai_hand", joinCards(t)) end

local function getDeckPile()
    return splitCards(getChatVar(CHAR_ID, "uno_deck") or "")
end
local function setDeckPile(t) setChatVar(CHAR_ID, "uno_deck", joinCards(t)) end

local function getTopCard()
    return getChatVar(CHAR_ID, "uno_top") or "red0"
end
local function setTopCard(card) setChatVar(CHAR_ID, "uno_top", card) end

local function getCurrentColor()
    local c = getChatVar(CHAR_ID, "uno_color")
    if not c or c == "" then return getColor(getTopCard()) end
    return c
end
local function setCurrentColor(c) setChatVar(CHAR_ID, "uno_color", c) end

local function getTurn()
    return getChatVar(CHAR_ID, "uno_turn") or "player"
end
local function setTurn(t) setChatVar(CHAR_ID, "uno_turn", t) end

-- ============================================================
-- 5. AI 턴 처리
-- ============================================================

-- AI: 패 중 낼 수 있는 첫 번째 카드 선택 (단순 전략)
local function aiChooseCard(aiHand, topCard, currentColor)
    for i, card in ipairs(aiHand) do
        local ok, reason = canPlay(card, topCard, currentColor)
        if ok then
            return i, card, reason
        end
    end
    return nil, nil, nil
end

local function aiTurn()
    local aiHand      = getAIHand()
    local topCard     = getTopCard()
    local currentColor = getCurrentColor()
    local deck        = getDeckPile()

    local idx, card, reason = aiChooseCard(aiHand, topCard, currentColor)

    if card then
        -- 카드를 낸다
        table.remove(aiHand, idx)
        setAIHand(aiHand)
        setTopCard(card)

        local newColor = currentColor
        if isWild(card) then
            -- AI 가 색상 랜덤 선택
            newColor = COLORS[math.random(1, 4)]
        else
            newColor = getColor(card)
        end
        setCurrentColor(newColor)

        -- [판정 중계 로그] AI 판정 결과 출력
        local log = "[판정] 바닥:" .. topCard .. "(색상:" .. currentColor .. ")"
                 .. " vs AI패:" .. card
                 .. " -> " .. reason
        if isWild(card) then
            log = log .. " / AI 색상선택: " .. newColor
        end
        alertNormal(log)

        -- ★ 승리 판정: AI 패가 0 장 → 즉시 종료, 차례 넘기기 실행하지 않음
        if #aiHand == 0 then
            setState("ended")
            alertNormal("🎴 게임 종료! 상대(나이스 트라이)가 모든 카드를 냈습니다. 상대의 승리!")
            return
        end

        setTurn("player")
        local status = "🤖 상대가 [" .. card .. "] 을 냈습니다."
        if isWild(card) then
            status = status .. " (선택 색상: " .. newColor .. ")"
        end
        status = status .. "\n📋 바닥: " .. card .. " / 유효색상: " .. newColor
        status = status .. "\n🖐 내 패(" .. #getPlayerHand() .. "장): " .. handDisplay(getPlayerHand())
        alertNormal(status)

        -- wild4: 플레이어가 4장 추가 뽑기
        if norm(card) == "wild4" then
            local pHand = getPlayerHand()
            local d = getDeckPile()
            local drawn = {}
            for _ = 1, 4 do
                if #d > 0 then
                    local c2 = table.remove(d, 1)
                    table.insert(pHand, c2)
                    table.insert(drawn, c2)
                end
            end
            setPlayerHand(pHand)
            setDeckPile(d)
            alertNormal("⚠️ Wild Draw 4! 당신이 4장을 추가로 뽑았습니다: " .. handDisplay(drawn)
                      .. "\n🖐 내 패(" .. #pHand .. "장): " .. handDisplay(pHand))
        end

    else
        -- 낼 카드 없음 → 1장 뽑기
        if #deck > 0 then
            local drawn = table.remove(deck, 1)
            table.insert(aiHand, drawn)
            setAIHand(aiHand)
            setDeckPile(deck)
        end
        setTurn("player")
        alertNormal("🤖 상대가 카드를 한 장 뽑았습니다. (" .. #aiHand .. "장 보유)\n"
                  .. "📋 바닥: " .. topCard .. " / 유효색상: " .. currentColor .. "\n"
                  .. "🖐 내 패(" .. #getPlayerHand() .. "장): " .. handDisplay(getPlayerHand()))
    end
end

-- ============================================================
-- 6. 게임 초기화
-- ============================================================

local function initGame()
    -- 랜덤 시드: os.time() 을 시도하고, 불가 시 os.clock() 으로 대체
    local seed = DEFAULT_RANDOM_SEED
    local ok_t, t = pcall(os.time)
    if ok_t and type(t) == "number" then
        seed = t
    else
        local ok_c, c = pcall(os.clock)
        if ok_c and type(c) == "number" then
            seed = math.floor(c * 1000000)
        end
    end
    math.randomseed(seed)

    local deck = shuffleDeck(makeDeck())
    local playerHand, deck2 = deal(deck, 7)
    local aiHand, deck3 = deal(deck2, 7)

    -- 첫 바닥 카드: 와일드카드 제외
    local topCard = nil
    local remaining = {}
    for _, card in ipairs(deck3) do
        if not topCard and not isWild(card) then
            topCard = card
        else
            table.insert(remaining, card)
        end
    end
    topCard = topCard or "red0"

    setPlayerHand(playerHand)
    setAIHand(aiHand)
    setDeckPile(remaining)
    setTopCard(topCard)
    setCurrentColor(getColor(topCard))
    setTurn("player")
    setState("playing")

    local msg = "🃏 UNO 게임 시작!\n"
             .. "━━━━━━━━━━━━━━━━━━━━\n"
             .. "📋 바닥 카드: [" .. topCard .. "]  유효색상: " .. getColor(topCard) .. "\n"
             .. "🖐 내 패(" .. #playerHand .. "장): " .. handDisplay(playerHand) .. "\n"
             .. "🤖 상대 패: " .. #aiHand .. "장\n"
             .. "━━━━━━━━━━━━━━━━━━━━\n"
             .. "💬 명령어: play [카드] | draw | hand"
    alertNormal(msg)
end

-- ============================================================
-- 7. 메인 입력 처리 함수
-- ============================================================

local function processInput(rawInput)
    local input = norm(rawInput)

    -- ── 게임 시작 ─────────────────────────────────────────────
    if input == "uno" or input == "unostart" or input == "시작"
       or input == "uno시작" or input == "게임시작" then
        initGame()
        return
    end

    local state = getState()

    -- ── 패 확인 ───────────────────────────────────────────────
    if input == "hand" or input == "패" or input == "내패" then
        if state ~= "playing" and state ~= "wildcolor" then
            alertNormal("게임이 진행 중이 아닙니다. 'uno' 를 입력해 시작하세요.")
            return
        end
        local hand = getPlayerHand()
        alertNormal("🖐 내 패(" .. #hand .. "장): " .. handDisplay(hand)
                  .. "\n📋 바닥: " .. getTopCard() .. " / 유효색상: " .. getCurrentColor())
        return
    end

    -- ── 게임 중이어야 하는 명령어 ───────────────────────────────
    if state == "idle" or state == "ended" then
        alertNormal("게임이 진행 중이 아닙니다. 'uno' 를 입력해 시작하세요.")
        return
    end

    if getTurn() ~= "player" then
        alertNormal("지금은 상대 차례입니다. 잠시 기다려 주세요.")
        return
    end

    -- ── 와일드카드 색상 선택 ─────────────────────────────────────
    if state == "wildcolor" then
        local validColors = { red = true, blue = true, green = true, yellow = true }
        if validColors[input] then
            setCurrentColor(input)
            setState("playing")
            alertNormal("✅ 색상을 [" .. input .. "] 으로 선택했습니다.\n🤖 상대 차례...")
            setTurn("ai")
            aiTurn()
        else
            alertNormal("올바른 색상을 입력하세요: red / blue / green / yellow")
        end
        return
    end

    -- ── 카드 뽑기 ─────────────────────────────────────────────
    if input == "draw" or input == "뽑기" or input == "카드뽑기" then
        local deck = getDeckPile()
        if #deck == 0 then
            alertNormal("⚠️ 덱에 카드가 남아 있지 않습니다!")
            return
        end
        local drawn = table.remove(deck, 1)
        local pHand = getPlayerHand()
        table.insert(pHand, drawn)
        setDeckPile(deck)
        setPlayerHand(pHand)
        alertNormal("🎴 [" .. drawn .. "] 을 뽑았습니다.\n🖐 내 패(" .. #pHand .. "장): " .. handDisplay(pHand))
        setTurn("ai")
        aiTurn()
        return
    end

    -- ── 카드 내기: "play red7" 또는 "playred7" 또는 "내다red7" 등 ──
    local playedCard = nil
    if string.sub(input, 1, 4) == "play" then
        playedCard = string.sub(input, 5)
    elseif string.sub(input, 1, 3) == "내다" then
        playedCard = string.sub(input, 4)
    elseif string.sub(input, 1, 2) == "내" then
        playedCard = string.sub(input, 3)
    end

    if playedCard and playedCard ~= "" then
        local pHand      = getPlayerHand()
        local topCard    = getTopCard()
        local curColor   = getCurrentColor()

        -- 패에서 카드 검색
        local foundIdx = nil
        for i, card in ipairs(pHand) do
            if norm(card) == norm(playedCard) then
                foundIdx = i
                break
            end
        end

        if not foundIdx then
            alertNormal("⚠️ 패에 [" .. playedCard .. "] 카드가 없습니다.\n🖐 내 패: " .. handDisplay(pHand))
            return
        end

        -- ★ 판정 엔진 호출
        local ok, reason = canPlay(playedCard, topCard, curColor)

        -- [판정 중계 로그] Stage 2 — 내부 계산 결과를 즉시 출력
        local log = "[판정] 바닥:" .. topCard .. "(색상:" .. curColor .. ")"
                 .. " vs 내패:" .. playedCard
                 .. " -> " .. (ok and ("✅ 유효! " .. reason) or "❌ " .. reason)
        alertNormal(log)

        if not ok then
            alertNormal("❌ 낼 수 없는 카드입니다!\n색상 또는 숫자가 바닥 카드와 일치해야 합니다.\n"
                      .. "바닥: " .. topCard .. " / 유효색상: " .. curColor)
            return
        end

        -- 카드를 패에서 제거하고 바닥에 냄
        table.remove(pHand, foundIdx)
        setPlayerHand(pHand)
        setTopCard(playedCard)

        -- 와일드카드 처리
        if isWild(playedCard) then
            setState("wildcolor")
            setTurn("player")   -- 색상 선택까지 플레이어 차례 유지
            alertNormal("✅ [" .. playedCard .. "] 을 냈습니다.\n"
                      .. "🌈 색상을 선택하세요: red / blue / green / yellow")
            return
        else
            setCurrentColor(getColor(playedCard))
        end

        -- ★ 승리 판정: 패가 0 장이 되는 즉시 게임 종료 — 차례 넘기기 실행 안 함
        if #pHand == 0 then
            setState("ended")
            alertNormal("🎉 UNO! 축하합니다! 당신이 모든 카드를 냈습니다. 당신의 승리! 🎉")
            return          -- ← 여기서 즉시 리턴, 이후 로직 실행 없음
        end

        -- 차례를 AI 에게 넘김
        setTurn("ai")
        alertNormal("✅ [" .. playedCard .. "] 을 냈습니다.\n"
                  .. "🖐 내 패(" .. #pHand .. "장): " .. handDisplay(pHand) .. "\n"
                  .. "🤖 상대 차례...")
        aiTurn()
        return
    end

    -- ── 알 수 없는 명령 ──────────────────────────────────────
    alertNormal("❓ 알 수 없는 명령입니다.\n"
              .. "💬 명령어: uno(시작) | play [카드] | draw(뽑기) | hand(패보기)")
end

-- ============================================================
-- 8. 진입점 — 마지막 메시지를 읽어서 processInput 호출
--    getLastMessage() 는 RisuAI triggerlua 환경이 주입하는 외부 함수입니다.
--    이 스크립트를 RisuAI 밖에서 단독 실행할 때는 별도로 스텁을 제공해야 합니다.
-- ============================================================
local rawMsg = getLastMessage()
if rawMsg and rawMsg ~= "" then
    processInput(rawMsg)
end
