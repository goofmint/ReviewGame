const DATA_URL_REGEX =
  /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+={0,2})$/i;
const BASE64_REGEX = /^[A-Za-z0-9+/=]+={0,2}$/;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface NormalizedImageData {
  base64: string;
  bytes: number;
}

/**
 * Validates the incoming image payload ensuring it is base64 and within limits
 */
export function validateBase64ImagePayload(
  imageData: unknown,
  maxBytes: number = MAX_IMAGE_BYTES
): NormalizedImageData | null {
  const base64Payload = normalizeBase64String(imageData);
  if (!base64Payload) {
    return null;
  }

  if (base64Payload.length % 4 !== 0) {
    return null;
  }

  const bytes = estimateBase64Size(base64Payload);
  if (bytes <= 0 || bytes > maxBytes) {
    return null;
  }

  return { base64: base64Payload, bytes };
}

/**
 * Converts a base64 string into an ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

function normalizeBase64String(imageData: unknown): string | null {
  if (typeof imageData !== "string") {
    return null;
  }

  const trimmed = imageData.trim();
  const dataUrlMatch = trimmed.match(DATA_URL_REGEX);
  if (dataUrlMatch) {
    return dataUrlMatch[2];
  }

  if (BASE64_REGEX.test(trimmed)) {
    return trimmed;
  }

  return null;
}

function estimateBase64Size(base64: string): number {
  const paddingMatch = base64.match(/=+$/);
  const padding = paddingMatch ? paddingMatch[0].length : 0;
  return Math.floor((base64.length * 3) / 4 - padding);
}
