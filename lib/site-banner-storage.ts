import "server-only";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  isSiteBannerKey,
  MAX_SITE_BANNER_BYTES,
  SITE_BANNER_HEIGHT,
  SITE_BANNER_WIDTH,
  siteBannerExtension,
} from "@/lib/site-banner";

/**
 * Server-only access to the private Arvan Object Storage bucket for the
 * landing banner. Unlike event photos, the uploaded bytes are written as-is:
 * re-encoding through sharp would destroy GIF animation. The row keeps only
 * the opaque key, and `app/api/site-banner/[key]` signs a read on demand.
 */

const SIGNED_URL_SECONDS = 10 * 60;

let cachedClient: S3Client | null = null;

function client(): S3Client {
  if (cachedClient) return cachedClient;

  const endpoint = process.env.ARVAN_S3_ENDPOINT;
  const region = process.env.ARVAN_S3_REGION;
  const accessKeyId = process.env.ARVAN_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.ARVAN_S3_SECRET_ACCESS_KEY;

  if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("Banner storage is not configured.");
  }

  cachedClient = new S3Client({
    endpoint,
    region,
    /* Arvan's standard S3 endpoint addresses buckets as a path segment. */
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });
  return cachedClient;
}

function bucket(): string {
  const value = process.env.ARVAN_S3_BUCKET;
  if (!value) throw new Error("Banner bucket is not configured.");
  return value;
}

/**
 * Validates the file, then stores its original bytes under a fresh key.
 * Throws a Persian, UI-ready message so the console can show it verbatim.
 */
export async function uploadSiteBanner(file: File): Promise<string> {
  const extension = siteBannerExtension(file.type);
  if (!extension) {
    throw new Error("فرمت بنر نامعتبر است؛ از PNG، JPG، WebP یا GIF استفاده کنید.");
  }
  if (file.size === 0 || file.size > MAX_SITE_BANNER_BYTES) {
    throw new Error("حجم بنر باید حداکثر ۱۰ مگابایت باشد.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  /* Metadata only — the bytes written below are the untouched originals. */
  const metadata = await sharp(bytes, { failOn: "error" }).metadata();
  if (metadata.width !== SITE_BANNER_WIDTH || metadata.height !== SITE_BANNER_HEIGHT) {
    throw new Error(
      `ابعاد بنر باید دقیقاً ${SITE_BANNER_WIDTH} × ${SITE_BANNER_HEIGHT} پیکسل باشد.`,
    );
  }

  const key = `${randomUUID()}.${extension}`;
  await client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: bytes,
      ContentType: file.type,
      CacheControl: "private, max-age=31536000",
    }),
  );
  return key;
}

/** Deletes one stored banner. Invalid keys are ignored; deletion is idempotent. */
export async function deleteSiteBannerObject(key: string): Promise<void> {
  if (!isSiteBannerKey(key)) return;
  await client().send(
    new DeleteObjectCommand({ Bucket: bucket(), Key: key }),
  );
}

/** A short-lived GET URL for the private object, used by the serving route. */
export async function signedSiteBannerUrl(key: string): Promise<string> {
  if (!isSiteBannerKey(key)) throw new Error("Invalid banner key.");

  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: SIGNED_URL_SECONDS },
  );
}
