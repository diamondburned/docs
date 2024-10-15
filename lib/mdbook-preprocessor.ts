import * as streams from "jsr:@std/streams";
import { type Book, type Config } from "#/lib/mdbook.ts";

export type Context = {
  root: string;
  config: Config;
  renderer: string;
  mdbook_version: string;
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
