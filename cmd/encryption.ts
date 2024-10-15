#!/usr/bin/env -S deno run -A
import { parseArgs } from "jsr:@std/cli@1.0.6/parse-args";
import { encodeBase64 } from "#/lib/encryption.ts";
import { loadKey, rotateKey } from "#/lib/encryptionkey.ts";

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
      console.log("Key rotated.");
      console.log("Don't forget to update the NFC tags!");
      break;
    }
    case "url": {
      const key = await loadKey();
      const raw = await crypto.subtle.exportKey("raw", key);

      const params = new URLSearchParams();
      params.set("key", encodeBase64(raw));
      if (args._[1]) params.set("name", args._[1].toString());

      const url = `https://docs.0xd14.id?${params.toString()}`;
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
