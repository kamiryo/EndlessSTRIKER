// Pixel Art Sprite Matrices & Bitmap Font Helper
// Drawn directly onto Canvas at 1x1 pixel resolution (320x180) for razor-sharp retro visuals

const PALETTE = {
  '.': null,
  'K': '#0b0e17', // Black / dark outline
  'W': '#ffffff', // Pure white
  'G': '#d4dce8', // Light gray
  'Y': '#ffd83b', // Bright arcade yellow
  'O': '#ff8c24', // Orange / gold shade
  'B': '#2464ff', // Royal blue
  'C': '#4cc3ff', // Cyan / light blue
  'R': '#ff3344', // Rival red
  'D': '#b01828', // Dark red
  'S': '#ffcca8', // Skin tone
  'M': '#784820', // Brown / hair / mud
  'L': '#56e364', // Bright grass green
  'E': '#1f9e40', // Deep grass green
  'U': '#127a36', // Deep soccer uniform green (shirt & shorts)
  'J': '#0b5424', // Darker green shade for kit depth
  'P': '#9048ff'  // Retro purple (title screen accent)
};

const SPRITES = {
  // Striker Frame 1 (Running & juggling) - 14x16 (Full deep green soccer kit)
  PLAYER_1: [
    '....YYYYYY....',
    '...YYYYYYYY...',
    '...UUUUUUUU...',
    '...KSSKSSSK...',
    '...SSSSSSSS...',
    '....SSSSSS....',
    '..KUUUUUUUUK..',
    '.KUUWUUUUWUUK.',
    '.KUUJUUUUJUUK.',
    '..KUUUUUUUUK..',
    '...KJJJJJJK...',
    '..KUUU..UUUK..',
    '..SSS....SSS..',
    '..UU......UU..',
    '.KKK......KKK.',
    '..............'
  ],
  // Striker Frame 2 (Kick / high knee juggle) - 14x16 (Full deep green soccer kit)
  PLAYER_2: [
    '....YYYYYY....',
    '...YYYYYYYY...',
    '...UUUUUUUU...',
    '...KSSKSSSK...',
    '...SSSSSSSS...',
    '....SSSSSS....',
    '.KUUUUUUUUUUK.',
    '..KUUWUUWUUK..',
    '..KJJUUUUJJK..',
    '...KUUUUUUK...',
    '...KJJJJJJK...',
    '...KUU...SSUU.',
    '...SS.....KKK.',
    '...UU.........',
    '..KKK.........',
    '..............'
  ],
  // Rival Defender Run 1 - 14x16
  DEF_RUN_1: [
    '....KKKKKK....',
    '...KKKKKKKK...',
    '...KSSKSSSK...',
    '...SSSSSSSS...',
    '....SSSSSS....',
    '..RRRRWWWRRR..',
    '..RRRWWWWWRR..',
    '...RRWWWWWR...',
    '....WWWWWW....',
    '...WWWWWWWW...',
    '..SSS....SSS..',
    '..RR......RR..',
    '.KKK......KKK.',
    '..............'
  ],
  // Rival Defender Run 2 - 14x16
  DEF_RUN_2: [
    '....KKKKKK....',
    '...KKKKKKKK...',
    '...KSSKSSSK...',
    '...SSSSSSSS...',
    '....SSSSSS....',
    '...RRRRWWWR...',
    '..RRRWWWWWRR..',
    '...RRWWWWWR...',
    '....WWWWWW....',
    '....WW..WW....',
    '...SSS...SSS..',
    '...RR.....RR..',
    '..KKK.....KKK.',
    '..............'
  ],
  // Sliding Tackle Defender - 18x12
  DEF_SLIDE: [
    '..........KKKKKK..',
    '.........KKKKKKKK.',
    '.........KSSKSSSK.',
    '.........SSSSSSSS.',
    '.......RRRRWWWRRR.',
    '.....WWWWWWWWWRR..',
    '..KKKSSSSWWWWWW...',
    '.KKKKK...SSSS.....',
    '.........KKKK.....',
    '..................'
  ],
  // Soccer Ball Frame 1 (7x7)
  BALL_1: [
    '..WWW..',
    '.WKKKW.',
    'WKWWWWW',
    'WWWWWKW',
    'WWKKWWW',
    '.WWWWW.',
    '..WWW..'
  ],
  // Soccer Ball Frame 2 (7x7) - rotated pentagons
  BALL_2: [
    '..WWW..',
    '.WWWWK.',
    'WWKKWWW',
    'WWWWWKW',
    'WKWWWWW',
    '.WKKWW.',
    '..WWW..'
  ],
  // Golden Star Ball (7x7)
  STAR_BALL: [
    '..YYY..',
    '.YOOOY.',
    'YOWWWOY',
    'YOWYWOY',
    'YOWWWOY',
    '.YOOOY.',
    '..YYY..'
  ],
  // Training Cone (10x11)
  CONE: [
    '....OO....',
    '....OO....',
    '...OOOO...',
    '...WWWW...',
    '..WWWWWW..',
    '..OOOOOO..',
    '.OOOOOOOO.',
    '.WWWWWWWW.',
    '.OOOOOOOO.',
    'OOOOOOOOOO',
    'KKKKKKKKKK'
  ],
  // Spinning Coin 1 (7x8)
  COIN_1: [
    '..YYY..',
    '.YWWWY.',
    'YWOOOWY',
    'YWOOOWY',
    'YWOOOWY',
    'YWOOOWY',
    '.YOOOY.',
    '..YYY..'
  ],
  // Spinning Coin 2 (7x8)
  COIN_2: [
    '...Y...',
    '..YWY..',
    '..YOY..',
    '..YOY..',
    '..YOY..',
    '..YOY..',
    '..YOY..',
    '...Y...'
  ],
  // HUD Life Crown / Boot Icon (8x6) - matches screenshot bottom-right icons
  LIFE_CROWN: [
    'Y..YY..Y',
    'YY.YY.YY',
    'YYYYYYYY',
    'YOOWWOOY',
    '.YYYYYY.',
    '.OOOOOO.'
  ],
  // Seagull / Stadium Bird 1 (9x5)
  BIRD_1: [
    '.WW...WW.',
    'W..W.W..W',
    '....W....',
    '.........',
    '.........'
  ],
  // Seagull / Stadium Bird 2 (9x5)
  BIRD_2: [
    '.........',
    '....W....',
    '.WWW.WWW.',
    'W.......W',
    '.........'
  ]
};

