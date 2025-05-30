import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  
  const authSession = cookieStore.get("auth-session")?.value;
  const userData = cookieStore.get("user-data")?.value;
  
  if (!authSession || authSession !== "true") {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }
  
  let user = null;
  if (userData) {
    try {
      user = JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  }
  
  return NextResponse.json({
    authenticated: true,
    user,
  });
} 