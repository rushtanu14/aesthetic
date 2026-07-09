import { useEffect, useRef } from "react";
import {
  AdditiveBlending,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

type CinematicSceneProps = {
  isPlaying: boolean;
  pulseKey: number;
  sceneMode: number;
  scrollProgress: number;
};

const vertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vPosition;
  uniform vec3 uAccent;
  uniform float uTime;
  void main() {
    float ring = sin((length(vPosition.xz) * 7.0) - uTime * 0.9);
    float line = smoothstep(0.78, 0.97, ring);
    float fade = smoothstep(2.4, 0.1, length(vPosition.xz));
    vec3 base = vec3(0.012, 0.016, 0.014);
    vec3 color = mix(base, uAccent, line * 0.38);
    gl_FragColor = vec4(color, fade * 0.9);
  }
`;

function createFacetTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const gradient = context.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, "#17231d");
  gradient.addColorStop(0.45, "#050706");
  gradient.addColorStop(1, "#6c765e");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 36; i += 1) {
    context.beginPath();
    context.moveTo(Math.random() * 256, Math.random() * 256);
    context.lineTo(Math.random() * 256, Math.random() * 256);
    context.strokeStyle = `rgba(226, 229, 205, ${0.05 + Math.random() * 0.14})`;
    context.lineWidth = 0.5 + Math.random() * 1.7;
    context.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function createDust(count: number) {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 13;
    positions[i * 3 + 1] = Math.random() * 4.8 - 1.9;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
    sizes[i] = 0.02 + Math.random() * 0.09;
  }

  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("size", new BufferAttribute(sizes, 1));

  const material = new PointsMaterial({
    color: 0xd3d9be,
    size: 0.028,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  return new Points(geometry, material);
}

function createShard(index: number) {
  const geometry = new IcosahedronGeometry(0.16 + Math.random() * 0.32, 0);
  const material = new MeshPhysicalMaterial({
    color: new Color("#090c0b"),
    roughness: 0.36,
    metalness: 0.35,
    clearcoat: 0.9,
    clearcoatRoughness: 0.25,
  });
  const shard = new Mesh(geometry, material);
  const side = index % 2 === 0 ? -1 : 1;
  shard.position.set(side * (2.4 + Math.random() * 3.6), Math.random() * 2.2 - 0.4, -1 - Math.random() * 3.6);
  shard.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  shard.scale.setScalar(0.75 + Math.random() * 1.4);
  return shard;
}

export default function CinematicScene({
  isPlaying,
  pulseKey,
  sceneMode,
  scrollProgress,
}: CinematicSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(sceneMode);
  const pointerRef = useRef(new Vector2(0.32, 0.05));
  const pulseRef = useRef(pulseKey);
  const progressRef = useRef(scrollProgress);
  const playingRef = useRef(isPlaying);

  useEffect(() => {
    progressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    modeRef.current = sceneMode;
  }, [sceneMode]);

  useEffect(() => {
    pulseRef.current = pulseKey;
  }, [pulseKey]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new Scene();
    scene.fog = new Fog("#020403", 4.2, 13);

    const camera = new PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0.55, 0.45, 7);

    const renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setClearColor(0x020403, 1);
    mount.appendChild(renderer.domElement);

    const field = new Group();
    scene.add(field);
    const accentPalette = [
      new Color("#9da47c"),
      new Color("#bcc69a"),
      new Color("#79876d"),
    ];

    const ambientLight = new AmbientLight("#aeb79c", 0.42);
    const keyLight = new DirectionalLight("#f0edd0", 2.8);
    keyLight.position.set(4.2, 2.7, 3.5);
    const rimLight = new PointLight("#9da47c", 28, 9, 1.7);
    rimLight.position.set(2.6, 0.75, 2.2);
    scene.add(ambientLight, keyLight, rimLight);

    const texture = createFacetTexture();
    const monolithMaterial = new MeshPhysicalMaterial({
      color: new Color("#050706"),
      map: texture ?? undefined,
      metalness: 0.48,
      roughness: 0.29,
      clearcoat: 1,
      clearcoatRoughness: 0.2,
      reflectivity: 0.58,
    });
    const monolith = new Mesh(new CylinderGeometry(0.72, 0.48, 3.6, 7, 5, false), monolithMaterial);
    monolith.position.set(1.12, 0.42, 0);
    monolith.rotation.set(-0.08, 0.36, 0.11);
    field.add(monolith);

    const beamMaterial = new MeshBasicMaterial({
      color: new Color("#e2e5cd"),
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const beam = new Mesh(new ConeGeometry(0.78, 5.2, 48, 1, true), beamMaterial);
    beam.position.set(3.15, 0.46, 1.1);
    beam.rotation.set(0, 0, Math.PI / 2);
    field.add(beam);

    const floorMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uAccent: { value: new Color("#9da47c") },
      },
      transparent: true,
      depthWrite: false,
    });
    const floor = new Mesh(new PlaneGeometry(14, 10, 96, 96), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.55;
    field.add(floor);

    const dust = createDust(900);
    field.add(dust);

    const shards = Array.from({ length: 18 }, (_, index) => createShard(index));
    shards.forEach((shard) => {
      shard.userData.basePosition = shard.position.clone();
      field.add(shard);
    });

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      renderer.setSize(width, height);
    };

    const onPointerMove = (event: PointerEvent) => {
      const nextX = (event.clientX / window.innerWidth - 0.5) * 2;
      const nextY = (event.clientY / window.innerHeight - 0.5) * -2;
      pointerRef.current.set(nextX, nextY);
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let frame = 0;
    let lastPulseKey = pulseRef.current;
    let pulseEnergy = 0;
    const clock = { time: 0 };

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const velocity = playingRef.current ? 0.008 : 0.0012;
      clock.time += velocity;
      const progress = progressRef.current;
      const pointer = pointerRef.current;
      const mode = modeRef.current % accentPalette.length;
      const modeOffset = mode - 1;
      const targetAccent = accentPalette[mode];

      if (lastPulseKey !== pulseRef.current) {
        lastPulseKey = pulseRef.current;
        pulseEnergy = 1;
      }

      pulseEnergy *= 0.92;

      floorMaterial.uniforms.uTime.value = clock.time * 34;
      floorMaterial.uniforms.uAccent.value.lerp(targetAccent, 0.035);
      beamMaterial.color.lerp(targetAccent, 0.03);
      rimLight.color.lerp(targetAccent, 0.035);
      rimLight.intensity += (28 + pulseEnergy * 28 - rimLight.intensity) * 0.08;

      monolith.rotation.y += playingRef.current ? 0.0035 : 0.0004;
      monolith.rotation.x = -0.08 + Math.sin(clock.time * 1.5) * 0.025 - progress * 0.16 + modeOffset * 0.035;
      monolith.position.y = 0.42 + Math.sin(clock.time * 1.2) * 0.09 - progress * 0.5;
      monolith.position.x = 1.12 - progress * 1.65 + pointer.x * 0.1 + modeOffset * 0.22;
      monolith.scale.setScalar(1 + pulseEnergy * 0.035);

      beam.position.x += (2.8 + pointer.x * 1.35 + modeOffset * 0.28 - beam.position.x) * 0.045;
      beam.position.y += (0.45 + pointer.y * 0.55 + modeOffset * 0.12 - beam.position.y) * 0.045;
      beam.rotation.z = Math.PI / 2 - pointer.y * 0.12;
      beamMaterial.opacity = 0.09 + Math.abs(pointer.x) * 0.028 + progress * 0.055 + pulseEnergy * 0.18;

      field.rotation.y = pointer.x * 0.045 - progress * 0.2 + modeOffset * 0.04;
      field.rotation.x = -pointer.y * 0.025;
      dust.rotation.y -= (playingRef.current ? 0.0009 : 0.0002) + mode * 0.00008;
      dust.position.z = progress * 0.8 + modeOffset * 0.12;

      shards.forEach((shard, index) => {
        const basePosition = shard.userData.basePosition as Vector3;
        const fan = modeOffset * (0.22 + index * 0.008);
        shard.rotation.x += (0.001 + index * 0.00006) * (playingRef.current ? 1 : 0.2);
        shard.rotation.y += (0.0017 + index * 0.00003) * (playingRef.current ? 1 : 0.2);
        shard.position.x += (basePosition.x + fan + pulseEnergy * modeOffset * 0.18 - shard.position.x) * 0.025;
        shard.position.y += (basePosition.y + Math.sin(clock.time * 1.3 + index) * 0.18 - shard.position.y) * 0.025;
        shard.position.z += (basePosition.z + Math.sin(clock.time * 0.9 + index * 1.8) * 0.18 - shard.position.z) * 0.025;
      });

      camera.position.x += (0.55 - progress * 1.35 + pointer.x * 0.22 + modeOffset * 0.22 - camera.position.x) * 0.035;
      camera.position.y += (0.45 + progress * 0.9 + pointer.y * 0.12 - camera.position.y) * 0.035;
      camera.position.z += (7 - progress * 2.35 - pulseEnergy * 0.28 - camera.position.z) * 0.035;
      camera.lookAt(new Vector3(0.55 - progress * 1.1 + modeOffset * 0.12, -0.12, -0.15));

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      renderer.dispose();
      texture?.dispose();
      monolith.geometry.dispose();
      monolithMaterial.dispose();
      beam.geometry.dispose();
      beamMaterial.dispose();
      floor.geometry.dispose();
      floorMaterial.dispose();
      dust.geometry.dispose();
      (dust.material as PointsMaterial).dispose();
      shards.forEach((shard) => {
        shard.geometry.dispose();
        (shard.material as MeshPhysicalMaterial).dispose();
      });
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="cinematic-scene" ref={mountRef} aria-hidden="true" />;
}
