import { forwardAuthRequest } from "@/lib/backend";

export async function POST(request: Request) {
  return forwardAuthRequest("/api/auth/login", request);
}
