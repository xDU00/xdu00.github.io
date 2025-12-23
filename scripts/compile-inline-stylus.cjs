/* This is a script to compile inline Stylus */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Recursively list files under a directory
function walk(dir) {
  const res = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) res.push(...walk(full));
    else res.push(full);
  }
  return res;
}

const srcDir = path.resolve('src');
if (!fs.existsSync(srcDir)) {
  console.error('No src directory found.');
  process.exit(1);
}

const files = walk(srcDir);

const styleBlockRe = /<style[^>]*lang=["']stylus["'][^>]*>([\s\S]*?)<\/style>/ig;
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const outNull = process.platform === 'win32' ? 'nul' : '/dev/null';

let failed = false;

function compileStylusContent(content, tmpPath) {
  fs.writeFileSync(tmpPath, content, 'utf8');
  try {
    execSync(`${npxCmd} stylus "${tmpPath}" -o ${outNull}`, { stdio: 'pipe' });
    fs.unlinkSync(tmpPath);
    return { ok: true };
  } catch (err) {
    const msg = err.stderr ? err.stderr.toString() : err.message;
    // keep temp file for debugging
    return { ok: false, error: msg };
  }
}

// Check .styl files
const stylFiles = files.filter(f => f.endsWith('.styl'));
for (const f of stylFiles) {
  const content = fs.readFileSync(f, 'utf8');
  const tmp = f + '.tmp.styl';
  const r = compileStylusContent(content, tmp);
  if (r.ok) console.log(`${f}: OK`);
  else {
    failed = true;
    console.error(`${f}: ERROR\n${r.error}`);
  }
}

// Check inline <style lang="stylus"> blocks in component files
const candidateExt = ['.astro', '.svelte', '.vue', '.html'];
for (const f of files) {
  if (!candidateExt.includes(path.extname(f))) continue;
  const text = fs.readFileSync(f, 'utf8');
  let m;
  styleBlockRe.lastIndex = 0;
  let idx = 0;
  while ((m = styleBlockRe.exec(text)) !== null) {
    idx += 1;
    const content = m[1].trim();
    const tmp = `${f}.style.${idx}.tmp.styl`;
    const r = compileStylusContent(content, tmp);
    if (r.ok) console.log(`${f} [style #${idx}]: OK`);
    else {
      failed = true;
      console.error(`${f} [style #${idx}]: ERROR\n${r.error}`);
    }
  }
}

if (failed) {
  console.error('\nStylus check failed. Fix above errors.');
  process.exit(1);
} else {
  console.log('\nAll Stylus checks passed.');
  process.exit(0);
}
