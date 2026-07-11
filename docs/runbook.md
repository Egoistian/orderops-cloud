# OrderOps Cloud runbook

이 문서는 OrderOps Cloud를 로컬에서 실행하고 데이터베이스, API, 사용자 흐름을 점검하는 절차를 정리합니다.

## 빠른 실행: Docker Compose

### 준비물

- Docker Desktop 또는 Docker Engine
- Docker Compose v2 (`docker compose` 명령)
- 호스트의 8787번과 5432번 포트

### 시작

```bash
docker compose up --build
```

Compose는 다음 순서로 실행됩니다.

1. PostgreSQL 16이 준비될 때까지 기다립니다.
2. `db-setup` 일회성 컨테이너가 스키마를 적용하고 기준 데이터를 적재합니다.
3. `app` 컨테이너가 빌드된 React 파일과 Express API를 8787번 포트에서 제공합니다.

브라우저에서 `http://localhost:8787`을 엽니다.

- liveness: `http://localhost:8787/api/health/live`
- readiness: `http://localhost:8787/api/health/ready`

Compose는 로컬 HTTP 접속을 위해 `SESSION_COOKIE_SECURE=false`를 설정합니다. HTTPS 배포에서는 이 예외를 제거합니다.

기본 설정은 `ACCESS_ACCOUNT_PASSWORD=orderops-access-2026`입니다. 역할별 계정 목록은 로그인 화면 또는 아래 API에서 확인할 수 있습니다.

```bash
curl http://localhost:8787/api/auth/access-accounts
```

포트, DB 비밀번호, 접근 비밀번호는 시작 전에 바꿀 수 있습니다.

```bash
APP_PORT=8888 \
POSTGRES_PORT=55432 \
POSTGRES_PASSWORD='local-db-password' \
ACCESS_ACCOUNT_PASSWORD='local-access-password' \
docker compose up --build
```

`POSTGRES_PASSWORD`에 URL 예약 문자를 쓰면 `DATABASE_URL` 인코딩이 필요하므로 영문, 숫자, 하이픈 조합을 권장합니다.

### 중지와 데이터 처리

컨테이너만 중지하고 DB 볼륨을 유지합니다.

```bash
docker compose down
```

컨테이너와 DB 볼륨을 모두 삭제합니다.

```bash
docker compose down --volumes
```

`db-setup` 컨테이너가 다시 만들어지면 알려진 두 회사의 데이터를 기준 상태로 교체합니다. 보존해야 할 데이터가 있는 환경에서는 이 명령 경로를 사용하지 않습니다.

## 로컬 실행: Node.js + PostgreSQL

### 준비물

- Node.js 24
- PostgreSQL 16에 접근 가능한 로컬 계정

```bash
cp .env.example .env
npm ci
npm run db:setup
npm run dev
```

- React 개발 서버: 기본 `http://127.0.0.1:5182`
- Express API: 기본 `http://127.0.0.1:8787`
- Vite가 브라우저의 `/api` 요청을 Express로 프록시합니다.

기본 `DATABASE_URL`의 데이터베이스가 없으면 `db:setup`이 `postgres` 데이터베이스에 접속해 생성합니다. 현재 PostgreSQL 사용자에게 데이터베이스 생성 권한이 없다면 빈 데이터베이스를 먼저 만들거나, 존재하는 DB 주소를 `.env`에 지정합니다.

DB 연결 풀은 일반 서버에서 기본 10개, `VERCEL=1` 환경에서 기본 2개 연결을 사용합니다. `DATABASE_POOL_MAX=1`부터 `50` 사이의 정수로 조정할 수 있습니다. 연결 대기 제한은 5초, 유휴 연결 제한은 30초입니다.

### DB 명령 구분

