import { copyFileSync, cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const server=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
mkdirSync(path.join(server,'public'),{recursive:true});
for(const file of ['index.html','game.js','simulation.js','oligarch-engine.js','oligarch.js','oligarch.css','oligarch-locales.js','sound.js','styles.css','experience.css','i18n.js','locales.js','countries.js','leaderboard-locales.js','leaderboards.js']) copyFileSync(path.join(server,'..',file),path.join(server,'public',file==='index.html'?'play.html':file));
cpSync(path.join(server,'..','audio'),path.join(server,'public','audio'),{recursive:true});
