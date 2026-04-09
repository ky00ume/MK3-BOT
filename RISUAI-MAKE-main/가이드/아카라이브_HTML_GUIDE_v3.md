# 아카라이브 HTML 작성 가이드 v3

> 실제 게시글 작성에서 검증된 서식만 정리.  
> v2에서 추가 검증된 항목 반영. 안 되는 건 빼고, 되는 것만 남김.

---

## 1. 절대 규칙

| 구분 | 사용 가능 | 사용 불가 |
|------|----------|----------|
| 레이아웃 | `display:table`, `display:table-cell`, `display:inline-block` | `display:flex`, `display:grid` |
| 스타일 | **인라인 `style=""` 만** | `<style>` 태그, 외부 CSS, CSS 변수(`var(--x)`) |
| 스크립트 | 없음 | `<script>`, `onclick` 등 전부 |
| 클래스 | `fr-fic fr-dii` (이미지 전용) | 커스텀 class |
| 접기 | `<details>` + `<summary>` | - |
| 표 | `<table>` | - |
| 주석 | 없음 | `<!-- -->` (자동 삭제됨) |

> **⚠ 주석 주의:** HTML 주석은 아카 에디터가 저장 시 자동 삭제합니다. 구조 설명은 주석 대신 빈 줄로 구분하세요.

---

## 2. 가능한 CSS 속성 전체 목록

### ✅ 확실히 작동
```
background-color
background: linear-gradient(...)       ← v2에서 추가 확인
color
font-size, font-weight, font-family
padding, margin
border, border-radius, border-collapse
text-align, vertical-align
letter-spacing, line-height
width, max-width, height, min-height
display: table, table-cell, inline-block
list-style: none
float: right                           ← summary 안에서만 확인됨
box-shadow                             ← v2에서 추가 확인
text-decoration (underline, line-through 등)
```

### ❌ 안 먹히는 것
```
display: flex, grid
position (absolute / relative / fixed)
transform
animation, transition
z-index
overflow
cursor
opacity
@media (반응형 불가)
CSS 변수 var(--x)
가상 요소 ::before, ::after
고급 선택자 :hover, :nth-child 등
```

---

## 3. 컨테이너 기본 틀

전체를 감싸는 외곽 `<div>` 하나로 시작. 배경·테두리·폰트 여기서 결정.

```html
<div style="max-width:900px;margin:0 auto 24px auto;background:linear-gradient(160deg,#0c0e14,#111827,#0c0e14);border:2px solid {ACCENT};border-radius:14px;font-family:'Malgun Gothic',sans-serif;color:#d8dce6;">

  <!-- 헤더 -->
  <div style="background:linear-gradient(135deg,{ACCENT},{ACCENT_DARK});padding:24px 20px;text-align:center;border-radius:12px 12px 0 0;">
    <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:1px;">제목</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:6px;letter-spacing:3px;">SUBTITLE</div>
  </div>

  <!-- 본문 -->
  <div style="padding:20px 24px;line-height:1.9;font-size:14px;">
    내용
  </div>

  <!-- 푸터 -->
  <div style="padding:14px 24px;text-align:center;font-size:10px;color:#445;letter-spacing:1px;border-top:1px solid #2a2a3a;border-radius:0 0 12px 12px;">
    푸터 텍스트
  </div>

</div>
```

**border-radius 규칙:**
- 첫 섹션(헤더): `border-radius:12px 12px 0 0`
- 마지막 섹션(푸터): `border-radius:0 0 12px 12px`
- 중간 섹션: `border-radius:0`
- 섹션 연결부: `border-bottom:1px solid #2a2a3a` 또는 `border-top:none`

---

## 4. 가로 배치 (table-cell)

`display:flex` 불가. 가로 배치는 **반드시** `display:table` + `display:table-cell`.

### 2열
```html
<div style="display:table;width:100%;">
  <div style="display:table-cell;width:50%;vertical-align:top;padding:16px;">
    왼쪽
  </div>
  <div style="display:table-cell;width:50%;vertical-align:top;padding:16px;border-left:1px solid #2a2a3a;">
    오른쪽
  </div>
</div>
```

