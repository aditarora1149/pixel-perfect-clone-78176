import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Grid } from "@react-three/drei";
import { useMemo, useRef, useState, Suspense } from "react";
import type { Mesh, Group } from "three";
import type { RankedRow } from "@/lib/screener";

function Node({ row, onHover }: { row: RankedRow; onHover: (r: RankedRow | null) => void }) {
  const mesh = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // X = valuation (-5..5), Y = momentum (-5..5), Z = quality (-5..5)
  const x = (row.scores.valuation - 50) / 10;
  const y = (row.scores.quantitative - 50) / 10;
  const z = (row.scores.fundamental - 50) / 10;
  const size = 0.15 + Math.min(0.6, Math.max(0.05, 1 - (row.metrics.volatility ?? 0.3)));
  const color =
    row.scores.composite >= 70 ? "#14b8a6" : row.scores.composite >= 55 ? "#3b82f6" : row.scores.composite >= 40 ? "#f59e0b" : "#ef4444";

  useFrame(() => {
    if (mesh.current && hovered) mesh.current.rotation.y += 0.02;
  });

  return (
    <group position={[x, y, z]}>
      <mesh
        ref={mesh}
        scale={hovered ? size * 1.5 : size}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(row); }}
        onPointerOut={() => { setHovered(false); onHover(null); }}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 0.8 : 0.3} roughness={0.4} />
      </mesh>
      {hovered && (
        <Text position={[0, size + 0.3, 0]} fontSize={0.25} color="#ffffff" anchorX="center" anchorY="bottom">
          {row.entry.symbol.replace(".NS", "")}
        </Text>
      )}
    </group>
  );
}

function Scene({ rows, onHover }: { rows: RankedRow[]; onHover: (r: RankedRow | null) => void }) {
  const group = useRef<Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.05;
  });
  return (
    <group ref={group}>
      {rows.map((r) => (
        <Node key={r.entry.symbol} row={r} onHover={onHover} />
      ))}
    </group>
  );
}

export function RiskUniverse3D({ rows }: { rows: RankedRow[] }) {
  const [hovered, setHovered] = useState<RankedRow | null>(null);
  const topRows = useMemo(() => rows.slice(0, 80), [rows]);

  return (
    <div className="relative w-full h-[560px] rounded-lg overflow-hidden border border-border bg-[#05080f]">
      <Canvas camera={{ position: [8, 6, 10], fov: 55 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#3b82f6" />
        <Grid args={[20, 20]} cellColor="#1e293b" sectionColor="#334155" fadeDistance={25} infiniteGrid />
        <Suspense fallback={null}>
          <Scene rows={topRows} onHover={setHovered} />
        </Suspense>
        <OrbitControls enablePan enableZoom enableRotate />
        {/* Axis labels */}
        <Text position={[6, 0, 0]} fontSize={0.4} color="#94a3b8">Valuation →</Text>
        <Text position={[0, 6, 0]} fontSize={0.4} color="#94a3b8">Momentum →</Text>
        <Text position={[0, 0, 6]} fontSize={0.4} color="#94a3b8">Quality →</Text>
      </Canvas>

      <div className="absolute top-3 left-3 text-[10px] text-muted-foreground bg-background/70 backdrop-blur rounded px-2 py-1 border border-border">
        Drag to orbit · scroll to zoom · hover a node
      </div>

      {hovered && (
        <div className="absolute bottom-3 left-3 right-3 md:right-auto md:max-w-sm bg-background/90 backdrop-blur border border-primary/60 rounded p-3 text-xs space-y-1">
          <div className="font-bold text-primary">{hovered.entry.symbol.replace(".NS", "")} · {hovered.entry.name}</div>
          <div className="text-muted-foreground">{hovered.entry.sector} · {hovered.entry.industry}</div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div><div className="text-[9px] text-muted-foreground">Composite</div><div className="font-bold tabular-nums">{hovered.scores.composite.toFixed(0)}</div></div>
            <div><div className="text-[9px] text-muted-foreground">Valuation</div><div className="font-bold tabular-nums">{hovered.scores.valuation.toFixed(0)}</div></div>
            <div><div className="text-[9px] text-muted-foreground">Momentum</div><div className="font-bold tabular-nums">{hovered.scores.quantitative.toFixed(0)}</div></div>
          </div>
        </div>
      )}

      <div className="absolute top-3 right-3 text-[10px] bg-background/70 backdrop-blur rounded px-2 py-1 border border-border space-y-1">
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#14b8a6]" /> Composite ≥ 70</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> 55–70</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> 40–55</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> &lt; 40</div>
      </div>
    </div>
  );
}
