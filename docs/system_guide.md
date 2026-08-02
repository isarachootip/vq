# คู่มือสถาปัตยกรรมระบบและการตั้งค่าฐานข้อมูล (System Guide & Database Infrastructure)

เอกสารฉบับนี้สรุปสถาปัตยกรรมระบบ การตั้งค่าฐานข้อมูลบน **Coolify** และการเชื่อมต่อบริการหลังบ้านของระบบ **vService & vFixQ Network**

---

## 🗄️ 1. ระบบฐานข้อมูลหลักบน Coolify (Primary Database)

ระบบ vService ใช้ **PostgreSQL** เป็นระบบจัดการฐานข้อมูลเชิงสัมพันธ์หลัก (Relational Database Management System - RDBMS) สำหรับจัดเก็บข้อมูลโครงสร้างทั้งหมดของระบบ

### 1.1 ข้อมูลการเชื่อมต่อ PostgreSQL (PostgreSQL Environment Variables)

| ตัวแปร Environment (Coolify) | ค่าเริ่มต้น / ตัวอย่าง | คำอธิบาย |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://postgres:postgres@<coolify-db-host>:5432/vservice_db` | Connection String หลักสำหรับเชื่อมต่อ PostgreSQL |
| `POSTGRES_HOST` | `localhost` หรือ IP ของ Container | Host/IP ของ PostgreSQL บน Coolify |
| `POSTGRES_PORT` | `5432` | พอร์ตมาตรฐานของ PostgreSQL |
| `POSTGRES_USER` | `postgres` | ผู้ใช้งานฐานข้อมูล |
| `POSTGRES_PASSWORD` | `postgres` | รหัสผ่านฐานข้อมูล |
| `POSTGRES_DB` | `vservice_db` | ชื่อฐานข้อมูลหลักของระบบ |
| `DB_SSL` | `false` | ตั้งเป็น `false` สำหรับ Internal Coolify Network |

### 1.2 โครงสร้างตารางหลักใน PostgreSQL (Database Schema)

* **ตาราง `zones`**: จัดเก็บข้อมูลโซนพื้นที่ให้บริการ รหัสโซน คำอธิบาย และรหัสไปรษณีย์ที่ครอบคลุม (`coverage_zipcodes` JSONB)
* **ตาราง `technicians`**: จัดเก็บประวัติทีมช่าง ระดับทักษะ (`skills` JSONB), โซนหลัก (`primary_zone`), โซนรอง (`secondary_zones` JSONB), อัตราเรตติ้ง, คะแนนความผิด Penalty, และข้อมูลเพิ่มเติม (`extra_data` JSONB)

### 1.3 การยิงข้อมูลตั้งต้นเข้า PostgreSQL (Database Seeding)

ระบบมีสคริปต์อัตโนมัติในการสร้างตารางและยิงข้อมูลตั้งต้น (87 โซนพื้นที่ และ 200 ทีมช่างพร้อม Skill Matrix):

```bash
# คำสั่งยิง Seed Data ขึ้น PostgreSQL
npm run db:seed
```

---

## 📦 2. ระบบจัดเก็บไฟล์ภาพและสื่อ (Object Storage on Coolify)

ระบบใช้ **MinIO Object Storage** (S3-Compatible Storage Service บน Coolify) สำหรับจัดเก็บไฟล์รูปภาพขนาดใหญ่ เช่น รูปโปรไฟล์ช่าง รูปแบนเนอร์บริการ และเอกสารแนบ

### 2.1 ข้อมูลการตั้งค่า MinIO

* **MinIO Endpoint**: URL ของ MinIO Instance บน Coolify (เช่น `https://storage.vibepjm.online`)
* **Buckets ที่ต้องสร้างใน MinIO Console**:
  1. `vservice-banners` (สำหรับรูปภาพแบนเนอร์หน้าร้าน)
  2. `vservice-services` (สำหรับรูปภาพหมวดหมู่บริการ)
  3. `vservice-avatars` (สำหรับรูปโปรไฟล์ช่างและลูกค้า)
* **Policy**: กำหนด Access Policy ของ Bucket เป็น `Public` เพื่อให้หน้าเว็บเรียกดูรูปภาพได้โดยตรง

---

## 🔄 3. กลไกสำรองข้อมูลอัตโนมัติ (Fallback & Backup Mechanism)

* **Local JSON Fallback Mode**: หากยังไม่ได้เชื่อมต่อ PostgreSQL หรืออยู่ในสภาวะ Offline ระบบ backend (`server.js`) จะสลับมาใช้การอ่าน/เขียนข้อมูลผ่านไฟล์ JSON ในโฟลเดอร์ `./data/` (`zones.json`, `technicians.json`, `line_conversations.json`) โดยอัตโนมัติ
* **Auto Sync**: ทุกครั้งที่มีการบันทึกข้อมูลผ่านหน้า UI หรือสคริปต์ `npm run db:seed` ระบบจะทำการบันทึกลง PostgreSQL พร้อมทั้งเขียนไฟล์สำรองลง `./data/` เพื่อป้องกันข้อมูลสูญหาย

---

## 🚀 4. สรุปขั้นตอนการดีพลอยบน Coolify (Deployment Quick Guide)

1. **สร้าง PostgreSQL Resource บน Coolify**:
   * ไปที่ Coolify Dashboard ➔ New Resource ➔ PostgreSQL ➔ ตั้งชื่อ DB เป็น `vservice_db`
2. **สร้าง MinIO Resource บน Coolify**:
   * New Resource ➔ MinIO Service ➔ สร้าง Buckets (`vservice-banners`, `vservice-services`, `vservice-avatars`)
3. **เชื่อมโยง Repository**:
   * New Resource ➔ Application ➔ Public/Private GitHub Repository (`https://github.com/isarachootip/vq`)
   * กำหนด Build Pack: `Dockerfile` (Port 80)
   * กำหนด Environment Variables (`DATABASE_URL`, `MINIO_ENDPOINT`, `LINE_CHANNEL_ACCESS_TOKEN` ฯลฯ)
4. **รัน Seeding Data**:
   * รันคำสั่ง `npm run db:seed` บน Server หรือ Container เพื่อนำข้อมูลขึ้น PostgreSQL
