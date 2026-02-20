import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import type { Frame } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { FrameMesh3D } from './FrameMesh3D'

export interface FrameMeshTransform {
  x: number
  y: number
  z: number
  width: number
  height: number
  frameDepth: number
}

export function frameToMesh(
  frame: Frame,
  wallWidth: number,
  wallHeight: number,
): FrameMeshTransform {
  return {
    x: (frame.x + frame.width / 2 - wallWidth / 2) / 100,
    y: (wallHeight / 2 - frame.y - frame.height / 2) / 100,
    z: frame.frameWidth / 200,
    width: frame.width / 100,
    height: frame.height / 100,
    frameDepth: frame.frameWidth / 100,
  }
}

export function getMatDimensions(frame: Frame): { width: number; height: number } {
  const inset = frame.matEnabled ? frame.matWidth * 2 : 0
  return {
    width: Math.max(frame.width - inset, 0),
    height: Math.max(frame.height - inset, 0),
  }
}

export function WallScene() {
  const wall = useAppStore((state) => state.wall)
  const frames = useAppStore((state) => state.frames)

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 10]} intensity={0.8} castShadow />

        <mesh>
          <planeGeometry args={[wall.width / 100, wall.height / 100]} />
          <meshStandardMaterial color={wall.color} />
        </mesh>

        {frames.map((frame) => (
          <FrameMesh3D
            key={frame.id}
            frame={frame}
            wallWidth={wall.width}
            wallHeight={wall.height}
          />
        ))}

        <OrbitControls
          minDistance={1}
          maxDistance={10}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
          enablePan
          enableZoom
        />

        <ContactShadows
          position={[0, -wall.height / 200, 0]}
          opacity={0.4}
          scale={10}
          blur={2}
        />
      </Canvas>
    </div>
  )
}

export default WallScene
