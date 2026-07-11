import { useEffect } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  Code2,
  Database,
  ExternalLink,
  FileCode2,
  Fingerprint,
  GitBranch,
  Github,
  History,
  LayoutDashboard,
  LockKeyhole,
  MonitorSmartphone,
  PackageCheck,
  Server,
  ShieldCheck,
  TestTube2,
} from "lucide-react";

const images = {
  dashboard: new URL("../docs/images/orderops-cloud-dashboard.jpg", import.meta.url).href,
  status: new URL("../docs/images/orderops-cloud-status-change.jpg", import.meta.url).href,
  audit: new URL("../docs/images/orderops-cloud-audit.jpg", import.meta.url).href,
  viewer: new URL("../docs/images/orderops-cloud-viewer-access.jpg", import.meta.url).href,
  mobile: new URL("../docs/images/orderops-cloud-mobile.jpg", import.meta.url).href,
};

const githubUrl = "https://github.com/Egoistian/orderops-cloud";

const deliveryLayers = [
  {
    number: "01",
    label: "PRODUCT & UX",
    title: "업무 규칙과 사용자 흐름",
    detail: "역할 · 상태 · 예외 · 완료 기준",
  },
  {
    number: "02",
    label: "INTERFACE",
    title: "반응형 운영 화면",
    detail: "React · TypeScript · 접근성",
  },
  {
    number: "03",
    label: "APPLICATION",
    title: "인증과 업무 API",
    detail: "Express · REST · 권한 검증",
  },
  {
    number: "04",
    label: "DATA",
    title: "일관성 있는 데이터 구조",
    detail: "PostgreSQL · 트랜잭션 · 감사 이력",
  },
  {
    number: "05",
    label: "QUALITY & DELIVERY",
    title: "검증 가능한 실행 환경",
    detail: "Unit · Integration · E2E · CI · Docker",
  },
];

const capabilities = [
  {
    icon: LayoutDashboard,
    tag: "ADMIN & OPERATIONS UI",
    title: "관리자·운영 화면",
    body: "검색, 필터, 상세 조회, 입력 폼, 상태 변경처럼 반복 업무를 처리하는 반응형 웹 화면을 구현합니다.",
    proof: "Responsive UI · Search · Filter · State feedback",
  },
  {
    icon: Server,
    tag: "API & APPLICATION",
    title: "API와 업무 로직",
    body: "REST API, 입력 검증, 일관된 오류 응답과 비즈니스 규칙을 화면 동작과 같은 기준으로 연결합니다.",
    proof: "Express · Validation · Error contract · Workflow",
  },
  {
    icon: LockKeyhole,
    tag: "AUTH & DATA BOUNDARY",
    title: "인증·권한·데이터 경계",
    body: "세션 인증, 역할별 권한, 회사별 데이터 분리와 서버 측 재검증으로 접근 경계를 구현합니다.",
    proof: "Session · RBAC · Tenant isolation · Security headers",
  },
  {
    icon: TestTube2,
    tag: "QUALITY & HANDOFF",
    title: "테스트와 실행 환경",
    body: "단위·통합·E2E 테스트, CI, Docker, API 명세와 실행 문서까지 결과물에 포함할 수 있습니다.",
    proof: "Node test · Playwright · GitHub Actions · Docker",
  },
];

const artifacts = [
  {
    icon: MonitorSmartphone,
    eyebrow: "PRODUCT UI",
    title: "작동 화면",
    body: "역할을 바꿔 로그인하고 주문 흐름과 권한 제한을 직접 확인할 수 있습니다.",
    href: "/",
    external: false,
    action: "운영 화면 열기",
  },
  {
    icon: FileCode2,
    eyebrow: "API CONTRACT",
    title: "OpenAPI 명세",
    body: "인증, 조회, 상태 변경, 오류 응답을 OpenAPI 3.1 계약으로 정리했습니다.",
    href: `${githubUrl}/blob/main/docs/openapi.yaml`,
    external: true,
    action: "API 명세 확인",
  },
  {
    icon: Database,
    eyebrow: "DATA MODEL",
    title: "PostgreSQL 스키마",
    body: "회사·사용자·주문·세션·감사 이벤트의 관계와 제약 조건을 코드로 확인할 수 있습니다.",
    href: `${githubUrl}/blob/main/server/schema.sql`,
    external: true,
    action: "스키마 확인",
  },
  {
    icon: GitBranch,
    eyebrow: "VERIFICATION",
    title: "테스트와 CI",
    body: "단위·통합·브라우저 테스트와 production build, audit, Docker build를 자동화했습니다.",
    href: `${githubUrl}/actions`,
    external: true,
    action: "CI 확인",
  },
];

