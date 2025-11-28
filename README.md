# Minio Simple Bucket Management

แอปนี้เป็นหน้า Dashboard สำหรับบริหารจัดการ MinIO object storage โดยเขียนด้วย Nuxt 4 + Nuxt UI  
**อัปเดต:** ตอนนี้มีระบบ Authentication และ Role-based Access Control แล้ว!

## ✨ ฟีเจอร์หลัก

### 🔐 Authentication & Authorization
- **ระบบ Login/Register** - ยืนยันตัวตนด้วย JWT และ bcrypt
- **Role-based Access Control** - แบ่งสิทธิ์ Admin และ User
  - **Admin**: เข้าถึงทุก bucket (public + private), สร้าง/ลบ bucket, แก้ไข policy
  - **User**: เข้าถึงเฉพาะ bucket ที่เป็น public, ไม่สามารถสร้าง/ลบ bucket

### 🪣 Bucket Management
- รายการบักเก็ตทั้งหมด (เรียก `GET /api/storage/buckets`)
- สร้างบักเก็ตใหม่ (`POST /api/storage/bucket.create`) - Admin เท่านั้น
- ลบบักเก็ต (`POST /api/storage/bucket.delete`) - Admin เท่านั้น
- ตั้งค่า Bucket Policy (Private/Public Read/Authenticated Read) - Admin เท่านั้น

### 📁 Object Management
- รายการโฟลเดอร์/ไฟล์ในแต่ละบักเก็ต (`GET /api/storage/folders`, `GET /api/storage/objects`)
- **อัปโหลดผ่าน Presigned URL** - อัปโหลดไฟล์โดยตรงไปยัง MinIO (`POST /api/storage/presigned-upload`)
- ดาวน์โหลดไฟล์ (`GET /api/storage/download`)
- ลบโฟลเดอร์หรือไฟล์ (`POST /api/storage/delete`)
- ดูรายละเอียดไฟล์ (เมตาดาตา / ขนาด) (`GET /api/storage/object.info`)
- แชร์ลิงก์ด้วย Presigned URL (`GET /api/storage/share`)

### 🔍 File Search (NEW!)
- **Full-text Search** - ค้นหาไฟล์ด้วยชื่อหรือเนื้อหาภายในไฟล์
- **Elasticsearch Integration** - ระบบจัดทำดัชนีไฟล์อัตโนมัติผ่าน webhook
- **Content Extraction** - แยกข้อความจาก PDF, DOCX, XLSX, และไฟล์อื่นๆ
- **Google-like Interface** - หน้าค้นหาที่ใช้งานง่าย พร้อม highlight ผลลัพธ์
- **Smart Indexing** - ไฟล์เล็ก (<10MB) จะถูกแยกเนื้อหาเต็มรูปแบบ, ไฟล์ใหญ่จะเก็บเฉพาะ metadata


## 🔑 บัญชีผู้ใช้เริ่มต้น

### Admin
- **Username:** `admin`
- **Password:** `admin123`
- **สิทธิ์:** เข้าถึงและจัดการทุกอย่าง

### User  
- **Username:** `user`
- **Password:** `user123`
- **สิทธิ์:** เข้าถึงเฉพาะ bucket ที่เป็น public

## 📦 การติดตั้ง

1. **เริ่มต้น Docker services (MinIO, Elasticsearch, Kibana):**
   ```bash
   docker compose up -d
   ```
   
   รอประมาณ 30 วินาทีให้ services พร้อมใช้งาน

2. **ติดตั้ง dependencies:**
   ```bash
   pnpm install
   ```

3. **สร้าง RSA key pair สำหรับ JWT:**
   ```bash
   mkdir -p keys
   ssh-keygen -t rsa -b 4096 -m PEM -f keys/jwt.key -N ""
   openssl rsa -in keys/jwt.key -pubout -outform PEM -out keys/jwt.key.pub
   ```
   
   ระบบจะสร้าง:
   - `keys/jwt.key` - Private key (ใช้สำหรับ sign token)
   - `keys/jwt.key.pub` - Public key (ใช้สำหรับ verify token)

4. **ตั้งค่า environment variables:**
   
   สร้างไฟล์ `.env` และเพิ่ม:
   ```bash
   # MinIO Configuration
   MINIO_ENDPOINT=127.0.0.1
   MINIO_PORT=9005
   MINIO_ACCESS_KEY=b
   MINIO_SECRET_KEY=bbb
   MINIO_PREVIEW_BASE=http://127.0.0.1:9005
   
   # Elasticsearch Configuration
   ELASTICSEARCH_URL=http://localhost:9200
   
   # Database Configuration
   DATABASE_URL="file:./dev.db"
   ```

5. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

6. **Seed database with default users:**
   ```bash
   pnpm db:seed
   ```

7. **ตั้งค่า MinIO Webhook (สำหรับ file indexing):**
   ```bash
   ./scripts/setup-webhook.sh
   ```
   
   ดูรายละเอียดเพิ่มเติมใน [Setup Guide](./scripts/setup-webhook.sh)


## 🚀 การรัน Dev Server

```bash
pnpm dev
# เปิดที่ http://localhost:3000
```

เมื่อเปิดแอป คุณจะถูก redirect ไปที่หน้า login  
ใช้บัญชี admin หรือ user ตามที่ระบุด้านบนเพื่อเข้าสู่ระบบ

## การ build / preview production

