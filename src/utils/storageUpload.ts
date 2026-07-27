/**
 * storageUpload.ts
 * MinIO S3-Compatible Image Upload Utility for vService Frontend
 * ใช้ AWS SDK v3 ซึ่ง Compatible กับ MinIO 100%
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface MinIOConfig {
  endpoint: string;      // เช่น https://storage.vibepjm.online
  accessKey: string;     // เช่น vservice_api
  secretKey: string;     // เช่น VService@API2026!
  region?: string;       // ใช้ 'us-east-1' เป็น default สำหรับ MinIO
}

export type StorageBucket = 'vservice-banners' | 'vservice-services' | 'vservice-avatars';

let s3Client: S3Client | null = null;
let currentEndpoint = '';

/**
 * สร้างหรือ refresh S3 Client เมื่อ config เปลี่ยน
 */
function getS3Client(config: MinIOConfig): S3Client {
  if (!s3Client || currentEndpoint !== config.endpoint) {
    s3Client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || 'us-east-1',
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true, // จำเป็นสำหรับ MinIO
    });
    currentEndpoint = config.endpoint;
  }
  return s3Client;
}

/**
 * ลดขนาดรูปภาพผ่าน Canvas API ก่อนอัปโหลด
 */
async function compressImage(
  file: File,
  maxWidth = 1200,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas toBlob failed'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * อัปโหลดไฟล์รูปภาพไป MinIO และคืน Public URL
 */
export async function uploadImageToStorage(
  file: File,
  bucket: StorageBucket,
  config: MinIOConfig
): Promise<string> {
  if (!config.endpoint || !config.accessKey || !config.secretKey) {
    throw new Error('MinIO ยังไม่ได้ตั้งค่า กรุณาตั้งค่าในหน้า Backend Settings → MinIO Configuration');
  }

  // บีบอัดภาพก่อนอัปโหลด
  const compressed = await compressImage(file);

  // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
  const ext = 'jpg';
  const fileName = `${bucket.replace('vservice-', '')}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  // อัปโหลดผ่าน S3/MinIO API
  const client = getS3Client(config);
  const arrayBuffer = await compressed.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: uint8Array,
    ContentType: 'image/jpeg',
    ACL: 'public-read' as any,
  }));

  // สร้าง Public URL
  const publicUrl = `${config.endpoint}/${bucket}/${fileName}`;
  return publicUrl;
}

/**
 * ตรวจสอบว่า MinIO Config พร้อมใช้งานหรือยัง
 */
export function isStorageConfigured(config: Partial<MinIOConfig>): boolean {
  return !!(config.endpoint && config.accessKey && config.secretKey);
}
