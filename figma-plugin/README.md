# Options Hub — Figma KR → EN Translator

팀이 작업한 한국어 Figma 파일을 영문판으로 변환하는 사내 플러그인.
원본은 절대 건드리지 않습니다 (사람이 먼저 Duplicate한 복제본에만 작업).

## 한 사이클 워크플로우

1. **복제** (Figma 안에서 수동)
   - 원본 파일 우클릭 → Duplicate. 또는 페이지/프레임 단위 Duplicate.
   - 복제본 이름 끝에 `(EN)` 같은 표시를 붙여 두면 헷갈리지 않음.

2. **Export** (플러그인)
   - 복제본 열기 → `Plugins` → `Development` → `Options Hub KR → EN Translator`
   - `Export texts.json` 클릭 → 다운로드된 파일을 `figma-plugin/exports/`로 옮김

3. **번역** (Claude Code)
   - Claude Code 세션에서 한 줄:
     > `figma-plugin/exports/texts-...json 번역해서 translations 폴더에 떨궈줘`
   - Claude는 같은 폴더의 `glossary.json`을 자동 적용해서 `figma-plugin/translations/translations-...json`을 생성
   - 결과 JSON을 한 번 훑어보고 어색한 문장이 있으면 Claude한테 "이건 X로 바꿔줘"로 수정 가능

4. **Import** (플러그인)
   - 같은 복제본에서 플러그인 다시 실행 → `Choose translations.json` → 파일 선택 → `Import & replace`
   - 끝나면 리포트 표시: 성공/누락/혼합스타일/오버플로우 카운트

5. **검토 & 공유**
   - 자동 레이아웃이 아닌 노드 중 영문이 길어진 것은 박스 넘칠 수 있음 (리포트에 ID 표시됨)
   - 마무리 후 영문 Figma 파일을 팀 프로젝트로 옮기거나 공유 링크 발행

## 처음 한 번만 — Figma에 등록

1. **Figma 데스크톱 앱** 실행 (웹 버전 X)
2. 메뉴 → `Plugins` → `Development` → `Import plugin from manifest...`
3. 이 폴더의 `manifest.json` 선택
4. 이후로는 `Plugins` → `Development` → `Options Hub KR → EN Translator`로 실행

## 자동 스킵 규칙

Export 시 다음 텍스트는 자동 제외됩니다:

| 사유 | 예시 |
|---|---|
| `empty` | 빈 문자열, 공백만 |
| `numeric-only` | `100`, `12.5%`, `$500`, `2026-04-28` |
| `no-korean` | 한글이 하나도 없는 텍스트 (영문, 코드, 외국어) |

브랜드명·티커(`Options Hub`, `XSP`, `Futubull` 등)가 한글과 섞여 있는 경우 → export는 되지만, `glossary.json`의 `preserveAsIs` 리스트에 따라 Claude가 번역 시 그대로 둡니다.

## 용어집 (`glossary.json`) 확장

새 용어 추가 시 — 단어/짧은 구는 `terms`, 문장/표제는 `phrases`, 브랜드/약어는 `preserveAsIs`.

```json
{
  "terms": {
    "신규용어": "New Term"
  },
  "phrases": {
    "긴 표제 한 줄": "Translated headline"
  },
  "preserveAsIs": [
    "새브랜드명"
  ]
}
```

## 한계 & 알려진 동작

- **혼합 스타일 노드**: 한 텍스트 노드 안에 굵기/색이 여러 개인 경우, 첫 segment의 스타일로 통일됨. 리포트에 ID 표시되니 수동 검토 필요.
- **고정 크기 텍스트** (`textAutoResize: NONE`): 영문이 한글보다 길어져 박스 넘칠 수 있음. 리포트에서 길이 1.4배 이상으로 늘어난 케이스를 경고.
- **컴포넌트 마스터**: 마스터 컴포넌트의 텍스트도 함께 교체됨 → 모든 인스턴스에 자동 반영 (의도된 동작).
- **노드 ID 기반**: Export 후 같은 복제본에 Import 해야 함. 복제본을 또 복제하면 ID가 바뀌어서 매칭 실패.
- **차분 번역 미지원**: 매 사이클 전체 재번역. 부분 업데이트는 수동으로 `translations.json` 일부만 추려서 import 가능.

## 파일 구조

```
figma-plugin/
├── manifest.json        # Figma 플러그인 매니페스트
├── code.js              # 텍스트 스캔/교체 로직 (sandbox)
├── ui.html              # 플러그인 UI
├── glossary.json        # 한→영 표준 용어집
├── exports/             # 추출된 texts-*.json 보관
├── translations/        # Claude가 만든 translations-*.json 보관
└── README.md
```

## translations.json 포맷 (참고)

Claude가 생성하는 파일 스펙:

```json
{
  "version": 1,
  "sourceFile": "texts-options-hub-20260428-143000.json",
  "translatedAt": "2026-04-28T14:35:00Z",
  "translations": {
    "1:23": "Strike Price",
    "1:24": "Premium",
    "5:101": "Place Your First Options Trade"
  }
}
```

`translations`는 노드 ID → 영문 텍스트 맵. 이 ID들은 Export된 `texts.json`의 ID와 정확히 일치해야 함.
