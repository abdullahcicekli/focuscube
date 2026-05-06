import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Environment, OrbitControls, RoundedBox, Text } from "@react-three/drei"
import * as THREE from "three"

import { createScreenTexture, type ScreenContent } from "@/lib/screenTexture"

type Props = {
  screen: ScreenContent
  running: boolean
  paused: boolean
  rollSignal: number
  rollDir: 1 | -1 | 0
  color?: string
  autoRotate?: boolean
  onUserRotate?: () => void
}

const QUARTER = Math.PI / 2

const LABEL_FONT = "/fonts/TBJSerialPortMonospaceDemo-Md-BF69d4cbd67cc03.ttf"
const LABEL_COLOR = "#2a2218"
const FACE_OFFSET = 1.001

type FaceLabelDef = {
  text: string
  position: [number, number, number]
  rotation: [number, number, number]
  size: number
}

// All labels share the same cube-local orientation: text "up" points to -Z
// (cube back). Each face's rotation orients its plane normal outward while
// keeping text-up consistent.
const FACE_LABELS: ReadonlyArray<FaceLabelDef> = [
  { text: "1%", position: [0, FACE_OFFSET, 0], rotation: [-QUARTER, 0, 0], size: 0.6 },
  { text: "5", position: [FACE_OFFSET, 0, 0], rotation: [0, QUARTER, -QUARTER], size: 0.7 },
  { text: "25", position: [-FACE_OFFSET, 0, 0], rotation: [0, -QUARTER, QUARTER], size: 0.6 },
  { text: "60", position: [0, -FACE_OFFSET, 0], rotation: [QUARTER, 0, Math.PI], size: 0.6 },
]

type RollAnim = {
  start: number
  cubeFrom: number
  cubeTo: number
  screenFrom: number
  screenTo: number
  dir: 1 | -1
}

const SCREEN_PHASE_START = 0.55
const CUBE_PHASE_END = 0.85

function roundedRectGeometry(
  width: number,
  height: number,
  radius: number,
  normalizeUV = false
) {
  const w = width / 2
  const h = height / 2
  const r = Math.min(radius, Math.min(w, h))
  const shape = new THREE.Shape()
  shape.moveTo(-w + r, -h)
  shape.lineTo(w - r, -h)
  shape.quadraticCurveTo(w, -h, w, -h + r)
  shape.lineTo(w, h - r)
  shape.quadraticCurveTo(w, h, w - r, h)
  shape.lineTo(-w + r, h)
  shape.quadraticCurveTo(-w, h, -w, h - r)
  shape.lineTo(-w, -h + r)
  shape.quadraticCurveTo(-w, -h, -w + r, -h)
  const geom = new THREE.ShapeGeometry(shape, 16)
  if (normalizeUV) {
    const uvs = geom.attributes.uv
    for (let i = 0; i < uvs.count; i++) {
      const u = (uvs.getX(i) + w) / width
      const v = (uvs.getY(i) + h) / height
      uvs.setXY(i, u, v)
    }
    uvs.needsUpdate = true
  }
  return geom
}

