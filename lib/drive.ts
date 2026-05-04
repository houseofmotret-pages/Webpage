import { google } from "googleapis";

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/drive"],
});

export const drive = google.drive({ version: "v3", auth });

export async function createFolder(name: string, parentId?: string) {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId || process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID!],
    },
    fields: "id, name, webViewLink",
  });
  return res.data;
}

export async function setFolderPermission(fileId: string, role: "reader" | "commenter" | "writer") {
  await drive.permissions.create({
    fileId,
    requestBody: {
      role,
      type: "anyone",
    },
  });
}

export async function getFolderFiles(folderId: string) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and mimeType contains 'image/' and trashed=false`,
    fields: "files(id, name, mimeType, webViewLink, thumbnailLink)",
    orderBy: "name",
  });
  return res.data.files || [];
}