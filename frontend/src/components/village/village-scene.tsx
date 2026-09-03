"use client";

import { ContactShadows, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { PCFShadowMap, ACESFilmicToneMapping } from "three";

import type { PlacedWorldItem } from "@/lib/world-items";

import {
  GRID_SIZE,
  TILE_COUNT,
  tileLabel,
  VillageIsland,
} from "./village-island";
import { treeArticle } from "./village-tree";
import styles from "./village.module.css";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function cameraZoom(width: number, height: number) {
  const shortest = Math.min(width, height);
  const tall = height / width > 1.15;
  return Math.max(22, Math.min(shortest / (tall ? 8.8 : 7.6), 88));
}

type VillageSceneProps = {
  coins: number | null;
  plantedItems: PlacedWorldItem[];
};

export function VillageScene({ coins, plantedItems }: VillageSceneProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [zoom, setZoom] = useState(48);
  const animate = !prefersReducedMotion();
  const focusedTile = hoveredTile ?? selectedTile;
  const row = focusedTile ? Math.floor((focusedTile - 1) / GRID_SIZE) + 1 : null;
  const column = focusedTile ? ((focusedTile - 1) % GRID_SIZE) + 1 : null;
  const occupied = useMemo(() => {
    const map = new Map<number, PlacedWorldItem>();

    for (const item of plantedItems) {
      map.set(item.tile, item);
    }

    return map;
  }, [plantedItems]);
  const focusedItem = focusedTile === null ? null : (occupied.get(focusedTile) ?? null);
  const trees = useMemo(
    () =>
      plantedItems
        .filter((item) => item.category === "tree")
        .map((item) => ({
          tile: item.tile,
          name: item.name,
          description: item.description,
        })),
    [plantedItems],
  );
  const plantedCount = plantedItems.length;
  const emptyCount = TILE_COUNT - plantedCount;

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) {
      return;
    }

    const updateZoom = () => {
      setZoom(cameraZoom(frame.clientWidth, frame.clientHeight));
    };

    updateZoom();
    const observer = new ResizeObserver(updateZoom);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (hoveredTile === null) {
      return;
    }

    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hoveredTile]);

  return (
    <div className={styles.stage}>
      <div ref={frameRef} className={styles.canvasFrame}>
        <Canvas
          className={styles.canvasLayer}
          dpr={[1, 1.75]}
          shadows={{ type: PCFShadowMap }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.08;
          }}
          onPointerMissed={() => setSelectedTile(null)}
        >
          <color attach="background" args={["#243c32"]} />
          <fog attach="fog" args={["#243c32", 16, 44]} />
          <OrthographicCamera
            makeDefault
            position={[11.2, 10.2, 11.2]}
            near={-80}
            far={160}
            zoom={zoom}
          />
          <ambientLight intensity={0.86} />
          <hemisphereLight args={["#ffe9b8", "#3d5c32", 0.7]} />
          <directionalLight
            position={[9, 16, 6]}
            intensity={1.55}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.5}
            shadow-camera-far={40}
            shadow-camera-left={-9}
            shadow-camera-right={9}
            shadow-camera-top={9}
            shadow-camera-bottom={-9}
            shadow-bias={-0.0004}
          />
          <directionalLight position={[-7, 5, -5]} intensity={0.28} />

          <group position={[0, 0.22, 0]}>
            <VillageIsland
              hoveredTile={hoveredTile}
              selectedTile={selectedTile}
              onHover={setHoveredTile}
              onSelect={setSelectedTile}
              animate={animate}
              trees={trees}
            />
          </group>

          <ContactShadows
            position={[0, -1.72, 0]}
            opacity={0.38}
            scale={22}
            blur={3.2}
            far={7}
          />

          <OrbitControls
            makeDefault
            target={[0, 0.05, 0]}
            enablePan={false}
            enableZoom
            enableDamping
            dampingFactor={0.08}
            minZoom={Math.max(20, zoom * 0.7)}
            maxZoom={zoom * 1.5}
            rotateSpeed={0.42}
            autoRotate={animate && selectedTile === null}
            autoRotateSpeed={0.32}
            minPolarAngle={Math.PI / 4.4}
            maxPolarAngle={Math.PI / 2.65}
            minAzimuthAngle={Math.PI / 14}
            maxAzimuthAngle={Math.PI / 2.15}
          />
        </Canvas>

        <div className={styles.vignette} aria-hidden="true" />

        <div className={styles.hud}>
          <p className={styles.dragHint}>Drag to look · pinch to zoom</p>

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

          <div className={styles.plan}>
            <p>Top view · 7 × 7</p>
            <ol>
              {Array.from({ length: TILE_COUNT }, (_, index) => {
                const id = index + 1;
                const planRow = Math.floor(index / GRID_SIZE);
                const planColumn = index % GRID_SIZE;
                const occupant = occupied.get(id);

                return (
                  <li key={id}>
                    <button
                      type="button"
                      className={`${(planRow + planColumn) % 2 === 0 ? styles.planLight : styles.planDark} ${
                        occupant ? styles.planPlanted : ""
                      } ${selectedTile === id || hoveredTile === id ? styles.planActive : ""}`}
                      onClick={() => setSelectedTile(id)}
                      aria-label={tileLabel(id, occupant?.name.toLowerCase())}
                      aria-pressed={selectedTile === id}
                    />
                  </li>
                );
              })}
            </ol>
          </div>

          <div className={styles.readout} role="status" aria-live="polite">
            {focusedItem?.category === "tree" ? (
              <header className={styles.treePairing}>
                <p>
                  This is {treeArticle(focusedItem.name)}{" "}
                  <em>{focusedItem.name.toLowerCase()}</em>.
                </p>
                <span>
                  Tile {focusedItem.tile} · {focusedItem.description}
                </span>
              </header>
            ) : focusedItem ? (
              <p>
                <strong>{focusedItem.name}</strong>
                <span>
                  Tile {focusedItem.tile} · row {row}, column {column}
                </span>
              </p>
            ) : focusedTile === null ? (
              <p>Tap a plot to inspect it.</p>
            ) : (
              <p>
                <strong>Tile {focusedTile}</strong>
                <span>
                  Row {row}, column {column} · empty
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      <ol
        className={styles.tileList}
        aria-label={`Village plots, ${GRID_SIZE} by ${GRID_SIZE}`}
      >
        {Array.from({ length: TILE_COUNT }, (_, index) => index + 1).map((id) => (
          <li key={id}>
            <button
              type="button"
              aria-pressed={selectedTile === id}
              onClick={() => setSelectedTile(id)}
              onFocus={() => setHoveredTile(id)}
              onBlur={() => setHoveredTile(null)}
            >
              {tileLabel(id, occupied.get(id)?.name.toLowerCase())}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
