import * as streams from "jsr:@std/streams";

export type Context = {
  root: string;
  config: {
    book: BookConfig;
    build: BuildConfig;
    [key: string]: unknown;
  };
  renderer: string;
  mdbook_version: string;
};

export type BookConfig = {
  title: string;
  description: string;
  authors: string[];
  language: string;
  multilingual: boolean;
  src: string;
};

export type BuildConfig = {
  "build-dir": string;
};

export type Book = {
  sections: Section[];
};

export type Section = "Separator" | { Chapter: Chapter };

export type Chapter = {
  name: string;
  number: number[] | null;
  content: string;
  sub_items: Section[];
  path: string;
  source_path: string;
  parent_names: string[];
};

// Override JS and Deno's stupid default: console.* should go to stderr.
console.debug = console.error;
console.log = console.error;

type stdinData = [Context, Book];

export async function preprocess(
  preprocessor: (context: Context, book: Book) => Promise<void> | void,
) {
  const stdin = await streams.toText(Deno.stdin.readable);
  if (!stdin) {
    // Sometimes mdbook sends an empty string.
    // Ignore it.
    return;
  }

  const [context, book] = JSON.parse(stdin) as stdinData;
  await preprocessor(context, book);
  console.info(JSON.stringify(book));
}

export function isChapter(section: Section): section is { Chapter: Chapter } {
  return typeof section == "object" && "Chapter" in section;
}

export function isSeparator(section: Section): section is "Separator" {
  return section === "Separator";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
