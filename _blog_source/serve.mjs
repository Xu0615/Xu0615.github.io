import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.xml':'application/xml','.md':'text/markdown; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/'){res.writeHead(302,{Location:'/blog/'});res.end();return}let file=resolve(root,decodeURIComponent(url.pathname.replace(/^\/blog\/?/,'')));if(!file.startsWith(root+'/')&&file!==root)throw Error();if((await stat(file)).isDirectory())file=resolve(file,'index.html');res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(file))}catch{res.writeHead(404);res.end('Not found')}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173/blog/'));
