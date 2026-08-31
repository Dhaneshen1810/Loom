import { getSessionToken } from "@/lib/auth";
import { backendUrl } from "@/lib/backend";

type MeResponse = {
  status?: string;
  user?: {
    coins?: number;
  };
};

export async function getCoinBalance(): Promise<number | null> {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${backendUrl()}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const payload = (await response.json()) as MeResponse;

    if (!response.ok || payload.status !== "success") {
      return null;
    }

    return typeof payload.user?.coins === "number" ? payload.user.coins : null;
  } catch {
    return null;
  }
}
