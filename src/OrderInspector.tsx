import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  LoaderCircle,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { ApiError, getOrderAudit, transitionOrder } from "./api";
import {
  ROLE_META,
  STATUS_META,
  StatusChip,
  errorMessage,
  formatCurrency,
  formatDateTime,
  isAbortError,
} from "./orderUi";
import type { InspectorTab } from "./orderUi";
import type { AuditEvent, Order, OrderStatus, User } from "./types";

export function OrderInspector({
  order,
  user,
  activeTab,
  onTabChange,
  onClose,
  onSessionExpired,
  onTransitioned,
}: {
  order: Order;
  user: User;
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onClose: () => void;
  onSessionExpired: (message: string) => void;
  onTransitioned: (order: Order, message: string) => void;
}) {
  const [transitionTarget, setTransitionTarget] = useState<OrderStatus | "">(order.allowedTransitions[0] ?? "");
  const [note, setNote] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [transitionFeedback, setTransitionFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [audit, setAudit] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditVersion, setAuditVersion] = useState(0);

  useEffect(() => {
    setTransitionTarget(order.allowedTransitions[0] ?? "");
  }, [order.status, order.version, order.allowedTransitions]);

  useEffect(() => {
    if (activeTab !== "audit") return;
    const controller = new AbortController();
    setAuditLoading(true);
    setAuditError("");
    void getOrderAudit(order.id, controller.signal)
      .then(setAudit)
      .catch((error) => {
        if (isAbortError(error)) return;
        if (error instanceof ApiError && error.status === 401) {
          onSessionExpired(error.message);
          return;
        }
        setAuditError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setAuditLoading(false);
      });
    return () => controller.abort();
  }, [activeTab, auditVersion, onSessionExpired, order.id]);

  async function handleTransition() {
    if (!transitionTarget || !order.allowedTransitions.includes(transitionTarget)) return;
    setTransitioning(true);
    setTransitionFeedback(null);
    try {
      const result = await transitionOrder({
        orderId: order.id,
        status: transitionTarget,
        expectedVersion: order.version,
        note,
      });
      const message = `${order.orderNumber}을(를) ${STATUS_META[result.order.status].label} 상태로 변경했습니다.`;
      setNote("");
      setTransitionFeedback({ type: "success", message });
      setAudit((current) => [result.audit, ...current.filter((event) => event.id !== result.audit.id)]);
      setAuditVersion((version) => version + 1);
      onTransitioned(result.order, message);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        onSessionExpired(error.message);
        return;
      }
      const message = errorMessage(error);
      setTransitionFeedback({ type: "error", message });
      if (error instanceof ApiError && error.status === 409) setAuditVersion((version) => version + 1);
    } finally {
      setTransitioning(false);
    }
  }

  return (
    <aside className="inspector" aria-label={`${order.orderNumber} 주문 인스펙터`}>
      <header className="inspectorHeader">
        <div>
          <strong>{order.orderNumber}</strong>
          <span>{order.customerName} · {order.productName}</span>
        </div>
        <button type="button" aria-label="주문 상세 닫기" onClick={onClose}>
          <X size={17} />
        </button>
      </header>

      <div className="inspectorTabs" role="tablist" aria-label="주문 작업">
        {([
          ["detail", "주문 상세"],
          ["status", "상태 변경"],
          ["audit", "감사 로그"],
        ] as Array<[InspectorTab, string]>).map(([tab, label]) => (
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => onTabChange(tab)}
            key={tab}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="inspectorBody">
        {activeTab === "detail" ? <OrderDetails order={order} /> : null}
        {activeTab === "status" ? (
          <section className="statusPanel">
            <div className="currentStatus">
              <span>현재 상태</span>
              <StatusChip status={order.status} />
              <p>{STATUS_META[order.status].description}</p>
            </div>

            <div className="transitionSection">
              <h2>다음 가능한 작업</h2>
              {order.allowedTransitions.length ? (
                <>
                  <div className="transitionOptions">
                    {order.allowedTransitions.map((status) => (
                      <button
                        type="button"
                        className={transitionTarget === status ? "active" : ""}
                        aria-pressed={transitionTarget === status}
                        onClick={() => setTransitionTarget(status)}
                        key={status}
                      >
                        <span>
                          <strong>{STATUS_META[status].label}</strong>
                          <small>{STATUS_META[status].description}</small>
                        </span>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                  {user.publicDemoMode ? (
                    <div className="publicDemoNote">
                      <ShieldCheck size={16} />
                      <span>공개 데모에서는 안전한 고정 사유로 기록됩니다.</span>
                    </div>
                  ) : (
                    <label className="transitionNote">
                      <span>변경 사유 <small>선택 · 최대 200자</small></span>
                      <textarea
                        value={note}
                        maxLength={200}
                        rows={3}
                        placeholder="감사 로그에 남길 사유를 입력하세요."
                        onChange={(event) => setNote(event.target.value)}
                      />
                      <em>{note.length} / 200</em>
                    </label>
                  )}
                  <button
                    className="primaryButton transitionSubmit"
                    type="button"
                    disabled={!transitionTarget || transitioning}
                    onClick={() => void handleTransition()}
                  >
                    {transitioning ? <LoaderCircle className="spin" size={17} /> : <ArrowRight size={17} />}
                    {transitioning
                      ? "변경 중"
                      : transitionTarget
                        ? `${STATUS_META[transitionTarget].label}로 변경`
                        : "상태 선택"}
                  </button>
                </>
              ) : (
                <div className="permissionNotice">
                  <ShieldCheck size={18} />
                  <div>
                    <strong>현재 가능한 상태 변경이 없습니다.</strong>
                    <span>
                      {user.role === "viewer"
                        ? "열람 전용 계정은 주문을 변경할 수 없습니다."
                        : "현재 상태가 마지막 단계이거나 역할 권한에 제한됩니다."}
                    </span>
                  </div>
                </div>
              )}
              {transitionFeedback ? (
                <div className={`transitionFeedback ${transitionFeedback.type}`} role="status">
                  {transitionFeedback.type === "success" ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
                  {transitionFeedback.message}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
        {activeTab === "audit" ? (
          <AuditTimeline
            events={audit}
            loading={auditLoading}
            error={auditError}
            onRetry={() => setAuditVersion((version) => version + 1)}
          />
        ) : null}
      </div>
    </aside>
  );
}

function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="orderDetails">
      <section>
        <h2>기본 정보</h2>
        <dl>
          <InfoRow label="주문번호" value={order.orderNumber} />
          <InfoRow label="주문일시" value={formatDateTime(order.orderedAt)} />
          <InfoRow label="고객" value={`${order.customerName} · ${order.maskedPhone}`} />
          <InfoRow label="배송지역" value={order.region} />
          <InfoRow label="상품" value={`${order.productName} · ${order.quantity}개`} />
          <InfoRow label="주문금액" value={formatCurrency(order.totalAmount)} />
        </dl>
      </section>
      <section>
        <h2>출고·물류</h2>
        <dl>
          <InfoRow label="물류 구분" value={order.lane} />
          <InfoRow label="출고 창고" value={order.warehouse} />
          <InfoRow label="배송 라인" value={order.shippingLine} />
          <InfoRow label="현재 상태" value={<StatusChip status={order.status} />} />
        </dl>
      </section>
      <section>
        <h2>정규화 근거</h2>
        {order.normalizationNotes.length ? (
          <ul className="normalizationList">
            {order.normalizationNotes.map((item) => (
              <li key={item}>
                <CheckCircle2 size={15} /> {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="emptyCopy">저장된 정규화 메모가 없습니다.</p>
        )}
      </section>
      <section>
        <h2>예외</h2>
        {order.exceptions.length ? (
          <div className="exceptionBox">
            <TriangleAlert size={17} />
            <span>{order.exceptions.join(", ")}</span>
          </div>
        ) : (
          <p className="emptyCopy">현재 확인할 예외가 없습니다.</p>
        )}
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function AuditTimeline({
  events,
  loading,
  error,
  onRetry,
}: {
  events: AuditEvent[];
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  if (loading && !events.length) {
    return (
      <div className="inspectorState" role="status">
        <LoaderCircle className="spin" size={18} /> 감사 로그를 불러오고 있습니다.
      </div>
    );
  }
  if (error) {
    return (
      <div className="inspectorState error" role="alert">
        <AlertCircle size={18} />
        <span>{error}</span>
        <button className="secondaryButton compact" type="button" onClick={onRetry}>
          다시 시도
        </button>
      </div>
    );
  }
  if (!events.length) return <div className="inspectorState">기록된 감사 이벤트가 없습니다.</div>;

  return (
    <section className="auditPanel">
      <div className="auditHeading">
        <div>
          <h2>감사 타임라인</h2>
          <p>현재 주문의 최신 변경부터 표시합니다.</p>
        </div>
        {loading ? <LoaderCircle className="spin" size={16} aria-label="감사 로그 갱신 중" /> : null}
      </div>
      <ol className="auditTimeline">
        {events.map((event) => (
          <li key={event.id}>
            <span className="timelineDot" aria-hidden="true" />
            <time>{formatDateTime(event.createdAt)}</time>
            <div>
              <strong>
                {event.fromStatus ? STATUS_META[event.fromStatus].shortLabel : "생성"}
                <ChevronRight size={13} />
                {STATUS_META[event.toStatus].shortLabel}
              </strong>
              <span>{event.actorName} · {ROLE_META[event.actorRole].label}</span>
              {event.note ? <p>{event.note}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
