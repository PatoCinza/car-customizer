import { useState, useEffect, useRef } from 'react'
import { Canvas, Rect, Text, Image } from 'fabric'
import './UVMapEditor.css'

/**
 * Predefined zones on the UV map where logos can be placed
 * Format: { id, name, x, y, width, height } (in normalized coordinates 0-1)
 * These represent areas on the UV map texture
 */
const PREDEFINED_ZONES = [
  {
    id: 'zone-front',
    name: 'Front',
    x: 0.25,
    y: 0.1,
    width: 0.5,
    height: 0.3,
    color: '#ff6b6b'
  },
  {
    id: 'zone-side',
    name: 'Side',
    x: 0.05,
    y: 0.45,
    width: 0.35,
    height: 0.4,
    color: '#4ecdc4'
  },
  {
    id: 'zone-back',
    name: 'Back',
    x: 0.25,
    y: 0.6,
    width: 0.5,
    height: 0.3,
    color: '#45b7d1'
  }
]

/**
 * UVMapEditor Component
 * Manages the UV map canvas with Fabric.js for logo placement
 * Displays predefined zones and allows logos to snap to them
 */
function UVMapEditor({
  uploadedLogo,
  onLogoUpload,
  placedZones,
  onZoneUpdate,
  onBakeTexture
}) {
  const canvasRef = useRef(null)
  const fabricCanvasRef = useRef(null)
  const [selectedZone, setSelectedZone] = useState(null)
  const [textureCanvas, setTextureCanvas] = useState(null)

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = new Canvas(canvasRef.current, {
      width: 400,
      height: 400,
      backgroundColor: '#1a1a1a'
    })

    fabricCanvasRef.current = canvas

    // Draw predefined zones
    drawZones(canvas)

    return () => {
      canvas.dispose()
    }
  }, [])

  /**
   * Draw the predefined zones on the canvas
   */
  const drawZones = (canvas) => {
    PREDEFINED_ZONES.forEach((zone) => {
      const rect = new Rect({
        left: zone.x * canvas.width,
        top: zone.y * canvas.height,
        width: zone.width * canvas.width,
        height: zone.height * canvas.height,
        fill: 'transparent',
        stroke: zone.color,
        strokeWidth: 2,
        selectable: false,
        evented: false,
        data: { type: 'zone', zoneId: zone.id }
      })

      const text = new Text(zone.name, {
        left: zone.x * canvas.width + 5,
        top: zone.y * canvas.height + 5,
        fill: zone.color,
        fontSize: 14,
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
        left: zone.x * canvas.width,
        top: zone.y * canvas.height,
        width: zone.width * canvas.width,
        height: zone.height * canvas.height,
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

    // Get the current canvas state as an image
    const dataUrl = fabricCanvasRef.current.toDataURL()

    // Create a new canvas to use as the texture
    const textureCanvas = document.createElement('canvas')
    textureCanvas.width = 512
    textureCanvas.height = 512

    const ctx = textureCanvas.getContext('2d')
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, 512, 512)

    // Load and draw the baked content
    const img = new Image()
    img.onload = () => {
      // Scale to fit the texture canvas
      const scale = Math.min(512 / img.width, 512 / img.height)
      const x = (512 - img.width * scale) / 2
      const y = (512 - img.height * scale) / 2

      ctx.drawImage(
        img,
        x,
        y,
        img.width * scale,
        img.height * scale
      )

      setTextureCanvas(textureCanvas)
      onBakeTexture(textureCanvas)

      alert('Texture baked! The 3D model should now show the updated texture.')
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
