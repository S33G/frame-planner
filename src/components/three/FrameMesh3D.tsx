import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import type { Frame } from '@/types'
import { getImageUrl } from '@/services/imageStorage'

export interface FrameMesh3DProps {
  frame: Frame
  wallWidth: number
  wallHeight: number
}

export interface FrameInnerDimensions {
  openingWidth: number
  openingHeight: number
  matWidth: number
  matHeight: number
  artworkWidth: number
  artworkHeight: number
  borderWidth: number
  frameDepth: number
}

function clampSize(value: number): number {
  return Math.max(value, 0)
}

function toMeters(value: number): number {
  return value / 100
}

export function getFrameInnerDimensions(frame: Frame): FrameInnerDimensions {
  const borderWidth = clampSize(frame.frameWidth)
  const frameDepth = clampSize(frame.frameWidth)

  const openingWidth = clampSize(frame.width - borderWidth * 2)
  const openingHeight = clampSize(frame.height - borderWidth * 2)

  const matWidth = frame.matEnabled ? openingWidth : 0
  const matHeight = frame.matEnabled ? openingHeight : 0

  const artworkInset = frame.matEnabled ? clampSize(frame.matWidth) * 2 : 0
  const artworkWidth = clampSize(openingWidth - artworkInset)
  const artworkHeight = clampSize(openingHeight - artworkInset)

  return {
    openingWidth,
    openingHeight,
    matWidth,
    matHeight,
    artworkWidth,
    artworkHeight,
    borderWidth,
    frameDepth,
  }
}

export function FrameMesh3D({ frame, wallWidth, wallHeight }: FrameMesh3DProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    let disposed = false
    let objectUrl: string | null = null

    if (!frame.imageId) {
      setTexture((previous) => {
        previous?.dispose()
        return null
      })
      return
    }

    getImageUrl(frame.imageId).then((url) => {
      if (!url || disposed) return
      objectUrl = url
      new THREE.TextureLoader().load(url, (tex) => {
        if (disposed) {
          tex.dispose()
          return
        }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.needsUpdate = true
        setTexture((previous) => {
          previous?.dispose()
          return tex
        })
      })
    })

    return () => {
      disposed = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [frame.imageId])

  useEffect(() => {
    return () => {
      texture?.dispose()
    }
  }, [texture])

  const meshTransform = useMemo(() => {
    const x = (frame.x + frame.width / 2 - wallWidth / 2) / 100
    const y = (wallHeight / 2 - frame.y - frame.height / 2) / 100
    const z = frame.frameWidth / 200
    return {
      x,
      y,
      z,
      width: frame.width / 100,
      height: frame.height / 100,
    }
  }, [frame, wallWidth, wallHeight])

  const inner = useMemo(() => getFrameInnerDimensions(frame), [frame])

  const borderWidthM = toMeters(inner.borderWidth)
  const frameDepthM = toMeters(inner.frameDepth)

  const openingWidthM = toMeters(inner.openingWidth)
  const openingHeightM = toMeters(inner.openingHeight)

  const matWidthM = toMeters(inner.matWidth)
  const matHeightM = toMeters(inner.matHeight)

  const artworkWidthM = toMeters(inner.artworkWidth)
  const artworkHeightM = toMeters(inner.artworkHeight)

  const textureMaterialProps = texture
    ? { map: texture, color: '#ffffff' }
    : { color: '#E8E8E8' }

  if (frame.shape === 'ellipse') {
    const outerRadius = Math.max(meshTransform.width / 2, 0.001)
    const innerRadius = Math.max(outerRadius - borderWidthM, 0.001)
    const frameRatio = meshTransform.width > 0 ? meshTransform.height / meshTransform.width : 1
    const openingRatio = openingWidthM > 0 ? openingHeightM / openingWidthM : 1
    const artworkRatio = artworkWidthM > 0 ? artworkHeightM / artworkWidthM : 1

    return (
      <group position={[meshTransform.x, meshTransform.y, 0]}>
        <mesh
          position={[0, 0, meshTransform.z]}
          scale={[1, frameRatio, 1]}
        >
          <ringGeometry args={[innerRadius, outerRadius, 64]} />
          <meshStandardMaterial color={frame.frameColor} />
        </mesh>

        {frame.matEnabled && matWidthM > 0 && matHeightM > 0 ? (
          <mesh
            position={[0, 0, meshTransform.z + frameDepthM * 0.1]}
            scale={[1, openingRatio, 1]}
          >
            <circleGeometry args={[Math.max(matWidthM / 2, 0.001), 64]} />
            <meshStandardMaterial color={frame.matColor} />
          </mesh>
        ) : null}

        {artworkWidthM > 0 && artworkHeightM > 0 ? (
          <mesh
            position={[0, 0, meshTransform.z + frameDepthM * 0.15]}
            scale={[1, artworkRatio, 1]}
          >
            <circleGeometry args={[Math.max(artworkWidthM / 2, 0.001), 64]} />
            <meshStandardMaterial {...textureMaterialProps} />
          </mesh>
        ) : null}
      </group>
    )
  }

  const horizontalBarWidth = Math.max(meshTransform.width, 0.001)
  const horizontalBarHeight = Math.max(borderWidthM, 0.001)
  const verticalBarWidth = Math.max(borderWidthM, 0.001)
  const verticalBarHeight = Math.max(meshTransform.height - borderWidthM * 2, 0.001)

  return (
    <group position={[meshTransform.x, meshTransform.y, 0]}>
      <mesh
        position={[0, meshTransform.height / 2 - borderWidthM / 2, meshTransform.z]}
      >
        <boxGeometry args={[horizontalBarWidth, horizontalBarHeight, frameDepthM]} />
        <meshStandardMaterial color={frame.frameColor} />
      </mesh>

      <mesh
        position={[0, -meshTransform.height / 2 + borderWidthM / 2, meshTransform.z]}
      >
        <boxGeometry args={[horizontalBarWidth, horizontalBarHeight, frameDepthM]} />
        <meshStandardMaterial color={frame.frameColor} />
      </mesh>

      <mesh
        position={[-meshTransform.width / 2 + borderWidthM / 2, 0, meshTransform.z]}
      >
        <boxGeometry args={[verticalBarWidth, verticalBarHeight, frameDepthM]} />
        <meshStandardMaterial color={frame.frameColor} />
      </mesh>

      <mesh
        position={[meshTransform.width / 2 - borderWidthM / 2, 0, meshTransform.z]}
      >
        <boxGeometry args={[verticalBarWidth, verticalBarHeight, frameDepthM]} />
        <meshStandardMaterial color={frame.frameColor} />
      </mesh>

      {frame.matEnabled && matWidthM > 0 && matHeightM > 0 ? (
        <mesh position={[0, 0, meshTransform.z + frameDepthM * 0.1]}>
          <planeGeometry args={[matWidthM, matHeightM]} />
          <meshStandardMaterial color={frame.matColor} />
        </mesh>
      ) : null}

      {artworkWidthM > 0 && artworkHeightM > 0 ? (
        <mesh position={[0, 0, meshTransform.z + frameDepthM * 0.15]}>
          <planeGeometry args={[artworkWidthM, artworkHeightM]} />
          <meshStandardMaterial {...textureMaterialProps} />
        </mesh>
      ) : null}
    </group>
  )
}
