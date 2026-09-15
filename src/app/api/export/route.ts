import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ error: "Endpoint unavailable during platform migration" }, { status: 410 });
}
