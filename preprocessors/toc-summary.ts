#!/usr/bin/env -S deno run -A
import {
  isChapter,
  preprocess,
  slugify,
} from "#/preprocessors/lib/preprocessor.ts";

const scriptsDir = new URL("../scripts", import.meta.url).pathname;

const outputDir = scriptsDir + "/dist";
const outputFile = outputDir + "/subsectionindex.json";

const reSubsection = /^## (.*)$/gm;

export type SubsectionsOutput = Section[];

export type Section = {
  name: string;
  link: string;
  subsections?: Section[];
};

await preprocess(async (context, book) => {
  if (context.renderer != "html") {
    return;
  }

  const output: SubsectionsOutput = [];

  for (const section of book.sections) {
    if (!isChapter(section)) {
      continue;
    }

    const chapter = section.Chapter;
    const processedSection: Section = {
      name: chapter.name,
      link: "/" + chapter.path.replace("src/", "").replace(".md", ".html"),
      subsections: [],
    };

    for (const match of chapter.content.matchAll(reSubsection)) {
      const subsection = match[1];
      const slug = slugify(subsection);
      processedSection.subsections!.push({
        name: subsection,
        link: `${processedSection.link}#${slug}`,
      });
    }

    output.push(processedSection);
  }

  await Deno.writeTextFile(outputFile, JSON.stringify(output, null, 2));
});
