import fs from 'fs';
const f = 'src/routes/product.$id.tsx';
let c = fs.readFileSync(f, 'utf8');
const OLD = '{isVid(g) ? <video src={g} muted playsInline preload="metadata" className="size-full object-cover" /> : <img src={g} alt="" className="size-full object-cover" />}';
const NEW = '{isVid(g) ? (<span className="relative flex size-full items-center justify-center bg-black"><video src={g} muted playsInline preload="metadata" className="size-full object-cover opacity-60" /><Play className="absolute size-5 text-white" /></span>) : (<img src={g} alt="" className="size-full object-cover" />)}';
if (c.includes(OLD)) { c = c.split(OLD).join(NEW); fs.writeFileSync(f, c); console.log('thumbnails: play badge added'); }
else console.log('thumbnail string not found');