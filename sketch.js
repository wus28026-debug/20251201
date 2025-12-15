// 全新實作：idle 使用 all1.png（8 帧 95x149），行走使用 all2.png（10 帧 1485x143）
const IDLE_FRAME_W = 95;
const IDLE_FRAME_H = 149;
const IDLE_FRAME_COUNT = 8;

const WALK_TOTAL_W = 1485; // total width of all2.png (info)
const WALK_TOTAL_H = 143;
const WALK_FRAME_COUNT = 10;

const ANIM_FPS = 12; // 動畫幀率
const SPEED = 220; // 移動速度 (px/s)

let idleSheet = null; // all1.png
let walkSheet = null; // all2.png
let jumpSheet = null; // all4.png (will load all4.png for jump)
let spaceSheet = null; // all3.png (for space action)

let currentFrame = 0;
let animAccumulator = 0;
let jumpElapsed = 0;
let jumping = false;
let jumpStartY = 0;
const JUMP_FRAME_COUNT = 12; // all4.png (12 frames)
const JUMP_HEIGHT = 160; // pixels to move up at peak (adjustable)
const JUMP_PEAK_FRAME = 5; // 當到第 6 張圖（index 5）時開始往下
// space (special hop) settings
const SPACE_FRAME_COUNT = 10; // all3.png
let spaceActive = false;
let spaceElapsed = 0;
let spaceV = 0; // horizontal velocity during space action (px/s)
const SPACE_SPEED_MIN = 120;
const SPACE_SPEED_MAX = 320;

let posX, posY;
let facing = 1; // 1 = right, -1 = left
let movingLeft = false;
let movingRight = false;
let canvasElem = null;
let inputElem = null; // p5 input element for dialog
let dialogActive = false;

// --- 測驗遊戲變數 ---
let quizTable = null;
let currentQuestionRow = null;
let quizState = 'IDLE'; // 'IDLE', 'ASKING', 'SHOWING_FEEDBACK'
let feedbackTimer = 0;

// all7 sprite (13 frames, total size ~3219x290)
const ALL7_FRAME_COUNT = 13;
let all7Sheet = null;
let leftSprite = null;
const LEFT_X = () => Math.floor(width / 3); // 畫面 1/3 的 x 座標
const LEFT_SCALE = 0.85; // left (all7) 縮小比例
// all8 sprite (14 frames, total size ~5231x425)
const ALL8_FRAME_COUNT = 14;
let all8Sheet = null;
let rightSprite = null;
const RIGHT_X = () => Math.floor((2 * width) / 3); // 畫面 2/3 的 x 座標
// all9 sprite (10 frames, total size ~2085x273) - used when player is near
const ALL9_FRAME_COUNT = 10;
let all9Sheet = null;
// all10 weapon sprite (assumption: default 6 frames if unknown)
const ALL10_FRAME_COUNT = 6;
let all10Sheet = null;
let projectiles = [];
const PROJ_SPEED = 600; // px/s
// 接近判定距離（像素）
const PROXIMITY_DIST = 160;

