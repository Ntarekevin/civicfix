const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

function migrateFile(filePath) {
  if (!filePath.endsWith('.jsx') && !filePath.endsWith('.js')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Add "use client" if it has hooks
  if ((content.includes('useState') || content.includes('useEffect') || content.includes('useRef') || content.includes('useRouter') || content.includes('useNavigate') || content.includes('usePathname')) && !content.includes('"use client"')) {
    content = '"use client";\n' + content;
  }

  // Replace imports
  if (content.includes('react-router-dom')) {
    let newImports = [];
    if (content.includes('Link') || content.includes('NavLink')) {
      newImports.push("import Link from 'next/link';");
    }
    if (content.match(/useNavigate|useLocation|useSearchParams/)) {
      newImports.push("import { useRouter, usePathname, useSearchParams } from 'next/navigation';");
    }
    
    // Remove react-router-dom import
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"];?\n?/g, '');
    
    // Insert new imports after React import
    content = content.replace(/(import\s+React.*?;\n)/, `$1${newImports.join('\n')}\n`);
  }

  // Replace hooks usage
  content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);/g, 'const router = useRouter();');
  content = content.replace(/navigate\(/g, 'router.push(');
  
  content = content.replace(/const\s+location\s*=\s*useLocation\(\);/g, 'const pathname = usePathname();');
  content = content.replace(/location\.search/g, 'useSearchParams().toString()'); // Rough approx

  // Replace NavLink/Link props
  content = content.replace(/<NavLink/g, '<Link');
  content = content.replace(/<\/NavLink>/g, '</Link>');
  content = content.replace(/\s+to=/g, ' href=');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Migrated:', filePath);
  }
}

walk(path.join(__dirname, 'src/pages'), migrateFile);
walk(path.join(__dirname, 'src/components'), migrateFile);
