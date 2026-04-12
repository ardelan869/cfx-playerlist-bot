import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, callback) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}

function fixJsonImports(filePath) {
  if (!filePath.endsWith('.js')) return;

  const content = readFileSync(filePath, 'utf8');

  // Ersetze: await import('./file.json', { assert: { type: 'json' } })
  // durch:   await import('./file.json', { with: { type: 'json' } })
  const replaced = content.replace(
    /import\(([^)]+?),\s*{[^}]*?assert\s*:\s*{[^}]*?type\s*:\s*['"]json['"]\s*}[^}]*?}\)/g,
    (match) => {
      return match.replace(/assert\s*:/, 'with:');
    }
  );

  if (content !== replaced) {
    writeFileSync(filePath, replaced, 'utf8');
    console.log(`✔ Patched dynamic JSON import in: ${filePath}`);
  }
}

walk('./dist', fixJsonImports);
