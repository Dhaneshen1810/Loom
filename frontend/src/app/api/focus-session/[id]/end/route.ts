import { NextResponse } from "next/server";

import { getSessionToken } from "@/lib/auth";
import { backendUrl } from "@/lib/backend";

type EndResponse = {
  status?: string;
  message?: string;
  reward_coins?: number;
  user?: {
    coins?: number;
  };
  data?: {
    reward_coins?: number;
    user?: {
      coins?: number;
    };
  };
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json(
      { status: "error", message: "Your session has expired." },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const response = await fetch(
      `${backendUrl()}/api/focus-session/${encodeURIComponent(id)}/end`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
    const payload = (await response.json()) as EndResponse;

    if (!response.ok || payload.status !== "success") {
      return NextResponse.json(
        {
          status: "error",
          message: payload.message ?? "The focus session could not be saved.",
        },
        { status: response.ok ? 400 : response.status },
      );
    }

    return NextResponse.json({
      status: "success",
      message: payload.message,
      coins: payload.data?.user?.coins ?? payload.user?.coins,
      coinsAwarded: payload.data?.reward_coins ?? payload.reward_coins,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "The farm is out of reach right now." },
      { status: 502 },
    );
  }
}
