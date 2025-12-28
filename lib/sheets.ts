import { google } from "googleapis";

export const getSheetsClient = () => {
  const clientEmail = process.env.SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Sheets credentials are missing");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
  });

  return google.sheets({ version: "v4", auth });
};

export const getSheetId = () => {
  const sheetId = process.env.SHEET_ID;
  if (!sheetId) {
    throw new Error("SHEET_ID is not set");
  }
  return sheetId;
};

export const getSheetRange = (fallback: string) =>
  process.env.SHEET_RANGE ?? fallback;
