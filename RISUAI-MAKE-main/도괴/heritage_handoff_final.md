---
name: heritage-hanyang-handoff
description: "더 헤리티지 한양 RisuAI 봇 개발 핸드오프 문서. 파일 구조, 완성 기능, AI 태그 시스템, 변수 목록, 버그 이력, TODO를 포함. 새 채팅에서 이어나갈 때 첨부."
---

# 더 헤리티지 한양 — RisuAI 봇 개발 핸드오프 문서

> 최종 업데이트: 2026년 3월
> 새 채팅에서 이어나갈 때 이 문서를 가장 먼저 읽는다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 장르 | 현대 심리 스릴러 / 재난 어드벤처 / 루프물 |
| 플랫폼 | RisuAI 데스크탑 앱 |
| 배경 | 더 헤리티지 한양 호텔 (1998년 준공, 8층) |
| 사건 | 6층 불법 증설 수영장으로 인한 건물 붕괴 |
| 구조 | 1회차(7층~5층 고립) → 2회차(진엔딩 루트 해금) |
| 주인공 | 강버들 (플레이어, {{user}}) |

---

## 2. 현재 RisuAI에 들어간 파일 목록

| 파일명 | RisuAI 위치 | 상태 |
|--------|-------------|------|
| `heritage_lua_v1.txt` | 트리거 스크립트 → Lua | ✅ |
| `heritage_background_embedding.txt` | 백그라운드 임베딩 | ✅ |
| `heritage_regex.json` | 정규식 스크립트 (JSON 임포트) | ✅ |
| `heritage_first_message.txt` | 첫 메시지 | ✅ |
| `heritage_globalnote.txt` | 글로벌 노트 | ✅ |
| `heritage_lorebook_v1.json` | 로어북 (JSON 임포트) | ✅ |
| `heritage_description.txt` | 디스크립션 | ✅ |
| `heritage_phone_module.js` | 플러그인 | ✅ 버튼 작동 확인 |

**기본 변수 (캐릭터 설정 → 기본 변수):**
```
cv_round: 1
cv_step: 1
cv_floor: 7
cv_phase: 1
cv_battery: 82
cv_signal: 2
cv_sus_kang: 0
cv_game_hour: 22
cv_game_min: 39
cv_location_name: 7층 스위트룸
cv_situation: 붕괴가 시작됐다.
cv_weather: fog
cv_companion: none
```

---

## 3. 완성된 기능

### ✅ 3단계 파이프라인

| 턴 | 변수 | 내용 |
|----|------|------|
| 1턴 | `Collapse_Timeline` | 붕괴 균열 순서, 증거 스케줄, NPC 레이어 배정 |
| 2턴 | `NPC_Relations` | 5인 관계 동적 생성 |
| 3턴 | `Main_Scenario` | 전체 타임라인, 전환점, NPC 자율행동, 오하은 살인 에스컬레이션 |

### ✅ SC 컷인 카드
```
{SC|🔦|22:51|5층 게스트 라운지|1}
```
- 정규식 → 카드 UI 변환
- Lua editOutput → cv_game_hour/min, cv_location_name, cv_floor, cv_phase 자동 저장
- 붕괴단계 색: 1=초록 / 2=주황 / 3=빨강(점멸)

### ✅ 스마트폰 패널 (heritage_phone_module.js)
- 6탭: 홈 / 메모 / 메시지 / SNS / 지도 / 갤러리
- 입력창 옆 아닌 화면 상단 우측에 📱 버튼 위치
- 탭 전환, X버튼, ESC 닫기 모두 작동

### ✅ NPC 5인 로어북
- 오하은 / 강태오 / 서준혁 / 이나경 / 정나비
- Round 2에서만 TRUTH_LAYER 추가 주입

### ✅ 자유 입력 방식 (霧の館 방식)
- 선택지 버튼 없음. 플레이어가 직접 텍스트 입력.
- 이유: RisuAI Lua API로 버튼 클릭 → AI 자동 응답 트리거 불가.

---

## 4. AI 출력 태그 시스템

| 태그 | 용도 | Lua 처리 |
|------|------|----------|
| `{SC\|이모지\|시간\|위치\|단계}` | SC 컷인 카드 | ✅ 정규식 변환 + Lua 변수 저장 |
| `{AFF\|코드\|±N}` | 호감도 | ❌ 미구현 |
| `{SUS\|±N}` | 강태오 의심도 | ✅ cv_sus_kang |
| `{BAT\|±N}` | 배터리 | ✅ cv_battery |
| `{SIG\|N}` | 신호 | ❌ 미구현 |
| `{INV\|코드\|get}` | 아이템 획득 | ❌ 미구현 |
| `{FLOOR\|N}` | 층 이동 | ✅ cv_floor |
| `{PHASE\|N}` | 붕괴 단계 | ✅ cv_phase |
| `{TIME\|HH:MM}` | 시간 | ✅ cv_game_hour/min |
| `{LOCATION\|장소명}` | 위치 | ✅ cv_location_name |
| `{SITUATION\|텍스트}` | 상황 덮어쓰기 | ✅ cv_situation |
| `{ENDING\|코드}` | 엔딩 | ❌ 미구현 |

