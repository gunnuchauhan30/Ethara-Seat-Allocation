import { Suspense, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Float, Html, Sphere } from "@react-three/drei";
import * as THREE from "three";
import { Users, Armchair, FolderKanban, Sparkles } from "lucide-react";
import { ErrorBoundary } from "./ErrorBoundary";

/**
 * Interactive 3D hero for the dashboard — four floating glass orbs, one per
 * main section of the app. Hovering lifts + brightens an orb; clicking
 * navigates straight to that page, so the hero doubles as quick-access nav
 * instead of being purely decorative.
 */
interface OrbDef {
  key: string;
  label: string;
  to: string;
  position: [number, number, number];
  scale: number;
  color: string;
  emissive: string;
  Icon: typeof Users;
}

const ORBS: OrbDef[] = [
  { key: "employees", label: "Employees", to: "/employees", position: [-2.4, 0.4, 0], scale: 0.95, color: "#a855f7", emissive: "#7c3aed", Icon: Users },
  { key: "seats", label: "Seats", to: "/seats", position: [-0.75, -0.7, 0.6], scale: 0.8, color: "#60a5fa", emissive: "#3b82f6", Icon: Armchair },
  { key: "projects", label: "Projects", to: "/projects", position: [0.9, 0.7, -0.3], scale: 0.85, color: "#c084fc", emissive: "#a855f7", Icon: FolderKanban },
  { key: "assistant", label: "AI Assistant", to: "/assistant", position: [2.4, -0.3, 0.3], scale: 0.75, color: "#f3f0fa", emissive: "#c084fc", Icon: Sparkles },
];

function Orb({ orb }: { orb: OrbDef }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      const targetScale = (hovered ? 1.18 : 1) * orb.scale;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
      meshRef.current.rotation.y = t * 0.3;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    navigate(orb.to);
  };

  return (
    <Float speed={1.6} rotationIntensity={0.4} floatIntensity={1.3}>
      <group position={orb.position}>
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(false);
            document.body.style.cursor = "auto";
          }}
        >
          <Sphere args={[0.62, 48, 48]}>
            <meshPhysicalMaterial
              color={orb.color}
              emissive={orb.emissive}
              emissiveIntensity={hovered ? 0.55 : 0.28}
              roughness={0.15}
              metalness={0.1}
              transmission={0.85}
              thickness={0.6}
              ior={1.3}
              transparent
              opacity={0.92}
            />
          </Sphere>
        </mesh>
        <Html center distanceFactor={8} position={[0, -0.95, 0]} style={{ pointerEvents: "none" }}>
          <div
            className={`flex flex-col items-center gap-1 whitespace-nowrap transition-opacity duration-200 ${
              hovered ? "opacity-100" : "opacity-70"
            }`}
          >
            <orb.Icon size={14} className="text-white/90" />
            <span className="text-[11px] font-medium text-white/90">{orb.label}</span>
          </div>
        </Html>
      </group>
    </Float>
  );
}

function Scene() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.08) * 0.08;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.7} />
      <pointLight position={[5, 5, 5]} intensity={45} color="#a855f7" />
      <pointLight position={[-5, -3, 2]} intensity={30} color="#60a5fa" />
      <pointLight position={[0, 3, 4]} intensity={20} color="#ffffff" />

      {ORBS.map((orb) => (
        <Orb key={orb.key} orb={orb} />
      ))}
    </group>
  );
}

export function DashboardHero3D() {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-2xl sm:h-72">
      <ErrorBoundary
        fallback={
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet/20 via-surface-2 to-blue-glow/10">
            <p className="text-sm text-muted">3D view unavailable in this browser</p>
          </div>
        }
      >
        <Canvas
          camera={{ position: [0, 0, 5.2], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </ErrorBoundary>
      <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-void/40 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-sm">
        Click a sphere to jump to that section
      </div>
    </div>
  );
}
