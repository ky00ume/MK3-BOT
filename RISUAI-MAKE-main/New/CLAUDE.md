# [프로젝트명] - Work Handoff Document
> Last updated: YYYY-MM-DD (세션 N)

## ABSOLUTE RULES (최우선 교리)

1. **백업 먼저**: 파일 수정 전 반드시 해당 폴더의 `백업/` 서브폴더에 `{순번}_{파일명}` 형식으로 백업 생성. 백업 없이 수정 금지.
2. **지시된 것만 실행**: 유저가 명시적으로 "해라/만들어라/추가해라"라고 한 것만 구현. 추론해서 추가 작업 금지.
3. **확인 후 행동**: 애매하면 구현하지 말고 물어볼 것.
4. **빌드 금지**: `build.ps1` 직접 실행 금지. 빌드는 유저가 수동으로 함.

---

## Project Overview

RisuAI 기반 [프로젝트 설명]. Lua 트리거 + 정규식 + 로어북 시스템으로 구동.

---

## Guide Index

| 문서 | 내용 |
|------|------|
| [가이드/핵심_패턴_가이드.md](가이드/핵심_패턴_가이드.md) | **필독** — 핵심 패턴 10가지 (버튼, Step UI, 태그파싱, 로어북 등) |
| [가이드/PROJECT_GUIDE.md](가이드/PROJECT_GUIDE.md) | 프로젝트 구조, 빌드 파이프라인, 변수 시스템, 넘버링 규칙 |
| [가이드/CURRENT_STATUS.md](가이드/CURRENT_STATUS.md) | 완성 작업 체크리스트 |
| [가이드/CHANGELOG.md](가이드/CHANGELOG.md) | 세션별 완료 작업 이력 |
| [가이드/BACKUP_LOG.md](가이드/BACKUP_LOG.md) | 백업 이력 |
| [가이드/CBS_QUICK_REF.md](가이드/CBS_QUICK_REF.md) | RisuAI CBS 매크로 문법 |
| [가이드/REGEX_OPTIMIZATION.md](가이드/REGEX_OPTIMIZATION.md) | 토큰 최적화 가이드 |
| [가이드/문법가이드_Lua.md](가이드/문법가이드_Lua.md) | Lua 5.4 + RisuAI API |
| [가이드/문법가이드_트리거_스크립트.md](가이드/문법가이드_트리거_스크립트.md) | 트리거 시스템 개요 |
| [가이드/문법가이드_정규식.md](가이드/문법가이드_정규식.md) | 정규식 패턴 참조 |
| [가이드/문법가이드_로어북.md](가이드/문법가이드_로어북.md) | 로어북 시스템 참조 |
| [가이드/문법가이드_HTML_CSS.md](가이드/문법가이드_HTML_CSS.md) | HTML/CSS 제약사항 |

---

## Pending Tasks

(없음)

---

## Notes

- 새 세션 시작 시 `CLAUDE.md` → `CURRENT_STATUS.md` → `CHANGELOG.md` 순서로 읽기 권장
- 작업 완료 후 반드시 `CHANGELOG.md`와 `CURRENT_STATUS.md` 갱신
- 백업 시 `BACKUP_LOG.md` 갱신