function preload() {
  // 嘗試幾個常見路徑（root, 1/, 2/）以提高成功率
  // 嘗試更多常見子資料夾（root, 1/, 2/, 3/, 4/），以涵蓋工作區中可能的位置
  const idlePaths = ['all1.png', '1/all1.png', '2/all1.png', '3/all1.png', '4/all1.png'];
  const walkPaths = ['all2.png', '1/all2.png', '2/all2.png', '3/all2.png', '4/all2.png'];
  const jumpPaths = ['all4.png', '1/all4.png', '2/all4.png', '3/all4.png', '4/all4.png'];
  const spacePaths = ['all3.png', '1/all3.png', '2/all3.png', '3/all3.png', '4/all3.png'];

  const all7Paths = ['all7.png', '1/all7.png', '2/all7.png', '3/all7.png', '4/all7.png', '7/all7.png'];
  const all8Paths = ['all8.png', '1/all8.png', '2/all8.png', '3/all8.png', '4/all8.png', '8/all8.png'];
  const all9Paths = ['all9.png', '1/all9.png', '2/all9.png', '3/all9.png', '4/all9.png', '9/all9.png'];
  const all10Paths = ['all10.png', '1/all10.png', '2/all10.png', '3/all10.png', '4/all10.png', '10/all10.png'];

  // 載入測驗題庫
  quizTable = loadTable('quiz.csv', 'csv', 'header');

  function tryLoadPaths(paths, assignCallback, i = 0) {
    if (i >= paths.length) return;
    const p = paths[i];
    loadImage(p,
      img => { assignCallback(img, p); },
      err => { tryLoadPaths(paths, assignCallback, i + 1); }
    );
  }

  tryLoadPaths(idlePaths, (img, p) => { idleSheet = img; /*idleLoadedPath = p;*/ });
  tryLoadPaths(walkPaths, (img, p) => { walkSheet = img; /*walkLoadedPath = p;*/ });
  tryLoadPaths(jumpPaths, (img, p) => { jumpSheet = img; });
  tryLoadPaths(spacePaths, (img, p) => { spaceSheet = img; });
  tryLoadPaths(all7Paths, (img, p) => { all7Sheet = img; });
  tryLoadPaths(all8Paths, (img, p) => { all8Sheet = img; });
  tryLoadPaths(all9Paths, (img, p) => { all9Sheet = img; });
  tryLoadPaths(all10Paths, (img, p) => { all10Sheet = img; });
}

function setup() {
  canvasElem = createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  noSmooth();
  posX = width / 2;
  posY = height / 2;
  // 建立隱藏的輸入框，用於 leftSprite 的對話輸入
  inputElem = createInput('');
  inputElem.attribute('placeholder', '在此輸入...'); // 將提示文字設為 placeholder
  inputElem.size(280); // 調整輸入框寬度以填滿背景
  inputElem.style('background-color', '#FFDDDD'); // 設定輸入框本身的背景為淺粉色
  inputElem.style('border', '1px solid #969696'); // 加上一個細邊框，讓它更清晰
  inputElem.hide();
  // 監聽 Enter 鍵送出
  inputElem.elt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDialogSubmit();
    }
  });
}

