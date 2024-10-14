#!/usr/bin/env -S deno run -A
import { isChapter, preprocess } from "#/preprocessors/lib/preprocessor.ts";
import { preprocessAllNamevars } from "#/scripts/namevar.ts";

await preprocess((context, book) => {
  if (context.renderer != "html") {
    return;
  }

  for (const section of book.sections) {
    if (!isChapter(section)) continue;
    const chapter = section.Chapter;
    chapter.content = preprocessAllNamevars(chapter.content);
  }
});
