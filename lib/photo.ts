// Where a user's profile photo is served from. The ?v= changes whenever the
// photo does, so browsers can cache it for a long time and still pick up a
// new one straight away.
export function photoSrc(user: { id: string; photoUpdatedAt?: Date | string | null } | null | undefined): string | null {
  if (!user?.photoUpdatedAt) return null;
  return `/api/users/${user.id}/photo?v=${new Date(user.photoUpdatedAt).getTime()}`;
}

export const MAX_PHOTO_BYTES = 400_000; // after resizing in the browser photos are ~20-40 KB

export function isValidPhotoDataUrl(v: unknown): v is string {
  return typeof v === "string" && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v) && v.length <= MAX_PHOTO_BYTES;
}
