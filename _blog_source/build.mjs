import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderDocument, sitemap } from './src/templates.js';
import { validateContent } from './src/model.js';
const out=resolve('dist'), live=resolve('../blog/content.json');
// Public content is canonical. Rebuilding never resets articles written in the browser.
const data=validateContent(JSON.parse(readFileSync(existsSync(live)?live:'content.json','utf8')));
function write(path,content){const full=resolve(out,path);mkdirSync(resolve(full,'..'),{recursive:true});writeFileSync(full,content)}
write('index.html',renderDocument(data));write('editor/index.html',renderDocument(data,'editor'));write('content.json',JSON.stringify(data,null,2)+'\n');write('sitemap.xml',sitemap(data));
for(const p of data.posts){write(`notes/${p.id}/index.html`,renderDocument(data,'article',p));write(`notes/${p.id}/index.md`,p.body);}
const favicon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#f7f5ed"/><text x="32" y="47" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="52" fill="#506b52">x</text><circle cx="49" cy="15" r="5" fill="#ad674c"/></svg>';
write('favicon.svg',favicon);
write('cover.svg','<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f7f5ed"/><text x="100" y="200" fill="#506b52" font-family="Georgia,serif" font-style="italic" font-size="110">xuwang</text><path d="M100 270h1000" stroke="#c5cebb"/><text x="100" y="360" fill="#303c32" font-family="Georgia,serif" font-size="42">A growing research notebook.</text><text x="100" y="425" fill="#72786c" font-family="sans-serif" font-size="25">PRETRAIN · DATA SCALING · INTERPRETABILITY</text><text x="100" y="550" fill="#ad674c" font-family="Georgia,serif" font-style="italic" font-size="25">a little more understood, every day.</text></svg>');
if(existsSync('../blog/uploads'))cpSync('../blog/uploads',resolve(out,'uploads'),{recursive:true});
console.log(`Built ${data.posts.length} articles, homepage, editor, and sitemap.`);
