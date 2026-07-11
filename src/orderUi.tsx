import { Cloud } from "lucide-react";
import type { OrderStatus, UserRole } from "./types";

export const ACCESS_ACCOUNT_PASSWORD = "orderops-access-2026";

export const ORDER_STATUSES: OrderStatus[] = ["received", "normalized", "exception", "ready", "shipped"];

export const STATUS_META: Record<
  OrderStatus,
  { label: string; shortLabel: string; description: string }
> = {
  received: { label: "주문 접수", shortLabel: "접수", description: "원본 주문이 안전하게 저장된 상태" },
  normalized: { label: "정보 정규화", shortLabel: "정규화", description: "고객·주소·상품 정보 정리가 완료된 상태" },
  exception: { label: "예외 확인", shortLabel: "예외", description: "담당자의 확인이 필요한 상태" },
  ready: { label: "출고 준비", shortLabel: "출고 준비", description: "물류 라인 배정과 검수를 마친 상태" },
  shipped: { label: "출고 완료", shortLabel: "출고 완료", description: "출고 처리가 완료된 상태" },
};

export const ROLE_META: Record<UserRole, { label: string; description: string }> = {
  admin: { label: "관리자", description: "모든 상태 전이 권한" },
  operator: { label: "운영 담당자", description: "운영 업무 권한" },
  viewer: { label: "열람 전용", description: "읽기 전용" },
};

export type InspectorTab = "detail" | "status" | "audit";

export function Brand() {
  return (
    <div className="brand">
      <Cloud size={27} aria-hidden="true" />
      <strong>OrderOps Cloud</strong>
    </div>
  );
}

export function StatusChip({ status }: { status: OrderStatus }) {
  return <span className={`statusChip status-${status}`}>{STATUS_META[status].shortLabel}</span>;
}

export function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

export function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "요청을 처리하지 못했습니다.";
}

export function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
