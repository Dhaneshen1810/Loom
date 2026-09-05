import { NextResponse } from "next/server";

import { getSessionToken } from "@/lib/auth";
import { backendUrl } from "@/lib/backend";

type PurchaseResponse = {
  status?: string;
  message?: string;
  data?: {
    remaining_coins?: number;
    user_world_item?: {
      id?: string;
      world_item_id?: string;
      tile?: number;
    };
  };
};

export async function POST(
  request: Request,
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
  let tile: number;
  let plantedOn: string | null = null;

  try {
    const body = (await request.json()) as {
      tile?: unknown;
      planted_on?: unknown;
    };
    tile = Number(body.tile);
    plantedOn =
      typeof body.planted_on === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(body.planted_on)
        ? body.planted_on
        : null;
  } catch {
    tile = Number.NaN;
  }

  if (!Number.isInteger(tile) || tile < 1 || tile > 25) {
    return NextResponse.json(
      { status: "error", message: "Choose a plot first." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${backendUrl()}/api/world_items/${encodeURIComponent(id)}/purchase`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tile,
          planted_on: plantedOn,
        }),
        cache: "no-store",
      },
    );
    const payload = (await response.json()) as PurchaseResponse;

    if (!response.ok || payload.status !== "success") {
      return NextResponse.json(
        {
          status: "error",
          message: payload.message ?? "That item could not be planted.",
        },
        { status: response.ok ? 400 : response.status },
      );
    }

    return NextResponse.json({
      status: "success",
      message: payload.message,
      coins: payload.data?.remaining_coins,
      placementId: payload.data?.user_world_item?.id,
      worldItemId: payload.data?.user_world_item?.world_item_id,
      tile: payload.data?.user_world_item?.tile,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "The farm is out of reach right now." },
      { status: 502 },
    );
  }
}
