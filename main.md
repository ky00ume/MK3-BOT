# MK3-BOT — 미무카와 나이스 트라이 UNO 게임

이 프로젝트는 RISUAI의 <미무카와 나이스 트라이> 캐릭터 봇 카드를 제작하기 위해 만들어졌습니다.

## 프로젝트 개요

본 레포지토리는 RisuAI 플랫폼에서 동작하는 **미무카와 나이스 트라이** 캐릭터 봇 카드 제작을 목적으로 합니다.  
Lua 트리거 스크립트, 정규식, 로어북, CSS/HTML UI 등 RisuAI 제작에 필요한 자료를 한데 모아 관리합니다.

## 폴더 구조

레포지토리의 모든 파일은 `RISUAI-MAKE-main/` 디렉토리 내에 아래와 같이 정리되어 있습니다.

| 폴더 | 설명 |
|------|------|
| `가이드/` | 문법 가이드, 프로젝트 가이드, 핵심 패턴 등 문서 자료 |
| `예제/` | CSS / HTML 예제 및 UI 참고 자료 |
| `도괴/` | 도괴(倒壞) — 더 헤리티지 한양 프로젝트 파일 |
| `독살에의초대/` | 독살에의 초대 프로젝트 파일 |
| `모듈/` | RisuAI 모듈 (.risum) 파일 모음 |
| `도구/` | JavaScript 도구 / 플러그인 (.js) |
| `프리셋/` | RisuAI 프리셋 (.risup) |
| `New/` | 새 프로젝트 빌드 시스템 템플릿 |

## 주요 문서

- [`RISUAI-MAKE-main/README.md`](RISUAI-MAKE-main/README.md) — 전체 자료 개요
- [`RISUAI-MAKE-main/CLAUDE.md`](RISUAI-MAKE-main/CLAUDE.md) — AI 작업 핸드오프 가이드
- [`RISUAI-MAKE-main/가이드/PROJECT_GUIDE.md`](RISUAI-MAKE-main/가이드/PROJECT_GUIDE.md) — 프로젝트 구조 및 빌드 파이프라인
