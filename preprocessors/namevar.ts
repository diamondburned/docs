#!/usr/bin/env -S deno run -A
import { preprocess } from "#/lib/mdbook-preprocessor.ts";
import { preprocessAllNamevars } from "#/scripts/namevar.ts";
import { chapters } from "#/lib/mdbook.ts";

await preprocess((context, book) => {
  if (context.renderer != "html") {
    return;
  }

  for (const chapter of chapters(book)) {
    chapter.content = preprocessAllNamevars(chapter.content);
  }
});
