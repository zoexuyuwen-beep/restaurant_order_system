/*
Simple Node script to fetch AI-generated images for the menu.

Usage (node >=18 recommended):
  1) Set environment variable OPENAI_API_KEY with your API key.
  2) Run: node fetch_ai_images.js

This script is a helper template. It attempts to call the OpenAI Images API
(or a compatible endpoint). You can adapt prompts and the destination folder.

Note: This script may require editing to match the image API you use.
*/

import fs from 'fs';
import path from 'path';

const MENU = [
  { id: 'mapo', name: '麻婆豆腐', prompt: 'A delicious plate of mapo tofu, Sichuan style, vibrant colors, top-down food photo' },
  { id: 'gongbao', name: '宫保鸡丁', prompt: 'Kung Pao chicken in a rustic bowl, high-quality food photography' },
  { id: 'xiao_long_bao', name: '小笼包', prompt: 'Soup dumplings (xiao long bao) with steam, studio food photo' },
  { id: 'chao_fan', name: '扬州炒饭', prompt: 'Yangzhou fried rice with colorful ingredients, appetizing food photo' },
  { id: 'peking_duck', name: '北京烤鸭（半只）', prompt: 'Peking duck slices with crispy skin and pancakes, stylized food photo' },
  { id: 'hotpot', name: '红油抄手', prompt: 'Spicy wontons in red chili oil, close-up food photography' },
  { id: 'qingcai', name: '清炒时蔬', prompt: 'Stir-fried seasonal vegetables, fresh and vibrant food photo' },
  { id: 'dan_tang', name: '蛋汤', prompt: 'Simple egg soup in a bowl, warm and comforting food photography' }
];

// Allow passing the API key via CLI: --key <KEY>, or fall back to env var.
const argv = process.argv.slice(2);
let cliKey = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--key' || argv[i] === '-k') {
    cliKey = argv[i + 1];
    break;
  }
}

const API_KEY = cliKey || process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
if (!API_KEY) {
  console.error('No API key found. Provide with `--key YOUR_KEY` or set OPENAI_API_KEY in your environment.');
  process.exit(1);
}

const outDir = path.resolve('./images');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function fetchImage(prompt, id) {
  // Example for OpenAI Images API (this is illustrative - adjust to your provider's exact endpoint)
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({ prompt, n: 1, size: '1024x1024' })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Image API error: ${res.status} ${t}`);
  }
  const data = await res.json();
  // The exact structure may vary; many image APIs return base64 data or URLs.
  // Some providers return base64 in `b64_json`, others return a direct `url`.
  const item = data.data?.[0] || {};
  const b64 = item.b64_json || null;
  const url = item.url || null;

  let buffer;
  if (b64) {
    buffer = Buffer.from(b64, 'base64');
  } else if (url) {
    // Fetch the binary image from the provided URL
    const imgRes = await fetch(url);
    if (!imgRes.ok) throw new Error(`Failed to download image from URL: ${imgRes.status}`);
    const ab = await imgRes.arrayBuffer();
    buffer = Buffer.from(ab);
  } else {
    throw new Error('No image data (b64_json or url) found in response');
  }

  const filePath = path.join(outDir, `${id}.jpg`);
  fs.writeFileSync(filePath, buffer);
  console.log('Saved', filePath);
}

(async () => {
  for (const it of MENU) {
    try {
      console.log('Generating', it.name);
      await fetchImage(it.prompt, it.id);
      // small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error('Failed', it.id, err.message || err);
    }
  }
})();