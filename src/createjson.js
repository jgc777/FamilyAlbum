import fs from 'fs/promises';
import path from 'path';
import process from 'process';
const { argv } = process;

function parseArgs() {
  const args = { root: ".", out: 'photos.json', embed: false, compact: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if ((a === '--root' || a === '-r') && argv[i+1]) { args.root = argv[++i]; }
    else if ((a === '--out' || a === '-o') && argv[i+1]) { args.out = argv[++i]; }
    else if (a === '--embed' || a === '-e') { args.embed = true; }
    else if (a === '--compact' || a === '-c') { args.compact = true; }
  }
  return args;
}

function extractPersonsFromFilename(filename) {
  const name = filename.replace(/\.[^/.]+$/, '');
  const cleaned = name.replace(/[^A-Za-zÀ-ÿ0-9 ,\-_./]/g, ' ');
  const tokens = cleaned.split(/[ ,_\-+.\/]+/).map(t => t.trim()).filter(t => t.length>0);
  const persons = tokens.filter(t => /[A-Za-zÀ-ÿ]/.test(t)).map(t => {
    return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
  });
  return persons.length ? Array.from(new Set(persons)) : ['Unknown'];
}

async function walkDir(root) {
  const years = [];
  const entries = await fs.readdir(root, { withFileTypes: true });
  const yearDirs = entries.filter(e => e.isDirectory() && /^\d{4}$/.test(e.name)).map(e => e.name).sort();
  for (const y of yearDirs) {
    const dirPath = path.join(root, y);
    const files = await fs.readdir(dirPath);
    const items = [];
    for (const f of files) {
      const full = path.join(dirPath, f);
      try {
        const stat = await fs.stat(full);
        if (!stat.isFile()) continue;
        if (!/\.(jpe?g|png|gif|webp|bmp)$/i.test(f)) continue;
        items.push({ filename: f, fullPath: full, mtimeMs: stat.mtimeMs });
      } catch (err) {
        console.warn('Could not read', full, err.message);
      }
    }
    items.sort((a,b)=> a.mtimeMs - b.mtimeMs);
    years.push({ year: y, items });
  }
  return years;
}

function detectMime(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.bmp') return 'image/bmp';
  return 'image/jpeg';
}

async function buildJson(root, yearsData, embedBase64) {
  const result = { years: [] };
  if (!embedBase64) result.root = root;

  for (const y of yearsData) {
    const yearNode = { year: y.year, photos: [] };
    for (const it of y.items) {
      const persons = extractPersonsFromFilename(it.filename);
      let photo = { persons };

      if (embedBase64) {
        const buf = await fs.readFile(it.fullPath);
        const mime = detectMime(it.filename);
        photo.data = `data:${mime};base64,${buf.toString('base64')}`;
      } else {
        const relPath = path.relative(process.cwd(), it.fullPath).split(path.sep).join('/');
        photo = { filename: it.filename, path: relPath, persons };
      }

      yearNode.photos.push(photo);
    }
    result.years.push(yearNode);
  }
  return result;
}

(async () => {
  try {
    const args = parseArgs();
    const years = await walkDir(args.root);
    const json = await buildJson(args.root, years, args.embed);

    const jsonString = args.compact 
      ? JSON.stringify(json) 
      : JSON.stringify(json, null, 2);

    await fs.writeFile(args.out, jsonString, 'utf8');
    console.log('Generated', args.out, 'with', json.years.reduce((s,y)=>s+y.photos.length,0), 'photos.',
                args.compact ? '(compact)' : 'formatted');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
