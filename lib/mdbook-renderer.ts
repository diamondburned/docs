import * as streams from "jsr:@std/streams";
import * as path from "jsr:@std/path";
import type { Book, Chapter, Config } from "#/lib/mdbook.ts";

export type Context = {
  version: string;
  root: string;
  book: Book;
  config: Config;
  destination: string;
};

// Override JS and Deno's stupid default: console.* should go to stderr.
console.debug = console.error;
console.log = console.error;

export async function render(
  renderer: (context: Context) => Promise<void> | void,
) {
  const stdin = await streams.toText(Deno.stdin.readable);
  const context = JSON.parse(stdin) as Context;

  await Deno.remove(context.destination, { recursive: true });
  await Deno.mkdir(context.destination);
  await renderer(context);
}

export async function writeChapter(
  context: Context,
  chapter: Chapter,
  content = chapter.content,
  {
    ext,
  }: {
    ext?: string;
  } = {},
) {
  const p = path.parse(path.join(context.destination, chapter.path));
  p.ext = ext || p.ext;
  p.base = "";
  await Deno.mkdir(p.dir, { recursive: true });
  await Deno.writeTextFile(path.format(p), content);
}
