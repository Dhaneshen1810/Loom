import { NextResponse } from "next/server";

import { getSessionToken } from "@/lib/auth";
import { backendUrl } from "@/lib/backend";

type UserResponse = {
  status?: string;
  message?: string;
  user?: {
    coins?: number;
  };
};

export async function GET() {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json(
      { status: "error", message: "Your session has expired." },
      { status: 401 },
    );
  }

  try {
    const response = await fetch(`${backendUrl()}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json()) as UserResponse;

    if (
      !response.ok ||
      payload.status !== "success" ||
      typeof payload.user?.coins !== "number"
    ) {
      return NextResponse.json(
        {
          status: "error",
          message: payload.message ?? "Your coin balance could not be loaded.",
        },
        { status: response.ok ? 502 : response.status },
      );
    }

    return NextResponse.json({
      status: "success",
      coins: payload.user.coins,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "Your coin balance could not be loaded." },
      { status: 502 },
    );
  }
}
