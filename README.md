# Installer Management System (คิวช่าง · Skill · Penalty)

ระบบบริหารจัดการคิวช่าง, Skill Matrix และระบบประเมิน/ลงโทษ (Penalty & E-CN Feedback Loop) ตามสถาปัตยกรรมระบบองค์กร (E-ordering ↔ KANNA ↔ STS ↔ QC ↔ E-CN)

---

## 🚀 ฟังก์ชันการใช้งานหลักใน Prototype

1. **Dashboard & Live Queue**: หน้าจอแสดงคิวงานติดตั้งแบบเรียลไทม์ และจำลองการเชื่อมต่อเพื่อกดจ่ายงานไปยังระบบ KANNA
2. **Smart Booking Engine**: ค้นหาและแนะนำทีมช่างพร้อมคำนวณ Match Score (%) โดยอิงจากหมวดหมู่ทักษะ (Skill Matrix Level 1-3), โซนที่ให้บริการ และประวัติการติด Penalty
3. **Technician & Skill Matrix**: ระบบบริหารประวัติและระดับทักษะของช่างแต่ละทีม พร้อมทั้งประวัติคะแนน Penalty สะสม
4. **End-to-End Integration Flow Simulator**: เครื่องมือจำลองวงจรการรับส่งข้อมูลทั้งระบบ ตั้งแต่การจอง (Selling Tools) -> งานระบบติดตั้ง (KANNA & STS) -> ตรวจสอบคุณภาพ (QC) และระบบออกใบเตือนค่าปรับ (Penalty E-CN) เพื่อจำลองผลตอบกลับ (Feedback Loop) เพื่อพักงานช่าง/ปรับลดสิทธิ์ในการรับงาน
5. **Penalty & E-CN Audit Logs**: หน้าตารางแสดงรายละเอียดใบ E-CN, ค่าปรับ และผลกระทบต่อระดับคิวช่าง

---

## 🛠️ วิธีการติดตั้งและรันแบบ Local

### Prerequisites
- Node.js (v22+)
- npm (v10+)

### Setup
1. ติดตั้ง Dependencies:
   ```bash
   npm install
   ```
2. รันระบบสำหรับ Development:
   ```bash
   npm run dev
   ```
3. (Optional) ยิง Seed Data ขึ้น PostgreSQL:
   ```bash
   npm run db:seed
   # หรือกำหนด connection string:
   DATABASE_URL="postgres://postgres:postgres@localhost:5432/vservice_db" npm run db:seed
   ```
4. เข้าชมระบบผ่าน Browser: [http://localhost:5173/](http://localhost:5173/)

---

## ☁️ วิธีการดีพลอยบน Coolify (Docker Deploy)

โปรเจกต์นี้ได้รับการคอนฟิก Dockerfile และ Nginx เรียบร้อยแล้วสำหรับการนำไปรันบนระบบ Coolify:

1. **เปิดหน้าแดชบอร์ด Coolify**
2. กดสร้าง **New Resource** -> เลือก **Public/Private Repository**
3. ใส่ลิงก์ GitHub: `https://github.com/isarachootip/vq` และเลือก Branch `main`
4. ที่หน้าตั้งค่าการ Build (Build Configuration):
   - เลือก **Build Pack**: `Dockerfile`
   - กำหนด **Ports**: `80` (หรือ Coolify จะตรวจพบพอร์ต 80 อัตโนมัติจาก Dockerfile)
5. กด **Save** และกด **Deploy** 🚀
