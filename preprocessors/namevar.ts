#!/usr/bin/env -S deno run -A
import { isChapter, preprocess } from "#/preprocessors/lib/preprocessor.ts";
import { namevars } from "#/scripts/namevar.ts";

await preprocess((_, book) => {
  for (const section of book.sections) {
    if (!isChapter(section)) continue;
    const chapter = section.Chapter;

    for (const namevar of namevars) {
      chapter.content = chapter.content.replace(
        namevar.preprocessMatcher,
        (match) => namevar.preprocess(match)().trim(),
      );
    }
  }
});