function draw() {
  background('#fefae0');

  // 顯示 idle 圖片載入狀態，但不要阻止 all7 精靈顯示
  if (!idleSheet || !idleSheet.width) {
    push();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('loading all1.png...', width / 2, height / 2);
    pop();
    // 不 return，繼續執行，讓 spawnedSprites 能在缺少 idle 時仍被產生並繪製
  }

  // 決定使用哪個 sprite（移動時用 walkSheet，否則用 idle）
  // 優先順序： spaceAction > jump > walk > idle
  const wantsWalk = movingLeft || movingRight;
  const wantsJump = jumping;
  const wantsSpace = spaceActive;
  const activeSheet = wantsSpace && spaceSheet && spaceSheet.width ? spaceSheet
    : (wantsJump && jumpSheet && jumpSheet.width ? jumpSheet
    : (wantsWalk && walkSheet && walkSheet.width ? walkSheet : idleSheet));
  const activeFrameCount = (activeSheet === spaceSheet) ? SPACE_FRAME_COUNT
    : ((activeSheet === jumpSheet) ? JUMP_FRAME_COUNT : ((activeSheet === walkSheet) ? WALK_FRAME_COUNT : IDLE_FRAME_COUNT));

  // 更新位置
  const dt = deltaTime / 1000;
  // 初始化單一 leftSprite（如果圖片已載入且尚未建立），固定在畫面左側中間
  if (all7Sheet && all7Sheet.width && !leftSprite) {
    leftSprite = new NonControlledSprite(LEFT_X(), height / 2, all7Sheet, ALL7_FRAME_COUNT);
    // 放慢 left sprite 動畫
    leftSprite.animFPS = Math.max(4, Math.floor(ANIM_FPS * 0.5));
  }
  // 初始化右側精靈（all8）
  if (all8Sheet && all8Sheet.width && !rightSprite) {
    rightSprite = new NonControlledSprite(RIGHT_X(), height / 2, all8Sheet, ALL8_FRAME_COUNT);
    // 放慢 right sprite 動畫
    rightSprite.animFPS = Math.max(4, Math.floor(ANIM_FPS * 0.5));
    rightSprite.dialogText = '';
  }
  if (movingRight) {
    facing = 1;
    posX += SPEED * dt;
  }
  if (movingLeft) {
    facing = -1;
    posX -= SPEED * dt;
  }

  // 若正在執行 space action，覆寫水平速度
  if (spaceActive) {
    posX += spaceV * dt;
  }

  // 計算 frame 尺寸
  const frameW = Math.floor(activeSheet.width / activeFrameCount) || IDLE_FRAME_W;
  const frameH = activeSheet.height || IDLE_FRAME_H;

  // 邊界限制
  posX = constrain(posX, frameW / 2, width - frameW / 2);

  // 動畫幀更新
  animAccumulator += dt;
  const frameDuration = 1 / ANIM_FPS;
  if (animAccumulator >= frameDuration) {
    const advance = Math.floor(animAccumulator / frameDuration);
    currentFrame = (currentFrame + advance) % activeFrameCount;
    animAccumulator -= advance * frameDuration;
  }

  // space action 時間與結束判定
  if (spaceActive) {
    spaceElapsed += dt;
    const totalSpaceTime = frameDuration * SPACE_FRAME_COUNT;
    if (spaceElapsed >= totalSpaceTime) {
      // space action 結束，回到畫布中央並重置
      spaceActive = false;
      spaceElapsed = 0;
      spaceV = 0;
      currentFrame = 0;
      animAccumulator = 0;
      posX = width / 2;
      posY = height / 2;
    }
  }

  // 跳躍位置控制（若 jumping）
  if (jumping) {
    jumpElapsed += dt;
    const peakTime = frameDuration * (JUMP_PEAK_FRAME + 1); // 到第 4 帧時視為到頂
    const totalJumpTime = frameDuration * JUMP_FRAME_COUNT;
    if (jumpElapsed <= peakTime) {
      // 上升
      const t = jumpElapsed / peakTime; // 0..1
      posY = jumpStartY - JUMP_HEIGHT * t;
    } else if (jumpElapsed < totalJumpTime) {
      // 下降
      const t2 = (jumpElapsed - peakTime) / (totalJumpTime - peakTime); // 0..1
      posY = jumpStartY - JUMP_HEIGHT * (1 - t2);
    } else {
      // 跳躍結束，回復
      jumping = false;
      jumpElapsed = 0;
      posY = jumpStartY;
      currentFrame = 0;
      animAccumulator = 0;
    }
  }

  const sx = currentFrame * frameW;
  const sy = 0;

  // 更新並繪製左側的單一精靈（不受鍵盤控制），位置以主角為基準往左偏移
  if (leftSprite) {
    leftSprite.update(dt);
    // 若主角靠近 leftSprite，暫時切換到 all9
    const distLeft = Math.abs(posX - LEFT_X());    
    if (all9Sheet && distLeft <= PROXIMITY_DIST && quizState === 'IDLE') {
      leftSprite.useTemporarySheet(all9Sheet, ALL9_FRAME_COUNT);
      // --- 觸發問答 ---
      quizState = 'ASKING';
      askNewQuestion(); // 提出新問題
      dialogActive = true;
      if (inputElem) {
        // 放在 leftSprite 上方
        const canvasLeft = canvasElem.elt.getBoundingClientRect().left;
        const canvasTop = canvasElem.elt.getBoundingClientRect().top;
        const leftOrigH = (leftSprite && leftSprite._origFrameH) ? leftSprite._origFrameH : frameH;
        const displayH_local = Math.floor(leftOrigH * LEFT_SCALE);
        // 將輸入框定位在對話氣泡下方
        const inputX = Math.floor(canvasLeft + LEFT_X() - 145); // 調整X座標以置中
        const inputY = Math.floor(canvasTop + height / 2 - displayH_local - 5);
        inputElem.position(inputX, inputY);
        inputElem.show();
        inputElem.elt.focus();
      }      
      if (rightSprite) rightSprite.alwaysShow = true;

    } else if (distLeft > PROXIMITY_DIST) {
      // 如果玩家遠離，且不是在顯示回饋的狀態，則重置
      if (quizState !== 'SHOWING_FEEDBACK') {
        leftSprite.restoreOriginalSheet();
        dialogActive = false;
        if (inputElem) inputElem.hide();
        if (rightSprite) {
          rightSprite.alwaysShow = false;
          rightSprite.dialogText = ''; // 清空右側對話
        }
        quizState = 'IDLE';
      }
    } else {
      // 玩家在範圍內，但可能已經在回答問題或看回饋
      leftSprite.useTemporarySheet(all9Sheet, ALL9_FRAME_COUNT);
    }
    // 左側顯示尺寸：以原始來源影格為基準進行縮放
    const leftOrigW = (leftSprite && leftSprite._origFrameW) ? leftSprite._origFrameW : frameW;
    const leftOrigH = (leftSprite && leftSprite._origFrameH) ? leftSprite._origFrameH : frameH;
    const leftDisplayW = Math.floor(leftOrigW * LEFT_SCALE);
    const leftDisplayH = Math.floor(leftOrigH * LEFT_SCALE);
    // 繪製左側精靈（縮小顯示）
    leftSprite.draw(LEFT_X(), height / 2, leftDisplayW, leftDisplayH);
  }

  // 如果正在顯示回饋，則計時
  if (quizState === 'SHOWING_FEEDBACK') {
    feedbackTimer += dt;
    if (feedbackTimer > 3) { // 顯示回饋 3 秒
      quizState = 'IDLE';
      feedbackTimer = 0;
    }
  }

  // 更新並繪製投射物
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.update(dt);
    p.draw();
    // 檢查與 left/right 碰撞（簡單 AABB）
    if (leftSprite && p.alive) {
      const dx = Math.abs(p.x - LEFT_X());
      const dy = Math.abs(p.y - height / 2);
      const lw = (leftSprite._origFrameW || frameW) / 2;
      const lh = (leftSprite._origFrameH || frameH) / 2;
      const pw = (p.frameW_source || 20) / 2;
      const ph = (p.frameH_source || 20) / 2;
      if (dx <= lw + pw && dy <= lh + ph) {
        // 碰撞：觸發 left 播放 all9 一次並移除投射物
        if (all9Sheet) leftSprite.useTemporarySheet(all9Sheet, ALL9_FRAME_COUNT, true);
        p.alive = false;
      }
    }
    if (rightSprite && p.alive) {
      const dx = Math.abs(p.x - RIGHT_X());
      const dy = Math.abs(p.y - height / 2);
      const rw = (rightSprite._origFrameW || frameW) / 2;
      const rh = (rightSprite._origFrameH || frameH) / 2;
      const pw = (p.frameW_source || 20) / 2;
      const ph = (p.frameH_source || 20) / 2;
      if (dx <= rw + pw && dy <= rh + ph) {
        if (all9Sheet) rightSprite.useTemporarySheet(all9Sheet, ALL9_FRAME_COUNT, true);
        p.alive = false;
      }
    }
    if (!p.alive) projectiles.splice(i, 1);
  }

  // 更新並繪製右側的單一精靈（不受鍵盤控制），固定在畫面右側
  if (rightSprite) {
    rightSprite.update(dt);
    // 若主角靠近 rightSprite，暫時切換到 all9
    const distRight = Math.abs(posX - RIGHT_X());
    if (all9Sheet && distRight <= PROXIMITY_DIST) {
      rightSprite.useTemporarySheet(all9Sheet, ALL9_FRAME_COUNT);
    } else {
      rightSprite.restoreOriginalSheet();
    }
  // 右側與左側共用顯示大小（若 leftSprite 已存在，使用其 frameW/frameH）
  // 右側目標大小：使用 left 的原始來源影格大小（不含 LEFT_SCALE），以保持右側大小不受 left 縮小影響
  const targetW = (leftSprite && leftSprite._origFrameW) ? leftSprite._origFrameW : frameW;
  const targetH = (leftSprite && leftSprite._origFrameH) ? leftSprite._origFrameH : frameH;
    // 若主角移到 all7 左邊（posX < LEFT_X()），則把右側角色左右反向顯示
    const shouldFlip = (posX < LEFT_X());
    rightSprite.draw(RIGHT_X(), height / 2, targetW, targetH, shouldFlip);
  }

  // 繪製主角（鏡像處理）
  push();
  translate(posX, posY);
  if (facing < 0) scale(-1, 1);
  image(activeSheet, 0, 0, frameW, frameH, sx, sy, frameW, frameH);
  pop();

  // 繪製 leftSprite 的對話框文字（當接近時）
  if (leftSprite) {
    const bubbleX = LEFT_X();
    const bubbleY = height / 2 - ( (leftSprite && leftSprite.frameH) ? leftSprite.frameH : frameH) / 2 - 40;

    if (dialogActive) {
        // 繪製觸發者的對話氣泡
        push();
        rectMode(CENTER);
        fill(255);
        stroke(0);
        strokeWeight(1);
        rect(bubbleX, bubbleY, 220, 36, 6);
        noStroke();
        fill(0);
        textAlign(CENTER, CENTER);
        textSize(14);
        text('請回答右邊的問題！', bubbleX, bubbleY);
        pop();
    }
  }

  // 繪製 rightSprite 的對話文字（若有）
  if (rightSprite && (rightSprite.dialogText || rightSprite.alwaysShow)) {
    const bubbleX = RIGHT_X();
    const bubbleY = height / 2 - ( (rightSprite && rightSprite.frameH) ? rightSprite.frameH : frameH) / 2 - 40;
    push();
    rectMode(CENTER);
    // 背景顏色 d6ccc2
    fill('#d6ccc2');
    stroke(0);
    strokeWeight(1);
    textAlign(CENTER, CENTER);
    textSize(14);
    const txt = rightSprite.dialogText || '...';
    const w = max(80, textWidth(txt) + 20);
    rect(bubbleX, bubbleY, w, 36, 6);
    noStroke();
    fill(0);
    text(txt, bubbleX, bubbleY);
    pop();
  }

  // 在畫布左上角顯示學號與姓名（覆蓋在最上層）
  push();
  textAlign(LEFT, TOP);
  textSize(20);
  fill(0);
  noStroke();
  // 若想微調位置，可更改 x,y（目前為距離邊緣 8px）
  text('41470027 王瑀瑄', 8, 8);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  posY = height / 2;
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    movingRight = true;
    // 切換到行走動畫從頭開始
    currentFrame = 0;
    animAccumulator = 0;
  } else if (keyCode === LEFT_ARROW) {
    movingLeft = true;
    currentFrame = 0;
    animAccumulator = 0;
  } else if (keyCode === UP_ARROW) {
    // 開始跳躍（若還沒在跳）
    if (!jumping) {
      jumping = true;
      jumpElapsed = 0;
      jumpStartY = posY;
      currentFrame = 0;
      animAccumulator = 0;
    }
  } else if (key === ' ' || keyCode === 32) {
    // 空白鍵啟動 space action（若尚未在執行）
    if (!spaceActive) {
      spaceActive = true;
      spaceElapsed = 0;
      // 隨機左右速度
      const dir = random() < 0.5 ? -1 : 1;
      const mag = random(SPACE_SPEED_MIN, SPACE_SPEED_MAX);
      spaceV = dir * mag;
      facing = dir;
      // 隨機一個起始位置（X,Y）在畫布上，確保不超出邊界
      const approxW = (spaceSheet && spaceSheet.width) ? Math.floor(spaceSheet.width / SPACE_FRAME_COUNT) : IDLE_FRAME_W;
      const approxH = (spaceSheet && spaceSheet.height) ? spaceSheet.height : IDLE_FRAME_H;
      posX = random(approxW / 2, max(width - approxW / 2, approxW / 2));
      posY = random(approxH / 2, max(height - approxH / 2, approxH / 2));
      currentFrame = 0;
      animAccumulator = 0;
    }
  } else if (keyCode === DOWN_ARROW) {
    // 發射投射物（all10），若找不到 all10 圖檔則發射一個 fallback 投射物（用簡單圖形顯示）
    const startX = posX + (facing > 0 ? (frameW / 2 + 10) : -(frameW / 2 + 10));
    const projSheet = (all10Sheet && all10Sheet.width) ? all10Sheet : null;
    const projFrameCount = (all10Sheet && all10Sheet.width) ? ALL10_FRAME_COUNT : 1;
    const proj = new Projectile(startX, posY, facing * PROJ_SPEED, 0, projSheet, projFrameCount);
    projectiles.push(proj);
  }
}

