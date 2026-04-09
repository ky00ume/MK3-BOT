# 프로젝트 가이드

> RisuAI 봇 프로젝트의 구조, 시스템 개요, 빌드 파이프라인을 설명하는 문서입니다.

---

## 프로젝트 구조

```
프로젝트명/
├── CLAUDE.md            ← AI 핸드오프 문서 (최우선 읽기)
├── build.ps1            ← 빌드 스크립트 (PowerShell)
│
├── 가이드/              ← 프로젝트 및 문법 가이드
│   ├── PROJECT_GUIDE.md         이 문서
│   ├── CURRENT_STATUS.md        현재 완성 상태
│   ├── CHANGELOG.md             세션별 작업 이력
│   ├── BACKUP_LOG.md            백업 이력
│   ├── CBS_QUICK_REF.md         CBS 매크로 레퍼런스
│   ├── REGEX_OPTIMIZATION.md    토큰 최적화
│   ├── 문법가이드_Lua.md        Lua 5.4 + RisuAI API
│   ├── 문법가이드_트리거_스크립트.md  트리거 시스템
│   ├── 문법가이드_정규식.md     정규식 스크립트
│   ├── 문법가이드_로어북.md     로어북 시스템
│   └── 문법가이드_HTML_CSS.md   HTML/CSS 제약사항
│
├── lua/                 ← Lua 스크립트 (번호순 병합)
│   ├── 백업/            ← 수정 전 백업
│   ├── 01_파일명.lua    ← 번호순 정렬 → build 시 병합
│   └── 02_파일명.lua
│
├── css/                 ← CSS 스타일시트 (번호순 병합)
│   ├── 백업/
│   ├── 00_wrapper_start.txt   ← <style> 태그 (필수)
│   ├── 01_파일명.css
│   └── 99_wrapper_end.txt     ← </style> 태그 (필수)
│
├── regex/               ← 정규식 스크립트 JSON (번호순 병합)
│   ├── 백업/
│   └── 001_파일명.json
│
├── html/                ← 퍼스트 메시지 HTML (번호순 병합)
│   └── 00_first_message.html
│
├── lorebook/            ← 로어북 JSON 파일
│   ├── data-카테고리/   ← 데이터 로어북 (서브폴더별 자동 그룹)
│   ├── rp-카테고리/     ← RP 로어북 (서브폴더별 자동 그룹)
│   └── 단독파일.json    ← 루트 레벨 로어북
│
├── globalnote/          ← 글로벌노트 txt (번호순 병합)
│   └── 01_system.txt
│
├── risu/                ← 빌드 출력 (RisuAI 임포트용)
│   ├── 기본변수.txt     ← 채팅 변수 초기값
│   ├── Background_Embedding.txt  ← CSS 병합 결과
│   ├── Lua.txt          ← Lua 병합 결과
│   ├── regexscript_export.json   ← Regex 병합 결과
│   ├── lorebook_export.json      ← Lorebook 병합 결과
│   ├── first_message.txt         ← HTML 병합 결과
│   └── globalnote.txt   ← Globalnote 병합 결과
│
├── _tools/              ← 유틸리티 스크립트
└── Image/               ← 에셋 이미지
```

---

## 분할 파일 작업 방식

### 개요

RisuAI는 각 기능(Lua, CSS, 정규식 등)을 **단일 파일**로 임포트합니다. 하지만 하나의 거대한 파일을 직접 편집하면 관리가 어렵습니다.

이 프로젝트는 **소스 파일을 기능별로 분할**하고, `build.ps1`로 병합하는 방식을 사용합니다.

```
[소스 파일 (분할)]              [빌드 출력 (병합)]              [RisuAI]
lua/01_data.lua          ┐
lua/02_setup_html.lua    ├→ risu/Lua.txt              →  Lua 스크립트
lua/03_button_handler.lua┘

css/00_wrapper_start.txt ┐
css/01_panel.css         ├→ risu/Background_Embedding.txt → 백그라운드 임베딩
css/02_status.css        │
css/99_wrapper_end.txt   ┘

regex/001_panel.json     ┐
regex/002_status.json    ├→ risu/regexscript_export.json → 정규식 스크립트
regex/003_image.json     ┘

lorebook/**/*.json       ──→ risu/lorebook_export.json    → 로어북
html/*.html              ──→ risu/first_message.txt       → 첫 메시지
globalnote/*.txt         ──→ risu/globalnote.txt          → 글로벌노트
```

