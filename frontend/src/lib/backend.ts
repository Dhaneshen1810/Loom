import { NextResponse } from "next/server";

import { attachSessionCookie } from "@/lib/auth";

type BackendAuthResponse = {
  status?: string;
  message?: string;
  token?: string;
};

const DEFAULT_BACKEND_URL = "http://localhost:3000";

function backendUrl() {
  return (process.env.BACKEND_API_URL ?? DEFAULT_BACKEND_URL).replace(/\/$/, "");
}

export async function forwardAuthRequest(
  endpoint: "/api/auth/login" | "/api/auth/register",
  request: Request,
) {
  let credentials: unknown;

  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json(
      { status: "error", message: "Please check the form and try again." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(`${backendUrl()}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
    });
    const payload = (await backendResponse.json()) as BackendAuthResponse;

    if (
      !backendResponse.ok ||
      payload.status !== "success" ||
      typeof payload.token !== "string"
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: payload.message ?? "Authentication failed. Please try again.",
        },
        { status: backendResponse.ok ? 401 : backendResponse.status },
      );
    }

    const response = NextResponse.json({
      status: "success",
      message: payload.message ?? "Welcome to Loom.",
    });

    try {
      attachSessionCookie(response, payload.token);
    } catch {
      return NextResponse.json(
        {
          status: "error",
          message: "The server returned an invalid session. Please try again.",
        },
        { status: 502 },
      );
    }

    return response;
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "The farm is out of reach. Is the backend running?",
      },
      { status: 502 },
    );
  }
}
