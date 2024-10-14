#!/usr/bin/env -S deno run -A
import {
  chapters,
  preprocess,
  rootDir,
} from "#/preprocessors/lib/preprocessor.ts";
import { html } from "jsr:@mark/html@1";
import { encrypt } from "#/scripts/lib/encryption.ts";
import { loadKey } from "#/scripts/lib/encryptionkey.ts";
import { sopsDecrypt } from "#/scripts/lib/sops.ts";
import { preprocessAllNamevars } from "#/scripts/namevar.ts";

// @ts-types="https://cdn.jsdelivr.net/npm/@types/commonmark@0.27.9/index.d.ts"
import * as commonmark from "https://cdn.jsdelivr.net/npm/commonmark@0.31.2/+esm";

const encryptedRe = /{{#encrypted +([^/\0]+)}}/gm;
const encryptedDir = rootDir + "/src/encrypted";

const preprocessors: ((content: string) => string)[] = [
  //
  preprocessAllNamevars,
];

const mdParser = new commonmark.Parser();
const mdRenderer = new commonmark.HtmlRenderer();

const key = await loadKey();

async function loadEncryptedContent(name: string): Promise<string> {
  const path = encryptedDir + "/" + name;

  // Perform SOPS decryption to convert from version controlled encryption to
  // plain text.
  let content = await sopsDecrypt(path);

  const [_, ext] = name.split(".");
  switch (ext) {
    case "":
    case "txt": {
      content = html`<pre>${content}</pre>`();
      break;
    }
    case "html": {
      // ok
      break;
    }
    case "md": {
      for (const f of preprocessors) {
        content = f(content);
      }
      content = mdRenderer.render(mdParser.parse(content));
      break;
    }
    default: {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  // Re-encrypt the content, this time for rendering instead of for version
  // control.
  content = await encrypt(key, content);
  return content;
}

await preprocess(async (_, book) => {
  const names = new Set<string>();
  for (const chapter of book.chapters) {
    for (const match of chapter.content.matchAll(encryptedRe)) {
      names.add(match[1]);
    }
  }

  const contents = (await Promise.all(
    Array.from(names).map((name) =>
      loadEncryptedContent(name).then((content) => ({
        name,
        content,
      }))
    ),
  )).reduce((map, { name, content }) => {
    map.set(name, content);
    return map;
  }, new Map<string, string>());

  for (const chapter of book.chapters) {
    chapter.content = chapter.content.replaceAll(encryptedRe, (_, key) => {
      return contents.get(key)!;
    });
  }
});
