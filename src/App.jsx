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

  // Fixed car model URL - uses local generic sedan car model
  const carModelUrl = new URL('./assets/generic_sedan_car_gltf/scene.gltf', import.meta.url).href

  // Store placed zones with their logos
  const [placedZones, setPlacedZones] = useState({})

  // Store the final texture that has been baked
  const [bakedTexture, setBakedTexture] = useState(null)

  // Store the UV map extracted from the model
  const [uvMapImage, setUVMapImage] = useState(null)

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

  const handleZoneUpdate = (zoneId, logoData) => {
    setPlacedZones(prev => ({
      ...prev,
      [zoneId]: logoData
    }))
  }

  const handleBakeTexture = (textureCanvas) => {
    setBakedTexture(textureCanvas)
  }

  const handleUVMapExtracted = (uvMapCanvas) => {
    setUVMapImage(uvMapCanvas)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Oi Gabe</h1>
      </header>

      <div className="container">
        <div className="viewer-section">
          <CarViewer3D
            modelUrl={carModelUrl}
            bakedTexture={bakedTexture}
            onUVMapExtracted={handleUVMapExtracted}
          />
        </div>

        <div className="editor-section">
          <UVMapEditor
            uploadedLogo={uploadedLogo}
            onLogoUpload={handleLogoUpload}
            placedZones={placedZones}
            onZoneUpdate={handleZoneUpdate}
            onBakeTexture={handleBakeTexture}
            uvMapImage={uvMapImage}
          />
        </div>
      </div>
    </div>
  )
}

export default App
