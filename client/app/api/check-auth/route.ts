import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  // Check for auth session cookie
  // @ts-ignore
  const authCookie = cookies().get("auth-session");

  return NextResponse.json({
    isAuthenticated: !!authCookie,
  });
}