function CubeMesh({
  screen,
  paused,
  rollSignal,
  rollDir,
  autoRotate = false,
  color = "#c9b794",
}: Props) {
  const cubeGroup = useRef<THREE.Group>(null!)
  const screenGroup = useRef<THREE.Group>(null!)
  const animRef = useRef<RollAnim | null>(null)
  const baseZ = useRef(0)
  const screenZ = useRef(0)

  // 90° tip on Z. Silicone + bezel rotate together; only the digit screen
  // counter-rotates near the end so the text lands upright.
  useEffect(() => {
    if (rollSignal === 0 || rollDir === 0) return
    const dir = rollDir as 1 | -1
    const cubeFrom = baseZ.current
    const cubeTo = cubeFrom + dir * -QUARTER
    const screenFrom = screenZ.current
    const screenTo = -cubeTo
    animRef.current = {
      start: performance.now(),
      cubeFrom,
      cubeTo,
      screenFrom,
      screenTo,
      dir,
    }
    baseZ.current = cubeTo
    screenZ.current = screenTo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rollSignal])

  // Bezel/screen geometries — bezel matches the cube face shape exactly.
  const bezelGeom = useMemo(() => roundedRectGeometry(1.5, 1.5, 0.18), [])
  const screenGeom = useMemo(
    () => roundedRectGeometry(1.3, 1.3, 0.14, true),
    []
  )
  useEffect(() => {
    return () => {
      bezelGeom.dispose()
      screenGeom.dispose()
    }
  }, [bezelGeom, screenGeom])

  // Live screen texture
  const screenKey =
    screen.kind === "minutes"
      ? `m:${screen.minutes}`
      : `ms:${screen.minutes}:${screen.seconds}`
  const screenTexture = useMemo(
    () => createScreenTexture(screen),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [screenKey]
  )
  useEffect(() => {
    return () => {
      screenTexture.dispose()
    }
  }, [screenTexture])

  useFrame((state, delta) => {
    const cg = cubeGroup.current
    const sg = screenGroup.current
    if (!cg || !sg) return
    const anim = animRef.current
    if (anim) {
      const dur = 600
      const u = Math.min(1, (performance.now() - anim.start) / dur)

      // Cube body + bezel tip together over the first 85% of the timeline.
      const cu = Math.min(1, u / CUBE_PHASE_END)
      const cubeEased = 1 - Math.pow(1 - cu, 3)
      cg.rotation.z =
        anim.cubeFrom + (anim.cubeTo - anim.cubeFrom) * cubeEased

      // Digits: hold previous compensation in phase 1 (so they spin with the
      // cube), then ease into the new compensation so they land upright.
      if (u < SCREEN_PHASE_START) {
        sg.rotation.z = anim.screenFrom
      } else {
        const su = (u - SCREEN_PHASE_START) / (1 - SCREEN_PHASE_START)
        const sEased = 1 - Math.pow(1 - su, 3)
        sg.rotation.z =
          anim.screenFrom + (anim.screenTo - anim.screenFrom) * sEased
      }

      const arc = Math.sin(u * Math.PI)
      cg.position.x = anim.dir * 0.14 * arc
      cg.position.y = 0.05 * arc

      if (u >= 1) {
        animRef.current = null
        cg.rotation.z = anim.cubeTo
        sg.rotation.z = anim.screenTo
        cg.position.x = 0
        cg.position.y = 0
      }
    } else {
      cg.rotation.z = THREE.MathUtils.damp(
        cg.rotation.z,
        baseZ.current,
        14,
        delta
      )
      sg.rotation.z = THREE.MathUtils.damp(
        sg.rotation.z,
        screenZ.current,
        14,
        delta
      )
      cg.position.x = THREE.MathUtils.damp(cg.position.x, 0, 10, delta)
      cg.position.y = THREE.MathUtils.damp(cg.position.y, 0, 10, delta)
      const pulse = paused
        ? 1 + Math.sin(state.clock.elapsedTime * 3.5) * 0.012
        : 1
      cg.scale.setScalar(pulse)

      // Idle loop — DOWN → LEFT → UP → RIGHT, repeating. X and Y at the
      // same frequency 90° out of phase trace a clean ellipse so every side
      // face surfaces in turn. Amplitudes ramp from 0 over ~5s so the cube
      // starts dead-on facing the camera and eases into the loop.
      if (autoRotate) {
        const t = state.clock.elapsedTime
        const phase = t * 0.22
        const ramp = THREE.MathUtils.smoothstep(t, 0, 5)
        cg.rotation.x = Math.cos(phase) * 0.55 * ramp
        cg.rotation.y = -Math.sin(phase) * 0.44 * ramp
      } else {
        // Once the user takes over, return the cube to its identity pose
        // so OrbitControls' azimuth/polar limits stay relative to the
        // screen-facing front, not whatever angle the idle loop left.
        cg.rotation.x = THREE.MathUtils.damp(cg.rotation.x, 0, 6, delta)
        cg.rotation.y = THREE.MathUtils.damp(cg.rotation.y, 0, 6, delta)
      }
    }
  })

  return (
    <group ref={cubeGroup}>
      {/* Silicone enclosure — visible warm beige so the 3D form reads */}
      <RoundedBox
        args={[2, 2, 2]}
        radius={0.28}
        smoothness={8}
        creaseAngle={0.4}
        castShadow
        receiveShadow
      >
        <meshPhysicalMaterial
          color={color}
          roughness={0.45}
          clearcoat={0.22}
          clearcoatRoughness={0.5}
          sheen={0}
          envMapIntensity={0.25}
        />
      </RoundedBox>

      {/* Bezel — rotates with the cube body */}
      <mesh position={[0, 0, 1.001]} geometry={bezelGeom}>
        <meshStandardMaterial
          color="#0a0a0c"
          roughness={0.55}
          metalness={0}
        />
      </mesh>

      {/* Digit screen — only lit pixels are opaque; counter-rotates near the
          end so the text lands upright after the tip. */}
      <group ref={screenGroup}>
        <mesh position={[0, 0, 1.012]} geometry={screenGeom}>
          <meshStandardMaterial
            map={screenTexture}
            emissive={"#ffffff"}
            emissiveMap={screenTexture}
            emissiveIntensity={0.7}
            roughness={0.35}
            metalness={0}
            transparent
            alphaTest={0.05}
          />
        </mesh>
      </group>

      {/* Mode labels engraved on the five non-screen faces */}
      {FACE_LABELS.map((face) => (
        <Text
          key={face.text}
          position={face.position}
          rotation={face.rotation}
          font={LABEL_FONT}
          fontSize={face.size}
          color={LABEL_COLOR}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.02}
        >
          {face.text}
        </Text>
      ))}
    </group>
  )
}

