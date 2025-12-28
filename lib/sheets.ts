import { sheets_v4 } from "@googleapis/sheets";

export const getSheetsClient = () => {
  const clientEmail = process.env.SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google Sheets credentials are missing");
  }

  return new sheets_v4.Sheets({
    auth: new sheets_v4.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"]
    })
  });
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