const projectEvidence = [
  {
    icon: Fingerprint,
    title: "멀티테넌트 백엔드 설계",
    body: "인증 세션에서 복원한 tenant_id를 모든 주문·지표·감사 쿼리에 적용해 회사 간 데이터 경계를 구현했습니다.",
  },
  {
    icon: ShieldCheck,
    title: "권한 기반 워크플로",
    body: "화면과 API가 같은 상태 전이 규칙을 사용하고, 서버가 역할과 현재 상태를 최종 검증합니다.",
  },
  {
    icon: GitBranch,
    title: "트랜잭션·동시성 처리",
    body: "FOR UPDATE 행 잠금과 expectedVersion을 결합해 오래된 요청이 최신 변경을 덮어쓰지 못하게 했습니다.",
  },
  {
    icon: History,
    title: "감사 가능한 데이터 구조",
    body: "주문 변경과 담당자·상태·사유를 하나의 트랜잭션으로 기록하고 일반 수정과 삭제를 제한했습니다.",
  },
];

const stackGroups = [
  { label: "Frontend", items: ["React", "TypeScript", "Vite", "Responsive UI", "Accessibility"] },
  { label: "Backend", items: ["Node.js", "Express", "REST API", "Session Auth", "RBAC"] },
  { label: "Database", items: ["PostgreSQL", "Transaction", "Row Lock", "Constraints", "Audit Log"] },
  { label: "Quality", items: ["Node Test", "Playwright", "GitHub Actions", "Runtime Audit", "Docker"] },
  { label: "Delivery", items: ["OpenAPI", "Electron", "Windows Package", "Runbook", "Vercel Adapter"] },
];

const handoffItems = [
  { icon: Code2, title: "소스코드", body: "화면·서버·데이터 로직을 포함한 실행 가능한 코드베이스" },
  { icon: Database, title: "DB 구조", body: "스키마, 제약 조건, 인덱스와 초기 데이터" },
  { icon: FileCode2, title: "API 계약", body: "OpenAPI 명세와 안정적인 성공·오류 응답" },
  { icon: PackageCheck, title: "실행 환경", body: "Docker Compose와 production 이미지 구성" },
  { icon: TestTube2, title: "검증 코드", body: "단위·PostgreSQL 통합·Playwright 사용자 흐름" },
  { icon: BookOpenCheck, title: "운영 문서", body: "아키텍처, 신뢰 경계, 실행·장애 대응 런북" },
];

const processSteps = [
  { number: "01", title: "업무 규칙 정리", body: "사용자, 권한, 상태, 예외 상황과 완료 기준을 정의합니다." },
  { number: "02", title: "화면·API·데이터 설계", body: "사용자 흐름과 API 계약, DB 구조를 같은 기준으로 연결합니다." },
  { number: "03", title: "Full-stack 구현", body: "화면과 서버를 함께 개발해 각 기능이 실제 데이터로 동작하게 만듭니다." },
  { number: "04", title: "오류 경계 검증", body: "정상 흐름, 실패 응답, 권한 제한과 반응형 화면을 자동화 테스트로 확인합니다." },
  { number: "05", title: "실행 환경과 문서", body: "빌드·실행 방법, API 명세와 운영 시 확인할 내용을 함께 정리합니다." },
];

