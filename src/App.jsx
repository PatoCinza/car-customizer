import { useState } from 'react'
import './App.css'
import CarViewer3D from './components/CarViewer3D'
import UVMapEditor from './components/UVMapEditor'

/**
 * Main App component
 * Manages the global state for the car customization tool
 * Layout: Split screen with 3D view on left, UV map editor on right
 */
function App() {
  // Store uploaded logo data
  const [uploadedLogo, setUploadedLogo] = useState(null)

  // Store the current car model URL
  const [carModelUrl, setCarModelUrl] = useState(
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf'
  )

  // Store placed zones with their logos
  const [placedZones, setPlacedZones] = useState({})

  // Store the final texture that has been baked
  const [bakedTexture, setBakedTexture] = useState(null)

  const handleLogoUpload = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedLogo({
        url: e.target.result,
        name: file.name
      })
    }
    reader.readAsDataURL(file)
  }

  const handleModelUpload = (file) => {
    const url = URL.createObjectURL(file)
    setCarModelUrl(url)
  }

  const handleZoneUpdate = (zoneId, logoData) => {
    setPlacedZones(prev => ({
      ...prev,
      [zoneId]: logoData
    }))
  }

  const handleBakeTexture = (textureCanvas) => {
    setBakedTexture(textureCanvas)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>3D Car Customizer PoC</h1>
        <div className="header-controls">
          <div className="control-group">
            <label>Upload Car Model (GLB/glTF):</label>
            <input
              type="file"
              accept=".glb,.gltf,.zip"
              onChange={(e) => e.target.files && handleModelUpload(e.target.files[0])}
            />
          </div>
        </div>
      </header>

      <div className="container">
        <div className="viewer-section">
          <CarViewer3D
            modelUrl={carModelUrl}
            bakedTexture={bakedTexture}
          />
        </div>

        <div className="editor-section">
          <UVMapEditor
            uploadedLogo={uploadedLogo}
            onLogoUpload={handleLogoUpload}
            placedZones={placedZones}
            onZoneUpdate={handleZoneUpdate}
            onBakeTexture={handleBakeTexture}
          />
        </div>
      </div>
    </div>
  )
}

export default App
