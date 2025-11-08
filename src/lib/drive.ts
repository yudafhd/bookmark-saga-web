import { google } from "googleapis";
import { Readable } from "stream";

export type Bookmark = {
  id: string;
  title: string;
  url: string;
  domain?: string;
  faviconUrl?: string;
  tags?: string[];
  savedAt: string; // ISO date
};

const FILE_NAME = "bookmark-saga-settings.json";
const APP_PROPERTIES = {
  app: "bookmark-saga",
  type: "settings",
  version: "1",
} as const;

export async function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

export type AppDataFile = {
  id: string;
  name: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
  appProperties?: Record<string, string>;
};

export async function listAppDataFiles(accessToken: string): Promise<AppDataFile[]> {
  const drive = await getDriveClient(accessToken);
  const res = await drive.files.list({
    spaces: "appDataFolder",
    q: "'appDataFolder' in parents and trashed = false",
    fields: "files(id,name,mimeType,size,modifiedTime,appProperties)",
    pageSize: 100,
    orderBy: "modifiedTime desc",
  });
  return (res.data.files || []) as AppDataFile[];
}

export async function ensureDataFile(accessToken: string) {
  const drive = await getDriveClient(accessToken);
  // First, try strict match with name + appProperties
  const list = await drive.files.list({
    spaces: "appDataFolder",
    q: [
      `name='${FILE_NAME.replace(/'/g, "\\'")}'`,
      "'appDataFolder' in parents",
      "appProperties has { key='app' and value='bookmark-saga' }",
      "appProperties has { key='type' and value='settings' }",
      "appProperties has { key='version' and value='1' }",
      "trashed = false",
    ].join(" and "),
    fields: "files(id, name, appProperties)",
    pageSize: 1,
  });

  if (list.data.files && list.data.files.length > 0) {
    return list.data.files[0].id as string;
  }

  // Fallback: find by name only, then normalize appProperties if missing/mismatched
  const fallback = await drive.files.list({
    spaces: "appDataFolder",
    q: [
      `name='${FILE_NAME.replace(/'/g, "\\'")}'`,
      "'appDataFolder' in parents",
      "trashed = false",
    ].join(" and "),
    fields: "files(id, name, appProperties)",
    pageSize: 1,
  });

  if (fallback.data.files && fallback.data.files.length > 0) {
    const file = fallback.data.files[0];
    const props = (file as any).appProperties as Record<string, string> | undefined;
    const needUpdate = !props || props.app !== APP_PROPERTIES.app || props.type !== APP_PROPERTIES.type || props.version !== APP_PROPERTIES.version;
    if (needUpdate) {
      await drive.files.update({
        fileId: file.id as string,
        requestBody: { appProperties: { ...APP_PROPERTIES } },
        fields: "id",
      });
    }
    return file.id as string;
  }

  const created = await drive.files.create({
    requestBody: {
      name: FILE_NAME,
      parents: ["appDataFolder"],
      mimeType: "application/json",
      appProperties: { ...APP_PROPERTIES },
    },
    media: {
      mimeType: "application/json",
      // Ensure a Node Readable stream to avoid `.pipe` errors
      body: Readable.from([JSON.stringify([])]),
    },
    fields: "id",
  });
  return created.data.id as string;
}

export async function readBookmarks(accessToken: string): Promise<Bookmark[]> {
  const driveClient = await getDriveClient(accessToken);
  const dataFileId = await ensureDataFile(accessToken);

  const response = await driveClient.files.get(
    { fileId: dataFileId, alt: "media" },
    { responseType: "stream" }
  );

  const fileChunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    response.data
      .on("data", (chunk) => fileChunks.push(chunk as Buffer))
      .on("end", () => resolve())
      .on("error", (error) => reject(error));
  });

  const fileContent = Buffer.concat(fileChunks).toString("utf8");


  try {
    const parsedData = JSON.parse(fileContent);
    // Case 1: already an array of bookmarks
    if (Array.isArray(parsedData)) return parsedData as Bookmark[];

    // Case 2: extension sync payload -> extract bookmarks
    if (parsedData && typeof parsedData === "object") {
      const payload: any = parsedData;
      if (
        (payload.version === 1 || payload.version === "1") &&
        payload.data && typeof payload.data === "object" &&
        Array.isArray(payload.data.bookmarkSagaFolders) &&
        payload.data.bookmarkSagaFolderItems && typeof payload.data.bookmarkSagaFolderItems === "object"
      ) {

        const bookmarkFolders: Array<{ id: string; name: string; parentId: string | null }> =
          payload.data.bookmarkSagaFolders;

        const folderItemsByFolderId: Record<
          string,
          Array<{
            url: string;
            title: string;
            faviconUrl?: string | null;
            savedAt: number;
            visitTime?: number | null;
          }>
        > = payload.data.bookmarkSagaFolderItems;

        const folderMetadataMap = new Map<string, { id: string; name: string; parentId: string | null }>();
        for (const folder of bookmarkFolders) folderMetadataMap.set(folder.id, folder);

        const folderPathCache = new Map<string, string>();
        const getFolderPath = (folderId: string): string => {
          if (folderPathCache.has(folderId)) return folderPathCache.get(folderId) as string;
          const folder = folderMetadataMap.get(folderId);
          if (!folder) return "Unsorted";
          const fullPath = folder.parentId
            ? `${getFolderPath(folder.parentId)} / ${folder.name}`
            : folder.name;
          folderPathCache.set(folderId, fullPath);
          return fullPath;
        };

        const bookmarks: Bookmark[] = [];
        for (const [folderId, folderItems] of Object.entries(folderItemsByFolderId)) {
          const folderPath = getFolderPath(folderId);
          for (const item of folderItems) {
            let hostname = "";
            try {
              hostname = new URL(item.url).hostname;
            } catch {
              hostname = "";
            }
            const bookmarkId = `${item.url}|${item.savedAt}`;
            bookmarks.push({
              id: bookmarkId,
              title: item.title,
              url: item.url,
              domain: hostname || undefined,
              faviconUrl: item.faviconUrl ?? undefined,
              tags: [folderPath],
              savedAt: new Date(item.savedAt).toISOString(),
            });
          }
        }
        bookmarks.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
        return bookmarks;
      }
    }
  } catch {
    // ignore and fallthrough
  }
  return [];
}

export async function writeBookmarks(
  accessToken: string,
  bookmarks: Bookmark[],
): Promise<void> {
  const drive = await getDriveClient(accessToken);
  const fileId = await ensureDataFile(accessToken);
  await drive.files.update({
    fileId,
    media: {
      mimeType: "application/json",
      body: Readable.from([JSON.stringify(bookmarks)]),
    },
  });
}
