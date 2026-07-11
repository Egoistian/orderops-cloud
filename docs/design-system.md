# OrderOps Cloud UI contract

This contract defines the visual system and interaction rules for the OrderOps Cloud workspace.

## Product surface

- Desktop operations console, not a marketing page.
- Primary workflow: sign in → scan tenant orders → select one order → perform one server-authorized status transition → confirm the new audit event.
- All visible values come from the current tenant's PostgreSQL records.
- Show `ROLE-BASED ACCESS` near the signed-in identity to make the active authorization context clear.

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
- `ROLE-BASED ACCESS`
- `주문 관리`
- `전체 주문`, `예외 주문`, and workflow status filters
- `주문번호, 고객명, 상품명 검색`
- factual metric labels derived from the API
- table column labels
- selected order number and inspector tab labels `주문 상세`, `상태 변경`, `감사 로그`

Functional error, loading, empty, success, permission, and confirmation copy must stay concise. Do not add performance claims, system-health marketing, fake pagination counts, or decorative badges.

## Components and interaction

- Buttons, tabs, inputs, status chips, table rows, notices, and timeline entries share explicit variants.
- Use the existing Lucide outline family at a consistent 16–18px visual weight.
- Search and filters update the API query or the loaded tenant data; no inert filter button.
- Row selection works with pointer and keyboard and exposes a single selected state without fake checkboxes.
- The transition control renders only `allowedTransitions` returned by the backend.
- A transition shows pending state, success confirmation, error recovery, then refreshes metrics, orders, and audit in parallel.
- Logout invalidates the server session.
- Respect `prefers-reduced-motion`; motion is limited to drawer/timeline state changes and focus feedback.

## Implementation decisions

- Metrics, dates, and activity entries come from the API.
- The workflow uses five verified states: `received`, `normalized`, `exception`, `ready`, `shipped`.
- Unimplemented navigation destinations are omitted or rendered as non-interactive context, never as dead buttons.
- Pagination is omitted while list responses remain capped at 100 rows.
