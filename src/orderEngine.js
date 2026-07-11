export const seedOrders = [
  {
    orderId: "YJ250602-0001",
    orderedAt: "2025-06-02 14:32",
    customerName: " 김 * 현 ",
    phone: "010 1245 1245",
    address: "서울시 강남구 역삼동 823-17  2층",
    product: "연어 스테이크",
    qty: "2",
    memo: "오늘 안에 부탁드려요. 문앞 배송 요청",
  },
  {
    orderId: "YJ250602-0002",
    orderedAt: "2025/06/02 14:28",
    customerName: "이 * 수",
    phone: "010-5678-5678",
    address: "경기 성남시 분당구 판교역로 242",
    product: "딸기 2kg",
    qty: "1",
    memo: "빠른 배송",
  },
  {
    orderId: "YJ250602-0003",
    orderedAt: "2025-06-02 14:21",
    customerName: "박 * 영",
    phone: "010.3344.3344",
    address: "인천 연수구 컨벤시아대로 165",
    product: "와인 750ml",
    qty: "1",
    memo: "선물 포장. 깨지지 않게",
  },
  {
    orderId: "YJ250602-0004",
    orderedAt: "2025-06-02 14:18",
    customerName: "최 * 준",
    phone: "01099879987",
    address: "부산 해운대구 센텀남대로 35",
    product: "대형 TV 65",
    qty: "1",
    memo: "엘리베이터 사용 가능",
  },
  {
    orderId: "YJ250602-0005",
    orderedAt: "2025-06-02 14:05",
    customerName: "정*희",
    phone: "010-2211-2211",
    address: "경기 안산시 단원구 고잔로 76",
    product: "반찬 세트",
    qty: "3",
    memo: "냉장 배송",
  },
  {
    orderId: "YJ250602-0006",
    orderedAt: "2025-06-02 13:58",
    customerName: "유 * 민",
    phone: "010-6677-6677",
    address: "충북 청주시 흥덕구 오송읍 오송생명5로 184",
    product: "소고기 등심",
    qty: "2",
    memo: "오후 출고",
  },
  {
    orderId: "YJ250602-0007",
    orderedAt: "2025-06-02 13:47",
    customerName: "조 * 아",
    phone: "010-5566-5566",
    address: "서울 마포구 월드컵북로 400",
    product: "책상",
    qty: "1",
    memo: "경비실 보관 불가",
  },
  {
    orderId: "YJ250602-0008",
    orderedAt: "2025-06-02 13:33",
    customerName: "신 * 호",
    phone: "010-8877-8877",
    address: "경기 용인시 수지구 풍덕천로 13",
    product: "아이스크림",
    qty: "5",
    memo: "녹지 않게 보내주세요",
  },
  {
    orderId: "YJ250602-0009",
    orderedAt: "2025-06-02 13:22",
    customerName: "임 * 정",
    phone: "010-4321-4321",
    address: "대전 유성구 대학로",
    product: "화장품 세트",
    qty: "1",
    memo: "동 호수 확인 필요",
  },
  {
    orderId: "YJ250602-0010",
    orderedAt: "2025-06-02 13:15",
    customerName: "오 * 석",
    phone: "010-7711-7711",
    address: "제주 제주시 첨단로 242",
    product: "생수 2L",
    qty: "12",
    memo: "묶음 배송",
  },
  {
    orderId: "YJ250602-0011",
    orderedAt: "2025-06-02 12:59",
    customerName: "강 * 빈",
    phone: "010-2222-9999",
    address: "서울 송파구 올림픽로 300",
    product: "유리컵 6P",
    qty: "4",
    memo: "파손 주의",
  },
  {
    orderId: "YJ250602-0012",
    orderedAt: "2025-06-02 12:44",
    customerName: "문 * 지",
    phone: "010-9090-9090",
    address: "서울시 강남구 역삼동 823-17 2층",
    product: "연어 스테이크",
    qty: "2",
    memo: "YJ250602-0001와 동일 수령지 확인",
  },
  {
    orderId: "YJ250602-0013",
    orderedAt: "2025-06-02 12:31",
    customerName: "한 * 결",
    phone: "010-12A-333",
    address: "대구 수성구 달구벌대로 2450",
    product: "노트북",
    qty: "1",
    memo: "연락처가 깨져 들어옴",
  },
  {
    orderId: "YJ250602-0014",
    orderedAt: "2025-06-02 12:22",
    customerName: "서 * 윤",
    phone: "010-3131-3131",
    address: "",
    product: "커피머신",
    qty: "1",
    memo: "주소 누락",
  },
];

const headerMap = {
  주문번호: "orderId",
  주문일시: "orderedAt",
  고객명: "customerName",
  연락처: "phone",
  주소: "address",
  상품: "product",
  수량: "qty",
  요청사항: "memo",
  orderId: "orderId",
  orderedAt: "orderedAt",
  customerName: "customerName",
  phone: "phone",
  address: "address",
  product: "product",
  qty: "qty",
  memo: "memo",
};

