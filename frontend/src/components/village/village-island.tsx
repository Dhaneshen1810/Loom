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
const TILE_GAP = 0.045;
const HALF = GRID_SIZE / 2;
const SOIL_HEIGHT = 1.85;
const GRASS_LIP = 0.16;
const ISLAND_SIZE = GRID_SIZE;
const PALETTE = {
  grassLight: "#d5f07c",
  grassMid: "#9ed84f",
  grassDeep: "#62b03c",
  grassTuft: "#3f7a2c",
  soil: "#c07542",
  soilDark: "#8a4d2d",
  soilDeep: "#5c3320",
  rock: "#8d8680",
  rockLight: "#cbbba6",
  flower: "#f7efe0",
  flowerCenter: "#f0c95a",
  wood: "#c48a4a",
  ink: "#4a2f1d",
  water: "#4f9bb0",
  waterDeep: "#2a5568",
};

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

function GrassTiles() {
  const tiles = useMemo(
    () =>
      Array.from({ length: TILE_COUNT }, (_, index) => {
        const { row, column, x, z } = tileCoordinates(index + 1);
        const shade = (row + column) % 2;

        return {
          id: index + 1,
          x,
          z,
          color: shade === 0 ? PALETTE.grassMid : PALETTE.grassDeep,
        };
      }),
    [],
  );

  return (
    <group>
      {tiles.map((tile) => (
        <mesh
          key={tile.id}
          position={[tile.x, GRASS_LIP / 2 + 0.01, tile.z]}
          receiveShadow
        >
          <boxGeometry args={[TILE_SIZE - TILE_GAP, GRASS_LIP, TILE_SIZE - TILE_GAP]} />
          <meshLambertMaterial color={tile.color} />
        </mesh>
      ))}
    </group>
  );
}

function GrassGrid() {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const y = GRASS_LIP + 0.012;

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
      <lineBasicMaterial color="#4e8a32" transparent opacity={0.28} />
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
  const targetY = isActive ? GRASS_LIP + 0.06 : GRASS_LIP + 0.02;

  useFrame(() => {
    if (!mesh.current) {
      return;
    }

    mesh.current.position.y += (targetY - mesh.current.position.y) * 0.22;
  });

  return (
    <mesh
      ref={mesh}
      position={[x, GRASS_LIP + 0.02, z]}
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
      <boxGeometry args={[TILE_SIZE * 0.92, 0.05, TILE_SIZE * 0.92]} />
      <meshLambertMaterial
        color={isActive ? PALETTE.grassLight : PALETTE.grassMid}
        transparent
        opacity={isActive ? 0.55 : 0}
      />
    </mesh>
  );
}

