import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json',
  '.wav':'audio/wav','.png':'image/png','.md':'text/plain; charset=utf-8'};
const port=Number(process.env.PORT)||4173;
createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const target=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(relative(root,target).startsWith('..')){res.writeHead(403);res.end('Forbidden');return;}
  try{
    const info=await stat(target);if(!info.isFile())throw Error('Not a file');
    const body=await readFile(target);
    res.writeHead(200,{'Content-Type':mime[extname(target)]||'application/octet-stream','Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff'});res.end(body);
  } catch {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(port,()=>console.log(`THE MAZE // http://localhost:${port}`));
