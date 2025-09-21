# Family Album

Simple static photo gallery that groups images by year and person. [Demo](./src/demo/)

Files included

- `index.html` — the web UI that reads `photos.json` and displays the gallery.
- `createjson.js` — Node.js script to generate `photos.json` from a folder tree of photos.

What it does

`createjson.js` scans a root folder that contains subfolders named by year (for example `2020`, `2021`) and builds a `photos.json` file. `index.html` loads that JSON to render a browsable gallery.

Quick example folder layout

```
photos-root/
  2020/
    maria_josé.jpg
    john_josé.png
  2021/
    john_josé_maría.jpg
index.html
createjson.js
```

Generate `photos.json`

Requirements: Node.js (v14+ recommended).

Examples:

```powershell
# Default: embed images as base64 in the JSON
node createjson.js --root "C:\path\to\photos-root" --out photos.json

# Embed image data
node createjson.js --root "C:\path\to\photos-root" --out photos.json --embed

# Produce a compact JSON (no pretty formatting)
node createjson.js --root "C:\path\to\photos-root" --out photos.json --compact
```

Main options

- `--root` / `-r`: root folder containing year subfolders.
- `--out` / `-o`: output JSON file path.
- `--embed` / `-e`: embed images as base64 urls.
- `--compact` / `-c`: write compact JSON.

The script also tries to extract person names from filenames (e.g. `maria_dad.jpg` → `['Maria','Dad']`). If no names are found it uses `Unknown`.

Serve locally

Opening `index.html` directly may work in some browsers, but a simple static server is recommended. You may also replace `json = await fetch('photos.json').then(r=>r.json());` in your html to include your image data in your html.

Security notice — IMPORTANT

This project does NOT provide encryption, authentication, or password protection. If you serve it on a public server or share the files, anyone who can access the server or the JSON can view the images.
