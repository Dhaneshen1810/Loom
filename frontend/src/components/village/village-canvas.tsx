"use client";

import dynamic from "next/dynamic";

import type { PlacedWorldItem } from "@/lib/world-items";

import styles from "./village.module.css";

const VillageScene = dynamic(
  () => import("./village-scene").then((module) => module.VillageScene),
  {
    ssr: false,
    loading: () => (
      <div className={styles.loading}>
        <span />
        Shaping the land...
      </div>
    ),
  },
);

type VillageCanvasProps = {
  coins: number | null;
  plantedItems: PlacedWorldItem[];
};

export function VillageCanvas({ coins, plantedItems }: VillageCanvasProps) {
  return <VillageScene coins={coins} plantedItems={plantedItems} />;
}
