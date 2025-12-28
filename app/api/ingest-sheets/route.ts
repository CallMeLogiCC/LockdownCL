import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Replace this stub with real Google Sheets ingestion.
  // 1. Use Google Sheets API with a service account or OAuth credentials.
  // 2. Provide SHEETS_CLIENT_EMAIL and SHEETS_PRIVATE_KEY env vars.
  // 3. Pull data from the configured SHEET_ID and write to Postgres.
  // Example: https://sheets.googleapis.com/v4/spreadsheets/{SHEET_ID}/values/{RANGE}
  return NextResponse.json({
    status: "stubbed",
    message: "Google Sheets ingestion will be wired here."
  });
}
