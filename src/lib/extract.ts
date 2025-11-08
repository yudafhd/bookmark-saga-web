import type { Bookmark } from "./drive";
// Schema import removed to avoid optional Ajv dependency at build time.

export type ExportFolder = {
  id: string;
  name: string;
  parentId: string | null;
};

export type ExportBookmarkItem = {
  url: string;
  title: string;
  faviconUrl?: string | null;
  savedAt: number;
  visitTime?: number | null;
};

export type ExportData = {
  version: number;
  exportedAt: string;
  folders: ExportFolder[];
  folderItems: Record<string, ExportBookmarkItem[]>;
};

export function isExportData(data: unknown): data is ExportData {
  if (!data || typeof data !== "object") return false;
  const d = data as Partial<ExportData> & Record<string, unknown>;
  if (typeof d.version !== "number") return false;
  if (typeof d.exportedAt !== "string") return false;
  if (!Array.isArray(d.folders)) return false;
  if (!d.folderItems || typeof d.folderItems !== "object") return false;
  return true;
}

export async function validateExportJSON(data: unknown): Promise<{ valid: boolean; errors?: string[] }> {
  const valid = isExportData(data);
  return { valid, errors: valid ? undefined : ["Invalid export structure"] };
}

export function extractBookmarksFromExport(data: ExportData): Bookmark[] {
  const folderMap = new Map<string, ExportFolder>();
  for (const f of data.folders) folderMap.set(f.id, f);

  const pathCache = new Map<string, string>();
  const getPath = (id: string): string => {
    if (pathCache.has(id)) return pathCache.get(id) as string;
    const f = folderMap.get(id);
    if (!f) return "Unsorted";
    const path = f.parentId ? `${getPath(f.parentId)} / ${f.name}` : f.name;
    pathCache.set(id, path);
    return path;
  };

  const result: Bookmark[] = [];
  for (const [folderId, items] of Object.entries(data.folderItems)) {
    const folderPath = getPath(folderId);
    for (const it of items) {
      let hostname = "";
      try {
        hostname = new URL(it.url).hostname;
      } catch {
        hostname = "";
      }
      const id = `${it.url}|${it.savedAt}`;
      result.push({
        id,
        title: it.title,
        url: it.url,
        domain: hostname || undefined,
        faviconUrl: it.faviconUrl ?? undefined,
        tags: [folderPath],
        savedAt: new Date(it.savedAt).toISOString(),
      });
    }
  }
  result.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
  return result;
}

export function tryExtractBookmarks(raw: unknown): Bookmark[] | null {
  if (isExportData(raw)) return extractBookmarksFromExport(raw);
  return null;
}
