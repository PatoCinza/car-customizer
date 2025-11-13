import { useState, useEffect, useRef } from 'react'
import { Canvas, Rect, Text, Image } from 'fabric'
import './UVMapEditor.css'

/**
 * Predefined zones on the UV map where logos can be placed
 * Format: { id, name, x, y, width, height } (in normalized coordinates 0-1)
 * These represent areas on the UV map texture for the generic sedan car
 */
const PREDEFINED_ZONES = [
  {
    id: 'zone-hood',
    name: 'Hood',
    x: 0.3,
    y: 0.2,
    width: 0.4,
    height: 0.2,
    color: '#ff6b6b'
  },
  {
    id: 'zone-door-left',
    name: 'Door (Left)',
    x: 0.1,
    y: 0.45,
    width: 0.25,
    height: 0.3,
    color: '#4ecdc4'
  },
  {
    id: 'zone-door-right',
    name: 'Door (Right)',
    x: 0.65,
    y: 0.45,
    width: 0.25,
    height: 0.3,
    color: '#45b7d1'
  },
  {
    id: 'zone-roof',
    name: 'Roof',
    x: 0.3,
    y: 0.0,
    width: 0.4,
    height: 0.15,
    color: '#ffeb3b'
  }
]

/**
 * UVMapEditor Component
 * Manages the UV map canvas with Fabric.js for logo placement
 * Displays UV map from the 3D model and allows logos to snap to zones
 */