// Pre-cache sprite patterns or draw directly onto context
function drawSprite(ctx, spriteKey, x, y, scale = 1, flipX = false, overrideColor = null) {
  const rows = SPRITES[spriteKey];
  if (!rows) return;

  const rx = Math.round(x);
  const ry = Math.round(y);
  const w = rows[0].length;

  for (let r = 0; r < rows.length; r++) {
    const rowStr = rows[r];
    for (let c = 0; c < w; c++) {
      const ch = rowStr[c];
      const color = overrideColor || PALETTE[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      const drawCol = flipX ? (w - 1 - c) : c;
      ctx.fillRect(rx + drawCol * scale, ry + r * scale, scale, scale);
    }
  }
}

// 5x5 Crisp Pixel Font for HUD & Retro Title (guaranteed crisp at 320x180)
const PIXEL_FONT = {
  '0': ['111','101','101','101','111'],
  '1': ['010','110','010','010','111'],
  '2': ['111','001','111','100','111'],
  '3': ['111','001','111','001','111'],
  '4': ['101','101','111','001','001'],
  '5': ['111','100','111','001','111'],
  '6': ['111','100','111','101','111'],
  '7': ['111','001','001','010','010'],
  '8': ['111','101','111','101','111'],
  '9': ['111','101','111','001','111'],
  'A': ['010','101','111','101','101'],
  'B': ['110','101','110','101','110'],
  'C': ['111','100','100','100','111'],
  'D': ['110','101','101','101','110'],
  'E': ['111','100','110','100','111'],
  'F': ['111','100','110','100','100'],
  'G': ['111','100','101','101','111'],
  'H': ['101','101','111','101','101'],
  'I': ['111','010','010','010','111'],
  'J': ['001','001','001','101','111'],
  'K': ['101','101','110','101','101'],
  'L': ['100','100','100','100','111'],
  'M': ['101','111','111','101','101'],
  'N': ['111','101','101','101','101'],
  'O': ['111','101','101','101','111'],
  'P': ['111','101','111','100','100'],
  'Q': ['111','101','101','111','001'],
  'R': ['111','101','110','101','101'],
  'S': ['111','100','111','001','111'],
  'T': ['111','010','010','010','010'],
  'U': ['101','101','101','101','111'],
  'V': ['101','101','101','101','010'],
  'W': ['101','101','111','111','101'],
  'X': ['101','101','010','101','101'],
  'Y': ['101','101','010','010','010'],
  'Z': ['111','001','010','100','111'],
  '!': ['010','010','010','000','010'],
  '+': ['000','010','111','010','000'],
  '-': ['000','000','111','000','000'],
  '=': ['000','111','000','111','000'],
  ':': ['000','010','000','010','000'],
  '/': ['001','001','010','100','100'],
  '.': ['000','000','000','000','010'],
  ' ': ['000','000','000','000','000']
};

function drawPixelText(ctx, text, x, y, scale = 1, color = '#ffffff', shadowColor = null, align = 'left', letterSpacing = 1) {
  const str = String(text).toUpperCase();
  const charW = (3 + letterSpacing) * scale;
  const totalW = str.length * charW - letterSpacing * scale;

  let startX = Math.round(x);
  if (align === 'center') startX = Math.round(x - totalW / 2);
  else if (align === 'right') startX = Math.round(x - totalW);
  const startY = Math.round(y);

  for (let i = 0; i < str.length; i++) {
    const glyph = PIXEL_FONT[str[i]] || PIXEL_FONT[' '];
    const cx = startX + i * charW;

    if (shadowColor) {
      ctx.fillStyle = shadowColor;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
          if (glyph[r][c] === '1') {
            ctx.fillRect(cx + c * scale + scale, startY + r * scale + scale, scale, scale);
          }
        }
      }
    }

    ctx.fillStyle = color;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        if (glyph[r][c] === '1') {
          ctx.fillRect(cx + c * scale, startY + r * scale, scale, scale);
        }
      }
    }
  }
}

window.SPRITES = SPRITES;
window.drawSprite = drawSprite;
window.drawPixelText = drawPixelText;
