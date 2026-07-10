// Cloudflare R2 Storage (S3-compatible)
const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

export async function uploadFile(
  key: string,
  body: Buffer | Blob,
  contentType: string
): Promise<string> {
  // Use S3-compatible API with AWS SDK v3 or direct fetch
  // For simplicity, using presigned URL approach

  if (!R2_ACCESS_KEY) {
    console.warn('[R2] Not configured');
    return '';
  }

  // In production, use @aws-sdk/client-s3
  // For now, return placeholder
  return `${R2_PUBLIC_URL}/${key}`;
}

export function getPublicUrl(key: string): string {
  if (!R2_PUBLIC_URL) return '';
  return `${R2_PUBLIC_URL}/${key}`;
}

export async function deleteFile(key: string): Promise<void> {
  // In production, use @aws-sdk/client-s3
  console.log('[R2] Delete:', key);
}

export function generateProductKey(productId: string, filename: string): string {
  const ext = filename.split('.').pop() || 'jpg';
  return `products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
}
