#!/usr/bin/env -S deno run -A
import { preprocess } from "#/preprocessors/lib/preprocessor.ts";

const stylesDir = new URL("../theme", import.meta.url).pathname;
const stylesRoot = stylesDir + "/styles.scss";
const stylesOutput = stylesDir + "/dist/styles.css";

await preprocess(async () => {
  const command = new Deno.Command("sass", {
    args: [stylesRoot, stylesOutput],
    stderr: "inherit",
  });
  const output = await command.output();
  if (!output.success) {
    throw new Error(`Sass compilation exited with status ${output.code}`);
  }
});