function keyReleased() {
  if (keyCode === RIGHT_ARROW) {
    movingRight = false;
    currentFrame = 0;
    animAccumulator = 0;
  } else if (keyCode === LEFT_ARROW) {
    movingLeft = false;
    currentFrame = 0;
    animAccumulator = 0;
  }
}

// 處理對話輸入提交
function handleDialogSubmit() {
  if (!inputElem) return;
  const val = inputElem.value().trim();
  if (val.length === 0) return;

  // --- 檢查答案 ---
  if (quizState === 'ASKING' && currentQuestionRow) {
    const correctAnswer = currentQuestionRow.getString('答案');
    if (val === correctAnswer) {
      rightSprite.dialogText = currentQuestionRow.getString('答對時的回饋');
    } else {
      rightSprite.dialogText = currentQuestionRow.getString('答錯時的回饋');
    }
    quizState = 'SHOWING_FEEDBACK';
    feedbackTimer = 0; // 重置回饋計時器
  }

  // 清空並隱藏輸入框
  inputElem.value('');
  inputElem.hide();
  dialogActive = false;
}

// --- 測驗遊戲函式 ---

/**
 * 從 CSV 中隨機抽取一個新問題並顯示在右邊角色上
 */
function askNewQuestion() {
  const randomIndex = floor(random(quizTable.getRowCount()));
  currentQuestionRow = quizTable.getRow(randomIndex);
  const questionText = currentQuestionRow.getString('題目');
  if (rightSprite) {
    rightSprite.dialogText = questionText;
  }
}

