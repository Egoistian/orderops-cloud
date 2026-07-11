import { hashPassword } from "./security.mjs";

const tenants = [
  { id: "tenant-seoul-fresh", slug: "seoul-fresh", name: "서울프레시 물류", emailDomain: "seoulfresh.example" },
  { id: "tenant-busan-craft", slug: "busan-craft", name: "부산크래프트 상점", emailDomain: "busancraft.example" },
];

const roles = [
  { role: "admin", label: "관리자" },
  { role: "operator", label: "운영 담당자" },
  { role: "viewer", label: "열람 전용" },
];

const orders = [
  ["sf-1001", "tenant-seoul-fresh", "SF-20260711-001", "2026-07-11T00:35:00+09:00", "김*현", "010-****-4821", "서울 강남구", "노르웨이산 생연어 스테이크 200g", 2, "냉장", "high", "ready", [], ["전화번호 형식 통일", "서울 권역 냉장 라인 자동 배정"], "성수 냉장센터", "냉장 B-02", 56800, 3],
  ["sf-1002", "tenant-seoul-fresh", "SF-20260711-002", "2026-07-11T00:12:00+09:00", "이*원", "010-****-1903", "경기 성남시", "리코타·루꼴라 믹스 샐러드 키트 3종", 1, "수도권 당일", "review", "exception", ["주소확인"], ["상세 주소 누락 감지", "출고 전 검수 필요"], "판교 허브", "주소 확인 대기", 24900, 2],
  ["sf-1003", "tenant-seoul-fresh", "SF-20260710-019", "2026-07-10T16:40:00+09:00", "박*정", "010-****-7730", "서울 마포구", "샤인머스캣·애플망고 과일박스 2.4kg", 1, "파손주의", "normal", "normalized", [], ["고객명 공백 제거", "파손주의 키워드 분류"], "마포 MFC", "완충 포장 F-01", 41900, 1],
  ["sf-1004", "tenant-seoul-fresh", "SF-20260710-018", "2026-07-10T15:58:00+09:00", "최*우", "010-****-5512", "인천 연수구", "시그니처 냉장 밀키트 6종 4인분", 2, "냉장", "normal", "received", [], ["원본 주문 수신", "정규화 대기"], "인천 저온센터", "미배정", 73200, 1],
  ["sf-1005", "tenant-seoul-fresh", "SF-20260710-017", "2026-07-10T15:10:00+09:00", "정*아", "010-****-8066", "서울 송파구", "저당 고단백 크림빵 4종 세트", 3, "일반택배", "low", "shipped", [], ["주소 표준화 완료", "일반택배 허브 배정"], "송파 MFC", "CJ-SEOUL-4", 38700, 5],
  ["sf-1006", "tenant-seoul-fresh", "SF-20260710-016", "2026-07-10T14:32:00+09:00", "유*민", "010-****-3304", "경기 고양시", "1+ 한우 모둠 선물세트 800g", 1, "냉장", "high", "ready", [], ["냉장 상품 태그 감지", "수도권 북부 라인 배정"], "고양 냉장센터", "냉장 B-04", 129000, 2],
  ["bc-2001", "tenant-busan-craft", "BC-20260711-041", "2026-07-11T00:28:00+09:00", "한*진", "010-****-2408", "부산 수영구", "수작업 유약 도자기 머그 2P 세트", 2, "파손주의", "high", "ready", [], ["파손주의 상품 자동 감지", "완충 포장 라인 배정"], "부산 동부센터", "완충 P-03", 64000, 2],
  ["bc-2002", "tenant-busan-craft", "BC-20260711-040", "2026-07-11T00:05:00+09:00", "문*서", "010-****-9910", "경남 창원시", "라탄 빅사이즈 다이아몬드 리빙박스", 1, "대형화물", "review", "exception", ["연락처확인"], ["연락처 자리수 검수 플래그", "대형화물 라인 임시 보류"], "창원 화물허브", "연락처 확인 대기", 89000, 1],
  ["bc-2003", "tenant-busan-craft", "BC-20260710-039", "2026-07-10T17:02:00+09:00", "서*훈", "010-****-4027", "부산 해운대구", "수작업 원목 패브릭 단스탠드", 1, "파손주의", "normal", "normalized", [], ["도로명 주소 표준화", "취급주의 라인 추천"], "부산 동부센터", "완충 P-02", 118000, 1],
  ["bc-2004", "tenant-busan-craft", "BC-20260710-038", "2026-07-10T16:16:00+09:00", "오*연", "010-****-6731", "울산 남구", "안개 숲 쉬폰 패브릭 포스터 90×140cm", 3, "일반택배", "low", "shipped", [], ["수량 숫자 형식 정리", "영남 일반택배 라인 배정"], "울산 소형허브", "LOTTE-YEONGNAM-2", 51000, 4],
];

