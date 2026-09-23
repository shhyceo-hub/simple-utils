# Simple Utils

작은 도구, 가벼운 업무. 로그인 없이 사용하는 한국어 사무용 정적 웹 유틸리티입니다.

## 도구

- 글자 수 세기: 이모지 포함 글자 수, 공백 제외, 단어, 줄, UTF-8 바이트
- 텍스트 정리: 양끝 공백, 연속 공백, 빈 줄 정리
- 중복 줄 제거: 공백·대소문자 옵션, 가나다순 정렬
- 목록 변환: 번호, 글머리 기호, Markdown 체크리스트, 쉼표 목록
- 날짜 계산: 총 일수, 평일·주말, 종료일 포함 옵션 (공휴일 미반영)
- 퍼센트 계산: 일부 값, 비율, 증감률
- JSON 정리: 문법 검증, 들여쓰기, 압축
- 표 변환: 엑셀 TSV → Markdown / CSV, 파일 다운로드

입력은 브라우저 메모리에만 보관됩니다. 서버 전송, 분석 스크립트, 외부 글꼴 요청, 브라우저 영구 저장이 없습니다. 도구를 바꾸면 텍스트 입력은 유지되며 새로고침하면 지워집니다. JSON 숫자는 JavaScript 정밀도를 따릅니다. CSV는 원본 셀을 보존하므로 신뢰할 수 없는 수식은 스프레드시트에서 열기 전에 검토하세요.

## 로컬 개발

Node.js 22.12 이상 권장.

```sh
npm ci
npm run dev
```

## 검사 및 빌드

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

`dist/`가 완성된 정적 사이트입니다. 상대 경로를 사용하므로 GitHub Pages 저장소 하위 경로에서도 작동합니다.

## GitHub Pages

저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 설정하세요.
`main`에 push하면 `.github/workflows/pages.yml`이 단위 테스트·브라우저 테스트·빌드를 통과한 뒤 배포합니다.

예정 주소: https://shhyceo-hub.github.io/simple-utils/

## 구성

- `src/app.js`: UI와 도구 연결
- `src/utils.js`: 계산·변환 순수 함수
- `src/style.css`: 반응형 스타일
- `tests/`: 단위 및 브라우저 테스트

별도 백엔드나 데이터베이스가 필요 없습니다.
