import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';

const SITE_URL = 'https://cemtemucin.com';
const PROJECT_NAME = 'portfolio';

const rootDist = `dist/${PROJECT_NAME}`;
const browserDist = `${rootDist}/browser`;

// Move 3rdpartylicenses.txt into browser/
const licenseSrc = `${rootDist}/3rdpartylicenses.txt`;
if (existsSync(licenseSrc)) {
    copyFileSync(licenseSrc, `${browserDist}/3rdpartylicenses.txt`);
    console.log('✓ 3rdpartylicenses.txt copied to browser/');
}

// Generate sitemap.xml
const manifestSrc = `${rootDist}/prerendered-routes.json`;
if (existsSync(manifestSrc)) {
    const data = JSON.parse(readFileSync(manifestSrc, 'utf8'));
    const routes = Array.isArray(data.routes) ? data.routes : (Array.isArray(data) ? data : Object.keys(data));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url><loc>${SITE_URL}${r.startsWith('/') ? r : `/${r}`}</loc></url>`).join('\n')}
</urlset>`;

    writeFileSync(`${browserDist}/sitemap.xml`, xml.trim());
    console.log(`✓ sitemap.xml created (${routes.length} routes)`);
}