# vBooking API Documentation

> **Version**: 1.0  
> **Base URL**: `https://your-domain.com/api/vbooking`  
> **Prefix**: `/api/vbooking/`

ระบบ API สำหรับให้ Partner / ระบบภายนอก ค้นหาช่าง จองบริการ และติดตามสถานะงาน

---

## 🔐 Authentication

ทุก Request ไปยัง `/api/vbooking/*` ต้องใส่ **API Key** ใน HTTP Header:

```
X-API-Key: vbk_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **หมายเหตุ**: รับ API Key ได้จาก Admin ผ่าน `POST /api/vbooking/admin/clients`

### Error Responses

| Code | Status | Meaning |
|------|--------|---------|
| `401` | `MISSING_API_KEY` | ไม่ได้ใส่ Header |
| `401` | `INVALID_API_KEY` | API Key ผิด/ถูกระงับ |
| `429` | `RATE_LIMIT_EXCEEDED` | ยิงเกิน N req/min |

---

## 📋 Service Catalog

### `GET /api/vbooking/service-catalog`

ดึงรายการหมวดหมู่บริการทั้งหมดที่รองรับ (ไม่ต้องการ API Key)

**Query Parameters**:
| Param | Required | Example | Description |
|-------|----------|---------|-------------|
| `category` | No | `ELEC_INSTALL` | กรองเฉพาะหมวดหมู่ที่ต้องการ |

**Response**:
```json
{
  "status": "success",
  "catalog": [
    {
      "code": "ELEC_INSTALL",
      "name": "ติดตั้งเครื่องใช้ไฟฟ้า",
      "name_en": "Electrical Appliance Installation",
      "icon": "zap",
      "sub_categories": [
        {
          "code": "AC_INSTALL_12000BTU",
          "name": "ติดตั้งแอร์ 12,000 BTU",
          "required_skill_level": 2,
          "est_duration_hours": 3,
          "required_team_size": 1,
          "price_standard": 1200,
          "price_premium": 1800
        }
      ]
    },
    {
      "code": "CONSTRUCTION",
      "name": "งานก่อสร้างและตกแต่ง",
      "sub_categories": [...]
    },
    {
      "code": "CLEANING",
      "name": "ทำความสะอาด",
      "sub_categories": [...]
    }
  ]
}
```

**Service Codes Reference**:

| Category Code | ชื่อหมวดหมู่ |
|---|---|
| `ELEC_INSTALL` | ติดตั้งเครื่องใช้ไฟฟ้า |
| `CONSTRUCTION` | งานก่อสร้างและตกแต่ง |
| `CLEANING` | ทำความสะอาด |
| `FURNITURE` | งานเฟอร์นิเจอร์ |

| Sub-Category Code | ชื่อบริการ | ช่วงเวลา (ชม.) | Skill Level |
|---|---|---|---|
| `AC_INSTALL_9000BTU` | ติดตั้งแอร์ 9,000 BTU | 2.5 | 2 |
| `AC_INSTALL_12000BTU` | ติดตั้งแอร์ 12,000 BTU | 3 | 2 |
| `AC_INSTALL_18000BTU` | ติดตั้งแอร์ 18,000 BTU | 4 | 2 |
| `AC_INSTALL_24000BTU` | ติดตั้งแอร์ 24,000 BTU | 5 | 3 |
| `AC_CLEAN` | ล้างแอร์ | 1.5 | 1 |
| `CEMENT_POUR` | เทปูนทั่วไป | 6 | 2 |
| `TILE_INSTALL_FLOOR` | ปูกระเบื้องพื้น | 8 | 2 |
| `DEEP_CLEAN_CONDO` | ทำความสะอาดคอนโดล้างลึก | 4 | 1 |
| `POST_CONSTRUCTION_CLEAN` | เก็บกวาดหลังก่อสร้าง | 8 | 1 |
| `WARDROBE_INSTALL` | ติดตั้งตู้เสื้อผ้าบิ้วอิน | 6 | 2 |

---

## 🔍 Technician Search

### `GET /api/vbooking/technicians/search`

ค้นหาช่างที่ตรงกับงาน วัน เวลา และพื้นที่ที่ระบุ

**Headers**:
```
X-API-Key: vbk_xxxxxxxx_...
```

**Query Parameters**:
| Param | Required | Example | Description |
|-------|----------|---------|-------------|
| `booking_date` | ✅ Yes | `2026-08-10` | วันที่ต้องการจอง (YYYY-MM-DD) |
| `service_category` | ✅* | `ELEC_INSTALL` | หมวดหมู่หลัก (*ระบุอย่างน้อย 1 อย่างจาก service_category หรือ service_sub_category) |
| `service_sub_category` | ✅* | `AC_INSTALL_12000BTU` | หมวดหมู่ย่อย (แนะนำ — แม่นยำกว่า) |
| `postal_code` | No | `10110` | รหัสไปรษณีย์ (ใช้ match Zone) |
| `lat` | No | `13.756` | Latitude ของสถานที่ |
| `lng` | No | `100.501` | Longitude ของสถานที่ |
| `preferred_time_window` | No | `09:00-12:00` | ช่วงเวลาที่ต้องการ |
| `max_results` | No | `5` | จำนวนช่างสูงสุดที่ต้องการ (default: 5) |
| `sort_by` | No | `match_score` | เรียงตาม: `match_score` / `rating` / `proximity` / `price` |
| `preferred_tech_id` | No | `TECH-102` | ขอช่างรายนี้เป็นพิเศษ (Loyalty Feature) |

**Response**:
```json
{
  "status": "success",
  "search_params": {
    "service_category": "ELEC_INSTALL",
    "service_sub_category": "AC_INSTALL_12000BTU",
    "booking_date": "2026-08-10",
    "postal_code": "10110"
  },
  "service_info": {
    "code": "AC_INSTALL_12000BTU",
    "name": "ติดตั้งแอร์ 12,000 BTU",
    "est_duration_hours": 3,
    "required_skill_level": 2,
    "price_standard": 1200,
    "price_premium": 1800,
    "category_code": "ELEC_INSTALL",
    "category_name": "ติดตั้งเครื่องใช้ไฟฟ้า"
  },
  "estimated_job_duration_hours": 3,
  "result_count": 3,
  "results": [
    {
      "tech_id": "TECH-102",
      "name": "ทีมช่างสมชายการช่าง",
      "match_score": 98.5,
      "skill_level": "Level 2",
      "tier": "Gold",
      "rating": 4.9,
      "completed_jobs": 142,
      "primary_zone": "Zone 1: สุขุมวิท-บางนา",
      "proximity_km": 3.2,
      "available_slots": ["08:00-12:00", "13:00-17:00"],
      "starting_price": 1200
    }
  ]
}
```

---

## 👤 Technician Profile

### `GET /api/vbooking/technicians/{tech_id}`

ดูโปรไฟล์ช่างละเอียด

**Response**:
```json
{
  "status": "success",
  "technician": {
    "id": "TECH-102",
    "code": "T-102",
    "name": "ทีมช่างสมชายการช่าง",
    "phone": "0898887777",
    "tier": "Gold",
    "rating": 4.9,
    "status": "Available",
    "primary_zone": "Zone 1: สุขุมวิท-บางนา",
    "secondary_zones": ["Zone 2: นนทบุรี"],
    "skills": [
      { "category": "ELEC_INSTALL", "level": 3, "isCertified": true }
    ],
    "completed_jobs": 142,
    "penalty_points": 0,
    "work_days": ["จ.", "อ.", "พ.", "พฤ.", "ศ."],
    "job_types": ["ติดตั้ง", "service MTN"]
  }
}
```

---

## 📅 Available Slots

### `GET /api/vbooking/technicians/{tech_id}/slots`

ดูสล็อตเวลาว่างของช่างในช่วงวันที่กำหนด

**Query Parameters**:
| Param | Required | Example |
|-------|----------|---------|
| `date_from` | No | `2026-08-10` |
| `date_to` | No | `2026-08-17` |
| `service_sub_category` | No | `AC_INSTALL_12000BTU` |

**Response**:
```json
{
  "status": "success",
  "tech_id": "TECH-102",
  "tech_name": "ทีมช่างสมชายการช่าง",
  "estimated_job_duration_hours": 3,
  "availability": [
    {
      "date": "2026-08-10",
      "day_of_week": "จ",
      "is_available": true,
      "slots": ["08:00-12:00", "13:00-17:00"]
    },
    {
      "date": "2026-08-11",
      "day_of_week": "อ",
      "is_available": true,
      "slots": ["08:00-12:00"]
    },
    {
      "date": "2026-08-16",
      "day_of_week": "ส",
      "is_available": false,
      "slots": []
    }
  ]
}
```

---

## 📌 Booking Flow (2 Steps)

> **สำคัญ**: ระบบใช้ 2-Step Booking เพื่อป้องกัน Race Condition (ช่างคนเดียวถูกจองพร้อมกัน 2 ระบบ)

```
[Step 1] POST /bookings/hold  →  รับ hold_token (มีอายุ 15 นาที)
         ↓
    [ฝั่ง Partner]  ดำเนินการ Checkout / รับชำระเงิน
         ↓
