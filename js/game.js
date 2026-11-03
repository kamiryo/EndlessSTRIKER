// STRIKER - Main Game Engine (320x180 Retro Pixel Canvas)

(() => {
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const W = 320;
  const H = 180;

  // Pitch vertical boundaries (matching the wave area in reference screenshots)
  const PITCH_TOP = 38;
  const PITCH_BOTTOM = 152; // Bottom HUD starts at y=152 (height 28px)
  const PLAYER_MIN_Y = 40;
  const PLAYER_MAX_Y = 134;

  const STATE = {
    TITLE: 'TITLE',
    PLAYING: 'PLAYING',
    GAMEOVER: 'GAMEOVER'
  };

  let gameState = STATE.TITLE;
  let hasPlayedOnce = false;
  let frameCount = 0;

  // Input state (One-button hold = UP, release = DOWN, plus optional arrow keys)
  let isHoldingUp = false;
  let isHoldingDownKey = false;
  let inputCooldown = 0;

  // Score & progression
  let score = 0;
  let distanceCounter = 0;
  let highScore = parseInt(localStorage.getItem('striker_dribble_hi') || '120', 10);
  let speedLevel = 1;
  let levelProgress = 0; // 0 to 100
  let baseScrollSpeed = 2.2;
  let scrollX = 0;

  // Player state
  const player = {
    x: 62,
    y: 96,
    vy: 0,
    w: 14,
    h: 16,
    lives: 3,
    invulnTimer: 0,
    feverTimer: 0,
    animFrame: 0,
    ballPhase: 0,
    combo: 0
  };

  // World entities
  let clouds = [];
  let obstacles = [];
  let items = [];
  let particles = [];
  let popups = [];
  let pitchLines = [];
  let grassTufts = [];
  let screenShake = 0;

  // Initialize decorative background elements
  function initEnvironment() {
    clouds = [
      { x: 35, y: 8, w: 26, speed: 0.25 },
      { x: 145, y: 12, w: 18, speed: 0.18 },
      { x: 180, y: 6, w: 32, speed: 0.3 },
      { x: 265, y: 11, w: 22, speed: 0.22 }
    ];

    pitchLines = [
      { x: 90, type: 'line' },
      { x: 210, type: 'center' },
      { x: 330, type: 'box' }
    ];

    grassTufts = [];
    for (let i = 0; i < 45; i++) {
      grassTufts.push({
        x: Math.random() * W,
        y: PITCH_TOP + 4 + Math.random() * (PITCH_BOTTOM - PITCH_TOP - 8),
        size: Math.random() < 0.5 ? 2 : 3
      });
    }
  }

  function resetGame() {
    score = 0;
    distanceCounter = 0;
    speedLevel = 1;
    levelProgress = 0;
    baseScrollSpeed = 2.2;
    scrollX = 0;

    player.x = 62;
    player.y = 105;
    player.vy = 0;
    player.lives = 3;
    player.invulnTimer = 0;
    player.feverTimer = 0;
    player.ballPhase = 0;
    player.combo = 0;

    obstacles = [];
    items = [];
    particles = [];
    popups = [];
    screenShake = 0;

    hasPlayedOnce = true;
    gameState = STATE.PLAYING;

    if (window.retroAudio) {
      window.retroAudio.playWhistle();
      window.retroAudio.startBGM();
    }
  }

  // Spawn defenders, cones, coins, and golden balls
  function spawnEntities() {
    const currentSpeed = getEffectiveSpeed();

    // Obstacle spawning
    const spawnInterval = Math.max(28, Math.floor(66 - speedLevel * 5));
    if (frameCount % spawnInterval === 0) {
      const roll = Math.random();
      const yPos = PLAYER_MIN_Y + 4 + Math.random() * (PLAYER_MAX_Y - PLAYER_MIN_Y - 4);

      if (roll < 0.22) {
        // Training Cone (static hazard)
        obstacles.push({
          type: 'CONE',
          x: W + 16,
          y: yPos,
          vx: 0,
          vy: 0,
          w: 10,
          h: 11,
          passed: false
        });
      } else if (roll < 0.68) {
        // Charging Rival Defender
        const tracksPlayer = speedLevel >= 2 && Math.random() < 0.45;
        obstacles.push({
          type: 'DEFENDER',
          x: W + 16,
          y: yPos,
          vx: -(0.55 + Math.random() * 0.5 + speedLevel * 0.08),
          vy: tracksPlayer ? (Math.random() < 0.5 ? 0.45 : -0.45) : 0,
          w: 14,
          h: 15,
          passed: false
        });
      } else {
        // Sliding Tackle Defender (fast horizontal lunge!)
        obstacles.push({
          type: 'SLIDE',
          x: W + 20,
          y: Math.min(PLAYER_MAX_Y, Math.max(PLAYER_MIN_Y + 4, player.y + (Math.random() * 44 - 22))),
          vx: -(1.35 + speedLevel * 0.14),
          vy: 0,
          w: 18,
          h: 10,
          passed: false
        });
      }
    }

    // Coin arc / line spawning
    if (frameCount % 65 === 0) {
      const startY = PLAYER_MIN_Y + 12 + Math.random() * (PLAYER_MAX_Y - PLAYER_MIN_Y - 28);
      const count = 3 + Math.floor(Math.random() * 3);
      const waveAmp = (Math.random() - 0.5) * 14;
      for (let i = 0; i < count; i++) {
        items.push({
          type: 'COIN',
          x: W + 16 + i * 16,
          y: Math.max(PLAYER_MIN_Y + 4, Math.min(PLAYER_MAX_Y, startY + Math.sin(i * 0.9) * waveAmp)),
          w: 7,
          h: 8
        });
      }
    }

    // Rare Golden Star Ball (FEVER power-up)
    if (frameCount % 380 === 220 && player.feverTimer <= 0) {
      items.push({
        type: 'STAR_BALL',
        x: W + 20,
        y: PLAYER_MIN_Y + 20 + Math.random() * (PLAYER_MAX_Y - PLAYER_MIN_Y - 35),
        vy: 0.7,
        w: 8,
        h: 8
      });
    }
  }

  function getEffectiveSpeed() {
    const feverBonus = player.feverTimer > 0 ? 1.35 : 0;
    return baseScrollSpeed + (speedLevel - 1) * 0.38 + feverBonus;
  }

  function addPopup(text, x, y, color = '#ffd83b') {
    popups.push({
      text,
      x,
      y,
      color,
      life: 32
    });
  }

  function spawnSpray(x, y, count = 2, color = '#ffffff') {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + (Math.random() * 4 - 2),
        y: y + (Math.random() * 4 - 2),
        vx: -(1.2 + Math.random() * 1.8),
        vy: (Math.random() - 0.5) * 1.2,
        size: Math.random() < 0.6 ? 2 : 1,
        color,
        life: 10 + Math.floor(Math.random() * 10)
      });
    }
  }

  // Main Update Loop
  function update() {
    frameCount++;
    if (inputCooldown > 0) inputCooldown--;
    if (screenShake > 0) screenShake--;

    const spd = gameState === STATE.PLAYING ? getEffectiveSpeed() : 1.2;
    scrollX = (scrollX + spd) % W;

    // Update clouds
    for (const c of clouds) {
      c.x -= c.speed;
      if (c.x + c.w < 0) c.x = W + 10;
    }

    // Update scrolling grass tufts & pitch lines
    for (const t of grassTufts) {
      t.x -= spd;
      if (t.x < -4) {
        t.x = W + Math.random() * 12;
        t.y = PITCH_TOP + 4 + Math.random() * (PITCH_BOTTOM - PITCH_TOP - 8);
      }
    }

    for (const line of pitchLines) {
      line.x -= spd;
      if (line.x < -30) {
        line.x = W + 40;
      }
    }

    if (gameState !== STATE.PLAYING) return;

    // --- PLAYER MOVEMENT (Hold = Up, Release = Down, just like the reference video) ---
    const targetVy = isHoldingUp ? -1.85 : (isHoldingDownKey ? 2.1 : 1.55);
    player.vy += (targetVy - player.vy) * 0.22;
    player.y += player.vy;

    if (player.y < PLAYER_MIN_Y) {
      player.y = PLAYER_MIN_Y;
      player.vy = 0;
    } else if (player.y > PLAYER_MAX_Y) {
      player.y = PLAYER_MAX_Y;
      player.vy = 0;
    }

    // Dribbling / Juggling rhythm
    const prevSin = Math.sin(player.ballPhase);
    player.ballPhase += 0.23 + speedLevel * 0.015;
    const curSin = Math.sin(player.ballPhase);

    // Every time the ball bounces off the player's foot, spawn turf spray
    if (prevSin < 0 && curSin >= 0) {
      spawnSpray(player.x + 2, player.y + 14, 3, '#ffffff');
      spawnSpray(player.x + 12, player.y + 14, 2, '#78ff82');
      if (frameCount % 3 === 0 && window.retroAudio) {
        window.retroAudio.playKick(isHoldingUp ? 1 : 0);
      }
    }

    // Continuous trail spray (like surf wake in the video)
    if (frameCount % 2 === 0) {
      const trailColor = player.feverTimer > 0
        ? (frameCount % 4 === 0 ? '#ffd83b' : '#4cc3ff')
        : (Math.random() < 0.65 ? '#ffffff' : '#65ef75');
      spawnSpray(player.x + 1, player.y + 13, 1, trailColor);
    }

    if (player.invulnTimer > 0) player.invulnTimer--;
    if (player.feverTimer > 0) player.feverTimer--;

    // Distance & Score progression
    distanceCounter += spd * 0.12;
    if (distanceCounter >= 1.8) {
      const add = Math.floor(distanceCounter / 1.8);
      distanceCounter %= 1.8;
      score += add;
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('striker_dribble_hi', String(highScore));
      }
    }

    // Speed Gauge progression
    levelProgress += 0.095;
    if (levelProgress >= 100) {
      levelProgress = 0;
      speedLevel = Math.min(9, speedLevel + 1);
      score += 25;
      addPopup(`SPEED UP! LV${speedLevel}`, player.x + 20, player.y - 8, '#4cc3ff');
      if (window.retroAudio) window.retroAudio.playSpeedUp();
    }

    spawnEntities();

    // Update collectibles
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.x -= spd;
      if (it.type === 'STAR_BALL') {
        it.y += it.vy;
        if (it.y < PLAYER_MIN_Y + 6 || it.y > PLAYER_MAX_Y - 6) it.vy *= -1;
      }

      // Check collision with player + ball hitbox
      if (
        it.x < player.x + 18 &&
        it.x + it.w > player.x &&
        it.y < player.y + 16 &&
        it.y + it.h > player.y - 2
      ) {
        if (it.type === 'COIN') {
          player.combo = Math.min(10, player.combo + 1);
          const pts = 5 + player.combo;
          score += pts;
          addPopup(`+${pts}`, it.x, it.y - 4, '#ffd83b');
          spawnSpray(it.x, it.y, 5, '#ffd83b');
          if (window.retroAudio) window.retroAudio.playCoin(player.combo);
        } else if (it.type === 'STAR_BALL') {
          player.feverTimer = 280; // ~4.6 seconds of invincible super dribble
          score += 30;
          addPopup('SUPER DRIBBLE!', player.x + 10, player.y - 10, '#ffd83b');
          spawnSpray(it.x, it.y, 10, '#ffd83b');
          if (window.retroAudio) window.retroAudio.playPowerup();
        }
        if (score > highScore) {
          highScore = score;
          localStorage.setItem('striker_dribble_hi', String(highScore));
        }
        items.splice(i, 1);
        continue;
      }

      if (it.x < -20) items.splice(i, 1);
    }

    // Update obstacles (Defenders & Cones)
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      ob.x += -spd + ob.vx;
      ob.y += ob.vy;

      if (ob.y < PLAYER_MIN_Y || ob.y > PLAYER_MAX_Y) {
        ob.vy *= -1;
      }

      // Sliding tackle leaves grass/dirt sparks
      if (ob.type === 'SLIDE' && frameCount % 3 === 0) {
        spawnSpray(ob.x + 14, ob.y + 9, 1, '#ffffff');
      }

      // Knocked away state (during Fever)
      if (ob.knocked) {
        ob.x += 5.5;
        ob.y += ob.knockVy;
        if (ob.x > W + 30) obstacles.splice(i, 1);
        continue;
      }

      // Tight arcade hitbox
      const hitX = ob.x + 2 < player.x + 13 && ob.x + ob.w - 2 > player.x + 2;
      const hitY = ob.y + 2 < player.y + 14 && ob.y + ob.h - 2 > player.y + 2;

      if (hitX && hitY) {
        if (player.feverTimer > 0) {
          // Blast defender away in Fever mode!
          ob.knocked = true;
          ob.knockVy = (Math.random() - 0.5) * 5;
          score += 15;
          screenShake = 5;
          addPopup('SMASH! +15', ob.x, ob.y - 4, '#4cc3ff');
          spawnSpray(ob.x, ob.y, 8, '#ffd83b');
          if (window.retroAudio) window.retroAudio.playNearMiss();
          continue;
        } else if (player.invulnTimer <= 0) {
          // Player takes tackle hit
          player.lives--;
          player.combo = 0;
          player.invulnTimer = 75;
          screenShake = 10;
          spawnSpray(player.x + 6, player.y + 8, 12, '#ff3344');
          addPopup('FOUL!', player.x, player.y - 6, '#ff3344');

          if (player.lives <= 0) {
            gameState = STATE.GAMEOVER;
            inputCooldown = 35;
            if (window.retroAudio) window.retroAudio.playGameOver();
          } else {
            if (window.retroAudio) window.retroAudio.playDamage();
          }
          obstacles.splice(i, 1);
          continue;
        }
      }

      // Check Near-Miss ("OLÉ!") bonus when passing close to a defender
      if (!ob.passed && ob.x + ob.w < player.x) {
        ob.passed = true;
        const vertDist = Math.abs((ob.y + ob.h / 2) - (player.y + player.h / 2));
        if (vertDist < 20 && player.invulnTimer <= 0) {
          score += 10;
          addPopup('OLE! +10', player.x + 6, player.y - 8, '#56e364');
          if (window.retroAudio) window.retroAudio.playNearMiss();
        }
      }

      if (ob.x < -30) {
        obstacles.splice(i, 1);
      }
    }

    // Update particles & floating popups
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = popups.length - 1; i >= 0; i--) {
      const pop = popups[i];
      pop.y -= 0.45;
      pop.life--;
      if (pop.life <= 0) popups.splice(i, 1);
    }
  }

  // =========================================================================
  // RENDERING (320x180 Pixel Art Canvas)
  // =========================================================================

  function drawTitleScreen() {
    // Pure black arcade background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // Falling stadium confetti across the title area
    const confettiColors = ['#ffd83b', '#3868ff', '#ff3344', '#56e364', '#ffffff', '#4cc3ff'];
    for (let i = 0; i < 28; i++) {
      const cx = (i * 37 + Math.floor(Math.sin(frameCount * 0.04 + i) * 8)) % (W - 60) + 30;
      const cy = ((i * 19 + Math.floor(frameCount * (0.4 + (i % 3) * 0.15))) % 98) + 8;
      const color = confettiColors[i % confettiColors.length];
      ctx.fillStyle = color;
      // Flutter effect (alternates 2x2 and 2x1)
      const h = (Math.floor(frameCount / 6) + i) % 2 === 0 ? 2 : 1;
      ctx.fillRect(cx, cy, 2, h);
    }

    // Main Title Logo: "STRIKER"
    drawPixelText(ctx, 'STRIKER', W / 2, 22, 5, '#3868ff', '#162870', 'center', 1);
    // Crisp highlight accent on top of title
    drawPixelText(ctx, 'STRIKER', W / 2 - 1, 21, 5, '#ffffff', null, 'center', 1);
    drawPixelText(ctx, 'STRIKER', W / 2, 22, 5, '#3868ff', null, 'center', 1);

    // Soccer Stadium Goalpost & Mesh Net (center vignette above the pitch strip)
    const goalX = 96;
    const goalY = 58;
    const goalW = 128;
    const goalH = 36;

    // Back goal depth frame
    ctx.fillStyle = '#1b243b';
    ctx.fillRect(goalX + 5, goalY + 4, goalW - 10, goalH - 4);

    // Goal Net (crisscross pixel mesh that ripples subtly)
    ctx.fillStyle = '#43547a';
    const netRipple = Math.floor(Math.sin(frameCount * 0.1) * 1);
    for (let nx = goalX + 6; nx < goalX + goalW - 6; nx += 5) {
      ctx.fillRect(nx, goalY + 3, 1, goalH - 3);
    }
    for (let ny = goalY + 5; ny < goalY + goalH; ny += 5) {
      ctx.fillRect(goalX + 4, ny + netRipple, goalW - 8, 1);
    }

    // White Goalposts & Crossbar
    ctx.fillStyle = '#d4dce8';
    ctx.fillRect(goalX + 4, goalY + 3, 2, goalH - 3); // Left back support
    ctx.fillRect(goalX + goalW - 6, goalY + 3, 2, goalH - 3); // Right back support

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(goalX, goalY, goalW, 3); // Top crossbar
    ctx.fillRect(goalX, goalY, 3, goalH); // Left front post
    ctx.fillRect(goalX + goalW - 3, goalY, 3, goalH); // Right front post

    // Animated pixel pitch turf strip & bouncing soccer ball across the goal line (x: 68 to 252, y: 94)
    const stripLeft = 68;
    const stripW = 184;
    const stripY = 94;

    // Deep turf base
    ctx.fillStyle = '#1b7d36';
    ctx.fillRect(stripLeft, stripY + 4, stripW, 6);
    ctx.fillStyle = '#36c959';
    ctx.fillRect(stripLeft, stripY + 2, stripW, 3);

    // White goal line chalk
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(goalX - 2, stripY + 2, goalW + 4, 1);

    // Animated grass blades along the strip
    for (let gx = 0; gx < stripW; gx += 4) {
      const waveH = Math.floor(Math.sin((gx + frameCount * 2) * 0.12) * 2);
      ctx.fillStyle = '#56e364';
      ctx.fillRect(stripLeft + gx, stripY + waveH, 2, 3);
    }

    // Mini animated striker & bouncing ball in front of the goal net
    const titlePlayerFrame = Math.floor(frameCount / 8) % 2 === 0 ? 'PLAYER_1' : 'PLAYER_2';
    drawSprite(ctx, titlePlayerFrame, 144, stripY - 14, 1);
    const bounceY = Math.abs(Math.sin(frameCount * 0.15)) * 6;
    drawSprite(ctx, frameCount % 12 < 6 ? 'BALL_1' : 'BALL_2', 160, stripY - 7 - bounceY, 1);

    // Bottom prompt texts
    if (Math.floor(frameCount / 22) % 2 === 0) {
      const promptText = hasPlayedOnce ? 'PRESS AGAIN' : 'PRESS START';
      drawPixelText(ctx, promptText, W / 2, 126, 1, '#ffffff', null, 'center', 1);
    }

    drawPixelText(ctx, 'HOLD = UP   RELEASE = DOWN', W / 2, 144, 1, '#ffd83b', null, 'center', 1);
  }

  function drawPitchEnvironment() {
    // 1. Bright retro blue sky (y: 0 to 26)
    ctx.fillStyle = '#2d92ff';
    ctx.fillRect(0, 0, W, 14);
    ctx.fillStyle = '#4cacff';
    ctx.fillRect(0, 14, W, 14);

    // Pixel clouds in the sky
    ctx.fillStyle = '#e8f6ff';
    for (const c of clouds) {
      const cx = Math.round(c.x);
      const cy = Math.round(c.y);
      ctx.fillRect(cx, cy + 3, c.w, 4);
      ctx.fillRect(cx + 4, cy + 1, c.w - 8, 2);
      ctx.fillRect(cx + 7, cy, c.w - 14, 1);
    }

    // 2. White foamy / chalk stadium horizon border (y: 26 to 38) - evokes the white wave crest in screenshots 2-4
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 26, W, 5);

    // Scrolling stadium ad boards & pixel turf border
    const boardOffset = Math.floor(scrollX) % 64;
    for (let bx = -boardOffset; bx < W; bx += 64) {
      // Ad board segments
      ctx.fillStyle = '#18348c';
      ctx.fillRect(bx, 30, 30, 5);
      ctx.fillStyle = '#ffd83b';
      ctx.fillRect(bx + 4, 31, 22, 2);

      ctx.fillStyle = '#d92638';
      ctx.fillRect(bx + 32, 30, 30, 5);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(bx + 36, 31, 22, 2);
    }

    // White chalk touchline at y=36..38
    ctx.fillStyle = '#e8f8ec';
    ctx.fillRect(0, 36, W, 2);

    // 3. Layered Horizontal Pitch Bands with scrolling vertical pixel strokes (just like the wave bands in screenshots 2-4!)
    const bands = [
      { y: 38, h: 20, bg: '#268c3e', blade: '#34a84e', density: 4 },
      { y: 58, h: 24, bg: '#2e9e47', blade: '#3eb859', density: 5 },
      { y: 82, h: 24, bg: '#38b052', blade: '#4acc66', density: 5 },
      { y: 106, h: 22, bg: '#42c25d', blade: '#58de75', density: 4 },
      { y: 128, h: 24, bg: '#4dd168', blade: '#68eb83', density: 4 }
    ];

    for (let b = 0; b < bands.length; b++) {
      const band = bands[b];
      ctx.fillStyle = band.bg;
      ctx.fillRect(0, band.y, W, band.h);

      // Horizontal row of crisp vertical pixel grass strokes (recreates the exact pixel texture from screenshots 2-4)
      ctx.fillStyle = band.blade;
      const rowOffset = Math.floor(scrollX * (0.9 + b * 0.08)) % 6;
      for (let gx = -rowOffset; gx < W; gx += 6) {
        const jitter = ((gx + b * 7) % 3);
        ctx.fillRect(gx, band.y + jitter, 1, 5);
        ctx.fillRect(gx + 2, band.y + 2 + jitter, 1, 4);
      }
    }

    // 4. Scrolling white pitch lines (halfway line, center circle, penalty box)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    for (const line of pitchLines) {
      const lx = Math.round(line.x);
      // Perspective-slanted vertical line
      for (let py = PITCH_TOP; py < PITCH_BOTTOM; py += 2) {
        const slant = Math.floor((py - PITCH_TOP) * 0.12);
        ctx.fillRect(lx - slant, py, 2, 2);
      }

      if (line.type === 'center') {
        // Center spot
        const cy = 92;
        const slant = Math.floor((cy - PITCH_TOP) * 0.12);
        ctx.fillRect(lx - slant - 3, cy - 2, 6, 4);
      }
    }

    // Scrolling bright grass flecks
    ctx.fillStyle = '#75ff90';
    for (const t of grassTufts) {
      ctx.fillRect(Math.round(t.x), Math.round(t.y), t.size, 1);
    }
  }

  function drawPlayerAndBall() {
    // Blink when invulnerable after a hit
    if (player.invulnTimer > 0 && Math.floor(frameCount / 3) % 2 === 0) {
      return;
    }

    const px = Math.round(player.x);
    const py = Math.round(player.y);

    // Shadow under player
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(px + 2, py + 14, 10, 2);

    // White turf/chalk wake underneath player's feet (matches the white surf board spray in screenshots 2-4)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(px - 2, py + 13, 6, 2);
    ctx.fillRect(px - 5, py + 14, 4, 1);

    // Choose running / juggling animation frame
    const runFrame = Math.floor(frameCount / 5) % 2 === 0 ? 'PLAYER_1' : 'PLAYER_2';
    const feverOverride = player.feverTimer > 0 && frameCount % 4 < 2 ? '#ffffff' : null;
    drawSprite(ctx, runFrame, px, py, 1, false, feverOverride);

    // Dribbling / Juggling Ball right in front of the player's feet
    const ballBounce = Math.round(Math.abs(Math.sin(player.ballPhase)) * 7);
    const bx = px + 13;
    const by = py + 9 - ballBounce;

    // Ball shadow on the grass
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(bx + 1, py + 14, 5, 2);

    // Draw spinning soccer ball (or Golden Star Ball during Fever)
    const ballSprite = player.feverTimer > 0
      ? 'STAR_BALL'
      : (Math.floor(frameCount / 4) % 2 === 0 ? 'BALL_1' : 'BALL_2');
    drawSprite(ctx, ballSprite, bx, by, 1);
  }

  function drawEntities() {
    // Draw collectibles
    for (const it of items) {
      if (it.type === 'COIN') {
        const coinSprite = Math.floor(frameCount / 8) % 2 === 0 ? 'COIN_1' : 'COIN_2';
        drawSprite(ctx, coinSprite, it.x, it.y, 1);
      } else if (it.type === 'STAR_BALL') {
        drawSprite(ctx, 'STAR_BALL', it.x, it.y, 1);
      }
    }

    // Draw obstacles (Defenders & Cones)
    for (const ob of obstacles) {
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(Math.round(ob.x + 2), Math.round(ob.y + ob.h - 2), ob.w - 4, 2);

      if (ob.type === 'CONE') {
        drawSprite(ctx, 'CONE', ob.x, ob.y, 1);
      } else if (ob.type === 'SLIDE') {
        drawSprite(ctx, 'DEF_SLIDE', ob.x, ob.y, 1);
      } else {
        const defFrame = Math.floor(frameCount / 6) % 2 === 0 ? 'DEF_RUN_1' : 'DEF_RUN_2';
        drawSprite(ctx, defFrame, ob.x, ob.y, 1);
      }
    }

    // Draw turf/chalk particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
    }

    // Draw floating score/OLE popups
    for (const pop of popups) {
      drawPixelText(ctx, pop.text, pop.x, pop.y, 1, pop.color, '#000000', 'left', 1);
    }
  }

  // Bottom Black HUD Bar (y: 152 to 180) - Faithful to Screenshots 2, 3, 4
  function drawBottomHUD() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, PITCH_BOTTOM, W, H - PITCH_BOTTOM);

    // Subtle top border line on the black bar
    ctx.fillStyle = '#182030';
    ctx.fillRect(0, PITCH_BOTTOM, W, 1);

    // LEFT: 6-digit zero-padded score + HI score below it
    const scoreStr = String(score).padStart(6, '0') + ' PTS';
    const hiStr = 'HI ' + String(highScore).padStart(6, '0') + ' PTS';
    drawPixelText(ctx, scoreStr, 12, 157, 1, '#fff3b8', null, 'left', 1);
    drawPixelText(ctx, hiStr, 12, 168, 1, '#d98a2b', null, 'left', 1);

    // CENTER: Speed Level & Progress Bar
    const speedLabel = player.feverTimer > 0 ? 'FEVER!!' : `SPEED ${speedLevel}`;
    const labelColor = player.feverTimer > 0 && frameCount % 6 < 3 ? '#ffd83b' : '#ffffff';
    drawPixelText(ctx, speedLabel, 134, 156, 1, labelColor, null, 'left', 1);

    // Progress bar track (56x3)
    const barX = 134;
    const barY = 163;
    const barW = 56;
    ctx.fillStyle = '#222a3d';
    ctx.fillRect(barX, barY, barW, 3);

    const fillRatio = player.feverTimer > 0 ? (player.feverTimer / 280) : (levelProgress / 100);
    const fillW = Math.max(2, Math.floor(barW * fillRatio));
    ctx.fillStyle = player.feverTimer > 0 ? '#ffd83b' : '#4ce668';
    ctx.fillRect(barX, barY, fillW, 3);

    drawPixelText(ctx, 'DRIBBLE', 134, 169, 1, '#9ba8c7', null, 'left', 1);

    // RIGHT: LIFE + 3 Crown/Trophy Icons
    drawPixelText(ctx, 'LIFE', 274, 156, 1, '#d98a2b', null, 'left', 1);
    for (let i = 0; i < 3; i++) {
      const iconX = 274 + i * 11;
      const iconY = 165;
      if (i < player.lives) {
        drawSprite(ctx, 'LIFE_CROWN', iconX, iconY, 1);
      } else {
        drawSprite(ctx, 'LIFE_CROWN', iconX, iconY, 1, false, '#282d3e');
      }
    }
  }

  function drawGameOverOverlay() {
    // Semi-transparent dark banner in center of pitch
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    ctx.fillRect(46, 52, W - 92, 78);
    ctx.strokeStyle = '#ffd83b';
    ctx.lineWidth = 1;
    ctx.strokeRect(46.5, 52.5, W - 93, 77);

    drawPixelText(ctx, 'FULL TIME', W / 2, 62, 2, '#ff3344', '#000000', 'center', 1);
    drawPixelText(ctx, `SCORE  ${String(score).padStart(6, '0')} PTS`, W / 2, 84, 1, '#ffffff', null, 'center', 1);
    drawPixelText(ctx, `BEST   ${String(highScore).padStart(6, '0')} PTS`, W / 2, 95, 1, '#ffd83b', null, 'center', 1);

    if (Math.floor(frameCount / 20) % 2 === 0) {
      drawPixelText(ctx, 'PRESS TO PLAY AGAIN', W / 2, 113, 1, '#56e364', null, 'center', 1);
    }
  }

  function render() {
    ctx.save();
    if (screenShake > 0) {
      const dx = Math.round((Math.random() - 0.5) * 4);
      const dy = Math.round((Math.random() - 0.5) * 4);
      ctx.translate(dx, dy);
    }

    if (gameState === STATE.TITLE) {
      drawTitleScreen();
    } else {
      drawPitchEnvironment();
      drawEntities();
      drawPlayerAndBall();
      drawBottomHUD();

      if (gameState === STATE.GAMEOVER) {
        drawGameOverOverlay();
      }
    }

    ctx.restore();
  }

  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  // =========================================================================
  // INPUT HANDLERS (Touch, Mouse, Keyboard)
  // =========================================================================

  function handlePressStart(e) {
    // Ignore clicks on top UI buttons
    if (e && e.target && e.target.closest('.ui-btn')) return;

    if (window.retroAudio) window.retroAudio.init();

    if (gameState === STATE.TITLE) {
      if (inputCooldown <= 0) {
        resetGame();
        isHoldingUp = true;
      }
      return;
    }

    if (gameState === STATE.GAMEOVER) {
      if (inputCooldown <= 0) {
        gameState = STATE.TITLE;
        inputCooldown = 18;
      }
      return;
    }

    isHoldingUp = true;
  }

  function handlePressEnd() {
    isHoldingUp = false;
  }

  const screenWrapper = document.getElementById('screen-wrapper');

  // Pointer / Touch events
  screenWrapper.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    handlePressStart(e);
  });

  window.addEventListener('pointerup', () => {
    handlePressEnd();
  });

  window.addEventListener('pointercancel', () => {
    handlePressEnd();
  });

  // Keyboard controls
  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) {
      e.preventDefault();
      handlePressStart(e);
    } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
      e.preventDefault();
      isHoldingDownKey = true;
      isHoldingUp = false;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) {
      handlePressEnd();
    } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
      isHoldingDownKey = false;
    }
  });

  // UI Buttons (CRT toggle & Sound toggle)
  const btnCrt = document.getElementById('btn-crt');
  const scanlines = document.getElementById('scanlines');
  btnCrt.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOff = scanlines.classList.toggle('off');
    btnCrt.classList.toggle('active', !isOff);
    btnCrt.textContent = isOff ? 'CRT: OFF' : 'CRT: ON';
  });

  const btnSound = document.getElementById('btn-sound');
  btnSound.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!window.retroAudio) return;
    const enabled = window.retroAudio.toggle();
    btnSound.classList.toggle('active', enabled);
    btnSound.textContent = enabled ? 'SOUND: ON' : 'SOUND: OFF';
    if (enabled && gameState === STATE.PLAYING) {
      window.retroAudio.startBGM();
    }
  });

  // Boot game
  initEnvironment();
  requestAnimationFrame(loop);
})();