| 명령 | 동작 | 주의점 |
| --- | --- | --- |
| `npm run db:migrate` | 현재 `schema.sql` 적용 | 데이터베이스가 존재해야 함 |
| `npm run db:seed` | 알려진 회사 데이터를 기준 상태로 교체 | 기존 주문과 감사 이력이 초기화됨 |
| `npm run db:setup` | DB 확인·생성, 스키마 적용, 기준 데이터 적재 | 첫 로컬 실행용 |
| `npm run db:reset` | 기준 데이터 재적재 | 스키마 마이그레이션은 실행하지 않음 |

## 공유 환경 보호 모드

여러 사용자가 하나의 공개 DB에 접근하는 환경에서는 서버 변수에 다음 값을 설정합니다.

```bash
SHARED_ACCESS_MODE=true
```

이 값이 정확히 `true`일 때 다음 보호가 켜집니다.

- 로그인에 성공한 계정의 회사 주문과 감사 이벤트를 기준 상태로 되돌립니다. 사용자와 기존 세션은 유지합니다.
- 사용자가 보낸 변경 사유 대신 `공개 환경에서 수행한 상태 변경`을 저장합니다.
- 로그인 성공에 따른 초기화는 같은 소켓 주소·계정 기준 10분에 10회로 제한합니다.
- 상태 변경은 세션당 10분에 30회, 소켓 주소당 10분에 120회로 제한합니다.
- 로그인과 세션 확인 응답의 `user.sharedAccessMode`가 `true`가 되어 화면에서 변경 사유 입력을 숨깁니다.

제한에 걸리면 API는 `429`, `Retry-After`, `SHARED_ACCESS_LOGIN_RATE_LIMITED` 또는 `SHARED_ACCESS_MUTATION_RATE_LIMITED`를 반환합니다. 카운터는 Node.js 프로세스 메모리에 있으므로 여러 인스턴스가 공유하지 않고 재시작하면 초기화됩니다. 주소 키는 전달 헤더가 아닌 직접 소켓 주소를 사용하므로 프록시 뒤에서는 여러 사용자가 같은 주소 제한을 공유할 수 있습니다.

주문 상태는 세션별 복사본이 아니라 회사별 공유 상태입니다. 다른 사용자가 같은 회사로 로그인하면 현재 주문과 감사 기록이 기준 상태로 돌아가므로 동시에 접근하면 `409 VERSION_CONFLICT`가 발생할 수 있습니다.

로컬 기본 실행은 `SHARED_ACCESS_MODE=false`를 유지합니다. 이때 로그인 초기화와 공유 환경용 변경 제한은 적용되지 않고, 입력한 변경 사유가 감사 이벤트에 저장됩니다.

## 검증

PostgreSQL이 실행 중이고 스키마가 적용된 상태에서 전체 검증을 실행합니다.

```bash
npm run verify
```

개별 명령은 다음과 같습니다.

```bash
npm test
npm run test:integration
npm run typecheck
npm run build
npm run test:e2e
npm audit --omit=dev
```

통합 테스트는 알려진 회사의 기준 데이터를 다시 적재합니다. 별도의 검증 DB를 사용합니다. CI는 PostgreSQL 16 서비스 컨테이너에서 같은 검사를 실행하며 워크플로 파일은 `.github/workflows/ci.yml`에 있습니다.

## API 상태 점검

프로세스가 HTTP 요청을 받을 수 있는지 확인합니다. DB를 조회하지 않습니다.

```bash
curl --fail http://127.0.0.1:8787/api/health/live
```

앱이 PostgreSQL까지 사용할 준비가 되었는지 확인합니다.

```bash
curl --fail http://127.0.0.1:8787/api/health/ready
```

정상 응답은 다음 형태입니다.

```json
{
  "ok": true,
  "service": "orderops-api",
  "database": "ready"
}
```

DB를 사용할 수 없으면 readiness는 `503`과 `{"ok":false,"service":"orderops-api","database":"unavailable"}`을 반환합니다. 기존 `/api/health`도 readiness와 같은 응답을 유지합니다.

## 자주 만나는 문제

