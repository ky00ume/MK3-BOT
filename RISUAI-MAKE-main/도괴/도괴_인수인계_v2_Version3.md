# 도괴 (倒壞) — 작업 인수인계 문서 v2.0

> 이 문서를 새 채팅의 첫 메시지에 첨부하면 이전 작업을 이어갈 수 있습니다.
> 작성일: 2026-03-15

---

## 1. 프로젝트 구조

```
도괴 봇 = 3개 파일로 구성

1) 캐릭터 카드 (.json 또는 RisuAI 내부)     ← ⬜ 미작성
   ├── description (시스템 프롬프트)
   ├── first_msg (퍼스트 메시지)
   └── globalLore[] ← 로어북 21개가 여기 들어감

2) 모듈 (dogoei_module.json)                 ← ✅ 완료, 가져오기 성공
   ├── type: "risuModule"
   ├── regex[19]   (AI 태그 파싱 → chatVar 저장)
   ├── trigger[1]  (새 채팅 시 초기값 세팅, effect 21개)
   └── lorebook: [] (비워둠)

3) 플러그인 (heritage_phone_module.js)       ← 🔧 v2.0 수정 필요
   └── 📱 스마트폰 UI (6탭)
```

---

## 2. 현재 완료 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| chatVar 명세서 (90개) | ✅ | 섹션 3 참조 |
| 모듈 JSON (regex 19 + trigger 1) | ✅ | RisuAI 가져오기 성공 확인 |
| 로어북 21개 content | ✅ | `dogoei_lorebook_FULL.json` 원본 |
| 플러그인 JS v1.0 | ✅ | `heritage_phone_module (3).js` |
| 정합성 검증 | ✅ | 10건 발견, 수정 방안 확정 |
| **플러그인 JS v2.0** | **🔧** | 코드 작성됨, 아직 파일 미교체 |
| **캐릭터 카드** | **⬜** | description, first_msg, globalLore 전부 없음 |
| **퍼스트 메시지 최종본** | **⬜** | 기획서에 초안 있음 |

---

## 3. chatVar 명세서

### 고정 변수 (트리거에서 초기값 세팅)

| 변수명 | 초기값 | 용도 |
|--------|--------|------|
| `cv_step` | `"1"` | 게임 진행 단계 |
| `cv_round` | `"1"` | 회차 |
| `cv_phase` | `"1"` | 붕괴 단계 (1~3) |
| `cv_battery` | `"82"` | 배터리 % (0~100) |
| `cv_signal` | `"2"` | 신호 강도 (0~4) |
| `cv_floor` | `"7"` | 현재 층 |
| `cv_game_hour` | `"22"` | 게임 시간 (시) |
| `cv_game_min` | `"39"` | 게임 시간 (분) |
| `cv_weather` | `"fog"` | 날씨 코드 |
| `cv_location_name` | `"7F 스위트룸 701"` | 위치 표시명 |
| `cv_companion` | `"none"` | 동행자 코드 |
| `cv_situation` | `"붕괴가 시작됐다."` | 현재 상황 텍스트 |
| `cv_aff_oh` | `"0"` | 오하은 호감도 (0~5) |
| `cv_aff_kang` | `"0"` | 강태오 호감도 |
| `cv_aff_seo` | `"0"` | 서준혁 호감도 |
| `cv_aff_lee` | `"0"` | 이나경 호감도 |
| `cv_aff_jung` | `"0"` | 정나비 호감도 |
| `cv_sus_kang` | `"0"` | 강태오 의��도 (0~5) |
| `cv_inv_keycard` | `"1"` | 키카드 보유 |
| `cv_inv_water` | `"1"` | 생수 보유 |
| `cv_contact_oh` | `"1"` | 오하은 연락처 해금 |

### 가변 패턴 변수

| 패턴 | 예시 | 용도 |
|------|------|------|
| `cv_inv_{코드}` | `cv_inv_doc_approval` | 아이템 보유 (0/1) |
| `cv_contact_{코드}` | `cv_contact_kang` | 연락처 해금 (0/1) |
| `cv_msg_{방코드}` | `cv_msg_oh`, `cv_msg_group` | 메시지 로그 (줄바꿈 구분) |
| `cv_unread_{방코드}` | `cv_unread_oh` | 안읽은 메시지 수 |
| `cv_scene_{씬코드}` | `cv_scene_oh_1` | 씬 해금 (0/1) |
| `cv_end_{엔딩코드}` | `cv_end_true` | 엔딩 달성 (0/1) |
| `cv_ach_{업적코드}` | `cv_ach_blade` | 업적 해금 (0/1) |
| `cv_sns_feed` | — | SNS 피드 (줄바꿈 구분) |
| `cv_situation_log` | — | 상황 로그 (줄바꿈 구분) |
| `cv_gallery_tab` | `"scene"` | 갤러리 서브탭 |

