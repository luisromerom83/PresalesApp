const fs = require('fs');
const content = fs.readFileSync('c:/AntigravityDEV/Presales/renderer.js', 'utf8');
const lines = content.split('\n');

const functions = {};
const regexFunc = /^function\s+([a-zA-Z0-9_]+)\s*\(/;
const regexConst = /^(?:window\.)?([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(/;

lines.forEach((line, i) => {
    let match = line.match(regexFunc);
    if (!match) match = line.match(regexConst);
    
    if (match) {
        const name = match[1];
        if (!functions[name]) functions[name] = [];
        functions[name].push(i + 1);
    }
});

Object.keys(functions).forEach(name => {
    if (functions[name].length > 1) {
        console.log(`Duplicate found: ${name} at lines ${functions[name].join(', ')}`);
    }
});