function GroundDetails() {
  const details = useMemo(() => {
    const random = createRandom(770077);
    const tufts: { position: [number, number, number]; rotation: number; scale: number }[] = [];
    const flowers: { position: [number, number, number]; rotation: number }[] = [];
    const pebbles: {
      position: [number, number, number];
      scale: number;
      color: string;
    }[] = [];

    for (let id = 1; id <= TILE_COUNT; id += 1) {
      if (id === 1) {
        continue;
      }

      const { x, z } = tileCoordinates(id);
      const roll = random();

      if (roll > 0.42) {
        tufts.push({
          position: [
            x + (random() - 0.5) * 0.58,
            GRASS_LIP + 0.02,
            z + (random() - 0.5) * 0.58,
          ],
          rotation: random() * Math.PI,
          scale: 0.75 + random() * 0.55,
        });
      }

      if (random() > 0.72) {
        flowers.push({
          position: [
            x + (random() - 0.5) * 0.5,
            GRASS_LIP + 0.04,
            z + (random() - 0.5) * 0.5,
          ],
          rotation: random() * Math.PI,
        });
      }

      if (random() > 0.78) {
        pebbles.push({
          position: [
            x + (random() - 0.5) * 0.52,
            GRASS_LIP + 0.03,
            z + (random() - 0.5) * 0.52,
          ],
          scale: 0.05 + random() * 0.04,
          color: random() > 0.5 ? PALETTE.rock : PALETTE.rockLight,
        });
      }
    }

    return { tufts, flowers, pebbles };
  }, []);

  return (
    <group>
      {details.tufts.map((tuft, index) => (
        <group
          key={`tuft-${index}`}
          position={tuft.position}
          rotation={[0, tuft.rotation, 0]}
          scale={tuft.scale}
        >
          {[-0.05, 0, 0.05].map((offset, blade) => (
            <mesh
              key={blade}
              position={[offset, 0.07, blade === 1 ? 0.02 : -0.02]}
              rotation={[0.12, 0, blade === 0 ? 0.5 : blade === 2 ? -0.5 : 0]}
            >
              <boxGeometry args={[0.03, 0.16, 0.02]} />
              <meshLambertMaterial color={PALETTE.grassTuft} />
            </mesh>
          ))}
        </group>
      ))}

      {details.flowers.map((flower, index) => (
        <group key={`flower-${index}`} position={flower.position} rotation={[0, flower.rotation, 0]}>
          {[0, 1, 2, 3].map((petal) => (
            <mesh
              key={petal}
              position={[
                Math.cos((petal * Math.PI) / 2) * 0.045,
                0.03,
                Math.sin((petal * Math.PI) / 2) * 0.045,
              ]}
            >
              <sphereGeometry args={[0.035, 6, 5]} />
              <meshLambertMaterial color={PALETTE.flower} />
            </mesh>
          ))}
          <mesh position={[0, 0.04, 0]}>
            <sphereGeometry args={[0.028, 6, 5]} />
            <meshLambertMaterial color={PALETTE.flowerCenter} />
          </mesh>
        </group>
      ))}

      {details.pebbles.map((pebble, index) => (
        <mesh
          key={`pebble-${index}`}
          position={pebble.position}
          scale={[pebble.scale, pebble.scale * 0.55, pebble.scale * 0.85]}
        >
          <sphereGeometry args={[1, 6, 5]} />
          <meshLambertMaterial color={pebble.color} />
        </mesh>
      ))}
    </group>
  );
}

function SoilRocks() {
  const rocks = useMemo(() => {
    const random = createRandom(20260830);
    const items: {
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
      color: string;
    }[] = [];
    const half = ISLAND_SIZE / 2 - 0.02;
    const colors = [PALETTE.rockLight, PALETTE.rock, PALETTE.soilDeep, "#d2b48c"];

    for (let index = 0; index < 58; index += 1) {
      const face = index % 4;
      const along = (random() - 0.5) * (ISLAND_SIZE - 0.5);
      const height = -0.28 - random() * (SOIL_HEIGHT - 0.55);
      const radius = 0.1 + random() * 0.16;
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
        rotation: [random(), random(), random()],
        scale: [radius, radius * (0.55 + random() * 0.3), radius * (0.7 + random() * 0.25)],
        color: colors[index % colors.length],
      });
    }

    return items;
  }, []);

  return (
    <group>
      {rocks.map((rock, index) => (
        <mesh
          key={index}
          position={rock.position}
          rotation={rock.rotation}
          scale={rock.scale}
        >
          <sphereGeometry args={[1, 7, 6]} />
          <meshLambertMaterial color={rock.color} />
        </mesh>
      ))}
    </group>
  );
}

function Shore() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -SOIL_HEIGHT - 0.1, 0]}>
        <circleGeometry args={[12.4, 72]} />
        <meshLambertMaterial color={PALETTE.waterDeep} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -SOIL_HEIGHT + 0.36, 0]}>
        <ringGeometry args={[3.62, 8.9, 72]} />
        <meshLambertMaterial color={PALETTE.water} />
      </mesh>
      {[
        [6.1, 1.4],
        [-5.4, -2.2],
        [2.8, -6.4],
        [-3.6, 5.8],
      ].map(([x, z], index) => (
        <mesh
          key={index}
          rotation={[-Math.PI / 2, 0, index * 0.7]}
          position={[x, -SOIL_HEIGHT + 0.4, z]}
        >
          <circleGeometry args={[0.42 + (index % 2) * 0.12, 10]} />
          <meshLambertMaterial color={PALETTE.grassDeep} />
        </mesh>
      ))}
    </group>
  );
}

