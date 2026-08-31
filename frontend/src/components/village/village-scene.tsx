"use client";

import { ContactShadows, OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";

import {
  GRID_SIZE,
  TILE_COUNT,
  tileLabel,
  VillageIsland,
} from "./village-island";
import styles from "./village.module.css";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function cameraZoom(width: number, height: number) {
  return Math.max(28, Math.min(width / 11.2, height / 8.1));
}

export function VillageScene({ coins }: { coins: number | null }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [hoveredTile, setHoveredTile] = useState<number | null>(null);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [zoom, setZoom] = useState(52);
  const [animate] = useState(() => !prefersReducedMotion());
  const focusedTile = hoveredTile ?? selectedTile;

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
          dpr={[1, 2]}
          shadows
          gl={{ antialias: true, alpha: false }}
          onPointerMissed={() => setSelectedTile(null)}
        >
          <color attach="background" args={["#1b3022"]} />
          <OrthographicCamera
            makeDefault
            position={[12, 11.5, 12]}
            near={-80}
            far={160}
            zoom={zoom}
          />
          <ambientLight intensity={0.85} />
          <hemisphereLight args={["#d7ecff", "#3d5c32", 0.55]} />
          <directionalLight
            position={[9, 16, 4]}
            intensity={1.85}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-7, 6, -5]} intensity={0.28} />

          <group position={[0, 0.15, 0]}>
            <VillageIsland
              hoveredTile={hoveredTile}
              selectedTile={selectedTile}
              onHover={setHoveredTile}
              onSelect={setSelectedTile}
              animate={animate}
            />
          </group>

          <ContactShadows
            position={[0, -1.72, 0]}
            opacity={0.38}
            scale={18}
            blur={2.4}
            far={5}
          />

          <OrbitControls
            makeDefault
            target={[0, -0.15, 0]}
            enablePan={false}
            enableZoom={false}
            rotateSpeed={0.35}
            minPolarAngle={Math.PI / 4.2}
            maxPolarAngle={Math.PI / 2.7}
            minAzimuthAngle={Math.PI / 12}
            maxAzimuthAngle={Math.PI / 2.2}
          />
        </Canvas>

        <p className={styles.dragHint}>Drag to look around</p>

        <div className={styles.counters}>
          <span className={styles.counter} aria-label={`${coins ?? 0} coins`}>
            <i className={styles.coinIcon} aria-hidden="true" />
            {coins === null ? "--" : coins}
          </span>
          <span className={styles.counter} aria-label="0 planted plots">
            <i className={styles.sproutIcon} aria-hidden="true" />
            0
          </span>
          <span className={styles.counter} aria-label={`${TILE_COUNT} empty plots`}>
            <i className={styles.plotIcon} aria-hidden="true" />
            {TILE_COUNT}
          </span>
        </div>
      </div>

      <div className={styles.readout} role="status" aria-live="polite">
        {focusedTile === null ? (
          <p>Choose a plot. Each square is waiting for its first sprout.</p>
        ) : (
          <p>
            <strong>Tile {focusedTile}</strong>
            <span>Empty plot, waiting for its first sprout.</span>
          </p>
        )}
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
              {tileLabel(id)}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
