/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Cloudflare R2 (S3 uyumlu) depolama istemcisi. Anahtarlar asla loglanmaz.
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

/** Test için enjekte edilebilir saklama katmanı arayüzü. */
export interface MediaStorage {
  putObject(key: string, body: Buffer, contentType: string, cacheControl: string): Promise<void>;
  deleteObject(key: string): Promise<void>;
}

export const R2_ENV_NAMES = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET', 'MEDIA_BASE_URL'] as const;

/** Eksik R2 değişkenlerinin ADLARINI döndürür (değerleri asla). */
export function missingR2Env(env: NodeJS.ProcessEnv = process.env): string[] {
  return R2_ENV_NAMES.filter((name) => !env[name]?.trim());
}

export function createR2Storage(env: NodeJS.ProcessEnv = process.env): MediaStorage {
  const missing = missingR2Env(env);
  if (missing.length) throw new Error(`Eksik R2 değişkenleri: ${missing.join(', ')}`);
  const bucket = env.R2_BUCKET!.trim();
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID!.trim()}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!.trim(), secretAccessKey: env.R2_SECRET_ACCESS_KEY!.trim() },
    // R2, SDK'nın varsayılan ek sağlama toplamı başlıklarını desteklemez.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
  return {
    async putObject(key, body, contentType, cacheControl) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }));
    },
    async deleteObject(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}
