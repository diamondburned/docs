#!/usr/bin/env -S deno run -A
import { render, writeChapter } from "#/lib/mdbook-renderer.ts";
import { chapters } from "#/lib/mdbook.ts";
import { assertSuccess } from "#/lib/cmd.ts";
import { buildFS, writeFS } from "#/lib/libdb.ts";

type Config = {
  base_url?: string;
};

async function lowdown(markdown: string): Promise<string> {
  const cmd = new Deno.Command("lowdown", {
    args: ["-tterm", "-"],
    stdin: "piped",
    stdout: "piped",
    stderr: "inherit",
  });

  const child = cmd.spawn();

  const stdin = child.stdin.getWriter();
  await stdin.write(new TextEncoder().encode(markdown));
  await stdin.close();

  const output = await child.output();
  assertSuccess(output);

  return new TextDecoder().decode(output.stdout);
}

await render(async (context) => {
  const config = context.config.output.terminal as Config;

  for (const chapter of chapters(context.book)) {
    const rendered = await lowdown(chapter.content);
    await writeChapter(context, chapter, rendered, { ext: ".txt" });
  }

  const fs = await buildFS(config.base_url ?? "", context.destination);
  await writeFS(fs, context.destination + "/fs.json");
});