### 앱 시작 시 DB 연결 오류

- PostgreSQL health check가 성공했는지 `docker compose ps`로 확인합니다.
- `DATABASE_URL`의 호스트를 확인합니다. Compose 내부에서는 `postgres`, 호스트에서 실행하면 보통 `localhost` 또는 `127.0.0.1`입니다.
- `docker compose logs app postgres`로 로그를 확인합니다.

### 401 AUTH_REQUIRED 또는 SESSION_EXPIRED

- 로그인 후 받은 `orderops_session` 쿠키가 요청에 포함되어야 합니다.
- 세션 유효 시간은 8시간입니다.
- DB 기준 데이터를 다시 적재하면 기존 세션이 삭제되므로 다시 로그인합니다.

### 403 TRANSITION_FORBIDDEN

현재 역할 또는 주문 상태에서 허용하지 않는 변경입니다. 열람 전용 계정은 상태를 변경할 수 없습니다. 가능한 전이는 주문 응답의 `allowedTransitions`에서 확인할 수 있으며 최종 판단은 서버가 합니다.

### 403 CSRF_REJECTED

로그인, 로그아웃, 주문 상태 변경 요청에는 `X-OrderOps-Request: 1` 헤더가 필요합니다. 브라우저가 `Sec-Fetch-Site`를 보낼 때 값이 `same-origin` 또는 `none`이 아니어도 거부됩니다.

```bash
curl -X POST http://127.0.0.1:8787/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-OrderOps-Request: 1' \
  --data '{"tenantSlug":"seoul-fresh","email":"operator@seoulfresh.example","password":"orderops-access-2026"}'
```

### 415 JSON_REQUIRED

로그인과 주문 상태 변경 본문은 `Content-Type: application/json`이어야 합니다. JSON 구문이 깨졌으면 `400 INVALID_JSON`, 본문이 100KB 제한을 넘으면 `413 PAYLOAD_TOO_LARGE`가 반환됩니다.

### 409 VERSION_CONFLICT

다른 요청이 먼저 주문을 변경했습니다. 주문 목록을 다시 조회하고 최신 `version`으로 사용자의 의도를 재확인한 뒤 요청합니다. 이전 값을 자동 재전송하지 않습니다.

### 429 SHARED_ACCESS_LOGIN_RATE_LIMITED

같은 주소와 계정에서 로그인·초기화를 짧은 시간에 반복했습니다. `Retry-After`가 지난 뒤 다시 요청합니다.

### 429 SHARED_ACCESS_MUTATION_RATE_LIMITED

현재 세션 또는 소켓 주소의 상태 변경 횟수가 제한에 도달했습니다. `Retry-After`가 지난 뒤 다시 요청합니다.

### Docker에서 8787 포트에 접근할 수 없음

- `app` 컨테이너의 `HOST`가 `0.0.0.0`인지 확인합니다.
- 포트 충돌이 있으면 `APP_PORT=8888 docker compose up`처럼 변경합니다.
- `docker compose ps`에서 app health 상태를 확인합니다.

## 로그와 장애 확인

예상하지 못한 서버 오류는 서버 로그에 기록하고, 클라이언트에는 일반화된 `INTERNAL_ERROR`를 반환합니다. 현재 점검 지점은 컨테이너 로그, liveness/readiness, 자동화 테스트 결과, PostgreSQL 상태입니다.

## 확장 체크리스트

- TLS 종료와 신뢰할 수 있는 프록시 설정
- 외부 비밀 관리자와 계정 프로비저닝
- 분산 요청 제한, MFA, 비밀번호 복구, 환경별 origin 검증
- 버전형 DB 마이그레이션과 롤백 계획
- 관리형 백업, 복구 목표, 복구 훈련
- PostgreSQL RLS 또는 동등한 심층 tenant 격리
- 구조화 로그, 요청 ID, 오류 추적, 알림
- 부하 및 장애 테스트로 산정한 용량 기준
