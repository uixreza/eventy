import { randomUUID } from "node:crypto";
import sharp from "sharp";
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  EVENT_IMAGE_MAX_EDGE,
  EVENT_IMAGE_WEBP_QUALITY,
  isEventImageInputType,
  isEventImageKey,
  MAX_EVENT_IMAGE_BYTES,
  type EventImageInputType,
} from "@/lib/event-images";

/**
 * Server-only access to the private Arvan Object Storage bucket.
 *
 * Event rows keep opaque object keys instead of URLs: the bucket is private,
 * so `app/api/event-images/[key]` signs a short-lived read on demand. Nothing
 * in this module is imported by a client component, and credentials stay in
 * environment variables.
 */

const SIGNED_URL_SECONDS = 10 * 60;

/* Sharp reports AVIF as `heif` on some libvips builds, so accept both. */
const DECODED_FORMATS: Record<EventImageInputType, string[]> = {
  "image/jpeg": ["jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif", "heif"],
  "image/heic": ["heif"],
  "image/heif": ["heif"],
};

let cachedClient: S3Client | null = null;

function client(): S3Client {
  if (cachedClient) return cachedClient;

  const endpoint = process.env.ARVAN_S3_ENDPOINT;
  const region = process.env.ARVAN_S3_REGION;
  const accessKeyId = process.env.ARVAN_S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.ARVAN_S3_SECRET_ACCESS_KEY;

  if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error("Event image storage is not configured.");
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
  if (!value) throw new Error("Event image bucket is not configured.");
  return value;
}

/**
 * Normalizes one validated File to a smaller WebP and stores it under a new
 * key. The original bytes are never written, so a phone photo or PNG arrives
 * in the bucket as one predictable, fast-loading format. Callers upload only
 * after the form's other checks pass, then roll back on later failures.
 */
export async function uploadEventImage(file: File): Promise<string> {
  if (!isEventImageInputType(file.type) || file.size === 0 || file.size > MAX_EVENT_IMAGE_BYTES) {
    throw new Error("Invalid event image.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const pipeline = sharp(input, { failOn: "error" }).rotate();
  const metadata = await pipeline.metadata();
  const allowed = DECODED_FORMATS[file.type];
  if (!metadata.format || !allowed.includes(metadata.format)) {
    throw new Error("Invalid event image.");
  }
  if ((metadata.pages ?? 1) > 1) {
    throw new Error("Animated event images are not supported.");
  }

  const output = await pipeline
    .resize({
      width: EVENT_IMAGE_MAX_EDGE,
      height: EVENT_IMAGE_MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: EVENT_IMAGE_WEBP_QUALITY, effort: 4 })
    .toBuffer();

  const key = `${randomUUID()}.webp`;
  await client().send(
    new PutObjectCommand({
      Bucket: bucket(),
      Key: key,
      Body: output,
      ContentType: "image/webp",
      CacheControl: "private, max-age=31536000",
    }),
  );
  return key;
}

/** Deletes every object the event no longer references. Deletion is idempotent. */
export async function deleteEventImages(keys: string[]): Promise<void> {
  const objects = Array.from(new Set(keys.filter(isEventImageKey))).map((Key) => ({ Key }));
  if (objects.length === 0) return;

  const result = await client().send(
    new DeleteObjectsCommand({
      Bucket: bucket(),
      Delete: { Objects: objects, Quiet: true },
    }),
  );
  if (result.Errors?.length) {
    throw new Error("Could not delete every event image.");
  }
}

/** A short-lived GET URL for the private object, used by the serving route. */
export async function signedEventImageUrl(key: string): Promise<string> {
  if (!isEventImageKey(key)) throw new Error("Invalid event image key.");

  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: bucket(), Key: key }),
    { expiresIn: SIGNED_URL_SECONDS },
  );
}
