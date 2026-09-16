import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { supabase } from './supabase';

const BUCKET = 'outfit-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_LONGEST_EDGE = 2048;
const JPEG_COMPRESSION = 0.82;
const SIGNED_URL_TTL_SECONDS = 15 * 60;
const SIGNED_URL_REFRESH_BUFFER_MS = 60 * 1000;
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const JPEG_CONTENT_TYPE = 'image/jpeg';

type SignedPhotoUrl = { url: string; expiresAt: number };

let cachedUserId: string | null = null;
const signedPhotoUrls = new Map<string, SignedPhotoUrl>();

function uploadError(message: string): Error {
  return new Error(message);
}

function getMimeType(value: string | null | undefined, file: File): string {
  const mimeType = value ?? file.type ?? '';
  if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
    throw uploadError('Choose a JPEG, PNG, WebP, HEIC, or HEIF image.');
  }
  return mimeType;
}

function ensureSignedUrlUser(userId: string) {
  if (cachedUserId !== userId) {
    signedPhotoUrls.clear();
    cachedUserId = userId;
  }
}

export function clearOutfitPhotoUrlCache() {
  signedPhotoUrls.clear();
  cachedUserId = null;
}

export function evictOutfitPhotoUrl(photoPath: string) {
  signedPhotoUrls.delete(photoPath);
}

async function prepareOutfitPhoto({ localUri, mimeType, width, height }: { localUri: string; mimeType?: string | null; width?: number; height?: number }) {
  const file = new File(localUri);
  if (!file.exists) throw uploadError('We could not read that photo. Please choose it again.');
  getMimeType(mimeType, file);

  try {
    const context = ImageManipulator.manipulate(localUri);
    if (width && height && Math.max(width, height) > MAX_LONGEST_EDGE) {
      context.resize(width >= height ? { width: MAX_LONGEST_EDGE } : { height: MAX_LONGEST_EDGE });
    }
    const rendered = await context.renderAsync();
    const result = await rendered.saveAsync({ compress: JPEG_COMPRESSION, format: SaveFormat.JPEG });
    const preparedFile = new File(result.uri);
    if (!preparedFile.exists) throw uploadError('We could not prepare that photo. Please choose it again.');
    if (preparedFile.size > MAX_FILE_SIZE) throw uploadError('That photo is still larger than 10 MB after optimization. Please choose a smaller photo.');
    return preparedFile;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('That photo is still')) throw error;
    throw uploadError('We could not prepare that photo. Please choose a different image and try again.');
  }
}

export async function uploadOutfitPhoto({ userId, outfitId, localUri, mimeType, width, height, onStage }: { userId: string; outfitId: string; localUri: string; mimeType?: string | null; width?: number; height?: number; onStage?: (stage: 'preparing' | 'saving') => void }) {
  onStage?.('preparing');
  const preparedFile = await prepareOutfitPhoto({ localUri, mimeType, width, height });
  const photoPath = `${userId}/outfits/${outfitId}.jpg`;

  try {
    const fileBody = await preparedFile.arrayBuffer();
    onStage?.('saving');
    const { error } = await supabase.storage.from(BUCKET).upload(photoPath, fileBody, {
      contentType: JPEG_CONTENT_TYPE,
      cacheControl: '3600',
      upsert: false,
    });
    if (error) throw uploadError('We could not upload your photo. Please check your connection and try again.');
    return photoPath;
  } finally {
    try {
      if (preparedFile.exists) preparedFile.delete();
    } catch {
      // A temporary local file can be cleaned up by the OS if immediate cleanup is unavailable.
    }
  }
}

export async function removeOutfitPhoto(photoPath: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([photoPath]);
  if (error) throw uploadError('We could not remove this outfit photo. Please try again.');
  evictOutfitPhotoUrl(photoPath);
}

export async function createOutfitPhotoUrls(userId: string, photoPaths: string[]) {
  if (!photoPaths.length) return new Map<string, string>();
  ensureSignedUrlUser(userId);
  const now = Date.now();
  const uniquePaths = [...new Set(photoPaths)];
  const reusable = uniquePaths.filter((path) => {
    const cached = signedPhotoUrls.get(path);
    return cached && cached.expiresAt - now > SIGNED_URL_REFRESH_BUFFER_MS;
  });
  const missing = uniquePaths.filter((path) => !reusable.includes(path));
  const urls = new Map(reusable.map((path) => [path, signedPhotoUrls.get(path)!.url]));
  if (!missing.length) return urls;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(missing, SIGNED_URL_TTL_SECONDS);
  if (error) throw uploadError('We could not load your outfit photos. Please try again.');
  const expiresAt = now + SIGNED_URL_TTL_SECONDS * 1000;
  for (const item of data ?? []) {
    if (!item.path || !item.signedUrl) continue;
    signedPhotoUrls.set(item.path, { url: item.signedUrl, expiresAt });
    urls.set(item.path, item.signedUrl);
  }
  return urls;
}