[Step 2] POST /bookings/confirm  →  รับ booking_ref (ยืนยันจองสำเร็จ)
```

---

### Step 1: `POST /api/vbooking/bookings/hold`

ล็อคสล็อตช่างชั่วคราว 15 นาที

**Request Body**:
```json
{
  "tech_id": "TECH-102",
  "service_category": "ELEC_INSTALL",
  "service_sub_category": "AC_INSTALL_12000BTU",
  "booking_date": "2026-08-10",
  "time_slot": "09:00-12:00",
  "client_ref_id": "PARTNER-ORDER-99881",
  "location": {
    "postal_code": "10110",
    "lat": 13.756,
    "lng": 100.501,
    "address_detail": "อาคาร A ชั้น 5 ซอยสีลม 7"
  }
}
```

**Response (201)**:
```json
{
  "status": "success",
  "message": "ล็อคสล็อตช่างสำเร็จ กรุณา Confirm ภายใน 15 นาที",
  "hold_token": "HOLD_A8F9C12B3E450F1D",
  "tech_id": "TECH-102",
  "tech_name": "ทีมช่างสมชายการช่าง",
  "booking_date": "2026-08-10",
  "time_slot": "09:00-12:00",
  "service_sub_category": "AC_INSTALL_12000BTU",
  "expires_at": "2026-08-04T10:23:00Z",
  "ttl_seconds": 900
}
```

**Error Responses**:
| Code | Error Code | Description |
|------|-----------|-------------|
| `400` | `MISSING_PARAMS` | ขาด field ที่จำเป็น |
| `404` | `NOT_FOUND` | ไม่พบช่างนี้ |
| `409` | `TECH_UNAVAILABLE` | ช่างไม่พร้อมรับงาน |
| `409` | `SLOT_TAKEN` | สล็อตนี้ถูกล็อคโดย Request อื่นแล้ว |

---

### Step 2: `POST /api/vbooking/bookings/confirm`

ยืนยันการจองด้วย `hold_token` + ข้อมูลลูกค้า + ผลชำระเงิน

**Request Body**:
```json
{
  "hold_token": "HOLD_A8F9C12B3E450F1D",
  "customer_info": {
    "name": "คุณสมศักดิ์ รักดี",
    "phone": "0812345678",
    "email": "somsak@example.com"
  },
  "payment_info": {
    "payment_status": "PAID",
    "transaction_ref": "TXN-88273"
  },
  "notes": "โปรดนำบันไดมาด้วย แอร์ชั้น 3"
}
```

**Response (201)**:
```json
{
  "status": "success",
  "message": "ยืนยันการจองบริการสำเร็จ",
  "booking_id": "bk_1722741234_abc123",
  "booking_ref": "BK-2026-741234",
  "status": "CONFIRMED",
  "assigned_technician": {
    "tech_id": "TECH-102",
    "name": "ทีมช่างสมชายการช่าง",
    "phone": "0898887777"
  },
  "booking_date": "2026-08-10",
  "time_slot": "09:00-12:00",
  "service_sub_category": "AC_INSTALL_12000BTU",
  "estimated_duration_hours": 3,
  "customer": {
    "name": "คุณสมศักดิ์ รักดี",
    "phone": "0812345678"
  },
  "created_at": "2026-08-04T10:08:00Z"
}
```

**Error Responses**:
| Code | Error Code | Description |
|------|-----------|-------------|
| `400` | `MISSING_PARAMS` | ขาด hold_token หรือ customer_info |
| `403` | `FORBIDDEN` | Hold นี้เป็นของ Client อื่น |
| `404` | `HOLD_NOT_FOUND` | ไม่พบ Hold Token นี้ |
| `409` | `ALREADY_CONFIRMED` | Confirm ไปแล้ว |
| `410` | `HOLD_EXPIRED` | Hold Token หมดอายุ (เกิน 15 นาที) |

---

## 📊 Booking Status & Cancel

### `GET /api/vbooking/bookings/{booking_id}`

ดูสถานะการจอง

**Response**:
```json
{
  "status": "success",
  "booking": {
    "id": "bk_1722741234_abc123",
    "booking_ref": "BK-2026-741234",
    "tech_id": "TECH-102",
    "tech_name": "ทีมช่างสมชายการช่าง",
    "service_sub_category": "AC_INSTALL_12000BTU",
    "booking_date": "2026-08-10",
    "time_slot": "09:00-12:00",
    "status": "CONFIRMED",
    "customer_name": "คุณสมศักดิ์ รักดี",
    "customer_phone": "0812345678",
    "payment_status": "PAID",
    "created_at": "2026-08-04T10:08:00Z"
  }
}
```

**Booking Status Values**:
| Status | ความหมาย |
|--------|----------|
| `CONFIRMED` | จองสำเร็จ รอช่างเข้างาน |
| `IN_PROGRESS` | ช่างกำลังทำงาน |
| `COMPLETED` | งานเสร็จสมบูรณ์ |
| `CANCELLED` | ยกเลิกแล้ว |

---

### `POST /api/vbooking/bookings/{booking_id}/cancel`

ยกเลิกการจองและคืนสล็อตช่าง

**Request Body**:
```json
{
  "reason": "ลูกค้าเลื่อนนัด"
}
```

**Response**:
```json
{
  "status": "success",
  "message": "ยกเลิกการจอง BK-2026-741234 สำเร็จ",
  "booking_ref": "BK-2026-741234",
  "cancelled_at": "2026-08-04T11:00:00Z",
  "reason": "ลูกค้าเลื่อนนัด"
}
```

---

## 🛡️ Admin API

> Admin Endpoints ต้องใส่ `X-Admin-Key: vbk_admin_2026` (หรือตามที่ตั้งใน ENV `VBOOKING_ADMIN_KEY`)

### `POST /api/vbooking/admin/clients`

สร้าง API Client ใหม่สำหรับ Partner

**Request Body**:
```json
{
  "name": "LINE OA Chatbot",
  "rate_limit_per_min": 60,
  "daily_quota": 10000
}
```

**Response (201)**:
```json
{
  "status": "success",
  "message": "สร้าง API Client สำเร็จ — บันทึก API Key นี้ไว้ (แสดงเพียงครั้งเดียว)",
  "client": {
    "id": "CLIENT_LINE_OA_CHATBOT_A1B2C3",
    "name": "LINE OA Chatbot",
    "api_key": "vbk_T_A1B2C3_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "rate_limit_per_min": 60,
    "daily_quota": 10000,
    "status": "ACTIVE",
    "created_at": "2026-08-04T10:00:00Z"
  }
}
```

---

### `GET /api/vbooking/admin/clients`

รายการ API Clients ทั้งหมด

### `GET /api/vbooking/admin/monitoring/metrics`

ข้อมูล Dashboard Metrics

**Response** (ตัวอย่าง):
```json
{
  "status": "success",
  "metrics": {
    "total_requests_today": 1247,
    "total_requests_week": 8934,
    "success_rate": 97.2,
    "error_rate": 2.8,
    "avg_latency_ms": 87,
    "p95_latency_ms": 234,
    "rpm_current": 12,
    "rpm_peak": 45,
    "rate_limit_hits": 3,
    "top_endpoints": [
      { "endpoint": "/api/vbooking/technicians/search", "count": 456 }
    ],
    "top_clients": [
      { "client_id": "CLIENT_LINE_OA_A1B2C3", "client_name": "LINE OA Chatbot", "count": 789 }
    ],
    "status_distribution": [
      { "status": "2xx", "count": 1211, "pct": 97.1 },
      { "status": "4xx", "count": 33, "pct": 2.6 },
      { "status": "5xx", "count": 3, "pct": 0.3 }
    ],
    "hourly_trend": [
      { "hour": "08", "requests": 45, "errors": 2 },
      { "hour": "09", "requests": 123, "errors": 1 }
    ]
  }
}
```

### `GET /api/vbooking/admin/monitoring/logs`

Request Logs แบบ Paginated

**Query Parameters**: `page`, `limit`, `status_code`, `client_id`, `endpoint`

---

## 💻 Quick Start Examples

### cURL: ค้นหาช่าง

```bash
curl -X GET \
  "https://your-domain.com/api/vbooking/technicians/search?\
service_sub_category=AC_INSTALL_12000BTU\
&booking_date=2026-08-10\
&postal_code=10110\
&max_results=3" \
  -H "X-API-Key: vbk_xxxxxxxx_xxxxxxxxxx"