export function FocusCube3D(props: Props) {
  const [grabbing, setGrabbing] = useState(false)
  const { autoRotate = false, onUserRotate, ...rest } = props
  return (
    <Canvas
      camera={{ position: [0.25, 0.7, 5.8], fov: 30 }}
      shadows
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 2]}
      style={{ cursor: grabbing ? "grabbing" : "grab", touchAction: "none" }}
      onPointerDown={() => setGrabbing(true)}
      onPointerUp={() => setGrabbing(false)}
      onPointerLeave={() => setGrabbing(false)}
    >
      <ambientLight intensity={0.1} />
      {/* Two pure-axis key lights — Key1 along +X, Key2 along +Z.
          Y component is exactly 0 on both, so the top (+Y) face receives no
          direct light from either key and falls into shadow alongside the
          left (-X) and bottom (-Y) faces — matching the soft gradient those
          faces already showed under the previous setup. */}
      <directionalLight
        position={[5, 0, 0]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0003}
      />
      <directionalLight position={[0, 0, 5]} intensity={1.0} />
      <directionalLight position={[-4, 1, -1]} intensity={0.32} />
      <directionalLight position={[0, -3, 4]} intensity={0.2} />
      {/* Rim lights at Y=0 so the top face isn't lit from above. */}
      <directionalLight position={[-5, 0, -3]} intensity={0.35} color="#fff2d9" />
      <directionalLight position={[5, 0, -3]} intensity={0.3} color="#dde6ff" />
      <Suspense fallback={null}>
        <CubeMesh {...rest} autoRotate={autoRotate} />
        <Environment preset="apartment" />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.8}
        onStart={onUserRotate}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
        minAzimuthAngle={-Math.PI * 0.22}
        maxAzimuthAngle={Math.PI * 0.22}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.18, 0]}
        receiveShadow
      >
        <circleGeometry args={[2.6, 64]} />
        <shadowMaterial transparent opacity={0.32} />
      </mesh>
    </Canvas>
  )
}
