import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (path: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      callback(p);
    }
  }
}

walk('src', (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Remove console.log
  const logRegex = /console\.log\([^)]*\);?/g;
  if (logRegex.test(content)) {
    content = content.replace(logRegex, '');
    changed = true;
  }
  
  // Remove console.error
  const errRegex = /console\.error\([^)]*\);?/g;
  if (errRegex.test(content)) {
    content = content.replace(errRegex, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Cleaned console.log in ${file}`);
  }
});
