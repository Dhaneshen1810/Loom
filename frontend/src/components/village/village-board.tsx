"use client";

import { useEffect, useMemo, useState } from "react";

import type { PlacedWorldItem, WorldItem } from "@/lib/world-items";
import { purchaseWorldItem } from "@/lib/world-shop";

import { TileSprite, treeArticle } from "./tile-sprite";
import styles from "./village.module.css";

export const GRID_SIZE = 10;
export const TILE_COUNT = GRID_SIZE * GRID_SIZE;

type VillageBoardProps = {
  coins: number | null;
  plantedItems: PlacedWorldItem[];
  catalog: WorldItem[];
};

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
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
  const [coins, setCoins] = useState(initialCoins);
  const [plantedItems, setPlantedItems] = useState(initialPlantedItems);
  const [storeOpen, setStoreOpen] = useState(false);
  const [planting, setPlanting] = useState(false);
  const [status, setStatus] = useState("");
  const occupied = useMemo(() => {
    const map = new Map<number, PlacedWorldItem>();

    for (const item of plantedItems) {
      map.set(item.tile, item);
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
  const focusedItem = selectedTile === null ? null : (occupied.get(selectedTile) ?? null);
  const plantedCount = plantedItems.length;
  const emptyCount = TILE_COUNT - plantedCount;
  const row = selectedTile ? Math.floor((selectedTile - 1) / GRID_SIZE) + 1 : null;
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

  async function plantOnTile(tile: number) {
    if (!selectedTree || planting || occupied.has(tile)) {
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

    const result = await purchaseWorldItem(selectedTree.id, tile);

    if (result.ok) {
      setPlantedItems((current) => [
        ...current,
        {
          ...selectedTree,
          placementId: result.placementId,
          tile,
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

  function handleTileClick(id: number) {
    setSelectedTile((current) => (current === id ? null : id));

    if (occupied.has(id) || selectedTile === id) {
      return;
    }

    void plantOnTile(id);
  }

  return (
    <div className={`${styles.farm} ${storeOpen ? styles.farmStoreOpen : ""}`}>
      <div className={styles.toolbar}>
        <p className={styles.hint}>
          {selectedTree
            ? `Tap an empty plot to plant ${treeArticle(selectedTree.name)} ${selectedTree.name.toLowerCase()}`
            : "Open the store to pick a tree"}
        </p>
        <div className={styles.counters}>
          <span className={styles.counter} aria-label={`${coins ?? 0} coins`}>
            <i className={styles.coinIcon} aria-hidden="true" />
            {coins === null ? "--" : coins}
          </span>
          <span className={styles.counter} aria-label={`${plantedCount} planted plots`}>
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
        <ol className={styles.board} aria-label={`Village plots, ${GRID_SIZE} by ${GRID_SIZE}`}>
          {Array.from({ length: TILE_COUNT }, (_, index) => {
            const id = index + 1;
            const occupant = occupied.get(id);
            const rowIndex = Math.floor(index / GRID_SIZE);
            const columnIndex = index % GRID_SIZE;
            const shade = (rowIndex + columnIndex) % 2 === 0;

            return (
              <li key={id}>
                <button
                  type="button"
                  className={`${styles.tile} ${shade ? styles.tileLight : styles.tileDark} ${
                    occupant ? styles.tilePlanted : ""
                  } ${selectedTile === id ? styles.tileSelected : ""}`}
                  onClick={() => handleTileClick(id)}
                  disabled={planting}
                  aria-label={tileLabel(id, occupant?.name.toLowerCase())}
                  aria-pressed={selectedTile === id}
                >
                  {occupant ? (
                    <TileSprite name={occupant.name} />
                  ) : selectedTree && selectedTile === id ? (
                    <span className={styles.spriteGhost}>
                      <TileSprite name={selectedTree.name} />
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <button
        className={styles.storeTab}
        type="button"
        aria-expanded={storeOpen}
        aria-controls="village-store"
        onClick={() => setStoreOpen((open) => !open)}
      >
        Store
      </button>

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
                      setSelectedTreeId((current) => (current === item.id ? null : item.id));
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
        ) : selectedTile === null ? (
          <p>
            {selectedTree
              ? `Choose a plot for ${treeArticle(selectedTree.name)} ${selectedTree.name.toLowerCase()}.`
              : "Open the store, pick a tree, then tap an empty plot."}
          </p>
        ) : (
          <p>
            <strong>Tile {selectedTile}</strong>
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
