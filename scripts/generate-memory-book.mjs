import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname,join} from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.MEMORIAL_BOOK_PLAYWRIGHT||'playwright');
const root=resolve(process.argv[2]||'_site');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.pdf':'application/pdf'};
const server=createServer(async(req,res)=>{try{let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://local').pathname));if(!path.startsWith(root+'/'))throw Error();if((await stat(path)).isDirectory())path=join(path,'index.html');res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(await readFile(path));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.MEMORIAL_BOOK_CHROMIUM?{executablePath:process.env.MEMORIAL_BOOK_CHROMIUM}:{}),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1100,height:1200}}),generatedAt=new Date().toISOString();
 await page.addInitScript(stamp=>{window.MEMORIAL_BOOK_SNAPSHOT=true;window.MEMORIAL_BOOK_GENERATED_AT=stamp;},generatedAt);
 await page.goto(`http://127.0.0.1:${server.address().port}/memory-book/`,{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>window.__memorialBookReady||window.__memorialBookError,{},{timeout:120000});
 const result=await page.evaluate(()=>({result:window.__memorialBookReady,error:window.__memorialBookError}));
 if(result.error)throw Error(result.error);
 if(result.result.failedImages.length||result.result.overflow.length)throw Error(JSON.stringify(result.result));
 // The archive uses public URLs in PDF hyperlinks, never the temporary build server.
 await page.locator('a').evaluateAll(links=>links.forEach(a=>{if(a.href.startsWith(location.origin)&&!a.getAttribute('href').startsWith('#'))a.href='https://robert-dickinson-memorial.github.io'+new URL(a.href).pathname+new URL(a.href).hash;}));
 await page.emulateMedia({media:'print'});
 const output=join(root,'memory-book');await mkdir(output,{recursive:true});
 await page.pdf({path:join(output,'Robert-E-Dickinson-Memory-Book.pdf'),printBackground:true,preferCSSPageSize:true,tagged:true,outline:true});
 await writeFile(join(output,'edition.json'),JSON.stringify({...result.result,format:'Letter portrait',widthInches:8.5,heightInches:11},null,2));
 console.log(JSON.stringify(result.result));
}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}
