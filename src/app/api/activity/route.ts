import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ error: "Endpoint unavailable during platform migration" }, { status: 410 });
}

export function POST() {
  return NextResponse.json({ error: "Endpoint unavailable during platform migration" }, { status: 410 });
}
