import type { KeyboardEvent } from "react";
import { AlertCircle, LoaderCircle, Search, TriangleAlert } from "lucide-react";
import { StatusChip, formatCurrency, formatDateTime } from "./orderUi";
import type { Order } from "./types";

export function OrdersTable({
  orders,
  selectedId,
  loading,
  error,
  onRetry,
  onSelect,
}: {
  orders: Order[];
  selectedId: string | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onSelect: (orderId: string) => void;
}) {
  function handleRowKeyDown(event: KeyboardEvent<HTMLTableRowElement>, orderId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(orderId);
    }
  }

  return (
    <div className="tableViewport">
      <table className="ordersTable">
        <thead>
          <tr>
            <th>주문번호</th>
            <th>고객</th>
            <th>상품</th>
            <th>물류</th>
            <th>현재 상태</th>
            <th>예외</th>
            <th>업데이트</th>
          </tr>
        </thead>
        <tbody>
          {loading && !orders.length ? (
            <tr>
              <td className="tableState" colSpan={7}>
                <LoaderCircle className="spin" size={19} /> 주문을 불러오고 있습니다.
              </td>
            </tr>
          ) : null}
          {error ? (
            <tr>
              <td className="tableState error" colSpan={7}>
                <AlertCircle size={18} />
                <span>{error}</span>
                <button type="button" className="secondaryButton compact" onClick={onRetry}>
                  다시 시도
                </button>
              </td>
            </tr>
          ) : null}
          {!loading && !error && !orders.length ? (
            <tr>
              <td className="tableState" colSpan={7}>
                <Search size={18} /> 현재 조건에 맞는 주문이 없습니다.
              </td>
            </tr>
          ) : null}
          {orders.map((order) => (
            <tr
              key={order.id}
              className={selectedId === order.id ? "selected" : ""}
              tabIndex={0}
              aria-selected={selectedId === order.id}
              onClick={() => onSelect(order.id)}
              onKeyDown={(event) => handleRowKeyDown(event, order.id)}
            >
              <td>
                <strong className="orderNumber">{order.orderNumber}</strong>
                <small>{formatDateTime(order.orderedAt)}</small>
              </td>
              <td>
                <strong>{order.customerName}</strong>
                <small>{order.region}</small>
              </td>
              <td>
                <strong>{order.productName}</strong>
                <small>{order.quantity}개 · {formatCurrency(order.totalAmount)}</small>
              </td>
              <td>
                <strong>{order.lane}</strong>
                <small>{order.warehouse}</small>
              </td>
              <td>
                <StatusChip status={order.status} />
              </td>
              <td>
                {order.exceptions.length ? (
                  <span className="exceptionLabel">
                    <TriangleAlert size={13} /> {order.exceptions.join(", ")}
                  </span>
                ) : (
                  <span className="mutedValue">-</span>
                )}
              </td>
              <td>
                <span className="updatedAt">{formatDateTime(order.updatedAt)}</span>
                <small>v{order.version}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && orders.length ? (
        <div className="tableUpdating" role="status">
          <LoaderCircle className="spin" size={15} /> 업데이트 중
        </div>
      ) : null}
    </div>
  );
}
