import { NextResponse } from "next/server";

import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    status: "success",
    message: "You have been logged out.",
  });

  clearSessionCookie(response);
  return response;
}
