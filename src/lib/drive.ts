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

const FILE_NAME = "bookmarks_saga.json";

export async function getDriveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: "v3", auth });
}

export async function ensureDataFile(accessToken: string) {
  const drive = await getDriveClient(accessToken);
  const list = await drive.files.list({
    spaces: "appDataFolder",
    q: `name='${FILE_NAME}' and 'appDataFolder' in parents`,
    fields: "files(id, name)",
    pageSize: 1,
  });

  if (list.data.files && list.data.files.length > 0) {
    return list.data.files[0].id as string;
  }

  const created = await drive.files.create({
    requestBody: {
      name: FILE_NAME,
      parents: ["appDataFolder"],
      mimeType: "application/json",
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
  const drive = await getDriveClient(accessToken);
  const fileId = await ensureDataFile(accessToken);
  const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    res.data
      .on("data", (c) => chunks.push(c as Buffer))
      .on("end", () => resolve())
      .on("error", (e) => reject(e));
  });

  const text = Buffer.concat(chunks).toString("utf8");
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data as Bookmark[];
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
