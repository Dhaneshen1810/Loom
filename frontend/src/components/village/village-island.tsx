"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  type Group,
  type Mesh,
} from "three";

export const GRID_SIZE = 7;
export const TILE_COUNT = GRID_SIZE * GRID_SIZE;

const TILE_SIZE = 1;
const HALF = GRID_SIZE / 2;
const SOIL_HEIGHT = 1.72;
const GRASS_LIP = 0.14;
const ISLAND_SIZE = GRID_SIZE;

function createRandom(seed: number) {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function tileCoordinates(id: number) {
  const index = id - 1;
  const row = Math.floor(index / GRID_SIZE);
  const column = index % GRID_SIZE;

  return {
    row,
    column,
    x: column * TILE_SIZE + TILE_SIZE / 2 - HALF,
    z: row * TILE_SIZE + TILE_SIZE / 2 - HALF,
  };
}

export function tileLabel(id: number) {
  const { row, column } = tileCoordinates(id);
  return `Tile ${id}, row ${row + 1}, column ${column + 1}, empty`;
}

function GrassGrid() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const y = GRASS_LIP / 2 + 0.012;

    for (let index = 0; index <= GRID_SIZE; index += 1) {
      const edge = -HALF + index * TILE_SIZE;
      positions.push(-HALF, y, edge, HALF, y, edge);
      positions.push(edge, y, -HALF, edge, y, HALF);
    }

    const buffer = new BufferGeometry();
    buffer.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return buffer;
  }, []);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#6aa63f" transparent opacity={0.42} />
    </lineSegments>
  );
}

function TileHitbox({
  id,
  isActive,
  onHover,
  onSelect,
}: {
  id: number;
  isActive: boolean;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
}) {
  const mesh = useRef<Mesh>(null);
  const { x, z } = tileCoordinates(id);
  const targetY = isActive ? 0.045 : 0.004;

  useFrame(() => {
    if (!mesh.current) {
      return;
    }

    mesh.current.position.y += (targetY - mesh.current.position.y) * 0.22;
  });

  return (
    <mesh
      ref={mesh}
      position={[x, 0.004, z]}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(id);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(id);
      }}
    >
      <boxGeometry args={[TILE_SIZE * 0.96, 0.05, TILE_SIZE * 0.96]} />
      <meshLambertMaterial
        color={isActive ? "#c6e878" : "#98d45c"}
        transparent
        opacity={isActive ? 0.92 : 0}
      />
    </mesh>
  );
}

