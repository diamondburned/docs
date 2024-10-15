#!/usr/bin/env -S deno run -A
import * as esbuild from "https://deno.land/x/esbuild@v0.23.0/mod.js";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.10";
import { preprocess } from "#/lib/mdbook-preprocessor.ts";

const denoFile = new URL("../deno.json", import.meta.url).pathname;
const scriptsDir = new URL("../scripts", import.meta.url).pathname;

const input = scriptsDir + "/index.ts";
const outputDir = scriptsDir + "/dist";

await preprocess(async (context) => {
  if (context.renderer != "html") {
    return;
  }

  await esbuild.build({
    plugins: [
      ...denoPlugins({
        loader: "native",
        configPath: denoFile,
      }),
    ],
    entryPoints: [input],
    outdir: outputDir,
    format: "iife",
    target: ["chrome80", "firefox80"],
    bundle: true,
    minify: true,
    sourcemap: true,
  });

  esbuild.stop();
});
