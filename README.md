[README.md](https://github.com/user-attachments/files/26969177/README.md)
# Chromatic Aberration Studio

Chromatic Aberration Studio is a browser-based image tool for adding adjustable chromatic aberration effects to uploaded images.

## Features

- Upload or drag-and-drop an image
- Adjust chromatic aberration strength
- Change the aberration angle
- Control effect opacity
- Inspect details with a 100% loupe overlay
- Hold left mouse button in the loupe to compare against the original image
- Download the edited result as a PNG with `_CAS` added to the filename
- PayPal donation link

## Usage

Open `index.html` in a browser.

No build step, backend, or dependencies are required.

## Files

- `index.html` - App layout
- `styles.css` - Visual styling
- `app.js` - Image processing, controls, loupe, and download logic

## Notes

Downloaded images are exported as PNG files. Browsers do not allow websites to automatically save downloads into the original upload folder, so the save location depends on the user's browser settings.

## Copyright

Copyright 2026 Umbra Studios.