### pending 변수 (정규식→플러그인 중간 전달용)

| 변수명 | 형식 | 플러그인 처리 |
|--------|------|---------------|
| `cv_pending_aff` | `"코드\|±N"` | 클램프 0~5 후 `cv_aff_{코드}`에 반영 |
| `cv_pending_sus` | `"±N"` | 클램프 0~5 후 `cv_sus_kang`에 반영 |
| `cv_pending_bat` | `"변화량"` | 클램프 0~100 후 `cv_battery`에 반영 |
| `cv_pending_msg` | `"방\|발신자\|side\|내용\|시간"` | `cv_msg_{방}`에 append + unread++ |
| `cv_pending_situation` | `"텍스트"` | `cv_situation_log`에 append |
| `cv_pending_situation_resolve` | `"1"` | 로그 마지막 미해결→해결 |
| `cv_pending_sns` | `"닉\|내용\|시간\|키워드"` | `cv_sns_feed`에 append |

### pending이 필요한 이유

정규식(`editoutput`)의 `{{setvar}}`는 값을 덮어쓰기만 가능.
호감도처럼 기존값 + delta 계산이나 0~5 범위 제한을 정규식만으로는 할 수 없음.
정규식은 raw 값을 pending에 저장 → 플러그인의 `processPending()`이 클램프 처리 후 실제 변수에 반영.

---

## 4. 모듈 regex 19개 (���져오기 완료)

모든 정규식: `type: "editoutput"`, `flag: "g"`, `ableFlag: true`

| # | AI 출력 태그 | OUT 처리 |
|---|-------------|----------|
| 01 | `{SC\|이모지\|HH:MM\|위치\|단계}` | cv_game_hour, cv_game_min, cv_location_name, cv_phase **직접** |
| 02 | `{AFF\|코드\|±N}` | cv_pending_aff **pending** |
| 03 | `{SUS\|±N}` | cv_pending_sus **pending** |
| 04 | `{BAT\|변화량}` | cv_pending_bat **pending** |
| 05 | `{SIG\|0~4}` | cv_signal **직접** |
| 06 | `{INV\|코드\|get}` | cv_inv_$1=1 **직접** |
| 07 | `{INV\|코드\|use}` | cv_inv_$1=0 **직접** |
| 08 | `{FLOOR\|층}` | cv_floor **직접** |
| 09 | `{PHASE\|1~3}` | cv_phase **직접** |
| 10 | `{SCENE\|코드}` | cv_scene_$1=1 **직접** |
| 11 | `{ENDING\|코드}` | cv_end_$1=1 + cv_step=9 **직접** |
| 12 | `{ACH\|코드}` | cv_ach_$1=1 **직접** |
| 13 | `{MSG\|타입\|방\|발신자\|side\|내용\|시간}` | cv_pending_msg **pending** |
| 14 | `{TIME\|HH:MM}` | cv_game_hour, cv_game_min **직접** |
| 15 | `{WEATHER\|코드}` | cv_weather **직접** |
| 16 | `{LOCATION\|장소명}` | cv_location_name **직접** |
| 17 | `{SITUATION_NEW\|텍스트}` | cv_pending_situation **pending** |
| 18 | `{SITUATION_RESOLVE}` | cv_pending_situation_resolve=1 **pending** |
| 19 | `{SNS\|닉\|내용\|시간\|키워드}` | cv_pending_sns **pending** |

---

## 5. 모듈 trigger (가져오기 완료)

`type: "start"`, effect 21개 — 섹션 3 "고정 변수" 전부를 `setvar`로 초기화.

---

## 6. 로어북 21개 — 캐릭터 봇 globalLore에 넣어야 함

원본 파일: `dogoei_lorebook_FULL.json` (type: "risu", 21개 엔트리)

이 파일은 RisuAI 캐릭터 편집 → 로어북 탭 → 가져오기로 삽입.
모듈이 아님. 캐릭터 내부 로어북임.

