const fs = require('fs');
const content = fs.readFileSync('c:\\AntigravityDEV\\Presales\\renderer.js', 'utf8');

// Find all function definitions
const defs = new Set();
const funcRegex = /function\s+([a-zA-Z0-9_]+)\s*\(/g;
let match;
while ((match = funcRegex.exec(content)) !== null) {
    defs.add(match[1]);
}

const windowRegex = /window\.([a-zA-Z0-9_]+)\s*=/g;
while ((match = windowRegex.exec(content)) !== null) {
    defs.add(match[1]);
}

const arrowRegex = /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g;
while ((match = arrowRegex.exec(content)) !== null) {
    defs.add(match[1]);
}

// Find all function calls
const callRegex = /([a-zA-Z0-9_]+)\s*\(/g;
const calls = new Set();
while ((match = callRegex.exec(content)) !== null) {
    calls.add(match[1]);
}

const ignore = new Set([
    'if', 'for', 'while', 'switch', 'catch', 'parseInt', 'parseFloat', 'isNaN', 
    'fetch', 'alert', 'confirm', 'prompt', 'setTimeout', 'clearTimeout', 
    'setInterval', 'clearInterval', 'decodeURIComponent', 'encodeURIComponent',
    'String', 'Number', 'Date', 'Array', 'Object', 'JSON', 'RegExp', 'Map', 'Set',
    'Math', 'console', 'window', 'document', 'navigator', 'location', 'history',
    'Intl', 'URL', 'Blob', 'FileReader', 'Papa', 'require', 'Boolean'
]);

const missing = Array.from(calls).filter(c => !defs.has(c) && !ignore.has(c) && !c.startsWith('_'));

console.log("Potential missing functions:");
missing.sort().forEach(m => console.log(m));