// 非受鍵盤控制的角色類別，支援任意 sprite sheet 與 frame count
class NonControlledSprite {
  // sheet: p5.Image, frameCount: number
  constructor(x, y, sheet = null, frameCount = ALL7_FRAME_COUNT) {
    this.x = x;
    this.y = y;
    this.sheet = sheet;
    // keep original sheet/frameCount to allow temporary switching
    this._origSheet = sheet;
    this._origFrameCount = frameCount;
    this.frame = 0;
    this.acc = 0;
    this.frameCount = frameCount;
    // 預設尺寸（當 sheet 尚未可用時使用近似值）
    const approxTotalW = (frameCount === ALL8_FRAME_COUNT) ? 5231 : 3219;
    const approxH = (frameCount === ALL8_FRAME_COUNT) ? 425 : 290;
    this.frameW = sheet && sheet.width ? Math.floor(sheet.width / this.frameCount) : Math.floor(approxTotalW / this.frameCount);
    this.frameH = sheet && sheet.height ? sheet.height : approxH;
    // 保存原始顯示尺寸（來源影格寬高的顯示參考）
    this._origFrameW = this.frameW;
    this._origFrameH = this.frameH;
    // 來源影格尺寸（用於計算來源裁切 sx, sy）
    this.frameW_source = this.frameW;
    this.frameH_source = this.frameH;
    this._usingTemp = false;
    this.animFPS = ANIM_FPS;
  }

