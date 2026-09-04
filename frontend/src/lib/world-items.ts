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
  return Number.isInteger(tile) && tile >= 1 && tile <= 100 ? tile : null;
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

  if (!item || typeof value.id !== "string" || tile === null) {
    return null;
  }

  return {
    ...item,
    placementId: value.id,
    tile,
  };
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