### 3열
```html
<div style="display:table;width:100%;">
  <div style="display:table-cell;width:33%;text-align:center;padding:16px 8px;border-right:1px solid #2a2a3a;">1열</div>
  <div style="display:table-cell;width:33%;text-align:center;padding:16px 8px;border-right:1px solid #2a2a3a;">2열</div>
  <div style="display:table-cell;width:34%;text-align:center;padding:16px 8px;">3열</div>
</div>
```

> `display:table`은 자식이 `display:table-cell`이어야 작동. 둘 중 하나만 쓰면 깨짐.

---

## 5. 스크린샷 칸

### 핵심 원칙
- **제목 행**(`<tr>`)과 **이미지 행**(`<tr>`)을 분리
- 이미지 `<td>`는 **완전히 비워둠** → 아카 에디터에서 커서 놓고 이미지 복붙
- `<img>` 태그 미리 작성 불필요. 붙여넣으면 아카가 자동 생성

### 아카가 삽입하는 img 태그 형식
```html
<img src="//ac-p1.namu.la/..." class="fr-fic fr-dii">
```
직접 쓸 경우 `class="fr-fic fr-dii"` 필수. 없으면 레이아웃 깨짐.

### 2열 (before/after 비교용)
```html
<table style="width:100%;border-collapse:collapse;">
  <tbody>
    <tr>
      <td style="width:50%;background:#111827;border:1px solid #1a1a2a;text-align:center;padding:7px 0;font-size:11px;font-weight:700;color:{ACCENT};">변경 전</td>
      <td style="width:50%;background:#111827;border:1px solid #1a1a2a;text-align:center;padding:7px 0;font-size:11px;font-weight:700;color:{ACCENT};">변경 후</td>
    </tr>
    <tr>
      <td style="background:#0a0e16;border:1px solid #1a1a2a;text-align:center;vertical-align:top;">
      </td>
      <td style="background:#0a0e16;border:1px solid #1a1a2a;text-align:center;vertical-align:top;">
      </td>
    </tr>
  </tbody>
</table>
```

### 1열 풀사이즈
```html
<table style="width:100%;border-collapse:collapse;">
  <tbody>
    <tr>
      <td style="background:#111827;border:1px solid #1a1a2a;text-align:center;padding:7px 0;font-size:11px;font-weight:700;color:{ACCENT};">캡션</td>
    </tr>
    <tr>
      <td style="background:#0a0e16;border:1px solid #1a1a2a;text-align:center;vertical-align:top;">
      </td>
    </tr>
  </tbody>
</table>
```

### 여러 장 연속 (같은 `<table>` 안에)
```html
<table style="width:100%;border-collapse:collapse;">
  <tbody>
    <tr>
      <td style="background:#111827;border:1px solid #1a1a2a;text-align:center;padding:7px 0;font-size:11px;font-weight:700;color:{ACCENT};">스샷 1</td>
    </tr>
    <tr>
      <td style="background:#0a0e16;border:1px solid #1a1a2a;text-align:center;vertical-align:top;">
      </td>
    </tr>
    <tr>
      <td style="background:#111827;border:1px solid #1a1a2a;border-top:none;text-align:center;padding:7px 0;font-size:11px;font-weight:700;color:{ACCENT};">스샷 2</td>
    </tr>
    <tr>
      <td style="background:#0a0e16;border:1px solid #1a1a2a;border-top:none;text-align:center;vertical-align:top;">
      </td>
    </tr>
  </tbody>
</table>
```

> 연속 스샷은 `border-top:none`으로 이중 선 방지.

---

## 6. 다운로드 버튼

`<button>` 태그 없음. `<a>` 안에 `<div>` 넣는 구조로 대체.

### 스타일 A — 테두리형 (권장, 눈 안 아픔)
```html
<div style="text-align:center;padding:20px 0;">
  <a href="URL" target="_blank" rel="noopener noreferrer">
    <div style="display:inline-block;background:#111827;border:2px solid {ACCENT};padding:12px 40px;border-radius:8px;">
      <span style="color:{ACCENT};font-size:14px;font-weight:700;letter-spacing:1px;">📁 다운로드</span>
    </div>
  </a>
</div>
```

