import { File } from 'expo-file-system';
import { supabase } from './supabase';

const BUCKET = 'outfit-photos';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);

const extensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

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

export async function uploadOutfitPhoto({ userId, outfitId, localUri, mimeType }: { userId: string; outfitId: string; localUri: string; mimeType?: string | null }) {
  const file = new File(localUri);
  if (!file.exists) throw uploadError('We could not read that photo. Please choose it again.');
  if (file.size > MAX_FILE_SIZE) throw uploadError('Choose a photo smaller than 10 MB.');

  const contentType = getMimeType(mimeType, file);
  const photoPath = `${userId}/outfits/${outfitId}.${extensions[contentType]}`;
  const fileBody = await file.arrayBuffer();
  const { error } = await supabase.storage.from(BUCKET).upload(photoPath, fileBody, {
    contentType,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw uploadError('We could not upload your photo. Please check your connection and try again.');
  return photoPath;
}

export async function removeOutfitPhoto(photoPath: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([photoPath]);
  if (error) throw uploadError('We could not remove this outfit photo. Please try again.');
}

export async function createOutfitPhotoUrls(photoPaths: string[]) {
  if (!photoPaths.length) return new Map<string, string>();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(photoPaths, 60 * 60);
  if (error) throw uploadError('We could not load your outfit photos. Please try again.');
  return new Map((data ?? []).filter((item) => item.signedUrl).map((item) => [item.path, item.signedUrl]));
}