const laneMeta = {
  "수도권 당일": { color: "green", line: "A-01", warehouse: "강남1센터" },
  냉장: { color: "blue", line: "B-02", warehouse: "부천콜드센터" },
  파손주의: { color: "red", line: "C-01", warehouse: "김포완충센터" },
  대형화물: { color: "violet", line: "D-03", warehouse: "군포대형센터" },
  주소확인: { color: "amber", line: "HOLD", warehouse: "예외검수" },
  일반택배: { color: "gray", line: "E-01", warehouse: "중부허브" },
};

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values, rowIndex) => {
    const record = {};
    headers.forEach((header, index) => {
      const key = headerMap[header] || header;
      record[key] = values[index] ? values[index].trim() : "";
    });
    return {
      orderId: record.orderId || `IMPORTED-${String(rowIndex + 1).padStart(3, "0")}`,
      orderedAt: record.orderedAt || "",
      customerName: record.customerName || "",
      phone: record.phone || "",
      address: record.address || "",
      product: record.product || "",
      qty: record.qty || "1",
      memo: record.memo || "",
    };
  });
}

export function exportCsv(processedOrders) {
  const headers = [
    "주문번호",
    "주문일시",
    "고객명",
    "연락처",
    "정규화주소",
    "상품",
    "수량",
    "태그",
    "물류분류",
    "SLA",
    "예외",
    "출고창고",
    "배송라인",
  ];
  const rows = processedOrders.map((order) => [
    order.orderId,
    order.orderedAt,
    order.normalized.customerName,
    order.normalized.maskedPhone,
    order.normalized.address,
    order.product,
    String(order.normalized.qty),
    order.tags.join("|") || "-",
    order.lane,
    order.priority,
    order.exceptions.join("|") || "-",
    order.warehouse,
    order.shippingLine,
  ]);
  return [headers, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function processOrders(rawOrders) {
  const processed = rawOrders.map((order, index) => classifyOrder(order, index));
  const addressGroups = new Map();

  for (const order of processed) {
    const duplicateKey = [
      order.normalized.phoneDigits,
      order.normalized.address.replace(/\s/g, ""),
      order.product.replace(/\s/g, ""),
    ].join("|");

    if (order.normalized.phoneDigits.length >= 10 && order.normalized.address) {
      addressGroups.set(duplicateKey, [...(addressGroups.get(duplicateKey) || []), order.id]);
    }
  }

  return processed.map((order) => {
    const duplicateKey = [
      order.normalized.phoneDigits,
      order.normalized.address.replace(/\s/g, ""),
      order.product.replace(/\s/g, ""),
    ].join("|");
    const duplicateIds = addressGroups.get(duplicateKey) || [];
    const exceptions = [...order.exceptions];

    if (duplicateIds.length > 1 && !exceptions.includes("중복의심")) {
      exceptions.push("중복의심");
    }

    return withReviewState({ ...order, exceptions });
  });
}

export function summarize(processedOrders) {
  const total = processedOrders.length;
  const exceptionCount = processedOrders.filter((order) => order.exceptions.length > 0).length;
  const normalizedCount = processedOrders.filter((order) => order.state !== "blocked").length;
  const classifiedCount = processedOrders.filter((order) => order.lane !== "주소확인").length;
  const buckets = Object.keys(laneMeta).map((lane) => {
    const count = processedOrders.filter((order) => order.lane === lane).length;
    return {
      lane,
      count,
      ratio: total ? Math.round((count / total) * 1000) / 10 : 0,
      ...laneMeta[lane],
    };
  });

  return {
    total,
    normalizedCount,
    classifiedCount,
    exceptionCount,
    autoRate: total ? Math.round((classifiedCount / total) * 1000) / 10 : 0,
    exceptionRate: total ? Math.round((exceptionCount / total) * 1000) / 10 : 0,
    buckets,
  };
}

export function loadMessyCsv() {
  return [
    "주문번호,주문일시,고객명,연락처,주소,상품,수량,요청사항",
    "YJ250602-9001,2025-06-02 15:10,  남 * 우  ,010 7777 1000,서울 강서구 공항대로 247,샐러드 세트,2,오늘 배송",
    "YJ250602-9002,2025-06-02 15:03,권 * 라,010-7777-2000,경기 고양시 일산동구 중앙로 1275,유리 화병,1,파손 주의",
    "YJ250602-9003,2025-06-02 14:58,백 * 호,010-ABCD-3000,,모니터 32,1,주소 없음",
    "YJ250602-9004,2025-06-02 14:41,송 * 은,010-7777-4000,전남 여수시 시청로 1,김치 5kg,3,냉장",
  ].join("\n");
}

function classifyOrder(order, index) {
  const normalized = normalizeOrder(order);
  const tags = detectTags(order.product, order.memo, normalized.qty);
  const exceptions = detectExceptions(order, normalized);
  const lane = pickLane(normalized, tags, exceptions, order.memo);
  const meta = laneMeta[lane] || laneMeta["일반택배"];
  const priority = pickPriority(lane, tags, exceptions, order.memo);
  const rationale = buildRationale(normalized, tags, lane, exceptions, order.memo);

  return withReviewState({
    id: `${order.orderId || "ORDER"}-${index}`,
    ...order,
    normalized,
    tags,
    lane,
    priority,
    exceptions,
    rationale,
    warehouse: meta.warehouse,
    shippingLine: meta.line,
    laneColor: meta.color,
  });
}

function normalizeOrder(order) {
  const phoneDigits = onlyDigits(order.phone);
  const customerName = normalizeName(order.customerName);
  const address = normalizeAddress(order.address);
  const region = detectRegion(address);
  const qty = Number.parseInt(String(order.qty || "1").replace(/[^\d]/g, ""), 10) || 0;

  return {
    customerName,
    phoneDigits,
    maskedPhone: maskPhone(phoneDigits),
    address,
    region,
    qty,
  };
}

function normalizeName(name) {
  return String(name || "")
    .replace(/\s+/g, "")
    .replace(/\*/g, "*")
    .trim() || "이름확인";
}

function normalizeAddress(address) {
  return String(address || "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^서울시\b/, "서울")
    .replace(/^서울특별시\b/, "서울")
    .replace(/^경기도\b/, "경기")
    .replace(/^인천광역시\b/, "인천")
    .replace(/^부산광역시\b/, "부산")
    .replace(/^대전광역시\b/, "대전")
    .replace(/^대구광역시\b/, "대구")
    .replace(/^제주특별자치도\b/, "제주")
    .trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function maskPhone(digits) {
  if (digits.length === 11) return `${digits.slice(0, 3)}-****-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-***-${digits.slice(6)}`;
  return digits ? "연락처확인" : "연락처없음";
}

function detectRegion(address) {
  const regions = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "충북", "충남", "전북", "전남", "경북", "경남", "강원", "제주"];
  return regions.find((region) => address.startsWith(region)) || "지역확인";
}

function detectTags(product, memo, qty) {
  const text = `${product || ""} ${memo || ""}`.toLowerCase();
  const tags = [];

  if (/연어|딸기|반찬|소고기|아이스크림|김치|샐러드|냉장|냉동/.test(text)) tags.push("냉장");
  if (/와인|유리|화장품|노트북|커피머신|파손|깨지/.test(text)) tags.push("파손주의");
  if (/tv|티비|책상|모니터|생수|대형|가구/.test(text) || qty >= 8) tags.push("대형화물");

  return tags;
}

function detectExceptions(order, normalized) {
  const exceptions = [];
  const memo = String(order.memo || "");

  if (!normalized.address || normalized.address.length < 8 || /확인 필요|주소 없음|주소 누락|동 호수/.test(memo)) {
    exceptions.push("주소확인");
  }
  if (normalized.phoneDigits.length < 10 || normalized.phoneDigits.length > 11) {
    exceptions.push("연락처확인");
  }
  if (!normalized.qty || normalized.qty < 1) {
    exceptions.push("수량확인");
  }

  return exceptions;
}

function pickLane(normalized, tags, exceptions, memo) {
  if (exceptions.includes("주소확인")) return "주소확인";
  if (tags.includes("대형화물")) return "대형화물";
  if (isMetro(normalized.region) && /오늘|당일|빠른|급/.test(String(memo || ""))) return "수도권 당일";
  if (tags.includes("냉장")) return isMetro(normalized.region) ? "수도권 당일" : "냉장";
  if (tags.includes("파손주의")) return isMetro(normalized.region) ? "수도권 당일" : "파손주의";
  if (isMetro(normalized.region)) return "수도권 당일";
  return "일반택배";
}

function pickPriority(lane, tags, exceptions, memo) {
  if (exceptions.includes("주소확인") || exceptions.includes("연락처확인")) return "검수";
  if (lane === "수도권 당일" || tags.includes("냉장") || /오늘|당일|빠른|급/.test(String(memo || ""))) return "높음";
  if (lane === "대형화물" || tags.includes("파손주의")) return "보통";
  return "낮음";
}

function buildRationale(normalized, tags, lane, exceptions, memo) {
  const rationale = [];
  if (tags.length > 0) rationale.push(`상품/요청 키워드 -> ${tags.join(", ")}`);
  if (isMetro(normalized.region)) rationale.push(`배송지 '${normalized.region}' -> 수도권 처리 가능`);
  if (/오늘|당일|빠른|급/.test(String(memo || ""))) rationale.push("요청사항 -> 긴급 출고");
  if (exceptions.length > 0) rationale.push(`예외 -> ${exceptions.join(", ")}`);
  rationale.push(`최종 물류 분류 -> ${lane}`);
  return rationale;
}

function isMetro(region) {
  return ["서울", "경기", "인천"].includes(region);
}

function withReviewState(order) {
  if (order.exceptions.some((item) => ["주소확인", "연락처확인", "수량확인"].includes(item))) {
    return { ...order, state: "blocked" };
  }
  if (order.exceptions.length > 0) return { ...order, state: "needs_review" };
  return { ...order, state: "ready" };
}

function escapeCsvCell(value) {
  const stringValue = String(value ?? "");
  if (/[",\n\r]/.test(stringValue)) return `"${stringValue.replace(/"/g, '""')}"`;
  return stringValue;
}
