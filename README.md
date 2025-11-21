# Minio Simple Bucket Management

แอปนี้เป็นหน้า Dashboard สำหรับบริหารจัดการ MinIO object storage โดยเขียนด้วย Nuxt 4 + Nuxt UI
ฟีเจอร์หลักที่เชื่อมต่อกับ API ฝั่งเซิร์ฟเวอร์แล้ว ได้แก่

- รายการบักเก็ตทั้งหมด (เรียก `GET /api/storage/buckets`)
- รายการโฟลเดอร์/ไฟล์ในแต่ละบักเก็ต (`GET /api/storage/folders`, `GET /api/storage/objects`)
- สร้างบักเก็ตใหม่ผ่าน prompt (`POST /api/storage/bucket.create`)
- อัปโหลดไฟล์ (`POST /api/storage/upload`)
- ลบโฟลเดอร์หรือไฟล์ (`POST /api/storage/delete`)
- ดูรายละเอียดไฟล์ (เมตาดาตา / ขนาด) (`GET /api/storage/object.info`)

## การติดตั้ง

```bash
pnpm install
```

## การรัน Dev Server

```bash
pnpm dev
# เปิดที่ http://localhost:3000
```

> อย่าลืมตั้งค่าตัวแปร MinIO ใน `.env` หรือ export ผ่าน shell เช่น

```bash
export MINIO_ENDPOINT=127.0.0.1
export MINIO_PORT=9000
export MINIO_ACCESS_KEY=minioadmin
export MINIO_SECRET_KEY=minioadmin
export MINIO_PREVIEW_BASE=http://127.0.0.1:9000
```

## การ build / preview production

```bash
pnpm build
pnpm preview
```

## โครงสร้างหน้า UI

- `app/layouts/dashboard.vue` : sidebar + header โทน Earth tone พร้อม prompt สร้าง bucket
- `app/pages/storage/[bucket]/index.vue` : Object Browser list, breadcrumb, upload, refresh
- `server/api/storage/*` : API proxy สื่อสารกับ MinIO ผ่าน SDK
