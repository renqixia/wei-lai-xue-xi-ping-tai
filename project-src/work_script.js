import fs from 'fs';
const file = 'src/App.tsx';
const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

const startIdx = 3183;
const endIdx = 3527; // The empty line after </AnimatePresence>
const length = endIdx - startIdx + 1;

console.log('Extracting:', lines[startIdx]);
console.log('Last extracted:', lines[endIdx-1]);

const extracted = lines.splice(startIdx, length);

const styleIdx = lines.findIndex(l => l.includes('<style>{`'));
console.log('Inserting before:', lines[styleIdx]);

lines.splice(styleIdx, 0, ...extracted);

fs.writeFileSync(file, lines.join('\n'));
console.log('Done');
