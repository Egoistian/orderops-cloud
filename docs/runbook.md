# OrderOps Cloud runbook

이 문서는 합성 데이터 기반 로컬 포트폴리오 데모를 실행하고 점검하기 위한 절차입니다. 실제 운영 서비스용 배포 가이드는 아닙니다.

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
2. `db-setup` 일회성 컨테이너가 스키마를 적용하고 합성 데모 데이터를 넣습니다.
3. `app` 컨테이너가 빌드된 React 파일과 Express API를 8787번 포트에서 제공합니다.

브라우저에서 `http://localhost:8787`을 엽니다. 상태 점검 주소는 `http://localhost:8787/api/health`입니다.

이 Compose 파일은 빌드된 앱을 `NODE_ENV=production`으로 실행하지만, 로컬 HTTP 접속을 위해 `SESSION_COOKIE_SECURE=false`를 명시합니다. 실제 배포에서는 HTTPS를 먼저 구성한 뒤 이 예외를 제거해야 합니다.

기본 데모 비밀번호는 `orderops-demo-2026`입니다. 공개 포트폴리오 전용 값이며 다른 계정에서 재사용하면 안 됩니다. 로그인 화면 또는 아래 API에서 합성 계정 목록을 확인할 수 있습니다.

```bash
curl http://localhost:8787/api/auth/demo-accounts
```

포트와 데모 비밀번호는 실행 전에 바꿀 수 있습니다.

```bash
APP_PORT=8888 \
POSTGRES_PORT=55432 \
POSTGRES_PASSWORD='local-db-password' \
SEED_DEMO_PASSWORD='local-demo-password' \
docker compose up --build
```

`POSTGRES_PASSWORD`에 URL 예약 문자를 쓰면 `DATABASE_URL` 인코딩이 필요하므로 로컬 데모에서는 영문, 숫자, 하이픈 조합을 권장합니다.

### 중지와 데이터 처리

컨테이너만 중지하고 DB 볼륨을 유지합니다.

```bash
docker compose down
```

컨테이너와 합성 DB 볼륨을 모두 삭제합니다.

```bash
docker compose down --volumes
```

`db-setup` 컨테이너가 다시 만들어지면 알려진 두 데모 회사의 데이터를 삭제한 뒤 다시 시드합니다. 보존해야 할 데이터가 있는 환경에서 이 명령 경로를 사용하면 안 됩니다.

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

기본 `DATABASE_URL`의 데이터베이스가 없으면 `db:setup`이 `postgres` 데이터베이스에 접속해 생성합니다. 현재 PostgreSQL 사용자에게 데이터베이스 생성 권한이 없다면 관리자가 먼저 빈 데이터베이스를 만들거나, 이미 존재하는 DB 주소를 `.env`에 지정해야 합니다.

DB 연결 풀은 일반 서버에서 기본 10개, `VERCEL=1` 환경에서 기본 2개 연결을 사용합니다. 환경에 맞게 조정해야 한다면 `DATABASE_POOL_MAX=1`부터 `50` 사이의 정수를 지정할 수 있습니다. 연결 대기 제한은 5초, 유휴 연결 제한은 30초이며, 이 기본값은 부하 테스트로 산정한 용량 보장이 아닙니다.

### DB 명령 구분

| 명령 | 동작 | 주의점 |
| --- | --- | --- |
| `npm run db:migrate` | 현재 `schema.sql` 적용 | 데이터베이스가 이미 존재해야 함 |
| `npm run db:seed` | 알려진 데모 회사 데이터를 삭제 후 재생성 | 데모 데이터가 초기화됨 |
| `npm run db:setup` | DB 확인/생성, 스키마 적용, 시드 | 첫 로컬 실행용 |
| `npm run db:reset` | 합성 데모 데이터 재생성 | 스키마 마이그레이션은 실행하지 않음 |

## 공유 공개 데모 모드

인터넷에 공개하는 합성 데이터 전용 배포에서만 서버 환경 변수에 다음 값을 설정할 수 있습니다.

```bash
PUBLIC_DEMO_MODE=true
```

이 값이 정확히 `true`일 때만 다음 보호가 켜집니다.

- 로그인에 성공한 데모 계정의 tenant 주문과 감사 이벤트만 초기 시드로 되돌립니다. 사용자와 기존 세션은 삭제하지 않습니다.
- 사용자가 보낸 변경 사유는 저장하지 않고 고정된 공개 데모 문구로 바꿉니다.
- 로그인 성공에 따른 초기화는 같은 소켓 주소·계정 기준 10분에 10회로 제한합니다.
- 상태 변경은 세션당 10분에 30회, 소켓 주소당 10분에 120회로 제한합니다.
- 로그인과 세션 확인 응답의 `user.publicDemoMode`가 `true`가 되어 화면에서 변경 사유 입력을 숨길 수 있습니다.

제한에 걸리면 API는 `429`와 `Retry-After`를 반환합니다. 카운터는 Node.js 프로세스 메모리에만 있으므로 여러 Vercel 인스턴스가 공유하지 않고 재시작하면 사라집니다. 클라이언트가 임의로 넣을 수 있는 전달 헤더를 주소 키로 신뢰하지 않고 직접 소켓 주소를 사용하므로, 프록시 뒤에서는 여러 방문자가 같은 주소 제한을 공유할 수 있습니다.

