import { ClipboardList, History, TriangleAlert } from "lucide-react";
import { Brand, ROLE_META, formatDateTime } from "./orderUi";
import type { InspectorTab } from "./orderUi";
import type { Metrics, User } from "./types";

export function Sidebar({
  user,
  metrics,
  exceptionsOnly,
  inspectorTab,
  onOrders,
  onExceptions,
  onAudit,
}: {
  user: User;
  metrics: Metrics | null;
  exceptionsOnly: boolean;
  inspectorTab: InspectorTab;
  onOrders: () => void;
  onExceptions: () => void;
  onAudit: () => void;
}) {
  return (
    <aside className="sidebar">
      <Brand />
      <nav aria-label="주요 메뉴">
        <button type="button" className={!exceptionsOnly && inspectorTab !== "audit" ? "active" : ""} onClick={onOrders}>
          <ClipboardList size={18} />
          <span>주문 관리</span>
          <em>{metrics?.total ?? "-"}</em>
        </button>
        <button type="button" className={exceptionsOnly ? "active exception" : ""} onClick={onExceptions}>
          <TriangleAlert size={18} />
          <span>예외 관리</span>
          <em>{metrics?.exceptions ?? "-"}</em>
        </button>
        <button type="button" className={inspectorTab === "audit" ? "active" : ""} onClick={onAudit}>
          <History size={18} />
          <span>감사 로그</span>
        </button>
      </nav>

      <section className="dataScope">
        <span>데이터 범위</span>
        <strong>{user.tenant.name}</strong>
        <small>회사별 PostgreSQL 주문 데이터</small>
        <dl>
          <div>
            <dt>역할</dt>
            <dd>{ROLE_META[user.role].label}</dd>
          </div>
          <div>
            <dt>최종 갱신</dt>
            <dd>{metrics?.lastUpdatedAt ? formatDateTime(metrics.lastUpdatedAt) : "불러오는 중"}</dd>
          </div>
        </dl>
        <p>표의 숫자와 주문은 현재 테넌트의 API 응답만 표시합니다.</p>
      </section>
    </aside>
  );
}
