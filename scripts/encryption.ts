#!/usr/bin/env -S deno run -A
import { decodeBase64, decrypt, keyFingerprint } from "#/lib/encryption.ts";
import { html } from "jsr:@mark/html@1";
import * as anchor from "#/scripts/anchor.ts";
import * as namevars from "#/scripts/namevar.ts";

const encryptedNotification = html`
  <p class="encrypted-notification">
    This content is encrypted. More information can be found under
    <a href="/sections/nfc-chipping.html">NFC Chipping</a>.
  </p>
`;

const incorrectKeyNotification = html`
  <div class="admonition admonish-warning" role="note">
    <div class="admonition-title">
      <p>Encrypted content cannot be decrypted</p>
    </div>
    <div>
      <p>
        You may have provided an incorrect decryption key or the content has
        been tampered with. You may try to obtain the correct key by
        <a href="/sections/nfc-chipping.html">scanning Diamond's NFC tag</a>.
      </p>
    </div>
  </div>
`;

class EncryptedHTMLElement extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const url = new URL(location.href);

    let keyStr = url.searchParams.get("key");
    if (keyStr) {
      sessionStorage.setItem("encryption-key", keyStr);
    } else {
      keyStr = sessionStorage.getItem("encryption-key");
      if (!keyStr) {
        this.notifyEncrypted();
        return;
      }
    }

    const iv = this.getAttribute("iv");
    const fp = this.getAttribute("fp");
    const data = this.getAttribute("data");
    if (!iv || !fp || !data) {
      console.error("Invalid html-encrypted element");
      return;
    }

    (async () => {
      const key = await crypto.subtle.importKey(
        "raw",
        decodeBase64(keyStr),
        "AES-GCM",
        true,
        ["decrypt"],
      );

      const keyFp = await keyFingerprint(key);
      if (keyFp !== fp) {
        throw new Error("Key fingerprint mismatch");
      }

      const content = document.createElement("div");
      content.innerHTML = await decrypt(key, iv, data);
      content.classList.add("decrypted-content");

      namevars.apply(content);
      anchor.apply(content);
      this.replaceChildren(content);

      console.debug("Decrypted element", this);
    })().catch((err) => {
      console.error("Failed to decrypt element", err);
      this.notifyIncorrectKey();
    });
  }

  private notifyEncrypted() {
    this.innerHTML = encryptedNotification();
  }

  private notifyIncorrectKey() {
    this.innerHTML = incorrectKeyNotification();
  }
}

export function apply() {
  customElements.define("html-encrypted", EncryptedHTMLElement);
}