function UVMapEditor({
  uploadedLogo,
  onLogoUpload,
  placedZones,
  onZoneUpdate,
  onBakeTexture,
  uvMapImage
}) {
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [textureCanvas, setTextureCanvas] = useState(null)
  const [canvasSize, setCanvasSize] = useState(400)

  // Initialize Fabric.js canvas with UV map
  useEffect(() => {
    if (!canvasRef.current) return

    // Fixed canvas size for consistent layout
    const size = 600
    setCanvasSize(size)

    const canvas = new Canvas(canvasRef.current, {
      width: size,
      height: size,
      backgroundColor: 'transparent'
    })

    fabricCanvasRef.current = canvas

    // Draw zones on the transparent canvas
    // UV map background is handled by CSS/container
    drawZones(canvas, size)

    return () => {
      canvas.dispose()
    }
  }, [uvMapImage])

  // Update the canvas container background with UV map
  useEffect(() => {
    const container = canvasRef.current?.parentElement
    if (container && uvMapImage) {
      const bgUrl = uvMapImage.toDataURL('image/png')
      container.style.backgroundImage = `url(${bgUrl})`
      container.style.backgroundSize = 'cover'
      container.style.backgroundPosition = 'center'
    }
  }, [uvMapImage])

  /**
   * Draw the predefined zones on the canvas
   * Zones are drawn based on canvas size for proper scaling
   */
  const drawZones = (canvas, size = 400) => {
    PREDEFINED_ZONES.forEach((zone) => {
      const rect = new Rect({
        left: zone.x * size,
        top: zone.y * size,
        width: zone.width * size,
        height: zone.height * size,
        fill: 'transparent',
        stroke: zone.color,
        strokeWidth: 2,
        selectable: false,
        evented: false,
        data: { type: 'zone', zoneId: zone.id }
      })

      const text = new Text(zone.name, {
        left: zone.x * size + 5,
        top: zone.y * size + 5,
        fill: zone.color,
        fontSize: 12,
        selectable: false,
        evented: false
      })

      canvas.add(rect, text)
    })

    canvas.renderAll()
  }

  /**
   * Handle logo upload
   */
  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onLogoUpload(file)
    }
  }

  /**
   * Place logo in selected zone
   * Snaps the logo to the zone boundaries
   */
  const placeLogoInZone = (zoneId) => {
    if (!uploadedLogo || !fabricCanvasRef.current) return

    const canvas = fabricCanvasRef.current
    const zone = PREDEFINED_ZONES.find((z) => z.id === zoneId)

    if (!zone) return

    const imgElement = new window.Image()
    imgElement.onload = () => {
      const fabricImg = new Image(imgElement, {
        left: zone.x * canvasSize,
        top: zone.y * canvasSize,
        width: zone.width * canvasSize,
        height: zone.height * canvasSize,
        scaleX: 1,
        scaleY: 1,
        selectable: true,
        data: { type: 'logo', zoneId }
      })

      canvas.add(fabricImg)
      canvas.renderAll()

      // Update placed zones state
      onZoneUpdate(zoneId, {
        logoUrl: uploadedLogo.url,
        logoName: uploadedLogo.name,
        zone: zone
      })

      setSelectedZone(zoneId)
    }

    imgElement.src = uploadedLogo.url
  }

  /**
   * Bake the current canvas state into a texture
   * Converts the Fabric.js canvas to a Three.js compatible texture
   */
  const handleBakeTexture = () => {
    if (!fabricCanvasRef.current) return

    console.log('Starting texture bake...')

    // Get the current canvas state as an image
    const dataUrl = fabricCanvasRef.current.toDataURL()
    console.log('Canvas exported, creating texture canvas...')

    // Create a new canvas to use as the texture
    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = 1024
    textureCanvas.height = 1024

    const ctx = textureCanvas.getContext('2d')

    // Start with the UV map background if available
    if (uvMapImage) {
      ctx.drawImage(uvMapImage, 0, 0, 1024, 1024)
    } else {
      // Otherwise fill with dark background
      ctx.fillStyle = '#333333'
      ctx.fillRect(0, 0, 1024, 1024)
    }

    // Load and draw the logos on top
    const img = new window.Image()
    img.onload = () => {
      console.log('Logos loaded, drawing onto texture...')

      // Draw the logos (which are on a transparent canvas) on top
      ctx.drawImage(img, 0, 0, 1024, 1024)

      console.log('Texture baked successfully')
      setTextureCanvas(textureCanvas)
      onBakeTexture(textureCanvas)
    }

    img.onerror = () => {
      console.error('Error loading canvas for baking')
    }

    img.src = dataUrl
  }

  /**
   * Clear selected zone and remove logo
   */
  const clearZone = (zoneId) => {
    if (!fabricCanvasRef.current) return

    // Find and remove logo objects in the zone
    const canvas = fabricCanvasRef.current
    const objectsToRemove = canvas.getObjects().filter((obj) => {
      return obj.data?.zoneId === zoneId && obj.data?.type === 'logo'
    })

    objectsToRemove.forEach((obj) => canvas.remove(obj))
    canvas.renderAll()

    onZoneUpdate(zoneId, null)
    setSelectedZone(null)
  }

  return (
    <div className="uv-map-editor">
      <div className="editor-header">
        <h2>UV Map & Customization</h2>
      </div>

      <div className="editor-content">
        {/* Canvas for UV map */}
        <div className="canvas-container">
          <canvas
            ref={canvasRef}
            className="uv-canvas"
            width={400}
            height={400}
          />
        </div>

        {/* Controls */}
        <div className="editor-controls">
          {/* Logo upload */}
          <div className="control-section">
            <label className="control-label">Upload Logo:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="file-input"
            />
            {uploadedLogo && (
              <p className="uploaded-info">Loaded: {uploadedLogo.name}</p>
            )}
          </div>

          {/* Zone selection and placement */}
          <div className="control-section">
            <label className="control-label">Place Logo in Zone:</label>
            <div className="zone-buttons">
              {PREDEFINED_ZONES.map((zone) => (
                <div key={zone.id} className="zone-button-group">
                  <button
                    className={`zone-btn ${selectedZone === zone.id ? 'active' : ''}`}
                    onClick={() => placeLogoInZone(zone.id)}
                    disabled={!uploadedLogo}
                  >
                    {zone.name}
                  </button>
                  {placedZones[zone.id] && (
                    <button
                      className="clear-btn"
                      onClick={() => clearZone(zone.id)}
                      title="Clear this zone"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bake texture button */}
          <div className="control-section">
            <button
              className="bake-btn primary"
              onClick={handleBakeTexture}
            >
              Bake Texture
            </button>
            <p className="help-text">
              Bake combines all logos into a single texture and updates the 3D model
            </p>
          </div>

          {/* Status info */}
          {Object.keys(placedZones).length > 0 && (
            <div className="status-section">
              <h3>Placed Items:</h3>
              <ul>
                {Object.entries(placedZones).map(([zoneId, data]) => {
                  const zone = PREDEFINED_ZONES.find((z) => z.id === zoneId)
                  return data ? (
                    <li key={zoneId}>
                      {zone?.name}: {data.logoName}
                    </li>
                  ) : null
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UVMapEditor
