import type { Bookmark } from "./drive";

export type FolderNode = {
  name: string;
  path: string; // e.g. "PROJECTS / Web"
  count: number;
  children: FolderNode[];
};

function ensureChild(parent: FolderNode, name: string): FolderNode {
  const path = parent.path ? `${parent.path} / ${name}` : name;
  let child = parent.children.find((c) => c.name === name);
  if (!child) {
    child = { name, path, count: 0, children: [] };
    parent.children.push(child);
  }
  return child;
}

export function buildFolderTree(bookmarks: Bookmark[]): FolderNode {
  const root: FolderNode = { name: "", path: "", count: 0, children: [] };
  const fallback = "Unsorted";

  for (const b of bookmarks) {
    const tagPath = (b.tags && b.tags[0]) || fallback;
    const segments = normalizePath(String(tagPath))
      .split("/")
      .filter(Boolean);

    let node = root;
    for (const seg of segments) {
      node = ensureChild(node, seg);
      node.count += 1;
    }
    // also increase root aggregate count
    root.count += 1;
  }

  // Sort children alphabetically at each level
  const sortRec = (n: FolderNode) => {
    n.children.sort((a, b) => a.name.localeCompare(b.name));
    n.children.forEach(sortRec);
  };
  sortRec(root);

  return root;
}

export function flattenFolders(root: FolderNode): Array<{ path: string; name: string; depth: number; count: number }>{
  const acc: Array<{ path: string; name: string; depth: number; count: number }> = [];
  const walk = (node: FolderNode, depth: number) => {
    for (const child of node.children) {
      acc.push({ path: child.path, name: child.name, depth, count: child.count });
      walk(child, depth + 1);
    }
  };
  walk(root, 0);
  return acc;
}

export function normalizePath(path: string): string {
  return path
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .join("/");
}
