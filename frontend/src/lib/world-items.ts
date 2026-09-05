import { getSessionToken } from "@/lib/auth";
import { backendUrl } from "@/lib/backend";

export type WorldItemCategory = "tree" | "building" | "decoration" | "road";

export type WorldItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: WorldItemCategory;
};

export type PlacedWorldItem = WorldItem & {
  placementId: string;
  tile: number;
  purchasedAt: string;
  plantedOn: string;
};

type BackendListResponse<T> = {
  status?: string;
  data?: T;
};

type BackendWorldItem = {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  price?: unknown;
  category?: unknown;
};

type BackendPlacedWorldItem = BackendWorldItem & {
  world_item_id?: unknown;
  tile?: unknown;
  purchased_at?: unknown;
  planted_on?: unknown;
};

const CATEGORIES = new Set<WorldItemCategory>([
  "tree",
  "building",
  "decoration",
  "road",
]);

function asCategory(value: unknown): WorldItemCategory | null {
  if (typeof value !== "string") {
    return null;
  }

  const category = value.toLowerCase() as WorldItemCategory;
  return CATEGORIES.has(category) ? category : null;
}

function asTile(value: unknown): number | null {
  const tile = typeof value === "number" ? value : Number(value);
  return Number.isInteger(tile) && tile >= 1 && tile <= 25 ? tile : null;
}

function parseWorldItem(value: BackendWorldItem): WorldItem | null {
  const category = asCategory(value.category);

  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.description !== "string" ||
    typeof value.price !== "number" ||
    category === null
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    description: value.description,
    price: value.price,
    category,
  };
}

function parsePlacedWorldItem(value: BackendPlacedWorldItem): PlacedWorldItem | null {
  const item = parseWorldItem({
    id: value.world_item_id,
    name: value.name,
    description: value.description,
    price: value.price,
    category: value.category,
  });

  const tile = asTile(value.tile);
  const purchasedAt = asPurchasedAt(value.purchased_at);
  const plantedOn = asPlantedOn(value.planted_on, purchasedAt);

  if (!item || typeof value.id !== "string" || tile === null || !plantedOn) {
    return null;
  }

  return {
    ...item,
    placementId: value.id,
    tile,
    purchasedAt,
    plantedOn,
  };
}

function asPurchasedAt(value: unknown): string {
  if (typeof value === "string" && !Number.isNaN(new Date(value).getTime())) {
    return value;
  }

  return "";
}

function asPlantedOn(value: unknown, purchasedAt: string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (!purchasedAt) {
    return "";
  }

  const planted = new Date(purchasedAt);
  return Number.isNaN(planted.getTime()) ? "" : planted.toLocaleDateString("en-CA");
}

async function authorizedGet<T>(
  path: string,
  parse: (payload: BackendListResponse<unknown>) => T,
): Promise<T> {
  const token = await getSessionToken();

  if (!token) {
    return parse({});
  }

  try {
    const response = await fetch(`${backendUrl()}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json()) as BackendListResponse<unknown>;

    if (!response.ok || payload.status !== "success") {
      return parse({});
    }

    return parse(payload);
  } catch {
    return parse({});
  }
}

export async function getWorldCatalog(): Promise<WorldItem[]> {
  return authorizedGet("/api/world_items", (payload) =>
    Array.isArray(payload.data)
      ? payload.data.flatMap((item) => {
          const parsed = parseWorldItem(item as BackendWorldItem);
          return parsed ? [parsed] : [];
        })
      : [],
  );
}

export async function getPlacedWorldItems(): Promise<PlacedWorldItem[]> {
  return authorizedGet("/api/user_world_items/me", (payload) =>
    Array.isArray(payload.data)
      ? payload.data.flatMap((item) => {
          const parsed = parsePlacedWorldItem(item as BackendPlacedWorldItem);
          return parsed ? [parsed] : [];
        })
      : [],
  );
}
