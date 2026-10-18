const fs = require('fs');

const files = [
  'products.js',
  'public/products.js'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace sub_chatgpt thumbnail
  content = content.replace(
    /"id":\s*"sub_chatgpt"[\s\S]*?"thumbnail":\s*".*?"/,
    (match) => match.replace(/"thumbnail":\s*".*?"/, '"thumbnail": "assets/images/products/chatgpt.png"')
  );

  // Replace sub_gemini thumbnail
  content = content.replace(
    /"id":\s*"sub_gemini"[\s\S]*?"thumbnail":\s*".*?"/,
    (match) => match.replace(/"thumbnail":\s*".*?"/, '"thumbnail": "assets/images/products/gemini_pro.png"')
  );

  // Replace sub_nitro thumbnail
  content = content.replace(
    /"id":\s*"sub_nitro"[\s\S]*?"thumbnail":\s*".*?"/,
    (match) => match.replace(/"thumbnail":\s*".*?"/, '"thumbnail": "assets/images/products/discord_nitro.jpg"')
  );

  // Replace sub_spotify thumbnail
  content = content.replace(
    /"id":\s*"sub_spotify"[\s\S]*?"thumbnail":\s*".*?"/,
    (match) => match.replace(/"thumbnail":\s*".*?"/, '"thumbnail": "assets/images/products/spotify.png"')
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated', file);
});
