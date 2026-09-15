import { NextResponse } from "next";

export function GET() {
  return NextResponse.json({ error: "Endpoint unavailable during platform migration" }, { status: 410 });
}