function CornerPosts() {
  const half = ISLAND_SIZE / 2 - 0.1;

  return (
    <group>
      {[
        [half, half],
        [half, -half],
        [-half, half],
        [-half, -half],
      ].map(([x, z], index) => (
        <mesh key={index} position={[x, 0.28, z]} castShadow>
          <boxGeometry args={[0.14, 0.62, 0.14]} />
          <meshLambertMaterial color={index % 2 === 0 ? PALETTE.wood : PALETTE.soilDark} />
        </mesh>
      ))}
    </group>
  );
}

function VillageSign({ animate }: { animate: boolean }) {
  const group = useRef<Group>(null);
  const { x, z } = tileCoordinates(1);

  useFrame((state) => {
    if (!group.current || !animate) {
      return;
    }

    group.current.rotation.y =
      Math.PI / 5 + Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
  });

  return (
    <group ref={group} position={[x + 0.08, 0, z + 0.08]}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.11, 1.1, 0.11]} />
        <meshLambertMaterial color={PALETTE.wood} />
      </mesh>
      <mesh position={[0, 1.28, 0.03]} castShadow>
        <boxGeometry args={[0.92, 0.62, 0.08]} />
        <meshLambertMaterial color="#e2c08a" />
      </mesh>
      <mesh position={[0, 1.16, 0.08]}>
        <boxGeometry args={[0.34, 0.22, 0.04]} />
        <meshLambertMaterial color={PALETTE.ink} />
      </mesh>
      <mesh position={[0, 1.38, 0.08]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.28, 0.22, 4]} />
        <meshLambertMaterial color={PALETTE.ink} />
      </mesh>
      <mesh position={[0.22, 0.02, 0.22]} rotation={[-Math.PI / 2, 0, 0.35]}>
        <circleGeometry args={[0.34, 14]} />
        <meshBasicMaterial color="#2f5a28" transparent opacity={0.16} />
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
      <Shore />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -SOIL_HEIGHT - 0.02, 0]}>
        <circleGeometry args={[6.4, 48]} />
        <meshBasicMaterial color="#15241c" transparent opacity={0.42} />
      </mesh>

      <mesh position={[0, GRASS_LIP / 2, 0]} receiveShadow>
        <boxGeometry args={[ISLAND_SIZE + 0.14, GRASS_LIP, ISLAND_SIZE + 0.14]} />
        <meshLambertMaterial attach="material-0" color={PALETTE.grassMid} />
        <meshLambertMaterial attach="material-1" color={PALETTE.grassDeep} />
        <meshLambertMaterial attach="material-2" color={PALETTE.grassLight} />
        <meshLambertMaterial attach="material-3" color={PALETTE.grassDeep} />
        <meshLambertMaterial attach="material-4" color={PALETTE.grassMid} />
        <meshLambertMaterial attach="material-5" color={PALETTE.grassDeep} />
      </mesh>

      <GrassTiles />
      <GrassGrid />
      <GroundDetails />
      <CornerPosts />

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
        <meshLambertMaterial attach="material-0" color={PALETTE.soilDark} />
        <meshLambertMaterial attach="material-1" color={PALETTE.soil} />
        <meshLambertMaterial attach="material-2" color={PALETTE.soil} />
        <meshLambertMaterial attach="material-3" color={PALETTE.soilDeep} />
        <meshLambertMaterial attach="material-4" color={PALETTE.soil} />
        <meshLambertMaterial attach="material-5" color={PALETTE.soilDark} />
      </mesh>

      <mesh position={[0, -SOIL_HEIGHT + 0.2, 0]}>
        <boxGeometry args={[ISLAND_SIZE + 0.06, 0.4, ISLAND_SIZE + 0.06]} />
        <meshLambertMaterial color={PALETTE.soilDeep} />
      </mesh>

      <SoilRocks />
      <VillageSign animate={animate} />
    </group>
  );
}
