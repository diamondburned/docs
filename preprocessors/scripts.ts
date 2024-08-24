#!/usr/bin/env -S deno run -A
import { preprocess } from "#/preprocessors/lib/preprocessor.ts";
import { bundle } from "jsr:@deno/emit";
import deno from "#/deno.json" with { type: "json" };

const scriptsDir = new URL("../scripts", import.meta.url).pathname;

const input = scriptsDir + "/index.ts";
const outputDir = scriptsDir + "/dist";
const outputScript = outputDir + "/scripts.js";

await preprocess(async () => {
  const { code, map } = await bundle(input, {
    type: "classic",
    minify: true,
    allowRemote: true,
    cacheSetting: "only",
    compilerOptions: {
      sourceMap: true,
    },
    importMap: {
      imports: deno.imports,
    },
  });

  await Deno.mkdir(outputDir, { recursive: true });
  await Deno.writeTextFile(outputScript, code);
  if (map) {
    await Deno.writeTextFile(outputScript + ".map", map);
  }
});
