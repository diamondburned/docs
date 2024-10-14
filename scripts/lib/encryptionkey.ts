import { rootDir } from "#/preprocessors/lib/preprocessor.ts";
import { generateKey } from "#/scripts/lib/encryption.ts";
import { sopsDecrypt, sopsEncryptTo } from "#/scripts/lib/sops.ts";

const KEY_PATH = `${rootDir}/src/encrypted/encryption-key.json`;

export async function saveKey(key: CryptoKey) {
  const raw = await crypto.subtle.exportKey("jwk", key);
  const json = JSON.stringify(raw);
  await sopsEncryptTo(KEY_PATH, json);
}

export async function loadKey(): Promise<CryptoKey> {
  const json = await sopsDecrypt(KEY_PATH);
  const raw = JSON.parse(json);
  const key = await crypto.subtle.importKey("jwk", raw, "AES-GCM", true, [
    "encrypt",
  ]);
  return key;
}

export async function rotateKey() {
  const key = await generateKey();
  await saveKey(key);
}
