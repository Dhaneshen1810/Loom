type PurchaseResult =
  | {
      ok: true;
      coins: number | null;
      placementId: string;
    }
  | {
      ok: false;
      message: string;
    };

type PurchaseResponse = {
  status?: string;
  message?: string;
  coins?: number;
  placementId?: string;
};

export async function purchaseWorldItem(
  worldItemId: string,
  tile: number,
  plantedOn: string,
): Promise<PurchaseResult> {
  try {
    const response = await fetch(
      `/api/world-items/${encodeURIComponent(worldItemId)}/purchase`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tile, planted_on: plantedOn }),
      },
    );
    const result = (await response.json()) as PurchaseResponse;

    if (
      !response.ok ||
      result.status !== "success" ||
      typeof result.placementId !== "string"
    ) {
      return {
        ok: false,
        message: result.message ?? "That tree could not be planted.",
      };
    }

    return {
      ok: true,
      coins: typeof result.coins === "number" ? result.coins : null,
      placementId: result.placementId,
    };
  } catch {
    return {
      ok: false,
      message: "The farm is out of reach right now.",
    };
  }
}
