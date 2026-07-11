# OrderOps Cloud UI contract

This file turns the accepted concept into an implementation checklist. The source of truth is `portfolio_assets/concepts/orderops-cloud-ui-concept-2026-07-11.png` and the linked Lazyweb report in the project README.

## Product surface

- Desktop operations console, not a marketing page.
- Primary workflow: sign in → scan tenant orders → select one order → perform one server-authorized status transition → confirm the new audit event.
- All visible values come from the current tenant's seeded PostgreSQL data.
- Always show `DEMO · 시드 데이터`; never imply a real customer deployment or real throughput.

## Layout

- Full-height white application shell.
- Compact left rail, flexible order workspace, fixed right inspector on wide screens.
- The table remains the primary surface; do not replace it with cards.
- The right inspector owns three states: order details, status change, audit history.
- At narrower desktop widths the inspector may become a drawer; on mobile it becomes a full-width layer beneath a compact header.

## Tokens

| Token | Value |
| --- | --- |
| Canvas | `#ffffff` |
| Subtle surface | `#f8fafc` |
| Selected surface | `#eef4ff` |
| Primary text | `#0f172a` |
| Muted text | `#64748b` |
| Border | `#d8e0eb` |
| Cobalt action | `#2563eb` |
| Green success | `#21864a` |
| Amber exception | `#c77700` |
| Red error | `#c2413b` |
| Radius | `6px` controls, `8px` panels |
| Shadow | only for overlays; no floating-card shadows in the main shell |

Use a Korean-capable system sans stack (`Pretendard`, `Inter`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, sans-serif). Chrome labels are 12–14px; table rows 13px; the page title 22–24px. Use a 4/8px spacing rhythm.

## Allowed first-viewport copy

- `OrderOps Cloud`
- current tenant name
- `역할`
- current role name
- `DEMO · 시드 데이터`
- `주문 관리`
- `전체 주문`, `예외 주문`, and workflow status filters
- `주문번호, 고객명, 상품명 검색`
- factual metric labels derived from the API
- table column labels
- selected order number and inspector tab labels `주문 상세`, `상태 변경`, `감사 로그`

Functional error, loading, empty, success, permission, and confirmation copy is an intentional necessity and must stay concise. Do not add claims, performance deltas, system-health marketing, fake pagination counts, or decorative badges.

## Components and interaction

- Buttons, tabs, inputs, status chips, table rows, notices, and timeline entries share explicit variants.
- Use the existing Lucide outline family at a consistent 16–18px visual weight.
- Search and filters update the API query or the loaded tenant data; no inert filter button.
- Row selection works with pointer and keyboard and exposes a single selected state without fake checkboxes.
- The transition control renders only `allowedTransitions` returned by the backend.
- A transition shows pending state, success confirmation, error recovery, then refreshes metrics, orders, and audit in parallel.
- Logout invalidates the server session.
- Respect `prefers-reduced-motion`; motion is limited to drawer/timeline state changes and focus feedback.

## Intentional differences from the image concept

- Concept metrics and dates are illustrative; implementation uses the 10 PostgreSQL seed orders only.
- Concept shows a seven-step fulfillment model; the implemented first version uses the verified five states `received`, `normalized`, `exception`, `ready`, `shipped`.
- Unimplemented navigation destinations are omitted or rendered as non-interactive context, never as dead buttons.
- Pagination is omitted while the seeded dataset remains below 100 rows.
