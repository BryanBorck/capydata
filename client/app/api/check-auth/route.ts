import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  // Check for auth session cookie
  // @ts-expect-error cookies() function requires server context but type definitions may not reflect this
  const authCookie = cookies().get("auth-session");

  return NextResponse.json({
    isAuthenticated: !!authCookie,
  });
}