### 스타일 B — 그라데이션형 (눈에 띔)
```html
<div style="text-align:center;padding:20px 0;">
  <a href="URL" target="_blank" rel="noopener noreferrer">
    <div style="display:inline-block;background:linear-gradient(135deg,{ACCENT},{ACCENT_DARK});padding:13px 48px;border-radius:50px;box-shadow:0 4px 20px rgba(0,0,0,0.35);">
      <span style="color:#fff;font-size:14px;font-weight:700;letter-spacing:1px;">📥 다운로드</span>
    </div>
  </a>
</div>
```

---

## 7. 접기/펼치기

```html
<details>
  <summary style="background:#111827;padding:14px 22px;font-size:13px;font-weight:700;color:{ACCENT};letter-spacing:1px;list-style:none;border-top:1px solid #2a2a3a;">
    섹션 제목 <span style="float:right;color:#556;font-size:11px;font-weight:400;">클릭하여 펼치기</span>
  </summary>
  <div style="padding:16px 22px;background:#0a0e16;font-size:13px;color:#8a94a8;line-height:1.8;">
    접힌 내용
  </div>
</details>
```

> `float:right`는 `<summary>` 안에서만 작동 확인됨. 다른 곳에선 테스트 필요.

---

## 8. 섹션 구분 헤더

```html
<div style="background:linear-gradient(160deg,#0c0e14,#1a1020,#0c0e14);padding:24px 22px 18px;text-align:center;border-top:1px solid #2a2a3a;border-bottom:1px solid #2a2a3a;">
  <div style="font-size:10px;letter-spacing:6px;color:rgba(200,150,200,0.4);margin-bottom:8px;">SECTION LABEL</div>
  <div style="font-size:18px;font-weight:900;color:{ACCENT};">섹션 제목</div>
  <div style="font-size:11px;color:#556;margin-top:4px;">부가 설명</div>
</div>
```

---

## 9. 번호 스텝 (border-left 타임라인)

```html
<div style="border-left:2px solid {ACCENT};margin-left:6px;">
  <div style="padding:8px 0 8px 16px;border-bottom:1px solid #151a28;">
    <span style="display:inline-block;background:linear-gradient(135deg,{ACCENT},{ACCENT_DARK});color:#fff;width:20px;height:20px;text-align:center;line-height:20px;font-size:10px;font-weight:700;border-radius:50%;margin-right:10px;">1</span>
    <span style="font-size:13px;color:#c0c8d8;">설명 텍스트</span>
  </div>
  <div style="padding:8px 0 8px 16px;">
    <span style="display:inline-block;background:linear-gradient(135deg,{ACCENT},{ACCENT_DARK});color:#fff;width:20px;height:20px;text-align:center;line-height:20px;font-size:10px;font-weight:700;border-radius:50%;margin-right:10px;">2</span>
    <span style="font-size:13px;color:#c0c8d8;">설명 텍스트</span>
  </div>
</div>
```

---

## 10. 코드 블록

아카라이브에 `<pre>` 태그는 작동하지만 syntax highlight 라이브러리 없음.  
`<span style="color:...">` 수동 색상으로 구현.

```html
<pre style="background:#0d0812;color:#e8d5f0;padding:14px 16px;border-radius:8px;font-size:12px;line-height:1.8;border:1px solid #2a1a2a;box-shadow:0 2px 12px rgba(0,0,0,0.4);border-left:3px solid {ACCENT};">코드 내용
<span style="color:#ff6b6b;text-decoration:line-through;">제거된 줄</span>
<span style="color:#80c080;">추가된 줄</span>
<span style="color:#888;">/* 주석 */</span>
</pre>
```

> `overflow`가 안 먹히므로 긴 줄은 자연 줄바꿈되거나 칸을 넘침. 너무 긴 한 줄 코드는 피할 것.

---

## 11. 인라인 코드 / 태그 뱃지

### 인라인 코드
```html
<code style="background:#1a0f2e;color:#c89ef0;padding:2px 6px;border-radius:4px;font-size:11px;">코드</code>
```