export function PortfolioPage() {
  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = description?.content;
    document.title = "Egoistian | Full-stack Web Application Developer";
    if (description) {
      description.content = "React·TypeScript UI부터 Node.js API, PostgreSQL, 인증·권한, 자동화 테스트와 운영 문서까지 구현하는 풀스택 개발자";
    }
    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) description.content = previousDescription;
    };
  }, []);

  return (
    <div className="portfolioPage">
      <a className="portfolioSkipLink" href="#portfolio-main">본문으로 이동</a>

      <header className="portfolioHeader">
        <a className="portfolioBrand" href="#top" aria-label="Egoistian 개발자 소개 처음으로">
          <span className="portfolioBrandMark" aria-hidden="true">E</span>
          <span>
            <strong>Egoistian</strong>
            <small>Full-stack Developer</small>
          </span>
        </a>
        <nav aria-label="개발자 소개 목차">
          <a href="#capabilities">가능한 작업</a>
          <a href="#selected-work">대표 프로젝트</a>
          <a href="#technical-capability">기술 역량</a>
          <a href="#process">작업 방식</a>
        </nav>
        <a className="portfolioHeaderCta" href={githubUrl} target="_blank" rel="noreferrer">
          <Github size={16} aria-hidden="true" />
          GitHub 보기
        </a>
      </header>

      <main id="portfolio-main">
        <section className="portfolioHero" id="top">
          <div className="portfolioHeroCopy">
            <p className="portfolioEyebrow">FULL-STACK DEVELOPER · WEB APPLICATIONS</p>
            <h1>
              <span>화면·API·DB·테스트를</span>
              <span>하나의 웹 시스템으로</span>
              <span>끝까지 연결합니다</span>
            </h1>
            <p className="portfolioLead">
              업무 요구사항을 상태·권한·예외 규칙으로 구조화하고,
              React 운영 화면부터 Express API, PostgreSQL 트랜잭션,
              자동화 테스트와 실행 문서까지 전체 개발 흐름을 완성합니다.
            </p>
            <div className="portfolioHeroScope" aria-label="담당 가능한 개발 범위">
              {['기획', 'UI/UX', 'Frontend', 'Backend', 'Database', 'QA'].map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="portfolioHeroActions">
              <a className="portfolioPrimaryCta" href="#selected-work">
                대표 프로젝트 확인
                <ArrowRight size={17} aria-hidden="true" />
              </a>
              <a className="portfolioSecondaryCta" href={githubUrl} target="_blank" rel="noreferrer">
                GitHub 코드 보기
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
            <p className="portfolioProofLine">
              <CheckCircle2 size={17} aria-hidden="true" />
              현재 저장소의 구현 코드, 제품 화면, 테스트와 문서로 작업 범위를 확인할 수 있습니다.
            </p>
          </div>

          <div className="portfolioDeliveryMap" aria-label="Full-stack 구현 범위">
            <div className="portfolioDeliveryMapHeader">
              <span>WHAT I DELIVER</span>
              <small>01 — 05</small>
            </div>
            <div className="portfolioDeliveryLayers">
              {deliveryLayers.map((layer) => (
                <article key={layer.number}>
                  <span>{layer.number}</span>
                  <div>
                    <small>{layer.label}</small>
                    <strong>{layer.title}</strong>
                    <p>{layer.detail}</p>
                  </div>
                </article>
              ))}
            </div>
            <a className="portfolioSelectedProof" href="#selected-work">
              <img src={images.dashboard} alt="OrderOps Cloud 주문 운영 화면 미리보기" />
              <span>
                <small>SELECTED WORK 01</small>
                <strong>OrderOps Cloud</strong>
                <em>구현 근거 보기 <ArrowRight size={14} aria-hidden="true" /></em>
              </span>
            </a>
          </div>
        </section>

        <section className="portfolioCapabilityBand" aria-label="핵심 기술 범위">
          <span>Product & UX</span>
          <span>React Interface</span>
          <span>Express API</span>
          <span>PostgreSQL</span>
          <span>Test · CI · Docker</span>
        </section>

        <section className="portfolioSection portfolioCapabilities" id="capabilities" aria-labelledby="capabilities-title">
          <div className="portfolioSectionHeading">
            <p>01 · WHAT I BUILD</p>
            <h2 id="capabilities-title">업무 규칙이 있는 웹 애플리케이션을 설계하고 구현합니다</h2>
            <span>
              단순한 화면 제작을 넘어 로그인, 권한, 검색·필터, 상태 변경, 예외 처리,
              데이터 저장과 변경 이력이 필요한 관리자·운영 시스템을 만들 수 있습니다.
            </span>
          </div>
          <div className="portfolioCapabilityGrid">
            {capabilities.map(({ icon: Icon, tag, title, body, proof }) => (
              <article key={title}>
                <div className="portfolioCapabilityIcon"><Icon size={21} aria-hidden="true" /></div>
                <small>{tag}</small>
                <h3>{title}</h3>
                <p>{body}</p>
                <span>{proof}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="portfolioArtifacts" aria-labelledby="artifacts-title">
          <div className="portfolioArtifactsIntro">
            <p>ARTIFACT DASHBOARD</p>
            <h2 id="artifacts-title">기술 이름보다 확인 가능한 결과물을 먼저 보여드립니다</h2>
          </div>
          <div className="portfolioArtifactGrid">
            {artifacts.map(({ icon: Icon, eyebrow, title, body, href, external, action }) => (
              <a key={title} href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>
                <Icon size={21} aria-hidden="true" />
                <small>{eyebrow}</small>
                <h3>{title}</h3>
                <p>{body}</p>
                <span>
                  {action}
                  {external ? <ExternalLink size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="portfolioProject" id="selected-work" aria-labelledby="project-title">
          <div className="portfolioProjectIntro">
            <div>
              <p>02 · SELECTED WORK</p>
              <span>01 / ORDER OPERATIONS</span>
            </div>
            <h2 id="project-title">OrderOps Cloud</h2>
            <h3>멀티테넌트 주문 운영 시스템</h3>
            <p>
              주문 조회 화면만 만드는 데서 멈추지 않고, 회사별 데이터 격리, 역할 권한,
              상태 전이, 동시 수정 충돌과 감사 이력까지 시스템 전체 경계를 구현했습니다.
            </p>
            <dl>
              <div><dt>목표</dt><dd>회사별 주문 분리와 역할 기반 운영 흐름</dd></div>
              <div><dt>담당</dt><dd>기획 · UI/UX · Frontend · Backend · Database · QA</dd></div>
              <div><dt>플랫폼</dt><dd>Responsive Web · Electron</dd></div>
              <div><dt>기술</dt><dd>React · TypeScript · Express · PostgreSQL · Playwright · Docker</dd></div>
            </dl>
            <div className="portfolioProjectActions">
              <a href="/case-study">
                프로젝트 상세 보기
                <ArrowRight size={16} aria-hidden="true" />
              </a>
              <a href={githubUrl} target="_blank" rel="noreferrer">
                GitHub 코드 확인
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="portfolioProjectVisuals" aria-label="OrderOps Cloud 제품 화면">
            <figure className="portfolioProjectMainShot">
              <img src={images.dashboard} alt="OrderOps Cloud 회사별 주문 운영 대시보드" />
              <figcaption><span>RESPONSIVE OPERATIONS UI</span><strong>주문 검색·필터·상세 확인</strong></figcaption>
            </figure>
            <figure>
              <img src={images.status} alt="주문 상태와 변경 사유를 입력하는 화면" />
              <figcaption><span>WORKFLOW & TRANSACTION</span><strong>허용 전이와 변경 사유</strong></figcaption>
            </figure>
            <figure>
              <img src={images.viewer} alt="열람 전용 역할의 변경 권한이 제한된 화면" />
              <figcaption><span>RBAC</span><strong>화면과 API의 역할 경계</strong></figcaption>
            </figure>
            <figure>
              <img src={images.audit} alt="담당자와 변경 사유가 표시된 감사 이력 화면" />
              <figcaption><span>AUDIT LOG</span><strong>변경 근거와 담당자 보존</strong></figcaption>
            </figure>
            <figure className="portfolioProjectMobileShot">
              <img src={images.mobile} alt="390픽셀 모바일 주문 관리 화면" />
              <figcaption><span>MOBILE</span><strong>390px 반응형 UI</strong></figcaption>
            </figure>
          </div>

          <div className="portfolioProjectEvidence">
            {projectEvidence.map(({ icon: Icon, title, body }) => (
              <article key={title}>
                <Icon size={20} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="portfolioTechnical" id="technical-capability" aria-labelledby="technical-title">
          <div className="portfolioTechnicalIntro">
            <p>03 · TECHNICAL CAPABILITY</p>
            <h2 id="technical-title">한 기능을 프론트엔드에서 데이터베이스까지 끊김 없이 연결합니다</h2>
            <p>
              화면에서 선택한 동작이 API의 권한 검사와 입력 검증을 거쳐 데이터베이스 트랜잭션으로 저장되고,
              실패 경계까지 자동화 테스트에서 확인되도록 설계합니다.
            </p>
          </div>

          <div className="portfolioTechnicalFlow" aria-label="프론트엔드, 애플리케이션, 데이터베이스 연결 구조">
            <article>
              <MonitorSmartphone size={24} aria-hidden="true" />
              <span>INTERFACE</span>
              <strong>React Workspace</strong>
              <small>반응형 UI · 검색과 입력 UX · 접근 가능한 인터랙션</small>
            </article>
            <ArrowRight aria-hidden="true" />
            <article>
              <ShieldCheck size={24} aria-hidden="true" />
              <span>APPLICATION</span>
              <strong>Express API</strong>
              <small>세션 인증 · 권한 검증 · 입력 검증 · 오류 계약</small>
            </article>
            <ArrowRight aria-hidden="true" />
            <article>
              <Database size={24} aria-hidden="true" />
              <span>DATA</span>
              <strong>PostgreSQL</strong>
              <small>관계형 스키마 · 트랜잭션 · 행 잠금 · 감사 이력</small>
            </article>
          </div>

          <div className="portfolioStackGroups">
            {stackGroups.map((group) => (
              <div key={group.label}>
                <strong>{group.label}</strong>
                <p>{group.items.map((item) => <span key={item}>{item}</span>)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="portfolioQuality" aria-labelledby="quality-title">
          <div className="portfolioQualitySummary">
            <p>04 · QUALITY & HANDOFF</p>
            <h2 id="quality-title">완료 기준을 “화면이 보인다”에서 끝내지 않습니다</h2>
            <p>
              정상 흐름뿐 아니라 권한 거부, 다른 회사 데이터 접근, 오래된 버전 충돌,
              감사 이력 변경 차단과 모바일 레이아웃까지 자동화된 검사로 확인합니다.
            </p>
            <div className="portfolioMetrics" aria-label="저장소 자동화 검증 결과">
              <article><strong>7</strong><span>단위 테스트</span><small>정규화 · 워크플로</small></article>
              <article><strong>12</strong><span>통합 테스트</span><small>권한 · 격리 · 동시성</small></article>
              <article><strong>4</strong><span>E2E 흐름</span><small>제품 · 사례 · 포트폴리오 · 모바일</small></article>
              <article><strong>0</strong><span>런타임 취약점</span><small>npm audit --omit=dev</small></article>
            </div>
          </div>

          <div className="portfolioHandoff">
            <div className="portfolioHandoffHeading">
              <span>DELIVERABLES</span>
              <strong>제공 가능한 결과물</strong>
            </div>
            <div className="portfolioHandoffGrid">
              {handoffItems.map(({ icon: Icon, title, body }) => (
                <article key={title}>
                  <Icon size={19} aria-hidden="true" />
                  <div><strong>{title}</strong><p>{body}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="portfolioSection portfolioProcess" id="process" aria-labelledby="process-title">
          <div className="portfolioSectionHeading">
            <p>05 · WORK PROCESS</p>
            <h2 id="process-title">필요한 기능을 먼저 정리하고, 단계마다 확인 가능한 결과를 만듭니다</h2>
          </div>
          <ol>
            {processSteps.map((step) => (
              <li key={step.number}>
                <span>{step.number}</span>
                <div><strong>{step.title}</strong><p>{step.body}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="portfolioFinalCta">
          <div>
            <span>FULL-STACK WEB APPLICATION DEVELOPMENT</span>
            <h2>업무 요구사항을 화면부터 데이터와 검증까지 하나의 범위로 구현합니다</h2>
            <p>대표 프로젝트의 작동 화면, 시스템 설계와 검증 코드를 함께 확인할 수 있습니다.</p>
          </div>
          <div>
            <a href="/case-study">OrderOps 상세 보기 <ArrowRight size={17} aria-hidden="true" /></a>
            <a href={githubUrl} target="_blank" rel="noreferrer">GitHub 코드 보기 <ExternalLink size={16} aria-hidden="true" /></a>
          </div>
        </section>
      </main>

      <footer className="portfolioFooter">
        <a className="portfolioBrand" href="#top">
          <span className="portfolioBrandMark" aria-hidden="true">E</span>
          <span><strong>Egoistian</strong><small>Full-stack Developer</small></span>
        </a>
        <span>Product · Frontend · Backend · Database · Quality</span>
        <a href={githubUrl} target="_blank" rel="noreferrer">GitHub <ExternalLink size={14} aria-hidden="true" /></a>
      </footer>
    </div>
  );
}