```

### cURL: 2-Step Booking

```bash
# Step 1: Hold
HOLD=$(curl -s -X POST \
  "https://your-domain.com/api/vbooking/bookings/hold" \
  -H "X-API-Key: vbk_xxxxxxxx_xxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "tech_id": "TECH-102",
    "service_sub_category": "AC_INSTALL_12000BTU",
    "booking_date": "2026-08-10",
    "time_slot": "09:00-12:00",
    "location": { "postal_code": "10110" }
  }')
HOLD_TOKEN=$(echo $HOLD | jq -r '.hold_token')

# Step 2: Confirm
curl -X POST \
  "https://your-domain.com/api/vbooking/bookings/confirm" \
  -H "X-API-Key: vbk_xxxxxxxx_xxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d "{
    \"hold_token\": \"$HOLD_TOKEN\",
    \"customer_info\": {
      \"name\": \"คุณสมศักดิ์\",
      \"phone\": \"0812345678\"
    },
    \"payment_info\": { \"payment_status\": \"PAID\", \"transaction_ref\": \"TXN-001\" }
  }"
```

### JavaScript / Node.js

```javascript
const API_KEY = 'vbk_xxxxxxxx_xxxxxxxxxx';
const BASE_URL = 'https://your-domain.com/api/vbooking';

