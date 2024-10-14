#!/usr/bin/env -S deno run -A
import { parseArgs } from "jsr:@std/cli@1.0.6/parse-args";
import { encodeBase64 } from "#/scripts/lib/encryption.ts";
import { loadKey, rotateKey } from "#/scripts/lib/encryptionkey.ts";

function usage() {
  console.log(
    `
Usage: encryption.ts <command> [options]

Commands:
  rotate      Generate a new encryption key
  url         Print the URL with the encryption key
`.trim(),
  );
}

async function main() {
  const args = parseArgs(Deno.args, {
    stopEarly: true,
  });

  switch (args._[0]) {
    case "rotate": {
      await rotateKey();
      break;
    }
    case "url": {
      const key = await loadKey();
      const raw = await crypto.subtle.exportKey("raw", key);
      const url = `https://docs.0xd14.id?key=${encodeBase64(raw)}`;
      console.log(url, `(${url.length} bytes)`);
      break;
    }
    default: {
      usage();
      break;
    }
  }
}

await main();