### 작업 규칙

1. **소스 파일만 편집** — `lua/`, `css/`, `regex/`, `html/`, `lorebook/`, `globalnote/` 폴더의 파일을 수정
2. **risu/ 폴더는 직접 수정 금지** — 빌드 출력물이므로 다음 빌드에서 덮어써짐
3. **빌드는 유저가 수동 실행** — AI가 `build.ps1`을 실행하지 않음
4. **수정 전 백업** — 원본 파일을 해당 폴더의 `백업/` 서브폴더에 복사

### 분할 기준

| 폴더 | 분할 단위 | 예시 |
|------|-----------|------|
| lua/ | 기능/역할별 | `01_data.lua` (데이터), `02_html.lua` (HTML 생성), `03_handler.lua` (버튼) |
| css/ | UI 컴포넌트별 | `01_panel.css` (패널), `02_status.css` (상태창) |
| regex/ | 기능별 | `001_panel.json` (사이드패널), `002_status.json` (상태창 HUD) |
| lorebook/ | 카테고리별 서브폴더 | `data-warrior/`, `data-mage/`, `rp-warrior/` |
| globalnote/ | 역할별 | `01_system.txt` (시스템 규칙) |

### RisuAI 임포트 방법

빌드 후 `risu/` 폴더의 파일을 RisuAI 캐릭터 설정에 각각 붙여넣거나 임포트:

| 빌드 출력 | RisuAI 설정 위치 |
|-----------|-----------------|
| `risu/Lua.txt` | 트리거 스크립트 → Lua |
| `risu/Background_Embedding.txt` | 백그라운드 임베딩 |
| `risu/regexscript_export.json` | 정규식 스크립트 (JSON 임포트) |
| `risu/lorebook_export.json` | 로어북 (JSON 임포트) |
| `risu/first_message.txt` | 첫 메시지 |
| `risu/globalnote.txt` | 글로벌 노트 |
| `risu/기본변수.txt` | 기본 변수 |

---

## 빌드 파이프라인

### build.ps1 사용법

PowerShell에서 실행:
```powershell
.\build.ps1
```

메뉴:
| 번호 | 대상 | 입력 → 출력 |
|------|------|-------------|
| 1 | CSS | `css/*.css,*.txt` → `risu/Background_Embedding.txt` |
| 2 | Lua | `lua/*.lua` → `risu/Lua.txt` |
| 3 | Regex | `regex/*.json` → `risu/regexscript_export.json` |
| 4 | Lorebook | `lorebook/**/*.json` → `risu/lorebook_export.json` |
| 5 | HTML | `html/*.html` → `risu/first_message.txt` |
| 6 | Globalnote | `globalnote/*.txt` → `risu/globalnote.txt` |
| 7 | ALL | 위 전부 |

### 병합 규칙
- 파일명 **알파벳/숫자 순서**로 병합됨
- 따라서 파일명 앞에 번호를 붙여 순서를 제어
- Regex/Lorebook은 JSON `data` 배열을 추출하여 합침

### 넘버링 규칙

| 폴더 | 파일명 형식 | 예시 |
|------|-------------|------|
| lua/ | `NN_이름.lua` | `01_button_handler.lua`, `02_setup_html.lua` |
| css/ | `NN_이름.css` | `01_sidepanel.css`, `02_status.css` |
| css/ | `00_wrapper_start.txt` / `99_wrapper_end.txt` | `<style>` / `</style>` 래퍼 **(필수)** |
| regex/ | `NNN_이름.json` | `001_sidepanel.json`, `002_status.json` |
| html/ | `NN_이름.html` | `00_first_message.html` |
| globalnote/ | `NN_이름.txt` | `01_system.txt` |

### Regex comment 넘버링

RisuAI에 업로드하면 regex comment가 목록에 표시됩니다. 파일 내 각 data 항목의 comment에 넘버링을 포함하여 정렬/식별합니다:

```
{파일번호}_v{항목번호}_{설명}
```

