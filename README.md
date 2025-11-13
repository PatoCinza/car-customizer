# 3D Car Customizer PoC

A proof-of-concept for a 3D car customization tool built with React, Three.js, and Fabric.js. This application allows users to view a 3D car model and customize it by placing logos on predefined UV map zones, then baking the modifications into a texture.

## Features

### ✅ Implemented Core Features

1. **3D Car Viewer** - Uses React Three Fiber with orbit controls
   - Rotate, zoom, and pan around the 3D model
   - Loads glTF/GLB models from file system or URL
   - Real-time texture updates
   - Basic lighting setup (ambient, directional, point lights)

2. **UV Map Editor** - Canvas-based editor using Fabric.js
   - Visual representation of the UV map
   - 3 predefined customization zones (Front, Side, Back)
   - Color-coded zone boundaries for easy identification

3. **Logo Upload & Placement**
   - Upload image files as logos (PNG, JPEG, etc.)
   - Place logos in predefined zones
   - Automatic snapping to zone boundaries
   - Clear individual zones

4. **Texture Baking**
   - Combines all placed logos into a single texture
   - Updates the 3D model with the new texture in real-time
   - Creates a 512x512 canvas texture compatible with Three.js

5. **Responsive UI**
   - Split-screen layout (3D view on left, editor on right)
   - Mobile responsive (stacks vertically on smaller screens)
   - Dark theme design

## Project Structure

```
src/
├── components/
│   ├── CarViewer3D.jsx          # 3D model viewer with orbit controls
│   ├── CarViewer3D.css          # Styling for 3D viewer
│   ├── UVMapEditor.jsx          # UV map canvas with Fabric.js
│   └── UVMapEditor.css          # Styling for UV editor
├── App.jsx                       # Main app component with state management
├── App.css                       # Global app styling
├── main.jsx                      # React entry point
└── index.css                     # Global styles
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the Vite development server on `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

## Usage Guide

### 1. Load a Car Model

- Click "Upload Car Model" in the header to select a GLB/glTF file
- A default Damaged Helmet model is loaded for testing
- Supported formats: `.glb`, `.gltf`

### 2. Upload a Logo

- In the UV Map Editor (right panel), click the file input under "Upload Logo"
- Select an image file (PNG, JPEG, etc.)
- The filename will be displayed below the upload button

### 3. Place Logo in Zone

- Click one of the zone buttons (Front, Side, Back) to place the uploaded logo
- The logo will snap to the zone boundaries
- The button highlights in blue when a zone is active
- The "×" button next to the zone clears it

### 4. Adjust and Arrange

- You can place multiple logos in different zones
- Use Fabric.js canvas tools to drag/resize logos before baking
- The placed items list shows all current placements

### 5. Bake Texture

- Click "Bake Texture" to finalize all changes
- This composites all logos onto a single texture
- The 3D model updates automatically with the new texture
- An alert confirms the texture bake is complete

## Technical Details

### Dependencies

- **React 19**: UI framework
- **React Three Fiber**: React renderer for Three.js
- **Three.js**: 3D graphics library
- **@react-three/drei**: Useful helpers (OrbitControls, GLTF loader)
- **Fabric.js**: Canvas manipulation library
- **Vite**: Build tool and dev server

### Key Components Explained

#### CarViewer3D Component (src/components/CarViewer3D.jsx:15-28)

- **Model Component**: Loads and renders the GLTF model
- **Texture Updates**: Watches for baked texture changes and applies them to the model
- **Error Handling**: Shows fallback geometry if model fails to load
- **Lighting**: Basic 3-light setup for proper model illumination

#### UVMapEditor Component (src/components/UVMapEditor.jsx:27-80)

- **PREDEFINED_ZONES**: Hard-coded zone definitions with normalized coordinates (0-1)
- **Fabric.js Canvas**: Custom canvas for logo placement
- **Zone Visualization**: Colored rectangles show zone boundaries
- **Logo Placement**: Snaps images to zone boundaries automatically
- **Texture Baking**: Converts canvas state to Three.js texture

