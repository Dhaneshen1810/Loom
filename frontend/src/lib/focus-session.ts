export const MAX_GOAL_DESCRIPTION_LENGTH = 140;

export function normalizeGoalDescription(value: unknown):
  | { ok: true; value: string | null }
  | { ok: false; message: string } {
  if (value === undefined || value === null) {
    return { ok: true, value: null };
  }

  if (typeof value !== "string") {
    return { ok: false, message: "Describe your goal in a short sentence." };
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return { ok: true, value: null };
  }

  if (Array.from(trimmed).length > MAX_GOAL_DESCRIPTION_LENGTH) {
    return { ok: false, message: "Keep your goal under 140 characters." };
  }

  return { ok: true, value: trimmed };
}
