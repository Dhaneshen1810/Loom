export type VillagePeriod = "day" | "week";

export const VILLAGE_PERIODS: VillagePeriod[] = ["day", "week"];
export const GRID_SIZE = 5;
export const TILE_COUNT = GRID_SIZE * GRID_SIZE;
export const WEEK_DAY_COLUMNS = 3;
export const WEEK_DAY_COUNT = WEEK_DAY_COLUMNS * WEEK_DAY_COLUMNS;
export const WEEK_GRID_SIZE = GRID_SIZE * WEEK_DAY_COLUMNS;
export const WEEK_CELL_COUNT = WEEK_GRID_SIZE * WEEK_GRID_SIZE;
export const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function weekPlotAt(index: number) {
  const row = Math.floor(index / WEEK_GRID_SIZE);
  const column = index % WEEK_GRID_SIZE;
  const dayIndex =
    Math.floor(row / GRID_SIZE) * WEEK_DAY_COLUMNS + Math.floor(column / GRID_SIZE);

  if (dayIndex >= WEEK_DAY_COUNT) {
    return null;
  }

  const localRow = row % GRID_SIZE;
  const localColumn = column % GRID_SIZE;

  return {
    dayIndex,
    tile: localRow * GRID_SIZE + localColumn + 1,
    row,
    column,
  };
}

export function localDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA");
}

function startOfLocalWeek(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = start.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  start.setDate(start.getDate() + mondayOffset);
  return start;
}

export function daysOfLocalWeek(now = new Date()) {
  const start = startOfLocalWeek(now);

  return Array.from({ length: WEEK_DAY_COUNT }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: localDateKey(date),
      label: `${WEEKDAY_LABELS[index % WEEKDAY_LABELS.length]} ${date.getDate()}`,
      date,
    };
  });
}

export function isDateInLocalWeek(dateKey: string, now = new Date()) {
  return daysOfLocalWeek(now).some((day) => day.key === dateKey);
}

export function periodNoun(period: VillagePeriod) {
  return period === "day" ? "today" : "this week";
}
