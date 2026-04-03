import { getSession } from "@/lib/auth";
import { getAppOrigin } from "@/lib/app-url";
import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  let origin: string;
  try {
    origin = getAppOrigin();
  } catch {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL is not configured" },
      { status: 500 },
    );
  }

  const session = await getSession();
  session.userId = "dev-user-001";
  session.steamId = "76561198000000000";
  session.steamLogin = "SkinWaveDev";
  session.steamAvatar = "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_medium.jpg";
  session.isAdmin = true;
  await session.save();

  return NextResponse.redirect(new URL("/", origin));
}
