export type Config = {
  book: BookConfig;
  build: BuildConfig;
  output: Record<string, unknown>;
  [key: string]: unknown;
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

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function isChapter(section: Section): section is { Chapter: Chapter } {
  return typeof section == "object" && "Chapter" in section;
}

export function isSeparator(section: Section): section is "Separator" {
  return section === "Separator";
}

export function chapters(book: Book): Chapter[] {
  return book.sections.filter(isChapter).map((s) => s.Chapter);
}