async function lockAccessTenant(client, tenantId) {
  await client.query(
    "select pg_advisory_xact_lock(hashtext('orderops-shared-access'), hashtext($1::text))",
    [tenantId],
  );
}

async function insertInitialOrders(client, tenant) {
  const tenantOrders = orders.filter((order) => order[1] === tenant.id);
  for (const order of tenantOrders) {
    await client.query(
      `insert into orders
        (id, tenant_id, order_number, ordered_at, customer_name, masked_phone, region,
         product_name, quantity, lane, priority, status, exceptions, normalization_notes,
         warehouse, shipping_line, total_amount, version)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
      order,
    );
    await client.query(
      `insert into audit_events
        (tenant_id, order_id, actor_user_id, actor_name, actor_role, action, from_status, to_status, note, created_at)
       values ($1, $2, $3, $4, 'admin', 'order.initialized', null, $5, '초기 주문 상태 등록', $6)`,
      [
        order[1],
        order[0],
        `${tenant.slug}-admin`,
        `${tenant.name} 관리자`,
        order[11],
        order[3],
      ],
    );
  }
}

export async function resetAccessTenantData(pool, tenantId) {
  const tenant = tenants.find((candidate) => candidate.id === tenantId);
  if (!tenant) throw new Error("공유 접근 초기화를 지원하지 않는 tenant입니다.");

  const client = await pool.connect();
  try {
    await client.query("begin");
    await lockAccessTenant(client, tenantId);
    await client.query("select set_config('orderops.audit_maintenance', 'on', true)");
    await client.query("delete from audit_events where tenant_id = $1", [tenantId]);
    await client.query("delete from orders where tenant_id = $1", [tenantId]);
    await insertInitialOrders(client, tenant);
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

export async function seedDatabase(pool, password = process.env.ACCESS_ACCOUNT_PASSWORD || "orderops-access-2026") {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query("select set_config('orderops.audit_maintenance', 'on', true)");
    for (const tenant of tenants) {
      await client.query("delete from audit_events where tenant_id = $1", [tenant.id]);
      await client.query("delete from sessions where tenant_id = $1", [tenant.id]);
      await client.query("delete from orders where tenant_id = $1", [tenant.id]);
      await client.query("delete from users where tenant_id = $1", [tenant.id]);
      await client.query("delete from tenants where id = $1", [tenant.id]);
      await client.query("insert into tenants (id, slug, name) values ($1, $2, $3)", [tenant.id, tenant.slug, tenant.name]);
    }

    const passwordHash = await hashPassword(password);
    for (const tenant of tenants) {
      for (const role of roles) {
        const id = `${tenant.slug}-${role.role}`;
        const email = `${role.role}@${tenant.emailDomain}`;
        await client.query(
          `insert into users (id, tenant_id, email, name, role, password_hash, is_access_account)
           values ($1, $2, $3, $4, $5, $6, true)`,
          [id, tenant.id, email, `${tenant.name} ${role.label}`, role.role, passwordHash],
        );
      }
    }

    for (const tenant of tenants) await insertInitialOrders(client, tenant);

    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
