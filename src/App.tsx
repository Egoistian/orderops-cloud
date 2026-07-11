import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  LoaderCircle,
  LogOut,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { ApiError, getCurrentUser, getDemoAccounts, getMetrics, getOrders, logout } from "./api";
import { LoginScreen } from "./LoginScreen";
import { OrderInspector } from "./OrderInspector";
import { OrdersTable } from "./OrdersTable";
import { Sidebar } from "./Sidebar";
import {
  Brand,
  ORDER_STATUSES,
  ROLE_META,
  STATUS_META,
  errorMessage,
  formatCurrency,
  isAbortError,
} from "./orderUi";
import type { InspectorTab } from "./orderUi";
import type { DemoAccount, Metrics, Order, OrderStatus, User } from "./types";

export default function App() {
  const [phase, setPhase] = useState<"checking" | "login" | "dashboard">("checking");
  const [user, setUser] = useState<User | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [sessionError, setSessionError] = useState("");
  const [bootVersion, setBootVersion] = useState(0);

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsError, setMetricsError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  const [queryInput, setQueryInput] = useState("");
  const query = useDebouncedValue(queryInput.trim(), 250);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("detail");
  const [notice, setNotice] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    setPhase("checking");
    setSessionError("");

    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser();
        if (!active) return;
        if (currentUser) {
          setUser(currentUser);
          setPhase("dashboard");
          return;
        }
        const accounts = await getDemoAccounts();
        if (!active) return;
        setDemoAccounts(accounts);
        setPhase("login");
      } catch (error) {
        if (!active) return;
        setSessionError(errorMessage(error));
        setPhase("login");
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [bootVersion]);

  const expireSession = useCallback((message: string) => {
    setUser(null);
    setMetrics(null);
    setOrders([]);
    setSelectedId(null);
    setSessionError(message);
    setPhase("login");
    void getDemoAccounts().then(setDemoAccounts).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setMetricsError("");
    void getMetrics(controller.signal)
      .then(setMetrics)
      .catch((error) => {
        if (isAbortError(error)) return;
        if (error instanceof ApiError && error.status === 401) {
          expireSession(error.message);
          return;
        }
        setMetricsError(errorMessage(error));
      });
    return () => controller.abort();
  }, [expireSession, refreshVersion, user]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setOrdersLoading(true);
    setOrdersError("");
    void getOrders({ query, status: statusFilter, exceptionsOnly }, controller.signal)
      .then((nextOrders) => {
        setOrders(nextOrders);
        setSelectedId((currentId) => {
          if (currentId && nextOrders.some((order) => order.id === currentId)) return currentId;
          return nextOrders[0]?.id ?? null;
        });
      })
      .catch((error) => {
        if (isAbortError(error)) return;
        if (error instanceof ApiError && error.status === 401) {
          expireSession(error.message);
          return;
        }
        setOrdersError(errorMessage(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setOrdersLoading(false);
      });
    return () => controller.abort();
  }, [exceptionsOnly, expireSession, query, refreshVersion, statusFilter, user]);

  useEffect(() => {
    function focusSearch(event: globalThis.KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  useEffect(() => {
    if (phase === "dashboard") window.scrollTo({ top: 0, left: 0 });
  }, [phase]);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedId) ?? null,
    [orders, selectedId],
  );

  function refreshData(message = "최신 데이터를 불러왔습니다.") {
    setNotice(message);
    setRefreshVersion((version) => version + 1);
  }

  function resetFilters() {
    setQueryInput("");
    setStatusFilter("");
    setExceptionsOnly(false);
    setInspectorTab("detail");
  }

  function openExceptions() {
    setStatusFilter("");
    setExceptionsOnly(true);
    setInspectorTab("detail");
  }

  function openAudit() {
    if (!selectedId && orders[0]) setSelectedId(orders[0].id);
    setInspectorTab("audit");
  }

  async function handleLogout() {
    setNotice("");
    try {
      await logout();
      setUser(null);
      setMetrics(null);
      setOrders([]);
      setSelectedId(null);
      setPhase("login");
      if (!demoAccounts.length) setDemoAccounts(await getDemoAccounts());
    } catch (error) {
      setNotice(errorMessage(error));
    }
  }

  if (phase === "checking") return <SessionLoading />;

  if (phase === "login" || !user) {
    return (
      <LoginScreen
        accounts={demoAccounts}
        connectionError={sessionError}
        onRetry={() => setBootVersion((version) => version + 1)}
        onAuthenticated={(nextUser) => {
          setUser(nextUser);
          setSessionError("");
          setNotice("");
          setPhase("dashboard");
        }}
      />
    );
  }

  return (
    <div className="appShell">
      <Sidebar
        user={user}
        metrics={metrics}
        exceptionsOnly={exceptionsOnly}
        inspectorTab={inspectorTab}
        onOrders={resetFilters}
        onExceptions={openExceptions}
        onAudit={openAudit}
      />

      <main className="workspace">
        <header className="topbar">
          <div className="tenantContext">
            <Building2 size={16} aria-hidden="true" />
            <strong>{user.tenant.name}</strong>
          </div>
          <div className="userContext">
            <span className="roleContext">
              역할 <strong>{ROLE_META[user.role].label}</strong>
            </span>
            <span className="demoBadge">DEMO · 시드 데이터</span>
            <button className="iconTextButton" type="button" onClick={() => void handleLogout()}>
              <LogOut size={16} aria-hidden="true" />
              로그아웃
            </button>
          </div>
        </header>

        <section className="operations" aria-labelledby="pageTitle">
          <div className="pageHeading">
            <div>
              <h1 id="pageTitle">주문 관리</h1>
              <p>{user.tenant.name}의 시드 주문을 조회하고 허용된 상태만 변경합니다.</p>
            </div>
            <button className="secondaryButton" type="button" onClick={() => refreshData()}>
              <RefreshCw size={16} aria-hidden="true" />
              새로고침
            </button>
          </div>

          {notice ? (
            <div className={`inlineNotice ${notice.includes("못했습니다") ? "error" : ""}`} role="status">
              {notice.includes("못했습니다") ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span>{notice}</span>
              <button type="button" aria-label="알림 닫기" onClick={() => setNotice("")}>
                <X size={15} />
              </button>
            </div>
          ) : null}

          <MetricStrip metrics={metrics} error={metricsError} />

          <div className={`contentGrid ${selectedOrder ? "withInspector" : ""}`}>
            <section className="ordersSurface" aria-label="주문 목록">
              <div className="orderTools">
                <div className="statusFilters" aria-label="주문 상태 필터">
                  <button
                    type="button"
                    className={!statusFilter && !exceptionsOnly ? "active" : ""}
                    aria-pressed={!statusFilter && !exceptionsOnly}
                    onClick={() => {
                      setStatusFilter("");
                      setExceptionsOnly(false);
                    }}
                  >
                    전체 주문
                  </button>
                  <button
                    type="button"
                    className={exceptionsOnly ? "active exception" : ""}
                    aria-pressed={exceptionsOnly}
                    onClick={() => {
                      setStatusFilter("");
                      setExceptionsOnly((current) => !current);
                    }}
                  >
                    예외 주문
                  </button>
                  {ORDER_STATUSES.map((status) => (
                    <button
                      type="button"
                      className={statusFilter === status && !exceptionsOnly ? "active" : ""}
                      aria-pressed={statusFilter === status && !exceptionsOnly}
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setExceptionsOnly(false);
                      }}
                    >
                      {STATUS_META[status].shortLabel}
                    </button>
                  ))}
                </div>

                <label className="searchField">
                  <Search size={16} aria-hidden="true" />
                  <span className="srOnly">주문 검색</span>
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={queryInput}
                    onChange={(event) => setQueryInput(event.target.value)}
                    placeholder="주문번호, 고객명, 상품명 검색"
                  />
                  <kbd>⌘K</kbd>
                </label>
              </div>

              <OrdersTable
                orders={orders}
                selectedId={selectedId}
                loading={ordersLoading}
                error={ordersError}
                onRetry={() => refreshData("주문 목록을 다시 요청했습니다.")}
                onSelect={(orderId) => {
                  setSelectedId(orderId);
                  setInspectorTab("detail");
                }}
              />

              {!ordersLoading && !ordersError ? (
                <footer className="tableSummary">
                  <strong>{orders.length.toLocaleString("ko-KR")}건</strong>
                  <span>현재 필터의 PostgreSQL 조회 결과 · 최대 100건</span>
                </footer>
              ) : null}
            </section>

            {selectedOrder ? (
              <OrderInspector
                key={selectedOrder.id}
                order={selectedOrder}
                user={user}
                activeTab={inspectorTab}
                onTabChange={setInspectorTab}
                onClose={() => setSelectedId(null)}
                onSessionExpired={expireSession}
                onTransitioned={(updatedOrder, message) => {
                  setOrders((current) =>
                    current.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
                  );
                  refreshData(message);
                }}
              />
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}

function SessionLoading() {
  return (
    <main className="sessionLoading" aria-live="polite">
      <Brand />
      <LoaderCircle className="spin" size={22} aria-hidden="true" />
      <span>세션을 확인하고 있습니다.</span>
    </main>
  );
}

function MetricStrip({ metrics, error }: { metrics: Metrics | null; error: string }) {
  if (error) {
    return (
      <div className="metricError" role="alert">
        <AlertCircle size={16} /> 지표를 불러오지 못했습니다. {error}
      </div>
    );
  }

  const cells = [
    { key: "total", label: "전체", value: metrics?.total },
    ...ORDER_STATUSES.map((status) => ({
      key: status,
      label: STATUS_META[status].shortLabel,
      value: metrics ? (metrics.statusCounts[status] ?? 0) : undefined,
      status,
    })),
    { key: "exceptions", label: "예외 표시", value: metrics?.exceptions, status: "exception" as const },
    { key: "amount", label: "주문 금액", value: metrics ? formatCurrency(metrics.totalAmount) : undefined },
  ];

  return (
    <section className="metricStrip" aria-label="현재 테넌트 주문 지표">
      {cells.map((cell) => (
        <div className={cell.status ? `metricCell status-${cell.status}` : "metricCell"} key={cell.key}>
          <span>{cell.label}</span>
          <strong>{cell.value ?? "-"}</strong>
        </div>
      ))}
    </section>
  );
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);
  return debounced;
}