async function searchTechnicians({ serviceSubCategory, bookingDate, postalCode, lat, lng }) {
  const params = new URLSearchParams({
    service_sub_category: serviceSubCategory,
    booking_date: bookingDate,
    postal_code: postalCode,
    lat, lng,
    sort_by: 'match_score',
    max_results: '5'
  });
  const res = await fetch(`${BASE_URL}/technicians/search?${params}`, {
    headers: { 'X-API-Key': API_KEY }
  });
  return res.json();
}

async function holdAndConfirm({ techId, serviceSubCategory, bookingDate, timeSlot, location, customer, payment }) {
  // Step 1: Hold
  const holdRes = await fetch(`${BASE_URL}/bookings/hold`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tech_id: techId, service_sub_category: serviceSubCategory, booking_date: bookingDate, time_slot: timeSlot, location })
  });
  const { hold_token } = await holdRes.json();

  // Step 2: Confirm
  const confirmRes = await fetch(`${BASE_URL}/bookings/confirm`, {
    method: 'POST',
    headers: { 'X-API-Key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ hold_token, customer_info: customer, payment_info: payment })
  });
  return confirmRes.json();
}
```

---

## 📊 Database Tables (PostgreSQL)

| Table | Description |
|-------|-------------|
| `vbooking_clients` | API Clients + API Key Hash |
| `vbooking_request_logs` | Request Logs ทุก Request |
| `vbooking_booking_holds` | Hold Token (TTL 15 นาที) |
| `vbooking_bookings` | Confirmed Booking Records |

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VBOOKING_ADMIN_KEY` | `vbk_admin_2026` | Admin Key สำหรับ `/admin/*` endpoints |
| `DATABASE_URL` | (none) | PostgreSQL Connection String |

---

*API Documentation v1.0 — vBooking Partner API by vService Team*
