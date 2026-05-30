import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./components', function(filePath) {
  if (!filePath.endsWith('.tsx')) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  
  // Parent overlay padding
  content = content.replace(/className="fixed inset-0(.*?)\bp-4\b(.*)"/g, 'className="fixed inset-0$1p-2 sm:p-4$2"');
  content = content.replace(/className="fixed inset-0(.*?)\bp-6\b(.*)"/g, 'className="fixed inset-0$1p-2 sm:p-6$2"');
  
  // Modal inner padding
  content = content.replace(/\bp-5 md:p-8 lg:p-12\b/g, 'p-4 sm:p-6 md:p-8 lg:p-12');
  content = content.replace(/\bp-5 lg:p-14\b/g, 'p-4 sm:p-6 md:p-8 lg:p-14');
  content = content.replace(/\bp-4 md:p-8 lg:p-10\b/g, 'p-3 md:p-8 lg:p-10');
  content = content.replace(/\bp-5 md:p-10\b/g, 'p-4 sm:p-6 md:p-10');
  content = content.replace(/\bp-5 md:p-8\b/g, 'p-4 sm:p-6 md:p-8');
  content = content.replace(/\bp-5 md:p-6\b/g, 'p-4 md:p-6');
  
  // Extra replacements for ones that weren't caught by previous regex exactly
  content = content.replace(/\bshadow-2xl p-4 md:p-8 lg:p-10\b/g, 'shadow-2xl p-3 sm:p-6 md:p-8 lg:p-10');
  
  // Make borders somewhat responsive too for mobile space saving
  content = content.replace(/\brounded-\[2rem\]\b/g, 'rounded-[1.25rem] sm:rounded-[2rem]');
  content = content.replace(/\brounded-\[1\.5rem\]\b/g, 'rounded-[1.25rem] sm:rounded-[1.5rem]');
  
  if (original !== content) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed padding', filePath);
  }
});