### State Management

The main `App.jsx` component manages:
- `uploadedLogo`: Current logo data and metadata
- `carModelUrl`: URL/path to the 3D model
- `placedZones`: Object tracking logos in each zone
- `bakedTexture`: The final baked canvas texture

## Customization Guide

### Adding More Zones

Edit `PREDEFINED_ZONES` in `src/components/UVMapEditor.jsx`:

```javascript
const PREDEFINED_ZONES = [
  {
    id: 'zone-roof',
    name: 'Roof',
    x: 0.3,      // Normalized X position (0-1)
    y: 0.0,      // Normalized Y position (0-1)
    width: 0.4,  // Width as fraction of canvas
    height: 0.2, // Height as fraction of canvas
    color: '#ff6b6b'
  },
  // ... more zones
]
```

### Changing Colors & Styling

- **3D Background**: Edit `.car-viewer-3d` in `src/components/CarViewer3D.css`
- **Editor Background**: Edit `.uv-map-editor` in `src/components/UVMapEditor.css`
- **Button Colors**: Edit button styles in `src/App.css` and component CSS files

### Adjusting Lighting

In `src/components/CarViewer3D.jsx` (around line 90):

```javascript
<ambientLight intensity={0.5} />
<directionalLight position={[5, 5, 5]} intensity={1} />
<pointLight position={[-5, 5, 5]} intensity={0.5} />
```

### Texture Resolution

To change the baked texture resolution, edit the canvas size in `UVMapEditor.jsx`:

```javascript
const textureCanvas = document.createElement('canvas')
textureCanvas.width = 1024  // Change from 512
textureCanvas.height = 1024
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 13+)
- WebGL is required for 3D rendering

## Performance Notes

- Large models (>5MB) may take time to load
- Texture baking is instant but visible on next 3D frame
- Canvas operations are fast for typical logo placement
- Orbit controls are smooth with mouse/trackpad input

## Testing

### With Sample Models

- Default: Damaged Helmet (loads automatically from Three.js examples)
- Upload custom GLB files for testing

### With Sample Logos

- Create simple PNG/JPEG files (200x200px works well)
- Logos with transparency (PNG) work best
- Very large images will be cropped to zone size

## Known Limitations & Future Improvements

### Current Limitations

1. **Free-form Logo Placement**: Logos snap to predefined zones only
2. **Zone-locked Logos**: Logos cannot be moved between zones without clearing
3. **No Real-time Preview**: Changes only visible after baking
4. **Texture Format**: Only canvas texture output (not saving to file)
5. **Model Scale**: No automatic scaling for different model sizes

### Suggested Enhancements

1. Add free-form logo positioning with grid snapping
2. Implement drag-to-move logos between zones
3. Add real-time texture preview
4. Export baked texture as PNG/JPEG
5. Add color/rotation controls for logos
6. Support multiple logo layers per zone
7. Add undo/redo functionality
8. Implement UV unwrapping visualization
9. Add model rotation presets (front, side, top views)
10. Support for different texture resolutions

## Troubleshooting

### Model Won't Load

- Ensure the GLB/glTF file is valid
- Check that textures are embedded in the model
- Try the default model to verify setup

### Logos Not Appearing

- Ensure image file is selected before placing
- Check browser console for errors
- Verify image file is a valid format (PNG, JPEG, GIF)

### Texture Bake Not Visible

- Check browser console for Three.js errors
- Verify the 3D model has proper material setup
- Try with a different model

### Performance Issues

- Close other browser tabs
- Use a smaller model file
- Reduce the baked texture resolution

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## License

This is a proof-of-concept project. Feel free to modify and extend as needed.

## Credits

Built with:
- React and Vite for the development environment
- Three.js and React Three Fiber for 3D rendering
- Fabric.js for canvas manipulation
- Drei helpers for common Three.js patterns
