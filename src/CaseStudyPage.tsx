import { useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  Fingerprint,
  GitBranch,
  History,
  Layers3,
  LockKeyhole,
  MonitorSmartphone,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const images = {
  login: new URL("../docs/images/orderops-cloud-login.jpg", import.meta.url).href,
  dashboard: new URL("../docs/images/orderops-cloud-dashboard.jpg", import.meta.url).href,
  exceptions: new URL("../docs/images/orderops-cloud-exceptions.jpg", import.meta.url).href,
  status: new URL("../docs/images/orderops-cloud-status-change.jpg", import.meta.url).href,
  audit: new URL("../docs/images/orderops-cloud-audit.jpg", import.meta.url).href,
  viewer: new URL("../docs/images/orderops-cloud-viewer-access.jpg", import.meta.url).href,
  busan: new URL("../docs/images/orderops-cloud-busan-catalog.jpg", import.meta.url).href,
  mobile: new URL("../docs/images/orderops-cloud-mobile.jpg", import.meta.url).href,
};

const proofItems = [
  { value: "3", label: "역할 권한" },
  { value: "5", label: "주문 상태" },
  { value: "23", label: "자동화 테스트" },
  { value: "0", label: "런타임 취약점" },
];

const solutionCards = [
  {
    icon: Layers3,
    title: "회사별 데이터 경계",
    body: "세션에서 복원한 tenant_id를 모든 주문·지표·감사 쿼리에 적용합니다.",
  },
  {
    icon: ShieldCheck,
    title: "역할 기반 상태 전이",
    body: "화면과 API가 같은 권한 규칙을 사용하고 서버가 최종 전이를 다시 검증합니다.",
  },
  {
    icon: GitBranch,
    title: "동시 수정 충돌 방지",
    body: "행 잠금과 expectedVersion으로 오래된 요청의 조용한 덮어쓰기를 차단합니다.",
  },
  {
    icon: History,
    title: "변경 근거 보존",
    body: "주문 변경과 담당자·상태·사유가 담긴 감사 이벤트를 한 트랜잭션으로 기록합니다.",
  },
];

const stack = [
  "React",
  "TypeScript",
  "Vite",
  "Node.js 24",
  "Express 5",
  "PostgreSQL 16",
  "Playwright",
  "Docker",
  "OpenAPI 3.1",
];

export function CaseStudyPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    document.title = "OrderOps Cloud 구축 사례 | 멀티테넌트 주문 운영 시스템";
    if (description) {
      description.content = "회사별 주문 격리, 역할 권한, 동시성 제어, 감사 이력을 연결한 OrderOps Cloud 구축 사례";
    }
    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
    };
  }, []);

  return (
    <div className="caseStudyPage">
      <a className="caseStudySkipLink" href="#case-study-main">본문으로 이동</a>

      <header className="caseStudyHeader">
        <a className="caseStudyBrand" href="#top" aria-label="OrderOps Cloud 구축 사례 처음으로">
          <Cloud size={24} aria-hidden="true" />
          <span>
            <strong>OrderOps Cloud</strong>
            <small>구축 사례</small>
          </span>
        </a>
        <nav aria-label="구축 사례 목차">
          <a href="/portfolio">개발자 역량</a>
          <a href="#workflow">업무 흐름</a>
          <a href="#architecture">기술 설계</a>
          <a href="#verification">검증</a>
        </nav>
        <a className="caseStudyHeaderCta" href="/">
          운영 화면 열기
          <ArrowRight size={16} aria-hidden="true" />
        </a>
      </header>

      <main id="case-study-main">
        <section className="caseStudyHero" id="top">
          <div className="caseStudyHeroCopy">
            <p className="caseStudyEyebrow">B2B ORDER OPERATIONS · FULL-STACK</p>
            <h1>
              <span>주문이 움직일 때마다</span>
              <span>권한과 근거가 함께</span>
              <span>남도록</span>
            </h1>
            <p className="caseStudyLead">
              회사별 주문을 분리하고, 역할에 허용된 상태 전이만 실행하며,
              주문 변경과 감사 이력을 PostgreSQL 트랜잭션으로 함께 기록하는 주문 운영 시스템입니다.
            </p>
            <dl className="caseStudyMeta">
              <div>
                <dt>유형</dt>
                <dd>B2B 주문 운영 웹 애플리케이션</dd>
              </div>
              <div>
                <dt>플랫폼</dt>
                <dd>Desktop · Responsive Web</dd>
              </div>
              <div>
                <dt>담당 범위</dt>
                <dd>기획 · UI/UX · Frontend · Backend · Database · QA</dd>
              </div>
            </dl>
            <div className="caseStudyHeroActions">
              <a className="caseStudyPrimaryCta" href="/">
                운영 화면 열기
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a
                className="caseStudySecondaryCta"
                href="https://github.com/Egoistian/orderops-cloud"
                target="_blank"
                rel="noreferrer"
              >
                GitHub 코드 보기
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
            <p className="caseStudyProofLine">
              <CheckCircle2 size={17} aria-hidden="true" />
              React · Express · PostgreSQL · Playwright · Docker로 구현과 검증을 연결했습니다.
            </p>
          </div>

          <div className="caseStudyHeroVisual" aria-label="OrderOps Cloud 제품 화면">
            <figure className="caseStudyHeroDesktop">
              <img src={images.dashboard} alt="회사별 주문과 상태, 물류 정보를 표시하는 OrderOps Cloud 주문 관리 화면" />
            </figure>
            <figure className="caseStudyHeroMobile">
              <img src={images.mobile} alt="390픽셀 모바일 환경의 OrderOps Cloud 주문 관리 화면" />
            </figure>
            <span className="caseStudyHeroBadge">ROLE-BASED WORKFLOW</span>
          </div>
        </section>

        <section className="caseStudyProofStrip" aria-label="구현 검증 요약">
          {proofItems.map((item) => (
            <div key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </section>

        <section className="caseStudySection caseStudyChallenge" aria-labelledby="challenge-title">
          <div className="caseStudySectionHeading">
            <p>01 · PROBLEM & DIRECTION</p>
            <h2 id="challenge-title">주문 조회만으로는 운영 시스템이 완성되지 않습니다</h2>
          </div>
          <div className="caseStudyChallengeBody">
            <p>
              회사 데이터가 섞이지 않아야 하고, 역할마다 허용된 변경이 달라야 하며,
              동시에 들어온 작업이 앞선 결정을 덮어쓰지 않아야 합니다.
              변경이 끝난 뒤에는 누가 무엇을 왜 바꿨는지 다시 확인할 수 있어야 합니다.
            </p>
            <p>
              OrderOps Cloud는 주문 탐색, 예외 검토, 상태 변경, 감사 이력 확인을 하나의 흐름으로 연결하고
              같은 규칙을 화면·API·PostgreSQL 제약·자동화 테스트에 적용했습니다.
            </p>
          </div>
          <div className="caseStudySolutionGrid">
            {solutionCards.map(({ icon: Icon, title, body }) => (
              <article key={title}>
                <span><Icon size={20} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="caseStudySection caseStudyWorkflow" id="workflow" aria-labelledby="workflow-title">
          <div className="caseStudySectionHeading">
            <p>02 · OPERATIONS FLOW</p>
            <h2 id="workflow-title">운영자가 확인하고 결정하는 순서대로 설계했습니다</h2>
            <span>
              로그인부터 예외 검토, 상태 변경, 감사 이력까지 각 화면이 하나의 시스템 규칙을 증명합니다.
            </span>
          </div>

          <CaseStudyFeature
            number="01"
            title="회사와 역할을 선택해 운영 범위를 결정합니다"
            body="로그인 세션이 사용자·회사·역할을 연결하고, 이후 모든 화면과 API가 같은 권한 컨텍스트를 사용합니다."
            image={images.login}
            alt="회사와 관리자, 운영 담당자, 열람 전용 역할을 선택하는 로그인 화면"
          />
          <CaseStudyFeature
            number="02"
            title="예외 주문만 분리해 보류 근거를 확인합니다"
            body="주소와 연락처 검수처럼 출고 전 확인이 필요한 주문을 좁히고, 정규화 근거와 물류 보류 상태를 함께 검토합니다."
            image={images.exceptions}
            alt="주소 확인이 필요한 예외 주문 한 건과 정규화 근거를 표시한 화면"
            reverse
          />
          <CaseStudyFeature
            number="03"
            title="허용된 다음 상태와 변경 사유를 함께 전달합니다"
            body="서버가 반환한 allowedTransitions만 선택할 수 있으며, 변경 사유는 주문 버전과 함께 API로 전달됩니다."
            image={images.status}
            alt="출고 준비 주문을 출고 완료로 변경하기 전 사유를 입력한 화면"
          />
          <CaseStudyFeature
            number="04"
            title="변경 결과는 감사 타임라인으로 이어집니다"
            body="담당자, 이전·다음 상태, 변경 사유가 주문 갱신과 같은 트랜잭션에서 저장되고 시간순으로 표시됩니다."
            image={images.audit}
            alt="출고 완료 상태 변경과 담당자, 변경 사유가 표시된 감사 로그 화면"
            reverse
          />

          <div className="caseStudyGalleryGrid">
            <figure>
              <img src={images.viewer} alt="열람 전용 사용자의 상태 변경이 제한된 화면" />
              <figcaption>
                <span>ROLE BOUNDARY</span>
                <strong>열람 전용 역할은 변경 액션이 제공되지 않습니다</strong>
              </figcaption>
            </figure>
            <figure>
              <img src={images.busan} alt="부산크래프트 상점 주문만 표시된 두 번째 회사 워크스페이스" />
              <figcaption>
                <span>TENANT ISOLATION</span>
                <strong>회사 컨텍스트에 따라 주문과 지표가 분리됩니다</strong>
              </figcaption>
            </figure>
            <figure className="caseStudyMobileCard">
              <img src={images.mobile} alt="모바일 너비에서 표시되는 주문 지표와 목록" />
              <figcaption>
                <span>RESPONSIVE WEB</span>
                <strong>같은 API와 권한 규칙을 모바일에서도 유지합니다</strong>
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="caseStudyArchitecture" id="architecture" aria-labelledby="architecture-title">
          <div className="caseStudyArchitectureIntro">
            <p>03 · SYSTEM ARCHITECTURE</p>
            <h2 id="architecture-title">브라우저가 보내는 회사와 권한을 그대로 신뢰하지 않았습니다</h2>
            <p>
              보호된 API는 HttpOnly 세션에서 사용자와 회사 컨텍스트를 복원합니다.
              상태 변경 시 역할·현재 상태·주문 버전을 다시 검사하고,
              주문 갱신과 감사 이벤트를 하나의 PostgreSQL 트랜잭션으로 커밋합니다.
            </p>
          </div>

          <div className="caseStudyArchitectureFlow" aria-label="브라우저, Express API, PostgreSQL 데이터 흐름">
            <article>
              <MonitorSmartphone size={24} aria-hidden="true" />
              <span>CLIENT</span>
              <strong>React Workspace</strong>
              <small>검색 · 필터 · 허용 전이 표시</small>
            </article>
            <ArrowRight aria-hidden="true" />
            <article>
              <LockKeyhole size={24} aria-hidden="true" />
              <span>APPLICATION</span>
              <strong>Express API</strong>
              <small>세션 · tenant · 역할 재검증</small>
            </article>
            <ArrowRight aria-hidden="true" />
            <article>
              <Database size={24} aria-hidden="true" />
              <span>DATA</span>
              <strong>PostgreSQL</strong>
              <small>행 잠금 · 트랜잭션 · 감사 이력</small>
            </article>
          </div>

          <div className="caseStudyTechnicalGrid">
            <article>
              <Fingerprint size={20} aria-hidden="true" />
              <h3>세션 기반 데이터 경계</h3>
              <p>요청 본문의 회사 ID가 아니라 인증 세션의 tenant_id로 모든 업무 쿼리를 제한합니다.</p>
            </article>
            <article>
              <GitBranch size={20} aria-hidden="true" />
              <h3>명시적인 동시성 계약</h3>
              <p>FOR UPDATE와 expectedVersion을 결합해 오래된 변경을 409 충돌로 반환합니다.</p>
            </article>
            <article>
              <History size={20} aria-hidden="true" />
              <h3>Append-only 감사 이력</h3>
              <p>일반 수정·삭제를 PostgreSQL 트리거가 거부하고 당시 담당자 정보를 보존합니다.</p>
            </article>
          </div>
        </section>

        <section className="caseStudySection caseStudyRoles" aria-labelledby="roles-title">
          <div className="caseStudySectionHeading">
            <p>04 · AUTHORIZATION</p>
            <h2 id="roles-title">같은 화면에서도 역할에 따라 가능한 작업이 달라집니다</h2>
          </div>
          <div className="caseStudyRoleTable" role="table" aria-label="역할별 권한">
            <div className="caseStudyRoleHeader" role="row">
              <span role="columnheader">역할</span>
              <span role="columnheader">조회</span>
              <span role="columnheader">정상 상태 전이</span>
              <span role="columnheader">예외 처리 전이</span>
            </div>
            <RoleRow roleName="관리자" read normal exception />
            <RoleRow roleName="운영 담당자" read normal />
            <RoleRow roleName="열람 전용" read />
          </div>
        </section>

        <section className="caseStudyVerification" id="verification" aria-labelledby="verification-title">
          <div>
            <p>05 · VERIFICATION</p>
            <h2 id="verification-title">정상 경로뿐 아니라 실패 경계까지 자동화했습니다</h2>
            <p>
              단위 테스트는 정규화와 워크플로 규칙을, PostgreSQL 통합 테스트는 권한·회사 격리·동시성·감사 이력을,
              Playwright는 데스크톱과 모바일 사용자 흐름을 확인합니다.
            </p>
          </div>
          <div className="caseStudyVerificationGrid">
            <VerificationItem value="7" label="단위 테스트" detail="정규화 · 워크플로" />
            <VerificationItem value="12" label="통합 테스트" detail="권한 · 격리 · 동시성" />
            <VerificationItem value="4" label="E2E 흐름" detail="제품 · 사례 · 포트폴리오 · 모바일" />
            <VerificationItem value="0" label="런타임 취약점" detail="npm audit --omit=dev" />
          </div>
        </section>

        <section className="caseStudySection caseStudyScope" aria-labelledby="scope-title">
          <div className="caseStudySectionHeading">
            <p>06 · IMPLEMENTATION SCOPE</p>
            <h2 id="scope-title">요구사항부터 운영 문서까지 하나의 결과물로 연결했습니다</h2>
          </div>
          <div className="caseStudyScopeGrid">
            <article>
              <Workflow size={22} aria-hidden="true" />
              <h3>제품·업무 설계</h3>
              <p>핵심 사용자 흐름, 상태 전이 규칙, 예외 처리, 권한별 동작 정의</p>
            </article>
            <article>
              <Code2 size={22} aria-hidden="true" />
              <h3>Full-stack 구현</h3>
              <p>React 운영 화면, Express API, PostgreSQL 스키마와 트랜잭션</p>
            </article>
            <article>
              <CheckCircle2 size={22} aria-hidden="true" />
              <h3>검증·운영 기반</h3>
              <p>단위·통합·E2E 테스트, CI, Docker, OpenAPI, 아키텍처와 런북</p>
            </article>
          </div>
          <div className="caseStudyStack" aria-label="기술 스택">
            {stack.map((item) => <span key={item}>{item}</span>)}
          </div>
        </section>

        <section className="caseStudyFinalCta">
          <div>
            <span>ORDEROPS CLOUD</span>
            <h2>주문 흐름과 권한 경계를 실제 화면에서 확인하세요</h2>
            <p>역할을 바꿔 로그인하고 주문 상태 변경부터 감사 이력까지 직접 살펴볼 수 있습니다.</p>
          </div>
          <a href="/">
            운영 화면 열기
            <ArrowRight size={18} aria-hidden="true" />
          </a>
        </section>
      </main>

      <footer className="caseStudyFooter">
        <a className="caseStudyBrand" href="#top">
          <Cloud size={21} aria-hidden="true" />
          <span><strong>OrderOps Cloud</strong></span>
        </a>
        <a href="/portfolio">개발자 포트폴리오</a>
        <a href="https://github.com/Egoistian/orderops-cloud" target="_blank" rel="noreferrer">
          GitHub
          <ExternalLink size={14} aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}

function CaseStudyFeature({
  number,
  title,
  body,
  image,
  alt,
  reverse = false,
}: {
  number: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  reverse?: boolean;
}) {
  return (
    <article className={"caseStudyFeature" + (reverse ? " reverse" : "")}>
      <div>
        <span>{number}</span>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
      <figure>
        <img src={image} alt={alt} />
      </figure>
    </article>
  );
}

function RoleRow({
  roleName,
  read = false,
  normal = false,
  exception = false,
}: {
  roleName: string;
  read?: boolean;
  normal?: boolean;
  exception?: boolean;
}) {
  return (
    <div className="caseStudyRoleRow" role="row">
      <strong role="cell">{roleName}</strong>
      <PermissionCell enabled={read} />
      <PermissionCell enabled={normal} />
      <PermissionCell enabled={exception} />
    </div>
  );
}

function PermissionCell({ enabled }: { enabled: boolean }) {
  return (
    <span className={enabled ? "enabled" : ""} role="cell">
      {enabled ? <CheckCircle2 size={17} aria-label="허용" /> : <span aria-label="제한">—</span>}
    </span>
  );
}

function VerificationItem({ value, label, detail }: { value: string; label: string; detail: string }) {
  return (
    <article>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </article>
  );
}
