-- ============================================
-- 예시: 버튼 핸들러 (Button Handler)
-- ============================================
-- risu-btn="이름" 속성이 있는 HTML 요소를 클릭하면
-- onButtonClick(triggerId, data) 함수가 호출됩니다.
-- data에는 risu-btn의 값이 문자열로 전달됩니다.

-- ============================================
-- 버튼 핸들러
-- ============================================

function onButtonClick(triggerId, data)

    -- 예시: 시작 버튼
    if data == "start-btn" then
        setChatVar(triggerId, "cv_step", "1")
        reloadDisplay(triggerId)
        return
    end

    -- 예시: 아이템 선택 (접두사 패턴)
    if data:match("^item%-") then
        local itemId = data:match("item%-(.+)")
        setChatVar(triggerId, "cv_selected_item", itemId)
        alertNormal(triggerId, itemId .. " 선택됨")
        reloadDisplay(triggerId)
        return
    end

    -- 예시: 토글 버튼
    if data == "toggle-option" then
        local current = getChatVar(triggerId, "cv_option") or "0"
        if current == "1" then
            setChatVar(triggerId, "cv_option", "0")
        else
            setChatVar(triggerId, "cv_option", "1")
        end
        reloadDisplay(triggerId)
        return
    end

end

-- ============================================
-- 이벤트 핸들러
-- ============================================

function onOutput(triggerId)
    -- AI 응답 후 처리
    local msg = getCharacterLastMessage(triggerId)

    -- 예시: 태그 파싱
    -- AI가 {ACTION|내용} 형식으로 출력하면 파싱
    for tag, content in msg:gmatch("{(%w+)|([^}]+)}") do
        if tag == "STATUS" then
            setChatVar(triggerId, "cv_status", content)
        end
    end
end

-- ============================================
-- 디스플레이 수정 (UI 렌더링)
-- ============================================

listenEdit("editDisplay", function(triggerId, data)
    -- 예시: {MY_TAG} → HTML로 치환
    data = data:gsub("{MY_TAG}", function()
        local status = getChatVar(triggerId, "cv_status") or "없음"
        return "<div class=\"my-status\">상태: " .. status .. "</div>"
    end)
    return data
end)

-- ============================================
-- 리퀘스트 수정 (프롬프트 최적화)
-- ============================================

listenEdit("editRequest", function(triggerId, data)
    -- 예시: 프롬프트에서 UI 태그 제거 (토큰 절약)
    data = data:gsub("{MY_TAG}", "")
    return data
end)