---

## 5. 정규식 구조 (현재 3개)

| type | 설명 |
|------|------|
| editprocess | SC태그 리퀘제거 |
| editdisplay | SC태그 컷인카드 변환 |
| editdisplay | 게임태그 전체 숨김 |

---

## 6. Lua 구조

| 함수 | 역할 |
|------|------|
| `onStart` | 초기값 세팅 (1회, cv_round 없을 때만 실행) |
| `editRequest` | NPC 5인 로어북 강제 주입 / Round 2시 TRUTH_LAYER 추가 |
| `editDisplay` | 파이프라인 태그 숨김 (`[%s%S]-` 패턴) |
| `editOutput` | 파이프라인 파싱 + 게임 태그 파싱 + SC 태그 파싱 |

---

## 7. 알려진 버그 & 해결 이력

| 버그 | 원인 | 상태 |
|------|------|------|
| `<collapse_timeline>` 화면 노출 | Lua `.-` 줄바꿈 미매칭 | ✅ `[%s%S]-`로 해결 |
| 버튼 클릭 자동 전송 불가 | RisuAI Lua에 AI 트리거 API 없음 | ⚠️ 자유 입력으로 설계 변경 |
| 플러그인 `[object Promise]` | Risuai.getChatVar가 Promise 반환 | ✅ thenable 감지로 해결 |
| X버튼/탭 클릭 무반응 | 플러그인 샌드박스에서 window 함수 못 찾음 | ✅ data-hp-action 이벤트 위임으로 해결 |
| 폰 패널 위치/시간 미연동 | SC 태그 파싱 후 변수 저장 로직 없음 | ✅ editOutput에 SC 파싱 추가. **단, 기존 채팅은 onStart 스킵으로 초기값 미적용 — 새 채팅에서만 정상 동작** |
| 지도 현재층 고정 | cv_floor 업데이트 시점 문제 | ⚠️ 미해결 — 다음 세션 |

---

## 8. TODO (우선순위 순)

### 🔴 다음 세션 최우선
- [ ] **폰 패널 위치/층 실시간 연동 디버그** — SC 태그 파싱이 되는데 패널이 안 갱신되는 이유 확인. 플러그인이 `render()` 호출 시점에 최신 cv 값을 못 읽는 것으로 추정. `Risuai.getChatVar`가 비동기일 가능성.
- [ ] **{AFF} 태그 Lua 파싱** — 호감도 cv_aff_* 변수 반영
- [ ] **{SIG} 태그 Lua 파싱** — cv_signal 반영
- [ ] **{INV} 태그 Lua 파싱** — 인벤토리 cv_inv_* 반영

### 🟠 그 다음
- [ ] **시나리오 기반 조사 시스템** — 단계별 조사 가능 목록 로어북 관리
- [ ] **2회차 진입 로직** — cv_round 2 전환 조건
- [ ] **호감도 이벤트 트리거**
- [ ] **메신저 시스템** — MSG 태그 파싱, 읽음 표시

### 🟡 장기
- [ ] **배드엔딩 씬 연출**
- [ ] **진엔딩 루트 설계**
- [ ] **업적/갤러리 연동**

---

## 9. 주의사항

1. **onStart 스킵 문제** — `cv_round`가 이미 있으면 onStart가 실행 안 됨. 새 채팅에서만 초기값 세팅됨. 기존 채팅에서 변수 리셋하려면 기본 변수에서 직접 수정.
2. **Lua `[%s%S]-` 패턴** — 줄바꿈 포함 태그 매칭. `.-`로 되돌리면 태그 노출됨.
3. **정규식 JSON 임포트는 덮어쓰기** — 항상 `heritage_regex.json` 하나만 임포트.
4. **플러그인 감지** — `cv_step` 변수 존재 여부로 도괴 봇 감지. 기본 변수에 `cv_step: 1` 필수.
5. **버튼 자동 전송 불가** — RisuAI 구조적 한계. 추후 커뮤니티 해결책 나오면 적용.
6. **파이프라인 변수** — 새 채팅 시 자동 재생성. 기존 채팅 이어가면 기존 값 유지.
