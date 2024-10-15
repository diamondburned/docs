import * as fs from "jsr:@std/fs";
import * as path from "jsr:@std/path";

type FS = {
  "$version": 2;
  base_url: string;
  tree: FSTree;
};

type FSTree = {
  [name: string]:
    | { size: number } // File
    | FSTree // Directory
  ;
};

export async function buildFS(baseURL: string, root: string): Promise<FS> {
  const tree: FSTree = {};

  const ensureEntry = async (entry: fs.WalkEntry) => {
    const parsedPath = path.parse(path.relative(root, entry.path));

    // Ensure all directories leading up to the file exist.
    let dirNode = tree;
    if (parsedPath.dir != "") {
      for (const part of parsedPath.dir.split("/")) {
        if (!dirNode[part]) {
          dirNode[part] = {};
        }
        dirNode = dirNode[part] as FSTree;
      }
    }

    if (entry.isFile) {
      const stat = await Deno.stat(entry.path);
      dirNode[parsedPath.base] = { size: stat.size };
      return;
    }

    if (entry.isDirectory) {
      dirNode[parsedPath.base] = {};
      return;
    }

    throw new Error(`Unknown file entry type: ${entry}`);
  };

  for await (const file of fs.walk(root)) {
    if (file.path == root) {
      continue; // skip root
    }

    await ensureEntry(file);
  }

  return {
    "$version": 2,
    base_url: baseURL,
    tree,
  };
}

export async function writeFS(fs: FS, path: string) {
  await Deno.writeTextFile(path, JSON.stringify(fs, null, 2));
}