```bash
pnpm build
pnpm preview
```

## 📂 โครงสร้างโปรเจค

### Frontend (app/)
- `layouts/dashboard.vue` - Sidebar + Header (Earth tone theme) พร้อมแสดงข้อมูลผู้ใช้
- `pages/login.vue` - หน้า Login
- `pages/register.vue` - หน้า Register
- `pages/storage/[bucket]/index.vue` - Object Browser (list, breadcrumb, upload, download)
- `composables/useAuth.ts` - การจัดการ Authentication state
- `composables/useStorage.ts` - การจัดการ Storage operations
- `middleware/auth.global.ts` - Global authentication middleware

### Backend (server/)
- `api/auth/*` - Authentication endpoints (login, register, me)
- `api/storage/*` - Storage API endpoints (bucket & object management)
- `lib/auth.ts` - Authentication utilities (JWT, bcrypt)
- `lib/prisma.ts` - Prisma client instance
- `lib/bucket-access.ts` - Bucket access control logic
- `lib/minio.ts` - MinIO client configuration

### Database (prisma/)
- `schema.prisma` - Database schema (User model)
- `seed.ts` - Database seeder (default users)
- `dev.db` - SQLite database file

## 🛠️ Tech Stack

- **Frontend:** Nuxt 4, Vue 3, Tailwind CSS, Nuxt UI
- **Backend:** Nuxt Server API, MinIO SDK
- **Database:** Prisma 5 + SQLite
- **Authentication:** JWT + bcrypt
- **Storage:** MinIO Object Storage
- **Search:** Elasticsearch 8 + Attachment Processor
- **Monitoring:** Kibana (http://localhost:5601)

## 📂 โครงสร้างโปรเจค (อัปเดต)

### Frontend (app/)
- `pages/search.vue` - **NEW!** หน้าค้นหาไฟล์แบบ Google
- `layouts/dashboard.vue` - Sidebar + Header พร้อมเมนู Search Files
- `pages/login.vue` - หน้า Login
- `pages/register.vue` - หน้า Register
- `pages/storage/[bucket]/index.vue` - Object Browser
- `composables/useAuth.ts` - การจัดการ Authentication state
- `composables/useStorage.ts` - การจัดการ Storage operations
- `composables/useUpload.ts` - **อัปเดต!** ใช้ Presigned URL แทน direct upload

### Backend (server/)
- `api/search/*` - **NEW!** Search API endpoints
- `api/webhook/*` - **NEW!** MinIO webhook receiver
- `api/storage/presigned-upload.post.ts` - **NEW!** Presigned URL generation
- `api/auth/*` - Authentication endpoints
- `api/storage/*` - Storage API endpoints
- `lib/elasticsearch.ts` - **NEW!** Elasticsearch client
- `lib/file-indexer.ts` - **NEW!** File indexing service
- `lib/auth.ts` - Authentication utilities
- `lib/prisma.ts` - Prisma client
- `lib/bucket-access.ts` - Bucket access control
- `lib/minio.ts` - MinIO client
- `plugins/elasticsearch.ts` - **NEW!** Elasticsearch initialization


## 📚 เอกสารเพิ่มเติม

- [AUTH_SETUP.md](./AUTH_SETUP.md) - คู่มือการตั้งค่าระบบ Authentication
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - สรุปการทำงานของระบบ

## 🔒 การรักษาความปลอดภัย

⚠️ **สำคัญสำหรับ Production:**
1. **เก็บ Private Key ให้ปลอดภัย** - ไฟล์ `keys/jwt.key` ต้องไม่ถูก commit ลง git และต้องเก็บเป็นความลับ
2. **สร้าง Key Pair ใหม่** - ใช้ key pair ใหม่สำหรับแต่ละ environment (dev, staging, production)
3. ใช้ **HTTPS** สำหรับการ deploy
4. อัปเดต **dependencies** เป็นประจำ
5. เพิ่ม **rate limiting** สำหรับ API
6. เพิ่มการตรวจสอบ**ความแข็งแรงของรหัสผ่าน**

### JWT Security
ระบบใช้ **RSA-256 (RS256)** สำหรับการเข้ารหัส JWT:
- ✅ มีความปลอดภัยสูงกว่า HS256 (HMAC with secret)
- ✅ Private key ใช้สำหรับ sign token (เก็บใน server)
- ✅ Public key ใช้สำหรับ verify token (สามารถแจกจ่ายได้)
- ✅ เหมาะสำหรับ microservices architecture

## 🎯 การทดสอบ

### ทดสอบ Admin Access
1. Login ด้วยบัญชี admin
2. ควรเห็น bucket ทั้งหมด (public และ private)
3. สามารถสร้าง/ลบ bucket ได้
4. สามารถแก้ไข bucket policy ได้

### ทดสอบ User Access
1. Login ด้วยบัญชี user
2. ควรเห็นแค่ bucket ที่เป็น public
3. ไม่เห็นปุ่ม "Create Bucket"
4. สามารถอัปโหลด/ดาวน์โหลดได้เฉพาะ public bucket

## 📝 หมายเหตุ

- ระบบใช้ SQLite เป็น database (ไฟล์ `prisma/dev.db`)
- Token หมดอายุใน 7 วัน
- User ใหม่ที่สมัครผ่าน /register จะได้ role เป็น USER
- ต้องเข้าไปแก้ไขใน database เพื่อเปลี่ยน role เป็น ADMIN
