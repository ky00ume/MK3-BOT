# MK3-BOT — 미무카와 나이스 트라이 UNO 게임

RisuAI (triggerlua) 전용 UNO 게임 스크립트입니다.

## 파일 구조

| 파일 | 설명 |
|------|------|
| `uno_game.lua` | RisuAI 스크립트 칸에 붙여 넣는 메인 Lua 코드 |

## 설정 방법

1. `uno_game.lua` 상단의 `CHAR_ID = ""` 값을 RisuAI 캐릭터 ID 로 교체하세요.
2. 파일 내용 전체를 RisuAI 의 **스크립트(triggerlua)** 칸에 붙여 넣으세요.

## 플레이 방법

| 명령어 | 설명 |
|--------|------|
| `uno` | 게임 시작 |
| `play red7` | 패에서 red7 카드를 내기 (붙여쓰기도 가능: `playred7`) |
| `draw` / `뽑기` | 덱에서 카드 한 장 뽑기 |
| `hand` / `패` | 현재 내 패 확인 |
| `red` / `blue` / `green` / `yellow` | 와일드카드 낸 뒤 색상 선택 |

## 카드 이름 형식

- 숫자 카드: `red0`~`red9`, `blue0`~`blue9`, `green0`~`green9`, `yellow0`~`yellow9`
- 와일드카드: `wild` (색상 변경), `wild4` (색상 변경 + 상대 4장 추가 뽑기)

## 구현 사양

- **언어**: Lua (triggerlua) — JS 미사용
- **변수 관리**: `getChatVar` / `setChatVar` API 전용
- **텍스트 비교**: `string.lower()` + `gsub("%s","")` 로 공백·대소문자 오류 원천 차단
- **Stage 1 판정 엔진**: 색상 일치 → 숫자 일치 → 와일드카드 우선순위 순서
- **승리 판정**: 플레이어 패 0장 즉시 `return` — 차례 넘기기 로직 미실행
- **Stage 2 판정 중계 로그**: 매 카드 판정 시 `[판정] 바닥:... vs 내패:... -> ...` 형식으로 `alertNormal` 출력