| # | comment | insertorder | alwaysActive |
|---|---------|-------------|-------------|
| 01 | 게임 기본 규칙 | 10 | ✅ |
| 02 | 인벤토리 시스템 | 20 | ✅ |
| 03 | 아이템 목록 | 30 | ✅ |
| 04 | 호텔 구조 | 40 | ✅ |
| 05 | 호텔 역사 | 50 | ✅ |
| 06 | 오늘 밤 | 60 | ✅ |
| 07 | 오하은 공개 | 70 | ✅ |
| 07-S | 오하은 비밀 | 71 | ❌ 키워드 |
| 08 | 강태오 공개 | 80 | ✅ |
| 08-S | 강태오 비밀 | 81 | ❌ 키워드 |
| 09 | 서준혁 공개 | 90 | ✅ |
| 09-S | 서준혁 비밀 | 91 | ❌ 키워드 |
| 10 | 이나경 공개 | 100 | ✅ |
| 10-S | 이나경 비밀 | 101 | ❌ 키워드 |
| 11 | 정나비 공개 | 110 | ✅ |
| 11-S | 정나비 비밀 | 111 | ❌ 키워드 |
| 12 | 핵심 비리 구조 | 120 | ❌ 키워드 |
| 13 | 오하은의 살의 | 130 | ❌ 키워드 |
| 14 | 물증 10종 | 140 | ❌ 키워드 |
| 15 | 분기 조건 | 150 | ✅ |
| 16 | 엔딩 목록 | 160 | ✅ |

### 로어북 수정사항 (아직 미적용)

01번 content 하단에 아래 3줄 추가 필요:
```
## 태그 내 문자 제한
- {MSG} 태그의 '내용' 필드에 | 문자를 사용하지 마시오.
- {SNS} 태그의 '내용' 필드에 | 문자를 사용하지 마시오.
```

---

## 7. 플러그인 v1.0 → v2.0 수정사항

v1.0은 현재 작동 중인 파일. v2.0은 코드가 작성되었으나 파일 교체가 안 된 상태.

| 항목 | v1.0 (현재) | v2.0 (작성 완료, 미적용) |
|------|------------|------------------------|
| pending 처리 | ❌ 없음 | ✅ `processPending()` — render() 호출마다 실행 |
| 호감도/의심도 UI | ❌ 없음 | ✅ home 탭에 💛관계 카드 (★☆ 5개 + ▲△ 5개) |
| fallback 보험 | ❌ 없음 | ✅ init()에서 16개 변수 트리거 실패 대비 보정 |
| parseMsgs | 단순 split | 뒤에서부터 파싱 (내용에 `\|` 포함 시 안전) |
| parseSns | 단순 split | 동일 강화 |
| CHARACTERS role | 강태오="보안팀" | "형사" |
| | 이나경="연회팀장" | "프런트 직원" |
| | 정나비="대학생" | "사진작가" |
| 지도 탭 잠금 | cv_unlock_floor3/b2 사용 | cv_round 기반으로 통일 |
| location fallback | "게스트 라운지" | "7F 스위트룸 701" |

### pending 처리가 없으면 발생하는 문제

v1.0 상태에서는 AI가 `{AFF|oh|+1}`을 출력해도:
1. 정규식이 `cv_pending_aff = "oh|+1"`로 저장
2. 그런데 이걸 읽어서 `cv_aff_oh`에 반영하는 코드가 없음
3. → 호감도가 영원히 0으로 남음
4. → 폰 UI에 호감도 표시도 없음 (v1.0에는 위젯 자체가 없음)

BAT, SUS, MSG, SNS, SITUATION 전부 동일한 문제.
**v2.0 적용 전까지 pending 기반 변수는 모두 작동하지 않음.**

---

## 8. 정합성 검증 결과

| # | 등급 | 문제 | 수정 위치 | 적용 여부 |
|---|------|------|-----------|-----------|
| 1 | 🔴 | pending 처리 로직 없음 | 플러그인 | v2.0에 포함, **미적용** |
| 2 | 🔴 | cv_location_name fallback 불일치 | 플러그인 | v2.0에 포함, **미적용** |
| 3 | 🔴 | cv_inv_keycard/water fallback 불일치 | 플러그인 | v2.0에 포함, **미적용** |
| 4 | 🔴 | cv_contact_oh fallback 불일치 | 플러그인 | v2.0에 포함, **미적용** |
| 5 | 🔴 | 호감도/의심도 UI 없음 | 플러그인 | v2.0에 포함, **미적용** |
| 6 | 🟡 | parseMsgs 파이프 문자 깨짐 | 플러그인 | v2.0에 포함, **미적용** |
| 7 | 🟡 | 태그 내 파이프 문자 가능성 | 로어북 01번 | **미적용** |
| 8 | 🟡 | 메신저 사용 가이드 없음 | 로어북 01번 | **미적용** |
| 9 | 🟡 | parseSns 동일 문제 | 플러그인 | v2.0에 포함, **미적용** |
| 10 | 💬 | 메신저/전화 선택지 | 설계 결정 | 자연어 입력 채택 |

