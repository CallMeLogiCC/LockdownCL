import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAuthSession } from "@/lib/auth";

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const MAX_BANNER_SIZE = 5 * 1024 * 1024;

const sanitizeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_.]/g, "");

export async function POST(request: Request) {
  const session = await getAuthSession();
  const discordId = session?.user?.discordId ?? null;

  if (!discordId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    if (type !== "avatar" && type !== "banner") {
      return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.type === "image/gif") {
      return NextResponse.json({ error: "Gifs are not yet supported" }, { status: 400 });
    }

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WebP images are supported" },
        { status: 400 }
      );
    }

    const maxSize = type === "avatar" ? MAX_AVATAR_SIZE : MAX_BANNER_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error:
            type === "avatar"
              ? "Avatar images must be 2MB or smaller"
              : "Banner images must be 5MB or smaller"
        },
        { status: 400 }
      );
    }

    const safeName = sanitizeFilename(file.name || `${type}.png`);
    const pathname = `profiles/${discordId}/${type}-${Date.now()}-${safeName}`;

    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Failed to upload image", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