function GrassTufts() {
  const tufts = useMemo(() => {
    const random = createRandom(49);
    const items: {
      position: [number, number, number];
      rotation: number;
      scale: number;
    }[] = [];

    for (let id = 1; id <= TILE_COUNT; id += 1) {
      if (id === 11 || random() > 0.38) {
        continue;
      }

      const { x, z } = tileCoordinates(id);
      items.push({
        position: [
          x + (random() - 0.5) * 0.62,
          GRASS_LIP / 2 + 0.02,
          z + (random() - 0.5) * 0.62,
        ],
        rotation: random() * Math.PI,
        scale: 0.7 + random() * 0.5,
      });
    }

    return items;
  }, []);

  return (
    <group>
      {tufts.map((tuft, index) => (
        <group
          key={index}
          position={tuft.position}
          rotation={[0, tuft.rotation, 0]}
          scale={tuft.scale}
        >
          <mesh position={[-0.04, 0.07, 0]} rotation={[0.15, 0, 0.45]}>
            <boxGeometry args={[0.028, 0.16, 0.018]} />
            <meshLambertMaterial color="#5fa03a" />
          </mesh>
          <mesh position={[0.04, 0.07, 0]} rotation={[0.1, 0, -0.48]}>
            <boxGeometry args={[0.028, 0.16, 0.018]} />
            <meshLambertMaterial color="#4f8f32" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SoilPebbles() {
  const pebbles = useMemo(() => {
    const random = createRandom(20260830);
    const items: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
      color: string;
    }[] = [];
    const half = ISLAND_SIZE / 2 - 0.01;
    const colors = ["#6a4a2c", "#5c4027", "#7a5734", "#4e3722"];

    for (let index = 0; index < 86; index += 1) {
      const face = index % 4;
      const along = (random() - 0.5) * (ISLAND_SIZE - 0.35);
      const height = -GRASS_LIP / 2 - 0.18 - random() * (SOIL_HEIGHT - 0.45);
      const radius = 0.07 + random() * 0.11;
      const position: [number, number, number] =
        face === 0
          ? [half, height, along]
          : face === 1
            ? [-half, height, along]
            : face === 2
              ? [along, height, half]
              : [along, height, -half];

      items.push({
        position,
        rotation: [
          face < 2 ? Math.PI / 2 : 0,
          face >= 2 ? Math.PI / 2 : 0,
          random() * Math.PI,
        ],
        scale: [radius, radius * (0.35 + random() * 0.25), radius],
        color: colors[index % colors.length],
      });
    }

    return items;
  }, []);

  return (
    <group>
      {pebbles.map((pebble, index) => (
        <mesh
          key={index}
          position={pebble.position}
          rotation={pebble.rotation}
          scale={pebble.scale}
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshLambertMaterial color={pebble.color} />
        </mesh>
      ))}
    </group>
  );
}

function VillageSign({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null);

  useFrame((state) => {
    if (!group.current || !animate) {
      return;
    }

    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.04;
  });

  return (
    <group ref={group} position={[0, 0, -2.15]} rotation={[0, Math.PI / 5, 0]}>
      <mesh position={[0, 0.78, 0]} castShadow>
        <boxGeometry args={[0.13, 1.42, 0.13]} />
        <meshLambertMaterial color="#c9a06a" />
      </mesh>
      <mesh position={[0, 1.42, 0.04]} castShadow>
        <boxGeometry args={[1.15, 0.72, 0.1]} />
        <meshLambertMaterial color="#d7b07a" />
      </mesh>
      <mesh position={[0, 1.42, 0.055]}>
        <boxGeometry args={[1.02, 0.08, 0.02]} />
        <meshLambertMaterial color="#c49a62" />
      </mesh>
      <mesh position={[0, 1.28, 0.1]}>
        <boxGeometry args={[0.07, 0.16, 0.05]} />
        <meshLambertMaterial color="#5b3d24" />
      </mesh>
      <mesh position={[-0.12, 1.5, 0.1]} rotation={[0, 0, 0.55]} scale={[1, 0.55, 0.45]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshLambertMaterial color="#5b3d24" />
      </mesh>
      <mesh position={[0.12, 1.52, 0.1]} rotation={[0, 0, -0.55]} scale={[1, 0.55, 0.45]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshLambertMaterial color="#5b3d24" />
      </mesh>
      <mesh position={[0.18, 0.01, 0.28]} rotation={[-Math.PI / 2, 0, 0.4]}>
        <circleGeometry args={[0.42, 16]} />
        <meshBasicMaterial color="#2f5a28" transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

type VillageIslandProps = {
  hoveredTile: number | null;
  selectedTile: number | null;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
  animate: boolean;
};

export function VillageIsland({
  hoveredTile,
  selectedTile,
  onHover,
  onSelect,
  animate,
}: VillageIslandProps) {
  const tiles = useMemo(
    () => Array.from({ length: TILE_COUNT }, (_, index) => index + 1),
    [],
  );

  return (
    <group>
      <mesh position={[0, GRASS_LIP / 2, 0]} receiveShadow>
        <boxGeometry args={[ISLAND_SIZE + 0.08, GRASS_LIP, ISLAND_SIZE + 0.08]} />
        <meshLambertMaterial attach="material-0" color="#7bb84a" />
        <meshLambertMaterial attach="material-1" color="#6fa842" />
        <meshLambertMaterial attach="material-2" color="#98d45c" />
        <meshLambertMaterial attach="material-3" color="#4f8a32" />
        <meshLambertMaterial attach="material-4" color="#7bb84a" />
        <meshLambertMaterial attach="material-5" color="#6fa842" />
      </mesh>

      <GrassGrid />
      <GrassTufts />

      {tiles.map((id) => (
        <TileHitbox
          key={id}
          id={id}
          isActive={hoveredTile === id || selectedTile === id}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      <mesh position={[0, -SOIL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[ISLAND_SIZE, SOIL_HEIGHT, ISLAND_SIZE]} />
        <meshLambertMaterial attach="material-0" color="#6b4a2c" />
        <meshLambertMaterial attach="material-1" color="#8a6240" />
        <meshLambertMaterial attach="material-2" color="#7a5534" />
        <meshLambertMaterial attach="material-3" color="#3f2b1c" />
        <meshLambertMaterial attach="material-4" color="#7a5534" />
        <meshLambertMaterial attach="material-5" color="#5c3f26" />
      </mesh>

      <SoilPebbles />
      <VillageSign animate={animate} />
    </group>
  );
}
