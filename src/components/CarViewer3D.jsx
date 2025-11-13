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
function Model({ url, bakedTexture, onUVMapExtracted }) {
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
          (loadedGltf) => {
            setGltf(loadedGltf)
            setError(null)

            // Extract UV map and existing textures from the model
            extractUVMap(loadedGltf)
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

  /**
   * Extract the UV map and base texture from the loaded model
   * This creates a visual representation of the UV unwrapping
   */
  const extractUVMap = (loadedGltf) => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')

    // Fill with model's existing texture or a neutral background
    let textureImage = null
    let foundTexture = false

    // Traverse the model to find existing textures
    loadedGltf.scene.traverse((node) => {
      if (node.isMesh && node.material && !foundTexture) {
        if (node.material.map) {
          // Use existing texture from the model
          const texture = node.material.map
          const canvas2 = document.createElement('canvas')
          canvas2.width = texture.image.width || 1024
          canvas2.height = texture.image.height || 1024
          const ctx2 = canvas2.getContext('2d')
          ctx2.drawImage(texture.image, 0, 0)
          textureImage = canvas2
          foundTexture = true
        }
      }
    })

    // Draw the texture or create a checkerboard pattern
    if (textureImage) {
      ctx.drawImage(textureImage, 0, 0, canvas.width, canvas.height)
    } else {
      // Create a checkerboard pattern if no texture found
      const squareSize = 32
      for (let y = 0; y < canvas.height; y += squareSize) {
        for (let x = 0; x < canvas.width; x += squareSize) {
          const isEven = ((x / squareSize) + (y / squareSize)) % 2 === 0
          ctx.fillStyle = isEven ? '#333333' : '#444444'
          ctx.fillRect(x, y, squareSize, squareSize)
        }
      }
    }

    // Add a border to indicate the UV bounds
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.strokeRect(0, 0, canvas.width, canvas.height)

    // Send the UV map canvas to parent component
    if (onUVMapExtracted) {
      onUVMapExtracted(canvas)
    }
  }

  // Update texture when baked texture changes
  useEffect(() => {
    if (gltf && bakedTexture) {
      console.log('Applying baked texture to model')

      // Create a new texture from the baked canvas
      const texture = new THREE.CanvasTexture(bakedTexture)
      texture.needsUpdate = true
      texture.colorSpace = THREE.SRGBColorSpace

      gltf.scene.traverse((child) => {
        if (child.isMesh && child.material) {
          console.log('Updating mesh:', child.name)

          if (Array.isArray(child.material)) {
            // Multiple materials
            child.material.forEach((mat) => {
              mat.map = texture
              mat.color.set(0xffffff) // Ensure color doesn't tint texture
              mat.needsUpdate = true
            })
          } else {
            // Single material
            child.material.map = texture
            child.material.color.set(0xffffff) // Ensure color doesn't tint texture
            child.material.needsUpdate = true
          }

          // Force update
          child.material.emissiveIntensity = 1
        }
      })

      console.log('Texture applied successfully')
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
 *   - onUVMapExtracted: Callback when UV map is extracted from model
 */
function CarViewer3D({ modelUrl, bakedTexture, onUVMapExtracted }) {
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
        <Model
          url={modelUrl}
          bakedTexture={bakedTexture}
          onUVMapExtracted={onUVMapExtracted}
        />

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
