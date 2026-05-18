const fs = require('fs');
const path = require('path');
const dir = 'src/pages';
fs.readdirSync(dir).forEach(file => {
  if (file.endsWith('.tsx')) {
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/(<(?:Button|button)[^>]*?className=(['"])[^\2]*?)text-neutral-500([^\2]*?\2[^>]*?>)/g, '$1text-white hover:text-white$3');
    content = content.replace(/(<(?:Button|button)[^>]*?className=(['"])[^\2]*?)text-neutral-600([^\2]*?\2[^>]*?>)/g, '$1text-white hover:text-white$3');
    fs.writeFileSync(p, content);
  }
});
console.log('Done replacing button colors.');
