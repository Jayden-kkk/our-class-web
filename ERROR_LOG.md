# 🛠️ 오류 수정 및 유지보수 기록 (ERROR_LOG)

프로젝트 운영 중 발생한 주요 오류의 원인 분석과 해결 방법을 기록한 문서입니다.

---

## 1. [2026-11-05] 주간 시간표 데이터 로딩 실패 오류 (`-` 빈칸 표시 현상)

### 📌 증상
- 학생 포털([`index.html`](file:///c:/Users/HOME/Desktop/junwoo/index.html))에서 **1학년 6반 주간 시간표** 모달을 열었을 때, 상단 주차 일자(`26-11-02 ~ 26-11-06`)는 정상 표시되나 1~7교시 모든 요일의 수업 과목이 `-`로 비어 있는 현상 발생.
- 새로고침 버튼을 눌러도 데이터가 불러와지지 않음.
- Cloud Functions API (`getTimetable`) 호출 시 HTTP `500` 에러와 함께 아래 응답 반환:
  ```json
  {
    "success": false,
    "error": "소스에서 식별 코드를 찾을 수 없습니다."
  }
  ```

### 🔍 원인 분석
1. **컴시간알리미(`comci.net`) 웹사이트의 스크립트 난독화 적용**
   - 기존에는 컴시간알리미 프레임 페이지(`http://comci.net:4082/st`)의 HTML 소스 내부에 `function school_ra(sc)` 및 `sc_data('...')` 식별 코드가 평문(Plain Text)으로 노출되어 있어 `comcigan-parser` 라이브러리가 이를 문자열 검색(`indexOf`)으로 추출했음.
   - 그러나 컴시간알리미 측에서 외부 파싱을 방지하기 위해 핵심 `<script>` 영역을 `/* hour-obfuscated-v2 */` 형태의 16진수(Hex) + 비트 XOR 연산(`(k + (j / 4) * 13) & 255`) 자기복호화 함수(IIFE)로 난독화함.
   - 그 결과 `comcigan-parser`가 평문에서 `school_ra(sc)`와 `sc_data('`를 찾지 못해 초기화 단계(`timetable.init()`)에서 에러를 발생시킴.
   - *(참고: 10월에서 11월로 월이 넘어가는 날짜 계산 문제와는 무관함)*

2. **Firebase Cloud Functions Node.js 20 런타임 지원 종료 (배포 시 발생)**
   - 2026-10-30부로 Firebase Functions에서 Node.js 20 런타임 배포가 중단되어 재배포 시 런타임 버전 업그레이드가 필요했음.

### ✅ 해결 방법
1. **컴시간 난독화 자동 복호화 패치 추가 ([`functions/index.js`](file:///c:/Users/HOME/Desktop/junwoo/functions/index.js))**
   - `comcigan-parser` 내부에서 사용하는 `iconv-lite` 모듈의 `decode` 함수를 래핑(`patchComciganIconv`)하여, 컴시간 서버로부터 EUC-KR HTML 소스를 디코딩할 때 `/* hour-obfuscated-... */` 패턴이 감지되면 즉시 XOR 복호화를 수행해 원래의 평문 자바스크립트 코드로 복원하도록 패치함.
2. **Node.js 런타임 업그레이드 ([`functions/package.json`](file:///c:/Users/HOME/Desktop/junwoo/functions/package.json))**
   - `"engines": { "node": "22" }`로 버전을 업그레이드하고 `firebase deploy --only functions`를 통해 클라우드 함수 재배포 완료.

### 💡 향후 참고사항
- 추후 다시 시간표가 나오지 않을 경우, 터미널에서 아래 명령어로 Cloud Function 응답을 먼저 확인하세요:
  ```powershell
  curl.exe -s "https://us-central1-our-class-web.cloudfunctions.net/getTimetable"
  ```
- 만약 컴시간알리미가 `hour-obfuscated-v3` 등 새로운 난독화 수식을 도입한다면 [`functions/index.js`](file:///c:/Users/HOME/Desktop/junwoo/functions/index.js)의 `patchComciganIconv()` 내 복호화 수식만 컴시간 페이지의 `<script>` 복호화 루프에 맞춰 수정한 뒤 `firebase deploy --only functions`로 배포하면 해결됩니다.

---

## 2. [2026-11-05] 전체 코드 QA, 잠재적 버그 수정 및 경량화 작업

### 📌 점검 및 개선 내역
1. **중복 함수 선언으로 인한 타이머/플리커 방지 로직 무효화 수정 ([`app.js`](file:///c:/Users/HOME/Desktop/junwoo/app.js))**
   - `pauseAllBackgroundTimers()`와 `resumeAllBackgroundTimers()`가 파일 상단(모달 전환 시 320ms 딜레이로 화면 깜빡임을 방지하는 버전)과 하단(단순 재시작 버전)에 중복 선언되어, JS 함수 호이스팅(Hoisting)에 의해 상단의 깜빡임 방지 로직이 덮어써지던 문제를 해결(하단 중복 함수 제거).
2. **공지사항 모달 제목(`#noticeModalHeading`) 미표시 버그 수정 ([`app.js`](file:///c:/Users/HOME/Desktop/junwoo/app.js))**
   - [`index.html`](file:///c:/Users/HOME/Desktop/junwoo/index.html)에 `style="display: none;"`으로 선언된 `#noticeModalHeading`이 일반 공지사항 활성화 시에도 `display: 'block'`으로 전환되지 않아 제목이 보이지 않던 문제를 [`showNoticeDetailInModal`](file:///c:/Users/HOME/Desktop/junwoo/app.js#L1391-L1433)에서 명시적으로 토글하도록 수정.
3. **모달 열기/닫기 중복 코드 통합 ([`app.js`](file:///c:/Users/HOME/Desktop/junwoo/app.js))**
   - 8개 모달(날씨, 급식, 시간표, 공지, 준비물, 지필평가, 갤러리, iOS 설치 안내)에서 반복되던 클래스 토글 및 배경 타이머 제어 코드를 [`openModalPair`](file:///c:/Users/HOME/Desktop/junwoo/app.js#L168-L173) / [`closeModalPair`](file:///c:/Users/HOME/Desktop/junwoo/app.js#L175-L180) 공통 헬퍼 함수로 일원화.
4. **페이지별(`index.html` vs `admin.html`) 불필요한 백그라운드 실행 및 방문자 수 중복 집계 방지 ([`app.js`](file:///c:/Users/HOME/Desktop/junwoo/app.js))**
   - 관리자 페이지([`admin.html`](file:///c:/Users/HOME/Desktop/junwoo/admin.html)) 접속 시에는 학생 포털 전용 히어로 타이머(`startHeroTimer`), 급식 자동 날짜 조회(`initAutoMealDate`), 초기 시간표 호출(`loadYangYoungTimetable`), 그리고 방문자 수 카운트 증가(`trackAnalytics`의 `increment(1)`)가 실행되지 않도록 DOM 존재 여부 가드 추가.
5. **주간 시간표 모달 중복 네트워크 요청 방지 ([`app.js`](file:///c:/Users/HOME/Desktop/junwoo/app.js))**
   - 시간표 모달을 열 때마다 매번 Cloud Function을 재호출하던 방식을 개선하여, 최초 1회 로드 성공 시(`timetableLoaded = true`) 캐시된 화면을 즉시 보여주고 새로고침 버튼 클릭 시에만 강제 재호출(`loadYangYoungTimetable(true)`)하도록 최적화.
6. **날씨 위젯 초기 로딩 시 가짜 데이터(`27°C / 맑음`) 깜빡임 제거 ([`app.js`](file:///c:/Users/HOME/Desktop/junwoo/app.js))**
   - [`fetchWeatherData`](file:///c:/Users/HOME/Desktop/junwoo/app.js#L220-L246) 호출 직후 실제 API 응답 전에 `27°C / 맑음`으로 덮어쓰던 코드를 제거하고, 네트워크 오류(`catch`) 시에만 기본값으로 폴백하도록 개선.
7. **D-Day 계산 로직 중복 제거 및 미사용 Firebase SDK 정리 ([`app.js`](file:///c:/Users/HOME/Desktop/junwoo/app.js), [`index.html`](file:///c:/Users/HOME/Desktop/junwoo/index.html), [`admin.html`](file:///c:/Users/HOME/Desktop/junwoo/admin.html), [`sw.js`](file:///c:/Users/HOME/Desktop/junwoo/sw.js))**
   - `calculateDdayStr`가 `calculateDdayNumber`를 재사용하도록 단일화.
   - [`index.html`](file:///c:/Users/HOME/Desktop/junwoo/index.html)과 [`admin.html`](file:///c:/Users/HOME/Desktop/junwoo/admin.html)에서 사용하지 않는 `firebase-storage.js` 및 `createUserWithEmailAndPassword` 모듈 import를 제거하여 초기 로딩 속도 개선.
   - [`admin.html`](file:///c:/Users/HOME/Desktop/junwoo/admin.html)의 Firebase 초기화 블록에 `try / catch` 예외 처리를 추가하여 안정성 확보.
   - 서비스 워커([`sw.js`](file:///c:/Users/HOME/Desktop/junwoo/sw.js)) 캐시 버전을 `yangyoung-1-6-v7`로 업데이트.