---

## 9. 데이터 파이프라인

```
🤖 AI 응답
  │  태그: {SC|🔦|22:51|5F 라운지|2} {AFF|oh|+1} {BAT|-2}
  ▼
📦 모듈 regex (editoutput)
  │  SC → cv_game_hour, cv_game_min, cv_location_name, cv_phase [직접]
  │  AFF → cv_pending_aff="oh|+1" [pending]
  │  BAT → cv_pending_bat="-2" [pending]
  │  태그가 채팅에서 제거됨
  ▼
📱 플러그인 render()
  │  processPending()  ← v2.0에서만 작동
  │    cv_aff_oh: 0+1=1 (클램프 0~5)
  │    cv_battery: 82-2=80 (클램프 0~100)
  │    pending 초기화
  │  UI 렌더링 (6탭)
  ▼
👁️ 📱폰 버튼 클릭 → UI 표시
```

---

## 10. 소스코드 확인 결과 (kwaroran/Risuai)

| 확인 사항 | 파일 | 결과 |
|-----------|------|------|
| editoutput OUT → CBS 파서 거침 | scripts.ts:289-291 | ✅ |
| {{setvar}} 존재 | cbs.ts:807-856 | ✅ |
| 모듈 JSON 필수 필드 | modules.ts:251-258 | `type:"risuModule"` + `name` + `id` |
| RisuModule 인터페이스 | risuai.d.ts:226-258 | name, description, lorebook?, regex?, trigger?, id |
| loreBook 인터페이스 | database.svelte.ts:1201-1222 | key, secondkey, insertorder, comment, content, mode, alwaysActive, selective |
| triggerEffectSetvar | triggers.ts:48-83 | { type, operator, var, value } |

---

## 11. 첨부 파일 목록

새 채팅에 이 문서와 함께 첨부할 파일:

| 파일 | 용도 | 상태 |
|------|------|------|
| `더_헤리티지_한양_기획서.md` | 전체 기획서 | 원본 |
| `dogoei_lorebook_FULL.json` | 로어북 21개 (캐릭터 globalLore용) | 원본 (01번 수정 필요) |
| `heritage_phone_module (3).js` | 플러그인 JS v1.0 | 원본 (v2.0 교체 필요) |
| `hotel_map (2).html` | 호텔 층별 구조 시각화 | 원본 |

---

## 12. 다음 작업 (TODO) — 반드시 사용자 승인 후 진행

### 🔴 즉시 필요

| 순서 | 작업 | 설명 |
|------|------|------|
| A | **플러그인 v2.0 적용** | pending 처리 + 호감도 UI + 파서 강화 + fallback 수정. v1.0을 v2.0으로 교체 |
| B | **로어북 01번 수정** | 태그 내 파이프 문자 금지 가이드 3줄 추가 |
| C | **캐릭터 카드 작성** | description(시스템 프롬프트) + first_msg(SC 태그 포함) + globalLore(로어북 21개) |

### 🟡 이후

| 작업 | 설명 |
|------|------|
| 퍼스트 메시지 최종본 | SC 태그 포함, 플러그인 연동 확인 |
| 테스트 시나리오 | 태그 파싱 검증용 대화 예시 |
| 2회차 루프 로직 | 엔딩 후 cv_round=2, 기억의 조각 |
| CBS {{button}} 선택지 | 메신저/전화 시 전용 선택지 (필요시) |

---

## 13. 주의사항

1. **로어북은 모듈이 아니라 캐릭터 카드 내부의 globalLore에 넣는다.**
2. **모듈 JSON에는 반드시 `"type": "risuModule"`이 있어야 한다.**
3. **pending 처리 로직은 플러그인 v2.0에만 있다. v1.0에서는 호감도/배터리/메시지가 작동하지 않는다.**
4. **작업 방향 결정이 필요한 부분은 반드시 먼저 사용자에게 확인받을 것.**