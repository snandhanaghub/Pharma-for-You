# Pharma4u Frontend

React-based user interface for medicine recognition system.

## Features

- 📝 Manual text search interface
- 📷 Image upload with preview
- 🔍 Interactive OCR result display
- 💊 Beautiful medicine result cards
- 📱 Responsive mobile design

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner

### `npm run build`
Builds the app for production to the `build` folder

## Components

### ManualSearch
Text-based medicine search interface

### ImageUpload
Image upload and OCR extraction interface

### OCRResult
Interactive text selection overlay (Google Lens style)

### ResultDisplay
Medicine information display cards

## Configuration

The frontend expects the backend API to be running on `http://localhost:8000`. This is configured via the proxy setting in `package.json`.

To change the API endpoint, modify the proxy setting:

```json
{
  "proxy": "http://your-backend-url:port"
}
```

## Styling

- Modern gradient design
- Purple/blue color scheme
- Responsive layout
- Smooth animations
- Card-based UI

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Dependencies

- React 18.2
- Axios (HTTP client)
- React Scripts 5.0