### 태그 뱃지
```html
<span style="display:inline-block;background:#1a1020;border:1px solid {ACCENT};padding:4px 14px;border-radius:20px;font-size:12px;color:#e0e0e0;margin:3px;">태그</span>
```

---

## 12. 점선 안내 박스

```html
<div style="border:1px dashed {ACCENT};background:#0f0f1a;padding:12px 16px;margin:12px 0;border-radius:8px;">
  <div style="font-size:11px;font-weight:700;color:{ACCENT};margin-bottom:4px;">⚠ 제목</div>
  <div style="font-size:12px;color:#8a94a8;line-height:1.7;">내용</div>
</div>
```

---

## 13. 예시 테마 — 다크 핑크

실제 벚꽃 테마 패치 게시글에서 사용한 테마.  
`{ACCENT}` = `#c47a9a`, `{ACCENT_DARK}` = `#7a3358`.  
그대로 복붙해서 색만 바꾸면 다른 테마로 전환 가능.

```html
<div style="max-width:900px;margin:0 auto 24px auto;background:linear-gradient(160deg,#1a0a12,#200d18,#1a0a12);border:2px solid #c47a9a;border-radius:14px;font-family:'Malgun Gothic',sans-serif;color:#e8d5df;">

  <div style="background:linear-gradient(135deg,#c47a9a,#7a3358);padding:26px 20px;text-align:center;border-radius:12px 12px 0 0;">
    <div style="font-size:10px;letter-spacing:6px;color:rgba(255,220,235,0.6);margin-bottom:8px;">CATEGORY · TAG</div>
    <div style="font-size:22px;font-weight:900;color:#fff0f6;letter-spacing:1px;">게시글 제목</div>
    <div style="font-size:11px;color:rgba(255,220,235,0.65);margin-top:6px;letter-spacing:2px;">부제목</div>
  </div>

  <div style="padding:20px 24px;line-height:1.9;font-size:14px;color:#c8a0b8;border-bottom:1px solid #3a1a2a;">
    본문 내용
  </div>

  <div style="padding:14px 24px;text-align:center;font-size:10px;color:#4a2a38;letter-spacing:2px;border-radius:0 0 12px 12px;">
    Special Thanks: <a href="#" style="color:#7a4a68;">링크</a>
  </div>

</div>
```

**색상 교체 치트시트:**

| 테마 | ACCENT | ACCENT_DARK | 배경 |
|------|--------|-------------|------|
| 다크 핑크 | `#c47a9a` | `#7a3358` | `#1a0a12` |
| 다크 골드 | `#d4a44c` | `#8a6020` | `#14100a` |
| 다크 청록 | `#4ab8a8` | `#206858` | `#0a1614` |
| 다크 블루 | `#5a8fd8` | `#204880` | `#0a0e1a` |
| 다크 라벤더 | `#9a7ad8` | `#503890` | `#100a1a` |

---

## 14. 작성 체크리스트

- [ ] 모든 스타일이 인라인 `style=""`인가
- [ ] `flex`, `grid`, `position`, `transform`, `overflow` 없는가
- [ ] 가로 배치는 `display:table` + `table-cell`인가
- [ ] 스크린샷 칸은 제목 tr / 이미지 tr 분리했는가
- [ ] 이미지 `<td>`는 비워뒀는가 (복붙용)
- [ ] 연속 스샷에 `border-top:none` 처리했는가
- [ ] 헤더 `border-radius:12px 12px 0 0`, 푸터 `0 0 12px 12px`
- [ ] `<a>` 태그에 `target="_blank" rel="noopener noreferrer"`
- [ ] `box-shadow`는 `rgba()` 형식으로 (hex alpha 미지원 가능성)
- [ ] 본문 `font-size:13~14px`, `line-height:1.7~1.9`
- [ ] 라벨/캡션 `font-size:10~11px`, `letter-spacing:2~6px`
- [ ] HTML 주석 `<!-- -->` 전부 제거했는가 (저장 시 자동 삭제)
- [ ] `CSS 변수 var(--x)` 안 썼는가
