import { NextResponse } from "next/server";

import { getSessionToken } from "@/lib/auth";
import { backendUrl } from "@/lib/backend";
import { normalizeGoalDescription } from "@/lib/focus-session";

type StartResponse = {
  status?: string;
  message?: string;
  session_id?: string;
};

export async function POST(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json(
      { status: "error", message: "Your session has expired." },
      { status: 401 },
    );
  }

  let goalSeconds: number;
  let goalDescription: string | null = null;

  try {
    const body = (await request.json()) as {
      goal_seconds?: unknown;
      goal_description?: unknown;
    };
    goalSeconds = Number(body.goal_seconds);

    const description = normalizeGoalDescription(body.goal_description);

    if (!description.ok) {
      return NextResponse.json(
        { status: "error", message: description.message },
        { status: 400 },
      );
    }

    goalDescription = description.value;
  } catch {
    goalSeconds = Number.NaN;
  }

  if (!Number.isInteger(goalSeconds) || goalSeconds < 5 || goalSeconds > 3600) {
    return NextResponse.json(
      { status: "error", message: "Choose a valid focus duration." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`${backendUrl()}/api/focus-session/start`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goal_seconds: goalSeconds,
        goal_description: goalDescription,
      }),
      cache: "no-store",
    });
    const payload = (await response.json()) as StartResponse;

    if (
      !response.ok ||
      payload.status !== "success" ||
      typeof payload.session_id !== "string"
    ) {
      return NextResponse.json(
        {
          status: "error",
          message:
            typeof payload.session_id === "string"
              ? (payload.message ?? "The focus session could not be started.")
              : "The focus session could not be started.",
        },
        { status: response.ok ? 502 : response.status },
      );
    }

    return NextResponse.json({
      status: "success",
      message: payload.message,
      sessionId: payload.session_id,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "The farm is out of reach right now." },
      { status: 502 },
    );
  }
}
