"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type VillagePeriod,
  GRID_SIZE,
  TILE_COUNT,
  VILLAGE_PERIODS,
  WEEK_CELL_COUNT,
  WEEK_GRID_SIZE,
  daysOfLocalWeek,
  localDateKey,
  periodNoun,
  weekPlotAt,
} from "@/lib/village-period";
import type { PlacedWorldItem, WorldItem } from "@/lib/world-items";
import { purchaseWorldItem } from "@/lib/world-shop";

import { TileSprite, treeArticle } from "./tile-sprite";
import styles from "./village.module.css";

type VillageBoardProps = {
  coins: number | null;
  plantedItems: PlacedWorldItem[];
  catalog: WorldItem[];
};

type SelectedPlot = {
  day: string;
  tile: number;
};

function plotKey(day: string, tile: number) {
  return `${day}:${tile}`;
}

export function tileLabel(id: number, occupant?: string) {
  const row = Math.floor((id - 1) / GRID_SIZE) + 1;
  const column = ((id - 1) % GRID_SIZE) + 1;
  const status = occupant ?? "empty";
  return `Tile ${id}, row ${row}, column ${column}, ${status}`;
}

export function VillageBoard({
  coins: initialCoins,
  plantedItems: initialPlantedItems,
  catalog,
}: VillageBoardProps) {
  const [selectedPlot, setSelectedPlot] = useState<SelectedPlot | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [coins, setCoins] = useState(initialCoins);
  const [plantedItems, setPlantedItems] = useState(initialPlantedItems);
  const [storeOpen, setStoreOpen] = useState(false);
  const [planting, setPlanting] = useState(false);
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState<VillagePeriod>("day");
  const today = localDateKey();
  const weekDays = useMemo(() => daysOfLocalWeek(), []);
  const occupied = useMemo(() => {
    const map = new Map<string, PlacedWorldItem>();

    for (const item of plantedItems) {
      map.set(plotKey(item.plantedOn, item.tile), item);
    }

    return map;
  }, [plantedItems]);
  const selectedTree = catalog.find((item) => item.id === selectedTreeId) ?? null;
  const stock = useMemo(() => {
    const order = ["oak tree", "cherry blossom", "spruce tree"];

    return [...catalog].sort((left, right) => {
      const leftIndex = order.indexOf(left.name.toLowerCase());
      const rightIndex = order.indexOf(right.name.toLowerCase());
      return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
    });
  }, [catalog]);
  const visibleItems = useMemo(() => {
    if (period === "day") {
      return plantedItems.filter((item) => item.plantedOn === today);
    }

    const weekKeys = new Set(weekDays.map((day) => day.key));
    return plantedItems.filter((item) => weekKeys.has(item.plantedOn));
  }, [period, plantedItems, today, weekDays]);
  const focusedItem = selectedPlot
    ? (occupied.get(plotKey(selectedPlot.day, selectedPlot.tile)) ?? null)
    : null;
  const plantedCount = visibleItems.length;
  const emptyCount =
    (period === "day" ? TILE_COUNT : TILE_COUNT * weekDays.length) - plantedCount;
  const periodName = periodNoun(period);
  const selectedTile = selectedPlot?.tile ?? null;
  const row = selectedTile
    ? Math.floor((selectedTile - 1) / GRID_SIZE) + 1
    : null;
  const column = selectedTile ? ((selectedTile - 1) % GRID_SIZE) + 1 : null;

  useEffect(() => {
    if (!storeOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setStoreOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [storeOpen]);

  async function plantOnTile(day: string, tile: number) {
    if (!selectedTree || planting || period !== "day" || day !== today) {
      return;
    }

    if (occupied.has(plotKey(day, tile))) {
      return;
    }

    if (coins !== null && coins < selectedTree.price) {
      setStatus(
        `Need ${selectedTree.price} coins for ${selectedTree.name.toLowerCase()}. You have ${coins}.`,
      );
      return;
    }

    setPlanting(true);
    setStatus(`Planting ${selectedTree.name.toLowerCase()}...`);

    const result = await purchaseWorldItem(selectedTree.id, tile, day);

    if (result.ok) {
      setPlantedItems((current) => [
        ...current,
        {
          ...selectedTree,
          placementId: result.placementId,
          tile,
          purchasedAt: new Date().toISOString(),
          plantedOn: day,
        },
      ]);

      if (result.coins !== null) {
        setCoins(result.coins);
      }

      setStatus(
        `Planted ${treeArticle(selectedTree.name)} ${selectedTree.name.toLowerCase()}.`,
      );
    } else {
      setStatus(result.message);
    }

    setPlanting(false);
  }

  function handleTileClick(day: string, tile: number, plantable: boolean) {
    setSelectedPlot((current) =>
      current?.day === day && current.tile === tile ? null : { day, tile },
    );

    if (
      !plantable ||
      occupied.has(plotKey(day, tile)) ||
      (selectedPlot?.day === day && selectedPlot.tile === tile)
    ) {
      return;
    }

    void plantOnTile(day, tile);
  }

  function renderDayBoard() {
    return (
      <ol
        className={styles.board}
        aria-label={`Village plots, ${GRID_SIZE} by ${GRID_SIZE}`}
      >
        {Array.from({ length: TILE_COUNT }, (_, index) =>
          renderTile(today, index + 1, index, true),
        )}
      </ol>
    );
  }

  function renderWeekBoard() {
    return (
      <div className={styles.weekBoard}>
        <div className={styles.weekLabels} aria-hidden="true">
          {weekDays.map((day) => (
            <span
              key={day.key}
              className={day.key === today ? styles.weekLabelToday : undefined}
            >
              {day.label}
            </span>
          ))}
        </div>
        <ol
          className={`${styles.board} ${styles.boardWeek}`}
          aria-label={`Weekly village, ${WEEK_GRID_SIZE} by ${WEEK_GRID_SIZE}`}
        >
          {Array.from({ length: WEEK_CELL_COUNT }, (_, index) => {
            const plot = weekPlotAt(index);

            if (!plot) {
              const shade = (Math.floor(index / WEEK_GRID_SIZE) + (index % WEEK_GRID_SIZE)) % 2 === 0;

              return (
                <li key={`path-${index}`}>
                  <span
                    className={`${styles.tile} ${styles.tilePath} ${
                      shade ? styles.tileLight : styles.tileDark
                    }`}
                    aria-hidden="true"
                  />
                </li>
              );
            }

            const day = weekDays[plot.dayIndex];

            if (!day) {
              return (
                <li key={`path-${index}`}>
                  <span className={`${styles.tile} ${styles.tilePath}`} aria-hidden="true" />
                </li>
              );
            }

            return renderTile(day.key, plot.tile, index, day.key === today, day.label);
          })}
        </ol>
      </div>
    );
  }

  function renderTile(
    day: string,
    tile: number,
    shadeIndex: number,
    plantable: boolean,
    dayLabel?: string,
  ) {
    const occupant = occupied.get(plotKey(day, tile));
    const shade =
      (Math.floor(shadeIndex / (dayLabel ? WEEK_GRID_SIZE : GRID_SIZE)) +
        (shadeIndex % (dayLabel ? WEEK_GRID_SIZE : GRID_SIZE))) %
        2 ===
      0;
    const selected = selectedPlot?.day === day && selectedPlot.tile === tile;
    const name = tileLabel(tile, occupant?.name.toLowerCase());

    return (
      <li key={`${day}-${tile}`}>
        <button
          type="button"
          className={`${styles.tile} ${shade ? styles.tileLight : styles.tileDark} ${
            occupant ? styles.tilePlanted : ""
          } ${selected ? styles.tileSelected : ""}`}
          onClick={() => handleTileClick(day, tile, plantable)}
          disabled={planting || (!plantable && !occupant)}
          aria-label={dayLabel ? `${dayLabel}, ${name}` : name}
          aria-pressed={selected}
        >
          {occupant ? (
            <TileSprite name={occupant.name} />
          ) : selectedTree && plantable && selected ? (
            <span className={styles.spriteGhost}>
              <TileSprite name={selectedTree.name} />
            </span>
          ) : null}
        </button>
      </li>
    );
  }

  return (
    <div className={`${styles.farm} ${storeOpen ? styles.farmStoreOpen : ""}`}>
      <div className={styles.toolbar}>
        <p className={styles.hint}>
          {selectedTree
            ? `Tap an empty plot to plant ${treeArticle(selectedTree.name)} ${selectedTree.name.toLowerCase()}`
            : plantedCount === 0
              ? `No trees ${periodName}`
              : plantedCount === 1
                ? `1 tree ${periodName}`
                : `${plantedCount} trees ${periodName}`}
        </p>
        <div className={styles.periodToggle} role="group" aria-label="Village period">
          {VILLAGE_PERIODS.map((option) => (
            <button
              key={option}
              type="button"
              className={period === option ? styles.periodActive : undefined}
              aria-pressed={period === option}
              onClick={() => {
                setPeriod(option);
                setSelectedPlot(null);

                if (option !== "day") {
                  setStoreOpen(false);
                  setSelectedTreeId(null);
                  setStatus("");
                }
              }}
            >
              {option}
            </button>
          ))}
        </div>
        <div className={styles.counters}>
          <span className={styles.counter} aria-label={`${coins ?? 0} coins`}>
            <i className={styles.coinIcon} aria-hidden="true" />
            {coins === null ? "--" : coins}
          </span>
          <span
            className={styles.counter}
            aria-label={`${plantedCount} trees ${periodName}`}
          >
            <i className={styles.sproutIcon} aria-hidden="true" />
            {plantedCount}
          </span>
          <span className={styles.counter} aria-label={`${emptyCount} empty plots`}>
            <i className={styles.plotIcon} aria-hidden="true" />
            {emptyCount}
          </span>
        </div>
      </div>

      <div className={styles.boardWrap}>
        {period === "day" ? renderDayBoard() : renderWeekBoard()}
      </div>

      {period === "day" ? (
      <button
        className={styles.storeTab}
        type="button"
        aria-expanded={storeOpen}
        aria-controls="village-store"
        onClick={() => setStoreOpen((open) => !open)}
      >
        Store
      </button>
      ) : null}

      {period === "day" ? (
      <aside
        id="village-store"
        className={`${styles.store} ${storeOpen ? styles.storeOpen : ""}`}
        aria-label="Store"
        aria-hidden={!storeOpen}
      >
        <header className={styles.storeHeader}>
          <p>Store</p>
          <button
            type="button"
            className={styles.storeClose}
            onClick={() => setStoreOpen(false)}
            aria-label="Close store"
          >
            Close
          </button>
        </header>
        {stock.length === 0 ? (
          <p className={styles.storeEmpty}>No trees are in stock.</p>
        ) : (
          <ul>
            {stock.map((item) => {
              const unaffordable = coins !== null && coins < item.price;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`${styles.storeItem} ${
                      selectedTreeId === item.id ? styles.storeItemSelected : ""
                    } ${unaffordable ? styles.storeItemCostly : ""}`}
                    onClick={() => {
                      setStatus("");
                      setSelectedTreeId((current) =>
                        current === item.id ? null : item.id,
                      );
                    }}
                    aria-pressed={selectedTreeId === item.id}
                    disabled={planting}
                    tabIndex={storeOpen ? 0 : -1}
                  >
                    <TileSprite name={item.name} />
                    <span>{item.name}</span>
                    <strong>
                      <i className={styles.coinIcon} aria-hidden="true" />
                      {item.price}
                    </strong>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </aside>
      ) : null}

      <div className={styles.readout} role="status" aria-live="polite">
        {status ? (
          <p>{status}</p>
        ) : focusedItem ? (
          <header className={styles.pairing}>
            <p>
              This is {treeArticle(focusedItem.name)}{" "}
              <em>{focusedItem.name.toLowerCase()}</em>.
            </p>
            <span>
              Tile {focusedItem.tile} · {focusedItem.description}
            </span>
          </header>
        ) : selectedPlot === null ? (
          <p>
            {selectedTree
              ? `Choose a plot for ${treeArticle(selectedTree.name)} ${selectedTree.name.toLowerCase()}.`
              : period === "day"
                ? "Open the store, pick a tree, then tap an empty plot."
                : "Switch to day view to plant a tree."}
          </p>
        ) : (
          <p>
            <strong>Tile {selectedPlot.tile}</strong>
            <span>
              Row {row}, column {column} · empty
              {selectedTree
                ? ` · ready for ${selectedTree.name.toLowerCase()}`
                : ""}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