예시:
- `001_v001_사이드패널_토글` — 001번 파일의 1번째 항목
- `001_v002_상태창_리퀘제거` — 001번 파일의 2번째 항목
- `002_v001_이미지_렌더링` — 002번 파일의 1번째 항목

### BOM 처리
- 빌드 스크립트는 **UTF-8 BOM을 자동 제거**합니다
- 출력 파일도 BOM 없이 저장됩니다

---

## 변수 시스템

### 규약
- **접두사**: `cv_` (Chat Variable)
- RisuAI의 `setChatVar` / `getChatVar`로 관리
- CBS에서 `{{getvar::cv_변수명}}`으로 읽기

### 기본변수 (risu/기본변수.txt)
- RisuAI 캐릭터 설정의 "기본 변수" 에 붙여넣기
- `// 주석` 형식으로 설명 가능
- `변수명: 초기값` 형식

```
// --- 셋업 ---
cv_step: 0

// --- 게임 상태 ---
cv_state:
```

---

## 각 레이어 역할

### Lua (트리거 스크립트)
- 이벤트 처리 (`onStart`, `onOutput`, `onInput`)
- 버튼 핸들러 (`onButtonClick`)
- 변수 조작, 로어북 동적 생성, AI 호출
- → 자세한 API: [문법가이드_Lua.md](문법가이드_Lua.md)

### Regex (정규식 스크립트)
- UI 렌더링 (editDisplay): 상태창, 사이드패널, 이미지
- 토큰 최적화 (editRequest): 오래된 태그 제거
- 출력 수정 (editOutput): 태그 숨김
- → 자세한 문법: [문법가이드_정규식.md](문법가이드_정규식.md)

### Lorebook (로어북)
- 키워드 기반 컨텍스트 주입
- `data-*` 폴더: 캐릭터/아이템 데이터
- `rp-*` 폴더: RP(역할극) 지침
- `@@dont_activate` + `@@stored_key`: Lua에서 동적 활성화
- → 자세한 문법: [문법가이드_로어북.md](문법가이드_로어북.md)

### CSS (백그라운드 임베딩)
- 모든 스타일을 여기에 선언 (정규식에 `<style>` 금지)
- `.클래스.서브클래스` → `.클래스.x-risu-서브클래스` 접두사 규칙
- → 자세한 제약: [문법가이드_HTML_CSS.md](문법가이드_HTML_CSS.md)

### HTML (퍼스트 메시지)
- 첫 화면 UI, CBS 조건부 블록
- `risu-btn="이름"` → Lua `onButtonClick` 연동

### Globalnote
- AI에게 항상 전달되는 시스템 지침
- RP 규칙, 응답 형식, 금지사항 등

---

## 백업 규칙

**파일 수정 전 반드시 백업**

| 항목 | 규칙 |
|------|------|
| 위치 | `{폴더}/백업/{순번}_{원본파일명}` |
| 넘버링 | `001_`, `002_`, `003_` ... (3자리) |
| 같은 번호 | 같은 시점의 백업 (여러 파일 동시 백업 시) |

예시:
- `lua/01_main.lua` → `lua/백업/001_01_main.lua`
- `regex/001_panel.json` → `regex/백업/001_001_panel.json`

→ 상세 이력: [BACKUP_LOG.md](BACKUP_LOG.md)

---

## 파일 형식 참조

### Regex JSON
```json
{
  "type": "regex",
  "data": [
    {
      "comment": "스크립트 이름",
      "in": "\\{패턴\\}",
      "out": "<div>대체 HTML</div>",
      "type": "editdisplay",
      "ableFlag": true,
      "flags": "g"
    }
  ]
}
```
- `type` 종류: `editinput`, `editoutput`, `editrequest`, `editdisplay`, `edittrans`

### Lorebook JSON
```json
{
  "type": "risu",
  "ver": 1,
  "data": [
    {
      "key": "활성화키",
      "comment": "항목 이름",
      "content": "AI에 전달될 내용",
      "mode": "normal",
      "insertorder": 100,
      "alwaysActive": false
    }
  ]
}
```

### 기본변수 (risu/기본변수.txt)
```
// 주석
변수명: 초기값
변수명:
```

---

**최종 업데이트: YYYY-MM-DD**
