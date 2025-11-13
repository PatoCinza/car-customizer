import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import './CarViewer3D.css'

/**
 * Model component that loads and displays the 3D car model
 * Handles texture updates when a baked texture is provided
 */
function Model({ url, bakedTexture }) {
  const group = useRef()
  const [gltf, setGltf] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Load the GLTF model
    const loadModel = async () => {
      try {
        const loader = new GLTFLoader()
        loader.load(
          url,
          (gltf) => {
            setGltf(gltf)
            setError(null)
          },
          undefined,
          (error) => {
            console.error('Model loading error:', error)
            setError('Failed to load model')
          }
        )
      } catch (err) {
        console.error('Error loading model:', err)
        setError('Error loading model')
      }
    }

    loadModel()
  }, [url])

  // Update texture when baked texture changes
  useEffect(() => {
    if (gltf && bakedTexture) {
      gltf.scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const canvas = bakedTexture
          const texture = new THREE.CanvasTexture(canvas)
          texture.needsUpdate = true

          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              mat.map = texture
              mat.needsUpdate = true
            })
          } else {
            child.material.map = texture
            child.material.needsUpdate = true
          }
        }
      })
    }
  }, [bakedTexture, gltf])

  if (error) {
    return (
      <group ref={group}>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      </group>
    )
  }

  if (!gltf) {
    return (
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color="#888" wireframe />
        </mesh>
      </group>
    )
  }

  return <primitive ref={group} object={gltf.scene} />
}

/**
 * CarViewer3D Component
 * Renders a 3D car model with orbit controls
 * Props:
 *   - modelUrl: URL to the GLB/glTF file
 *   - bakedTexture: Canvas element with the baked texture (optional)
 */
function CarViewer3D({ modelUrl, bakedTexture }) {
  return (
    <div className="car-viewer-3d">
      <div className="viewer-info">
        <p>Use mouse to rotate, scroll to zoom</p>
      </div>
      <Canvas
        camera={{
          position: [0, 1.5, 3],
          fov: 50,
          near: 0.1,
          far: 1000
        }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Lighting setup */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
        />
        <pointLight position={[-5, 5, 5]} intensity={0.5} />

        {/* Model with interactive controls */}
        <Model url={modelUrl} bakedTexture={bakedTexture} />

        {/* Orbit controls for camera interaction */}
        <OrbitControls
          autoRotate={false}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
        />
      </Canvas>
    </div>
  )
}

export default CarViewer3D
