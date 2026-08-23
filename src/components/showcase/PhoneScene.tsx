import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  RoundedBox,
  ContactShadows,
  useTexture,
} from "@react-three/drei";
import * as THREE from "three";
import { CHAPTERS, Chapter } from "./chapters";

const W = 2.0;
const H = (W * 1398) / 645;
const ACCENT = "#ffd400";

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

function Finger({ chapter, t }: { chapter: Chapter; t: number }) {
  const ring = useRef<THREE.Mesh>(null);
  const dot = useRef<THREE.Mesh>(null);
  const grp = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!grp.current || !ring.current || !dot.current) return;
    const active = chapter.taps.find((tap) => t >= tap.at - 0.35 && t <= tap.at + 0.85);
    if (!active) {
      grp.current.visible = false;
      return;
    }
    grp.current.visible = true;
    const local = t - active.at;
    const drift = local < 0 ? 1 + Math.abs(local) * 0.6 : 1;
    const swipe = active.kind === "swipe" ? Math.max(0, Math.min(1, local / 0.7)) : 0;
    grp.current.position.set(
      (active.x * W) / 2,
      (active.y * H) / 2 + swipe * H * 0.28,
      0.14
    );
    const press = local < 0 ? 0 : Math.max(0, 1 - local / 0.85);
    const s = 0.16 * drift * (1 + (1 - press) * 1.9);
    ring.current.scale.setScalar(s);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = press * 0.55;
    dot.current.scale.setScalar(0.14 * (0.9 + press * 0.35));
    (dot.current.material as THREE.MeshBasicMaterial).opacity = 0.35 + press * 0.5;
  });

  return (
    <group ref={grp}>
      <mesh ref={ring}>
        <ringGeometry args={[0.72, 1, 48]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.5} />
      </mesh>
      <mesh ref={dot}>
        <circleGeometry args={[1, 40]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function Phone({
  index,
  prevIndex,
  t,
  turn,
}: {
  index: number;
  prevIndex: number;
  t: number;
  turn: number;
}) {
  const group = useRef<THREE.Group>(null);
  const textures = useTexture(CHAPTERS.map((c) => c.img));
  const list = useMemo(() => {
    const arr = Array.isArray(textures) ? textures : [textures];
    arr.forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
    });
    return arr as THREE.Texture[];
  }, [textures]);

  const spin = Math.min(1, turn / 0.95);
  const showing = spin < 0.5 ? prevIndex : index;
  const chapter = CHAPTERS[showing];

  useFrame((state) => {
    if (!group.current) return;
    const time = state.clock.elapsedTime;
    const flip = ease(spin) * Math.PI * 2;
    group.current.rotation.y = flip + Math.sin(time * 0.45) * 0.22;
    group.current.rotation.x = Math.sin(time * 0.33) * 0.06;
    group.current.rotation.z = Math.sin(time * 0.27) * 0.03;
    group.current.position.y = Math.sin(time * 0.6) * 0.07;
    const pop = 1 + Math.sin(ease(spin) * Math.PI) * 0.06;
    group.current.scale.setScalar(pop);
  });

  return (
    <group ref={group}>
      {/* body */}
      <RoundedBox args={[W + 0.16, H + 0.16, 0.2]} radius={0.16} smoothness={6}>
        <meshStandardMaterial color="#171819" metalness={0.85} roughness={0.28} />
      </RoundedBox>
      {/* accent rim */}
      <RoundedBox args={[W + 0.19, H + 0.19, 0.14]} radius={0.17} smoothness={6}>
        <meshStandardMaterial
          color={ACCENT}
          metalness={0.9}
          roughness={0.35}
          emissive={ACCENT}
          emissiveIntensity={0.18}
        />
      </RoundedBox>
      {/* screen */}
      <mesh position={[0, 0, 0.105]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={list[showing]} toneMapped={false} />
      </mesh>
      {/* glass sheen */}
      <mesh position={[0, 0, 0.12]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.04} />
      </mesh>
      {/* back plate glow */}
      <mesh position={[0, 0, -0.14]}>
        <planeGeometry args={[W * 1.5, H * 1.15]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.05} />
      </mesh>
      <Finger chapter={chapter} t={showing === index ? t : t + 99} />
    </group>
  );
}

function Orbiters() {
  const grp = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (grp.current) grp.current.rotation.y = s.clock.elapsedTime * 0.18;
  });
  const items = useMemo(
    () =>
      new Array(14).fill(0).map((_, i) => ({
        a: (i / 14) * Math.PI * 2,
        r: 3.1 + (i % 3) * 0.45,
        y: -2.2 + (i * 0.36) % 4.6,
        s: 0.03 + (i % 4) * 0.012,
      })),
    []
  );
  return (
    <group ref={grp}>
      {items.map((it, i) => (
        <mesh
          key={i}
          position={[Math.cos(it.a) * it.r, it.y, Math.sin(it.a) * it.r]}
        >
          <sphereGeometry args={[it.s, 12, 12]} />
          <meshBasicMaterial color={i % 3 === 0 ? ACCENT : "#8fd3ff"} transparent opacity={0.55} />
        </mesh>
      ))}
    </group>
  );
}

interface Props {
  index: number;
  prevIndex: number;
  t: number;
  turn: number;
}

const PhoneScene = ({ index, prevIndex, t, turn }: Props) => (
  <Canvas
    dpr={[1, 2]}
    camera={{ position: [0, 0, 11], fov: 28 }}
    gl={{ antialias: true, alpha: true }}
  >
    <ambientLight intensity={0.55} />
    <directionalLight position={[4, 6, 6]} intensity={1.5} />
    <directionalLight position={[-5, -2, 3]} intensity={0.7} color="#7fc8ff" />
    <pointLight position={[0, 0, 3]} intensity={12} color={ACCENT} distance={9} />
    <Suspense fallback={null}>
      <Phone index={index} prevIndex={prevIndex} t={t} turn={turn} />
      <Orbiters />
      <ContactShadows
        position={[0, -2.6, 0]}
        opacity={0.5}
        scale={11}
        blur={3}
        far={5}
      />
      <Environment preset="city" />
    </Suspense>
  </Canvas>
);

export default PhoneScene;