  update(dt) {
    // 如果圖片尚未載入，跳過計時（但會嘗試修正尺寸）
    if (this.sheet && this.sheet.width) {
      // 更新來源影格寬高
      this.frameW_source = Math.floor(this.sheet.width / this.frameCount);
      this.frameH_source = this.sheet.height;
      // 若未處於臨時切換，更新顯示尺寸與原始尺寸參考
      if (!this._usingTemp) {
        this.frameW = this.frameW_source;
        this.frameH = this.frameH_source;
        this._origFrameW = this.frameW;
        this._origFrameH = this.frameH;
      }
    }
    this.acc += dt;
    const frameDuration = 1 / this.animFPS;
    if (this.acc >= frameDuration) {
      const adv = Math.floor(this.acc / frameDuration);
      this.frame = (this.frame + adv) % this.frameCount;
      this.acc -= adv * frameDuration;
    }
    // if playing once, advance timer and restore when done
    if (this._playOnce) {
      this._playOnceTimer += dt;
      if (this._playOnceTimer >= this._playOnceTotalTime) {
        this._playOnce = false;
        this._playOnceTimer = 0;
        // restore original sheet after finishing
        this.restoreOriginalSheet();
      }
    }
  }

  // draw(x?, y?, w?, h?) 可選參數以覆蓋位置與大小
  draw() {
    if (!this.sheet || !this.sheet.width) return;
    // 使用來源影格寬度計算 sx（來源影格寬度與顯示寬度分離）
    const sx = this.frame * this.frameW_source;
    const sy = 0;
    const useX = (typeof arguments[0] === 'number') ? arguments[0] : this.x;
    const useY = (typeof arguments[1] === 'number') ? arguments[1] : this.y;
    // 若使用者傳入目標顯示大小，使用之；否則使用顯示寬高（若處於臨時 sheet，顯示大小仍為原始 _origFrameW/_origFrameH）
    const useW = (typeof arguments[2] === 'number') ? arguments[2] : (this._usingTemp ? this._origFrameW : this.frameW);
    const useH = (typeof arguments[3] === 'number') ? arguments[3] : (this._usingTemp ? this._origFrameH : this.frameH);
    const flip = (typeof arguments[4] === 'boolean') ? arguments[4] : this.flipped;
    push();
    translate(useX, useY);
    if (flip) scale(-1, 1);
    // draw image: destination size useW/useH, source rect sx,sy,this.frameW_source,this.frameH_source
    image(this.sheet, 0, 0, useW, useH, sx, sy, this.frameW_source, this.frameH_source);
    pop();
  }

