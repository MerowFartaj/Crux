const fs = require('fs');
const path = require('path');

// Copy renderer files (webpack handles this in dev, but for electron we need them)
const srcRenderer = path.join(__dirname, '..', 'src', 'renderer');
const distRenderer = path.join(__dirname, '..', 'dist', 'renderer');

// Ensure dist/renderer exists
fs.mkdirSync(distRenderer, { recursive: true });

// Copy index.html
const htmlSrc = path.join(srcRenderer, 'index.html');
if (fs.existsSync(htmlSrc)) {
  let html = fs.readFileSync(htmlSrc, 'utf-8');
  // Add script and style tags for the built bundle
  html = html.replace('</head>', '<link rel="stylesheet" href="styles.css">\n</head>');
  html = html.replace('</body>', '<script src="bundle.js"></script>\n</body>');
  fs.writeFileSync(path.join(distRenderer, 'index.html'), html);
}

console.log('Assets copied successfully');
