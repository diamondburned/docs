import { html } from "#/scripts/element.ts";

const KEY_SIZE = 128;

export type Base64<_ extends Uint8Array> = string;

export async function generateKey(): Promise<CryptoKey> {
  const raw = crypto.getRandomValues(new Uint8Array(KEY_SIZE / 8));
  const str = btoa(String.fromCharCode(...raw));
  const key = new TextEncoder().encode(str);
  return await crypto.subtle.importKey("raw", key, "AES-GCM", true, [
    "encrypt",
  ]);
}

// encrypt encrypts the given data using the key.
// The result is an HTML element that can be parsed by the caller.
export async function encrypt(key: CryptoKey, data: string): Promise<string> {
  const fp = await keyFingerprint(key);
  // const iv = crypto.getRandomValues(new Uint8Array(12));
  const iv = await getIV(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    new TextEncoder().encode(data),
  );

  const ivStr = encodeBase64(iv);
  const encryptedStr = encodeBase64(encrypted);

  return html`
    <div>
      <html-encrypted fp="${fp}" iv="${ivStr}" data="${encryptedStr}" />
    </div>
  `().trim();
}

// decrypt decrypts the given data using the key and iv.
// HTML parsing is done by the caller.
export async function decrypt(
  key: CryptoKey,
  iv: Base64<Uint8Array>,
  data: Base64<Uint8Array>,
): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(iv) },
    key,
    decodeBase64(data),
  );
  return new TextDecoder().decode(decrypted);
}

// keyFingerprint returns the fingerprint of a key.
// This fingerprint uniquely identifies the key apart from its name.
export async function keyFingerprint(key: CryptoKey): Promise<string> {
  if (!key.extractable) {
    throw new Error("Key is not extractable");
  }

  const raw = await crypto.subtle.exportKey("raw", key);
  const hash = await crypto.subtle.digest("SHA-256", raw);
  const hash6 = new Uint8Array(hash).slice(0, 6);

  return [...new Uint8Array(hash6)]
    .map((x) => x.toString(16).padStart(2, "0").toUpperCase())
    .join(":");
}

export function encodeBase64(
  raw: Uint8Array | ArrayBuffer,
): Base64<Uint8Array> {
  const u8buf = raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw;
  return btoa(String.fromCharCode(...u8buf));
}

export function decodeBase64(str: Base64<Uint8Array>): Uint8Array {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

// getIV deterministically generates an IV from the given data.
// This is required for mdbook.
async function getIV(data: string): Promise<Uint8Array> {
  const ivLen = 16;
  const nonBase64Len = (ivLen * 3) / 4;

  const bytes = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const hashTrimmed = new Uint8Array(hash).slice(0, nonBase64Len);

  return new Uint8Array(hashTrimmed);
}