주문 상태는 세션별 복사본이 아니라 tenant별 공유 상태입니다. 다른 방문자가 같은 회사로 로그인하면 현재 주문과 감사 기록이 다시 초기화되므로, 동시에 체험하면 화면이 초기 상태로 돌아가거나 `409 VERSION_CONFLICT`가 발생할 수 있습니다. 저트래픽 합성 포트폴리오 데모를 위한 절충이며 실제 서비스의 사용자 격리로 간주하면 안 됩니다.

일반 로컬 실행은 `PUBLIC_DEMO_MODE=false`를 유지합니다. 이때 로그인 초기화와 공개 데모용 변경 제한은 적용되지 않고, 입력한 변경 사유가 기존 방식대로 감사 이벤트에 저장됩니다.

## 검증

PostgreSQL이 실행 중이고 스키마가 적용된 상태에서 다음을 순서대로 실행합니다.

```bash
npm test
npm run test:integration
npm run typecheck
npm run build
```

통합 테스트는 데모 시드를 다시 쓰고 종료할 때 원래 데모 상태로 되돌립니다. 합성 데이터 전용 DB에서만 실행합니다.

CI는 PostgreSQL 16 서비스 컨테이너를 시작한 뒤 같은 네 단계를 실행합니다. 워크플로 파일은 `.github/workflows/ci.yml`에 있습니다.

## API 상태 점검

프로세스가 HTTP 요청을 받을 수 있는지만 확인합니다. 이 경로는 DB를 조회하지 않습니다.

```bash
curl --fail http://127.0.0.1:8787/api/health/live
```

앱이 PostgreSQL까지 사용할 준비가 되었는지 확인합니다. Compose의 app health check도 이 경로를 사용합니다.

```bash
curl --fail http://127.0.0.1:8787/api/health/ready
```

정상 예시는 다음 형태입니다.

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

- PostgreSQL health check가 성공했는지 확인합니다: `docker compose ps`.
- `DATABASE_URL`의 호스트를 확인합니다. Compose 내부에서는 `postgres`, 호스트에서 실행하면 보통 `localhost` 또는 `127.0.0.1`입니다.
- 앱 로그를 확인합니다: `docker compose logs app postgres`.

### 401 AUTH_REQUIRED 또는 SESSION_EXPIRED

- 로그인 후 받은 `orderops_session` 쿠키가 요청에 포함되어야 합니다.
- 세션 유효 시간은 8시간입니다.
- DB를 다시 시드하면 기존 세션이 삭제되므로 다시 로그인합니다.

### 403 TRANSITION_FORBIDDEN

현재 역할 또는 주문 상태에서 허용하지 않는 변경입니다. 열람 전용 계정은 어떤 상태도 변경할 수 없습니다. 가능한 전이는 주문 응답의 `allowedTransitions`에서 확인할 수 있지만, 최종 판단은 서버가 합니다.

### 403 CSRF_REJECTED

로그인, 로그아웃, 주문 상태 변경 요청에는 `X-OrderOps-Request: 1` 헤더가 필요합니다. 브라우저가 `Sec-Fetch-Site`를 보낼 때 값이 `same-origin` 또는 `none`이 아니어도 거부됩니다. 직접 API를 점검한다면 다음처럼 헤더를 추가합니다.

```bash
curl -X POST http://127.0.0.1:8787/api/auth/login \
  -H 'Content-Type: application/json' \
  -H 'X-OrderOps-Request: 1' \
  --data '{"tenantSlug":"seoul-fresh","email":"operator@seoulfresh.demo","password":"orderops-demo-2026"}'
```

### 415 JSON_REQUIRED

로그인과 주문 상태 변경 본문은 `Content-Type: application/json`이어야 합니다. JSON 구문이 깨졌으면 `400 INVALID_JSON`, 본문이 100KB 제한을 넘으면 `413 PAYLOAD_TOO_LARGE`가 반환됩니다.

### 409 VERSION_CONFLICT

다른 요청이 먼저 주문을 변경했습니다. 주문 목록을 다시 조회하고 최신 `version`으로 사용자의 의도를 재확인한 뒤 요청합니다. 이전 값을 자동 재전송하지 않습니다.

### Docker에서 8787 포트에 접근할 수 없음

- `app` 컨테이너의 `HOST`가 `0.0.0.0`인지 확인합니다.
- 호스트 포트 충돌이 있으면 `APP_PORT=8888 docker compose up`처럼 변경합니다.
- `docker compose ps`에서 app health 상태를 확인합니다.

## 로그와 장애 확인 범위

현재 앱은 예상하지 못한 서버 오류를 표준 오류로 기록하고, 클라이언트에는 일반화된 `INTERNAL_ERROR`만 반환합니다. 구조화 로그, 요청 ID, APM, 오류 추적 서비스, 지표 수집은 아직 연결하지 않았습니다. 따라서 이 로컬 데모의 점검 범위는 컨테이너 로그, liveness/readiness, 테스트 결과, PostgreSQL 상태입니다.

## 운영 환경으로 가져가기 전에 필요한 것

- TLS 종료와 신뢰할 수 있는 프록시 설정
- 외부 비밀 관리자와 데모 계정 제거
- 로그인 속도 제한, MFA/비밀번호 복구, 환경에 맞는 강화된 CSRF 설계
- 버전형 DB 마이그레이션과 롤백 계획
- 관리형 백업, 복구 목표, 실제 복구 훈련
- PostgreSQL RLS 또는 동등한 심층 tenant 격리
- 구조화 로그, 요청 ID, 오류 추적, 알림
- 부하 및 장애 테스트로 산정한 용량 기준

이 체크리스트를 완료하기 전에는 포함된 Compose 구성을 운영 배포 구성으로 간주하지 않습니다.