  // 暫時使用另一個 sprite sheet（例如 all9），會改變 frameCount
  useTemporarySheet(sheet, frameCount) {
    if (!sheet) return;
    this.sheet = sheet;
    this.frameCount = frameCount;
    this._usingTemp = true;
    // 設定來源影格寬高，但保留原始顯示尺寸（_origFrameW/_origFrameH）
    if (this.sheet && this.sheet.width) {
      this.frameW_source = Math.floor(this.sheet.width / this.frameCount);
      this.frameH_source = this.sheet.height;
    }
    // 若第三參數為 true，代表要播放一次後恢復
    const playOnce = (arguments.length >= 3) ? arguments[2] : false;
    if (playOnce) {
      this._playOnce = true;
      this._playOnceTimer = 0;
      this._playOnceTotalTime = this.frameCount / this.animFPS;
    } else {
      this._playOnce = false;
      this._playOnceTimer = 0;
      this._playOnceTotalTime = 0;
    }
  }

  // 恢復成原本的 sheet/frameCount
  restoreOriginalSheet() {
    this.sheet = this._origSheet;
    this.frameCount = this._origFrameCount;
    this._usingTemp = false;
    if (this.sheet && this.sheet.width) {
      this.frameW_source = Math.floor(this.sheet.width / this.frameCount);
      this.frameH_source = this.sheet.height;
      this.frameW = this.frameW_source;
      this.frameH = this.frameH_source;
      this._origFrameW = this.frameW;
      this._origFrameH = this.frameH;
    }
  }
}

// 投射物類別，使用 sprite sheet
class Projectile {
  constructor(x, y, vx, vy, sheet, frameCount = ALL10_FRAME_COUNT) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.sheet = sheet;
    this.frameCount = frameCount;
    this.frame = 0;
    this.acc = 0;
    this.frameW_source = (sheet && sheet.width) ? Math.floor(sheet.width / frameCount) : 20;
    this.frameH_source = (sheet && sheet.height) ? sheet.height : 20;
    this.frameW = this.frameW_source;
    this.frameH = this.frameH_source;
    this.animFPS = ANIM_FPS;
    this.alive = true;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.acc += dt;
    const frameDuration = 1 / this.animFPS;
    if (this.acc >= frameDuration) {
      const adv = Math.floor(this.acc / frameDuration);
      this.frame = (this.frame + adv) % this.frameCount;
      this.acc -= adv * frameDuration;
    }
    // 若超過畫面邊界則死亡
    if (this.x < -100 || this.x > width + 100) this.alive = false;
  }

  draw() {
    if (!this.sheet || !this.sheet.width) {
      // fallback visual when no sprite sheet is available: draw a small circle
      push();
      noStroke();
      fill(80, 160, 255);
      ellipse(this.x, this.y, 16, 16);
      pop();
      return;
    }
    const sx = this.frame * this.frameW_source;
    push();
    translate(this.x, this.y);
    image(this.sheet, 0, 0, this.frameW, this.frameH, sx, 0, this.frameW_source, this.frameH_source);
    pop();
  }
}
