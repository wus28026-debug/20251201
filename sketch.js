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

function preload() {
  // 嘗試幾個常見路徑（root, 1/, 2/）以提高成功率
  // 嘗試更多常見子資料夾（root, 1/, 2/, 3/, 4/），以涵蓋工作區中可能的位置
  const idlePaths = ['all1.png', '1/all1.png', '2/all1.png', '3/all1.png', '4/all1.png'];
  const walkPaths = ['all2.png', '1/all2.png', '2/all2.png', '3/all2.png', '4/all2.png'];
  const jumpPaths = ['all4.png', '1/all4.png', '2/all4.png', '3/all4.png', '4/all4.png'];
  const spacePaths = ['all3.png', '1/all3.png', '2/all3.png', '3/all3.png', '4/all3.png'];

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
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  noSmooth();
  posX = width / 2;
  posY = height / 2;
}

function draw() {
  background('#ffd6ff');

  // 必要：idle 必須載入才能看到東西
  if (!idleSheet || !idleSheet.width) {
    push();
    fill(0);
    textAlign(CENTER, CENTER);
    textSize(16);
    text('loading all1.png...', width / 2, height / 2);
    pop();
    return;
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

  // 繪製（鏡像處理）
  push();
  translate(posX, posY);
  if (facing < 0) scale(-1, 1);
  image(activeSheet, 0, 0, frameW, frameH, sx, sy, frameW, frameH);
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
