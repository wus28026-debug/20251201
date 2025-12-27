// 全新實作：idle 使用 all1.png（8 帧 95x149），行走使用 all2.png（10 帧 1485x143）
const IDLE_FRAME_W = 95;
const IDLE_FRAME_H = 149;
const IDLE_FRAME_COUNT = 8;

const WALK_TOTAL_W = 1485; // total width of all2.png (info)
const WALK_TOTAL_H = 143;
const WALK_FRAME_COUNT = 10;

const ANIM_FPS = 12; // 動畫幀率
// 對於非 all9 的連續動畫，使用較慢的實際幀率（原本的一半）
const EFFECTIVE_ANIM_FPS = Math.max(1, Math.floor(ANIM_FPS * 0.5));
const SPEED = 220; // 移動速度 (px/s)

// 背景樹林圖片（從 background 資料夾及常見檔名嘗試載入）
let bgForest = null;
const BG_FOREST_PATHS = [
  'background/forest.png', 'background/forest.jpg', 'background/forest.jpeg',
  'background/forest1.png', 'background/forest1.jpg',
  'forest.png', 'forest.jpg',
  './background/forest.png', './background/forest.jpg',
  '../background/forest.png', '../background/forest.jpg',
  'Background/forest.png', 'background/Forest.png',
  // 中文資料夾/檔名（你的情況）
  '背景/樹林.jpg', '背景/樹林.png', '背景/森林.jpg', '背景/森林.png',
  './背景/樹林.jpg', './背景/樹林.png', '../背景/樹林.jpg',
  '背景/樹林.jpeg'
];
let bgFlower = null; // 花海背景
let bgWonderland = null; // 仙境背景
let sceneStage = 1; // 1: 樹林, 2: 花海, 3: 仙境

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
let baselineY = null; // 全域基準 Y（將角色下移到畫面下方約 1/3，實作為 2/3 高度）
let facing = 1; // 1 = right, -1 = left
let movingLeft = false;
let movingRight = false;
let canvasElem = null;
let inputElem = null; // p5 input element for dialog
let dialogActive = false;
let playerDialogText = ''; // 主角對話文字
let playerDialogTimer = 0; // 主角對話計時器
let spaceKeyCount = 0; // 空白鍵計數

// --- 測驗遊戲變數 ---
let quizTable = null;
let currentQuestionRow = null;
let quizState = 'IDLE'; // 'IDLE', 'ASKING', 'SHOWING_FEEDBACK'
let feedbackTimer = 0;
let availableQuestionIndices = []; // 用於追蹤尚未問過的題目索引

// all7 sprite (13 frames, total size ~3219x290)
const ALL7_FRAME_COUNT = 13;
let all7Sheet = null;
let leftSprite = null;
const LEFT_X = () => Math.floor(width / 4); // 畫面 1/4 的 x 座標
const LEFT_SCALE = 0.7; // left (all7) 縮小比例
// all8 sprite (14 frames, total size ~5231x425)
const ALL8_FRAME_COUNT = 14;
let all8Sheet = null;
let rightSprite = null;
const RIGHT_X = () => Math.floor((3 * width) / 4); // 畫面 3/4 的 x 座標
// all9 sprite (10 frames, total size ~2085x273)
// 使用全部 10 張影格，答錯時會無限循環播放（useTemporarySheet 預設會把速度放慢）
const ALL9_FRAME_COUNT = 10;
let all9Sheet = null;
// all10 weapon sprite (assumption: default 6 frames if unknown)
const ALL10_FRAME_COUNT = 6;
let all10Sheet = null;
let projectiles = [];
const PROJ_SPEED = 600; // px/s
// 接近判定距離（像素）
const PROXIMITY_DIST = 160;
let effects = []; // 特效陣列

// 獎勵小精靈變數
let rewardSheet = null;
let rewardSprite = null;
let correctAnswerCount = 0;
const REWARD_FRAME_COUNT = 6;
let ridingMode = false; // 是否處於騎乘模式
let rewardTimer = 0;    // 用於計時對話框顯示時間

let all11Sheet = null; // 花海場景的新角色
const ALL11_FRAME_COUNT = 17;
let all11State = 'WAITING'; // WAITING, DESCENDING, IDLE
let all11Y = -150; // 用於從上往下出現的 Y 座標
let all11_2Sheet = null; // 仙境場景第二階段角色 (11/2/all2.png)
const ALL11_2_FRAME_COUNT = 18;
let scene2CorrectCount = 0; // 第二階段答對題數
let scene2RewardTriggered = false; // 是否已觸發第二階段獎勵
let all13Sheet = null; // 仙境場景的新角色
const ALL13_FRAME_COUNT = 26;
let all13State = 'WAITING'; // WAITING, DESCENDING, IDLE
let all13Y = -150;
let extra13Sprite = null;
// all14 (第3階段左側精靈)
let all14Sheet = null;
const ALL14_FRAME_COUNT = 18;

function preload() {
  // 嘗試幾個常見路徑（root, 1/, 2/）以提高成功率
  // 嘗試更多常見子資料夾（root, 1/, 2/, 3/, 4/），以涵蓋工作區中可能的位置
  const idlePaths = ['all1.png', '1/all1.png', '2/all1.png', '3/all1.png', '4/all1.png'];
  const walkPaths = ['all2.png', '1/all2.png', '2/all2.png', '3/all2.png', '4/all2.png'];
  const jumpPaths = ['all4.png', '1/all4.png', '2/all4.png', '3/all4.png', '4/all4.png'];
  const spacePaths = ['3/all3.png', 'all3.png', '1/all3.png', '2/all3.png', '4/all3.png', '12/1/all3.png', 'all3/all3.png'];

  const all7Paths = ['all7.png', '1/all7.png', '2/all7.png', '3/all7.png', '4/all7.png', '7/all7.png'];
  const all8Paths = ['all8.png', '1/all8.png', '2/all8.png', '3/all8.png', '4/all8.png', '8/all8.png'];
  const all9Paths = ['all9.png', '1/all9.png', '2/all9.png', '3/all9.png', '4/all9.png', '9/all9.png'];
  const all10Paths = ['all10.png', '1/all10.png', '2/all10.png', '3/all10.png', '4/all10.png', '10/all10.png'];

  // 載入獎勵小精靈圖片 (12/1/all1.png)
  loadImage('12/1/all1.png', img => { rewardSheet = img; }, () => console.log('Reward sprite not found'));

  // 載入花海場景的新角色 (11/1/all1.png)
  loadImage('11/1/all1.png', img => { all11Sheet = img; }, () => console.log('11/1/all1.png not found'));

  // 載入仙境場景第二階段角色 (11/2/all2.png)
  loadImage('11/2/all2.png', img => { all11_2Sheet = img; }, () => console.log('11/2/all2.png not found'));

  // 載入花海背景
  loadImage('背景/花海.jpg', img => { bgFlower = img; }, () => console.log('Flower bg not found'));

  // 載入仙境背景
  loadImage('背景/仙境.jpg', img => { bgWonderland = img; }, () => console.log('Wonderland bg not found'));

  // 載入測驗題庫
  quizTable = loadTable('quiz.csv', 'csv', 'header');

  function tryLoadPaths(paths, assignCallback, i = 0) {
    if (i >= paths.length) {
      console.warn('tryLoadPaths: all paths failed for list, giving up.');
      return;
    }
    const p = paths[i];
    console.log('tryLoadPaths: trying', p);
    // 使用 encodeURI 嘗試處理中文路徑編碼問題
    loadImage(encodeURI(p),
      img => { 
        console.log('tryLoadPaths: loaded', p);
        assignCallback(img, p); 
      },
      err => { 
        // 印出錯誤並繼續嘗試下一個路徑
        console.warn('tryLoadPaths: failed to load', p);
        tryLoadPaths(paths, assignCallback, i + 1); 
      }
    );
  }
  
  // 嘗試載入背景樹林圖
  tryLoadPaths(BG_FOREST_PATHS, (img, p) => { 
    console.log('background image assigned from', p);
    bgForest = img; 
  });
  
  tryLoadPaths(idlePaths, (img, p) => { idleSheet = img; /*idleLoadedPath = p;*/ });
  tryLoadPaths(walkPaths, (img, p) => { walkSheet = img; /*walkLoadedPath = p;*/ });
  tryLoadPaths(jumpPaths, (img, p) => { jumpSheet = img; });
  tryLoadPaths(spacePaths, (img, p) => { spaceSheet = img; });
  tryLoadPaths(all7Paths, (img, p) => { all7Sheet = img; });
  tryLoadPaths(all8Paths, (img, p) => { all8Sheet = img; });
  tryLoadPaths(all9Paths, (img, p) => { all9Sheet = img; });
  tryLoadPaths(all10Paths, (img, p) => { all10Sheet = img; });
  // 嘗試載入 all14（資料夾 14 中的 all14.png）
  // const all14Paths = ['14/all14.png', 'all14.png', '14/all14.jpg'];
  // tryLoadPaths(all14Paths, (img, p) => { all14Sheet = img; });
}

function setup() {
  canvasElem = createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  noSmooth();
  baselineY = height * (2 / 3);
  posX = width / 2;
  posY = baselineY;
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

  // 初始化可用題目索引列表
  if (quizTable) {
    for (let i = 0; i < quizTable.getRowCount(); i++) {
      availableQuestionIndices.push(i);
    }
  }
}

function draw() {
  // 根據場景階段選擇背景
  let currentBg = bgForest;
  if (sceneStage === 2 && bgFlower && bgFlower.width) currentBg = bgFlower;
  if (sceneStage === 3 && bgWonderland && bgWonderland.width) currentBg = bgWonderland;
  if (currentBg && currentBg.width) {
    push();
    imageMode(CORNER);
    // 將背景平鋪或拉伸填滿畫布
    image(currentBg, 0, 0, width, height);
    pop();
  } else {
    background('#fefae0');
  }
  
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
  // 若處於騎乘模式，強制使用 jumpSheet (all4)
  const wantsWalk = movingLeft || movingRight;
  const wantsJump = jumping;
  const wantsSpace = spaceActive;
  const activeSheet = ridingMode && jumpSheet && jumpSheet.width ? jumpSheet 
    : (wantsSpace && spaceSheet && spaceSheet.width ? spaceSheet
    : (wantsJump && jumpSheet && jumpSheet.width ? jumpSheet
    : (wantsWalk && walkSheet && walkSheet.width ? walkSheet : idleSheet)));
  const activeFrameCount = (activeSheet === spaceSheet) ? SPACE_FRAME_COUNT
    : ((activeSheet === jumpSheet) ? JUMP_FRAME_COUNT : ((activeSheet === walkSheet) ? WALK_FRAME_COUNT : IDLE_FRAME_COUNT));

  // 更新位置
  const dt = deltaTime / 1000;
  // 全域 frame duration 供後續使用（避免 block-scope 導致未定義）
  const globalFrameDuration = 1 / ANIM_FPS;

  // DEBUG: 快速檢查載入 & 狀態（只在開發時使用）
  if (typeof window !== 'undefined' && window.__debug_tick !== true) {
    console.log({
      movingLeft, movingRight, posX, posY,
      all8Loaded: !!(all8Sheet && all8Sheet.width),
      rightSpriteExists: !!rightSprite
    });
    // 只印一次（避免大量 log），如需持續請移除該條件
    window.__debug_tick = true;
  }

  // Fallback：若 all8 已載入但 rightSprite 還沒建立，強制建立
  if (!rightSprite && all8Sheet && all8Sheet.width) {
    rightSprite = new NonControlledSprite(RIGHT_X(), baselineY, all8Sheet, ALL8_FRAME_COUNT);
    rightSprite.animFPS = Math.max(4, Math.floor(ANIM_FPS * 0.5));
    rightSprite.dialogText = '';
    console.log('Fallback: created rightSprite from all8Sheet');
  }
  
  // 初始化單一 leftSprite（如果圖片已載入且尚未建立），固定在畫面左側中間
  if (all7Sheet && all7Sheet.width && !leftSprite) {
    leftSprite = new NonControlledSprite(LEFT_X(), baselineY, all7Sheet, ALL7_FRAME_COUNT);
    // 放慢 left sprite 動畫
    leftSprite.animFPS = Math.max(4, Math.floor(ANIM_FPS * 0.5));
  }
  // 初始化右側精靈（all8）
  if (all8Sheet && all8Sheet.width && !rightSprite) {
    rightSprite = new NonControlledSprite(RIGHT_X(), baselineY, all8Sheet, ALL8_FRAME_COUNT);
    // 放慢 right sprite 動畫
    rightSprite.animFPS = Math.max(4, Math.floor(ANIM_FPS * 0.5));
    rightSprite.dialogText = '';
  }
  // 若非騎乘模式，才允許鍵盤控制移動
  if (!ridingMode) {
    if (movingRight) {
      facing = 1;
      posX += SPEED * dt;
    }
    if (movingLeft) {
      facing = -1;
      posX -= SPEED * dt;
    }
  }

  // 若正在執行 space action，覆寫水平速度
  if (spaceActive) {
    posX += spaceV * dt;
  }

  // 計算 frame 尺寸
  const frameW = Math.floor(activeSheet.width / activeFrameCount) || IDLE_FRAME_W;
  const frameH = activeSheet.height || IDLE_FRAME_H;

  // 邊界限制
  if (!ridingMode) {
    posX = constrain(posX, frameW / 2, width - frameW / 2);
  }

  // 動畫幀更新
  if (ridingMode) {
    // 騎乘模式下固定在某一張圖（例如第 2 張，index 1）
    currentFrame = 1;
    animAccumulator = 0;
  } else {
    animAccumulator += dt;
    // 主角恢復使用原始 ANIM_FPS（使用 globalFrameDuration）
    if (animAccumulator >= globalFrameDuration) {
      const advance = Math.floor(animAccumulator / globalFrameDuration);
      currentFrame = (currentFrame + advance) % activeFrameCount;
      animAccumulator -= advance * globalFrameDuration;
    }
  }

  // space action 時間與結束判定
  if (spaceActive) {
    spaceElapsed += dt;
    const totalSpaceTime = globalFrameDuration * SPACE_FRAME_COUNT;
    if (spaceElapsed >= totalSpaceTime) {
      // space action 結束，回到畫布中央並重置
      spaceActive = false;
      spaceElapsed = 0;
      spaceV = 0;
      currentFrame = 0;
      animAccumulator = 0;
      posX = width / 2;
      posY = baselineY;
    }
  }

  // 跳躍位置控制（若 jumping）
  if (jumping) {
    jumpElapsed += dt;
    const peakTime = globalFrameDuration * (JUMP_PEAK_FRAME + 1);
    const totalJumpTime = globalFrameDuration * JUMP_FRAME_COUNT;
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

    // --- Scene 2 Logic: 切換為 all11 ---
    // 若第二階段答對 3 題以上，切換為 all11_2 (11/2/all2.png)
    if (sceneStage === 2 && scene2CorrectCount >= 3 && all11_2Sheet && all11_2Sheet.width) {
      if (leftSprite.sheet !== all11_2Sheet) {
        leftSprite.sheet = all11_2Sheet;
        leftSprite.frameCount = ALL11_2_FRAME_COUNT;
        leftSprite._origSheet = all11_2Sheet;
        leftSprite._origFrameCount = ALL11_2_FRAME_COUNT;
        leftSprite.frameW_source = Math.floor(all11_2Sheet.width / ALL11_2_FRAME_COUNT);
        leftSprite.frameH_source = all11_2Sheet.height;
        leftSprite.frame = 0;
        leftSprite._usingTemp = false;
        // 速度放慢一點
        leftSprite.animFPS = Math.max(4, Math.floor(ANIM_FPS * 0.5));
      }
    } else if (sceneStage === 2 && all11Sheet && all11Sheet.width) {
      // 尚未答對 3 題，維持 all11
      if (leftSprite.sheet !== all11Sheet && leftSprite.sheet !== all11_2Sheet) {
        leftSprite.sheet = all11Sheet;
        leftSprite.frameCount = ALL11_FRAME_COUNT;
        leftSprite._origSheet = all11Sheet;
        leftSprite._origFrameCount = ALL11_FRAME_COUNT;
        leftSprite.frameW_source = Math.floor(all11Sheet.width / ALL11_FRAME_COUNT);
        leftSprite.frameH_source = all11Sheet.height;
        leftSprite.frame = 0;
        leftSprite._usingTemp = false;
      }
    } else if (sceneStage === 3) {
      // 第三階段：優先把 leftSprite 換成 all14（若不存在再 fallback 到 all13）
      if (all14Sheet && all14Sheet.width) {
        if (leftSprite.sheet !== all14Sheet) {
          leftSprite.sheet = all14Sheet;
          leftSprite.frameCount = ALL14_FRAME_COUNT;
          leftSprite._origSheet = all14Sheet;
          leftSprite._origFrameCount = ALL14_FRAME_COUNT;
          leftSprite.frameW_source = Math.floor(all14Sheet.width / ALL14_FRAME_COUNT);
          leftSprite.frameH_source = all14Sheet.height;
          leftSprite.frame = 0;
          leftSprite._usingTemp = false;
          leftSprite.animFPS = Math.max(4, Math.floor(EFFECTIVE_ANIM_FPS)); // 左側角色保持較慢動畫
        }
        // 計算顯示尺寸與位置（縮小顯示）
        const fW = Math.floor(all14Sheet.width / ALL14_FRAME_COUNT);
        const fH = all14Sheet.height || 40;
        const scale = 0.6; // 縮小倍率，可調
        drawW = Math.max(1, Math.floor(fW * scale));
        drawH = Math.max(1, Math.floor(fH * scale));
        drawX = Math.floor(width / 3); // 左側約 1/3
        drawY = baselineY + Math.floor(frameH * 0.15);
      } else if (all13Sheet && all13Sheet.width) {
        // fallback 使用 all13
        if (leftSprite.sheet !== all13Sheet) {
          leftSprite.sheet = all13Sheet;
          leftSprite.frameCount = ALL13_FRAME_COUNT;
          leftSprite._origSheet = all13Sheet;
          leftSprite._origFrameCount = ALL13_FRAME_COUNT;
          leftSprite.frameW_source = Math.floor(all13Sheet.width / ALL13_FRAME_COUNT);
          leftSprite.frameH_source = all13Sheet.height;
          leftSprite.frame = 0;
          leftSprite._usingTemp = false;
          leftSprite.animFPS = Math.max(4, Math.floor(EFFECTIVE_ANIM_FPS));
        }
        const fW = Math.floor(all13Sheet.width / ALL13_FRAME_COUNT);
        const fH = all13Sheet.height || 24;
        const scale = 0.6;
        drawW = Math.max(1, Math.floor(fW * scale));
        drawH = Math.max(1, Math.floor(fH * scale));
        drawX = Math.floor(width / 3);
        drawY = baselineY + Math.floor(frameH * 0.15);
      } else {
        // 若兩者皆未載入，隱藏左側顯示
        drawW = 0;
        drawH = 0;
      }
    }
    // 若主角靠近 leftSprite，暫時切換到 all9
    const distLeft = Math.abs(posX - LEFT_X());
    // 觸發問答：Scene 1 直接觸發；Scene 2 需按下兩次空白鍵後觸發
    const canTrigger = (sceneStage === 1) || (sceneStage === 2 && spaceKeyCount >= 2);
    if (canTrigger && distLeft <= PROXIMITY_DIST && quizState === 'IDLE') {
      // --- 觸發問答（不切換精靈）---
      quizState = 'ASKING';
      askNewQuestion(); // 提出新問題
      dialogActive = true;
      if (inputElem) {
        // 放在 leftSprite 下方
        const canvasLeft = canvasElem.elt.getBoundingClientRect().left;
        const canvasTop = canvasElem.elt.getBoundingClientRect().top;
        let leftOrigH = (leftSprite && leftSprite._origFrameH) ? leftSprite._origFrameH : frameH;
        // Scene 2 時，all11 顯示大小被強制為 all7 大小，故輸入框位置也需參考 all7 高度
        if (sceneStage === 2 && all7Sheet && all7Sheet.height) leftOrigH = all7Sheet.height;
        const displayH_local = Math.floor(leftOrigH * LEFT_SCALE);
        const inputX = Math.floor(canvasLeft + LEFT_X() - 145); // 調整X座標以置中
        // 將輸入框定位在角色下方 (baselineY 是中心，加上一半高度即為底部，再加 20px 間距)
        const inputY = Math.floor(canvasTop + baselineY + (displayH_local / 2) + 20);
        inputElem.position(inputX, inputY);
        inputElem.show();
        inputElem.elt.focus();
      }      
      if (rightSprite) rightSprite.alwaysShow = true;

    } else if (canTrigger && distLeft > PROXIMITY_DIST) {
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
      // 不自動切換 all9，改由答錯時處理
    }
    // 左側顯示尺寸：以原始來源影格為基準進行縮放
    const leftOrigW = (leftSprite && leftSprite._origFrameW) ? leftSprite._origFrameW : frameW;
    const leftOrigH = (leftSprite && leftSprite._origFrameH) ? leftSprite._origFrameH : frameH;
    
    let drawX = LEFT_X();
    let drawY = baselineY;
    let drawW = Math.floor(leftOrigW * LEFT_SCALE);
    let drawH = Math.floor(leftOrigH * LEFT_SCALE);

    // Scene 2: 顯示在主角右邊，且大小跟第一階段的提問者(all7)相同
    if (sceneStage === 2 && (leftSprite.sheet === all11Sheet || leftSprite.sheet === all11_2Sheet)) {
      // 若還在等待出場，則不繪製
      if (all11State === 'WAITING') {
        drawW = 0; // 隱藏
        drawH = 0;
      } else {
        // 計算第一階段角色 (all7) 的目標大小
        // all7 原始約 247x290，縮放 0.7
        const refW = (all7Sheet && all7Sheet.width) ? (all7Sheet.width / ALL7_FRAME_COUNT) : 247;
        const refH = (all7Sheet && all7Sheet.height) ? all7Sheet.height : 290;
        drawW = Math.floor(refW * LEFT_SCALE);
        drawH = Math.floor(refH * LEFT_SCALE);

        // 處理從上往下出現的動畫
        if (all11State === 'DESCENDING') {
          all11Y += 200 * dt; // 下降速度
          if (all11Y >= baselineY) {
            all11Y = baselineY;
            all11State = 'IDLE';
          }
          drawX = LEFT_X();
          drawY = all11Y;
        } else {
          // IDLE
          drawX = LEFT_X();
          drawY = baselineY;
        }
      }
    } else if (sceneStage === 3 && leftSprite.sheet === all13Sheet) {
      // Scene 3: 顯示在主角右邊，且大小跟第一階段的提問者(all7)相同
      if (all13State === 'WAITING') {
        drawW = 0;
        drawH = 0;
      } else {
        const refW = (all7Sheet && all7Sheet.width) ? (all7Sheet.width / ALL7_FRAME_COUNT) : 247;
        const refH = (all7Sheet && all7Sheet.height) ? all7Sheet.height : 290;
        drawW = Math.floor(refW * LEFT_SCALE);
        drawH = Math.floor(refH * LEFT_SCALE);
        drawX = Math.floor(width / 3); // 在左邊約 1/3 處
        // 處理從上往下出現的動畫（共用 all13State/ all13Y 邏輯）
        if (all13State === 'DESCENDING') {
          all13Y += 200 * dt; // 下降速度
          if (all13Y >= baselineY) {
            all13Y = baselineY;
            all13State = 'IDLE';
          }
          drawY = all13Y;
        } else {
          // IDLE
          drawY = baselineY;
        }
      }
    }
    // 若使用 all14 則同樣處理（把 all13 判斷也換成 all14）
    else if (sceneStage === 3 && leftSprite.sheet === all14Sheet) {
      // 第三階段：優先把 leftSprite 換成 all14（若不存在再 fallback 到 all13）
      if (all14Sheet && all14Sheet.width) {
        if (leftSprite.sheet !== all14Sheet) {
          leftSprite.sheet = all14Sheet;
          leftSprite.frameCount = ALL14_FRAME_COUNT;
          leftSprite._origSheet = all14Sheet;
          leftSprite._origFrameCount = ALL14_FRAME_COUNT;
          leftSprite.frameW_source = Math.floor(all14Sheet.width / ALL14_FRAME_COUNT);
          leftSprite.frameH_source = all14Sheet.height;
          leftSprite.frame = 0;
          leftSprite._usingTemp = false;
          leftSprite.animFPS = Math.max(4, Math.floor(EFFECTIVE_ANIM_FPS)); // 左側角色保持較慢動畫
        }
        // 計算顯示尺寸與位置（縮小顯示）
        const fW = Math.floor(all14Sheet.width / ALL14_FRAME_COUNT);
        const fH = all14Sheet.height || 40;
        const scale = 0.6; // 縮小倍率，可調
        drawW = Math.max(1, Math.floor(fW * scale));
        drawH = Math.max(1, Math.floor(fH * scale));
        drawX = Math.floor(width / 3); // 左側約 1/3
        drawY = baselineY + Math.floor(frameH * 0.15);
      } else if (all13Sheet && all13Sheet.width) {
        // fallback 使用 all13
        if (leftSprite.sheet !== all13Sheet) {
          leftSprite.sheet = all13Sheet;
          leftSprite.frameCount = ALL13_FRAME_COUNT;
          leftSprite._origSheet = all13Sheet;
          leftSprite._origFrameCount = ALL13_FRAME_COUNT;
          leftSprite.frameW_source = Math.floor(all13Sheet.width / ALL13_FRAME_COUNT);
          leftSprite.frameH_source = all13Sheet.height;
          leftSprite.frame = 0;
          leftSprite._usingTemp = false;
          leftSprite.animFPS = Math.max(4, Math.floor(EFFECTIVE_ANIM_FPS));
        }
        const fW = Math.floor(all13Sheet.width / ALL13_FRAME_COUNT);
        const fH = all13Sheet.height || 24;
        const scale = 0.6;
        drawW = Math.max(1, Math.floor(fW * scale));
        drawH = Math.max(1, Math.floor(fH * scale));
        drawX = Math.floor(width / 3);
        drawY = baselineY + Math.floor(frameH * 0.15);
      } else {
        // 若兩者皆未載入，隱藏左側顯示
        drawW = 0;
        drawH = 0;
      }
    }

    // 繪製左側精靈
    if (drawW > 0 && drawH > 0) {
      // Scene 2 (all11) 預設面向左，若主角在右側則翻轉面向右
      const flip = (sceneStage === 2 && posX > LEFT_X());
      leftSprite.draw(drawX, drawY, drawW, drawH, flip);
    }
  }

  // 如果正在顯示回饋，則計時
  if (quizState === 'SHOWING_FEEDBACK') {
    feedbackTimer += dt;
    if (feedbackTimer > 3) { // 顯示回饋 3 秒，結束後恢復原本精靈與狀態
      quizState = 'IDLE';
      feedbackTimer = 0;
      if (leftSprite) leftSprite.restoreOriginalSheet();
      if (rightSprite) {
        rightSprite.restoreOriginalSheet();
        rightSprite.alwaysShow = false;
        rightSprite.dialogText = '';
      }
      // 隱藏輸入框（保險）
      if (inputElem) {
        inputElem.hide();
        dialogActive = false;
      }
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
      const dy = Math.abs(p.y - baselineY);
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
      const dy = Math.abs(p.y - baselineY);
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

  // 更新並繪製特效
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i];
    e.update(dt);
    e.draw();
    if (e.finished) {
      if (typeof e.onFinish === 'function') e.onFinish();
      effects.splice(i, 1);
    }
  }
  
  // 更新並繪製右側的單一精靈（不受鍵盤控制），固定在畫面右側
  if (rightSprite) {
    rightSprite.update(dt);
    // 若主角靠近 rightSprite，暫時切換到 all9
    const distRight = Math.abs(posX - RIGHT_X());
    // 取消靠近即切換 all9 的行為；改由答錯時觸發
    if (distRight > PROXIMITY_DIST) {
      rightSprite.restoreOriginalSheet();
    }
  // 右側與左側共用顯示大小
  // 優先使用 all7 的原始尺寸作為基準，確保場景切換時右側角色大小不變
  let targetW = frameW;
  let targetH = frameH;
  if (all7Sheet && all7Sheet.width) {
    targetW = Math.floor(all7Sheet.width / ALL7_FRAME_COUNT);
    targetH = all7Sheet.height;
  } else if (leftSprite && leftSprite._origFrameW) {
    targetW = leftSprite._origFrameW;
    targetH = leftSprite._origFrameH;
  }
    // 若主角移到 all7 左邊（posX < LEFT_X()），則把右側角色左右反向顯示
    const shouldFlip = (posX < LEFT_X());
    rightSprite.draw(RIGHT_X(), baselineY, targetW, targetH, shouldFlip);
  }

  // all13 額外顯示已移除
  // 若答對 3 次以上，顯示獎勵小精靈 (all12)
  // Scene 1: correctAnswerCount >= 3; Scene 2: scene2CorrectCount >= 3
  if (correctAnswerCount >= 3 && rewardSheet && rewardSheet.width) {
    if (!rewardSprite) {
      // 從螢幕左下方出現 (x < 0, y 接近底部)
      rewardSprite = new NonControlledSprite(-200, height - 50, rewardSheet, REWARD_FRAME_COUNT);
      rewardSprite.state = 'RUNNING_IN'; // 設定初始狀態為奔跑進場
    }
    rewardSprite.update(dt);

    // Scene 2 觸發獎勵 (答對3題後)
    if (sceneStage === 2 && scene2CorrectCount >= 3 && !scene2RewardTriggered) {
      scene2RewardTriggered = true;
      // 重新生成 all12，像第一次一樣出現
      rewardSprite = new NonControlledSprite(-200, height - 50, rewardSheet, REWARD_FRAME_COUNT);
      rewardSprite.state = 'SCENE_2_RETURN_RUNNING';
    }

    // 設定目標位置與大小
    const mountScale = 2.5; // 縮小一點 (原本 4.0)
    const targetX = width / 2; // 螢幕中間
    const targetY = height - 80; // 螢幕下方

    if (rewardSprite.state === 'RUNNING_IN') {
      // 計算移動向量
      const dx = targetX - rewardSprite.x;
      const dy = targetY - rewardSprite.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const runSpeed = 500; // 奔跑速度
      
      if (dist < 10) {
        rewardSprite.state = 'ARRIVED';
        rewardSprite.x = targetX;
        rewardSprite.y = targetY;
        rewardTimer = 0; // 重置計時器
      } else {
        rewardSprite.x += (dx / dist) * runSpeed * dt;
        rewardSprite.y += (dy / dist) * runSpeed * dt;
      }
    } else if (rewardSprite.state === 'ARRIVED') {
      // 到達後固定位置
      rewardSprite.x = targetX;
      rewardSprite.y = targetY;
      
      // 顯示對話框 "跟我走吧"
      rewardTimer += dt;
      push();
      rectMode(CENTER);
      fill(255);
      stroke(0);
      rect(rewardSprite.x, rewardSprite.y - 60, 100, 30, 5);
      noStroke();
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(14);
      text("跟我走吧", rewardSprite.x, rewardSprite.y - 60);
      pop();

      // 2秒後進入騎乘模式
      if (rewardTimer > 2.0 && !spaceActive) {
        rewardSprite.state = 'RIDING';
        ridingMode = true;
      }
    } else if (rewardSprite.state === 'RIDING') {
      if (ridingMode) {
        // 騎乘模式：往右跑
        rewardSprite.x += 200 * dt;
        // 同步主角位置 (鎖定在坐騎背上)
        posX = rewardSprite.x;
        posY = rewardSprite.y - 50; // 調整高度讓主角看起來坐在上面
        facing = 1; // 強制面向右

        // 當騎乘超出畫面右側，切換到花海場景 (Scene 2)
        if (rewardSprite.x > width + 100 && sceneStage === 1) {
          sceneStage = 2; // 切換背景
          rewardSprite.x = -100; // 重置到左側
          rewardSprite.state = 'SCENE_2_RUNNING'; // 進入第二階段奔跑
          spaceKeyCount = 0; // 重置空白鍵計數
          scene2CorrectCount = 0; // 重置第二階段答對計數
        }
      } else {
        // 若 ridingMode 被取消（例如按下空白鍵），將坐騎狀態改回 ARRIVED（原地等待）
        rewardSprite.state = 'ARRIVED';
        rewardTimer = 0; // 重置計時器，避免立刻又進入騎乘
      }
    } else if (rewardSprite.state === 'SCENE_2_RUNNING') {
      // 第二階段：從左側跑到中間
      rewardSprite.x += 200 * dt;
      posX = rewardSprite.x;
      posY = rewardSprite.y - 50;
      facing = 1;

      // 到達中間，主角停下，坐騎繼續跑
      if (rewardSprite.x >= width / 2) {
        rewardSprite.state = 'SCENE_2_LEAVING';
        ridingMode = false; // 解除騎乘模式
        posX = width / 2; // 主角固定在中間
        posY = baselineY; // 主角回到地面高度

        // 主角下豬後，觸發 all11 從上往下出現
        if (sceneStage === 2 && all11State === 'WAITING') {
          all11State = 'DESCENDING';
          all11Y = -150; // 設定初始高度在畫面外
        }
      }
    } else if (rewardSprite.state === 'SCENE_2_LEAVING') {
      // 坐騎獨自往右跑並消失
      rewardSprite.x += 300 * dt; // 加速離開
    } else if (rewardSprite.state === 'SCENE_2_RETURN_RUNNING') {
      // Scene 2 結尾：all12 再次出現，跑到畫面中下方
      const tX = width / 2;
      const tY = height - 80;
      const dx = tX - rewardSprite.x;
      const dy = tY - rewardSprite.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const runSpeed = 500;
      
      if (dist < 10) {
        rewardSprite.state = 'SCENE_2_RETURN_ARRIVED';
        rewardSprite.x = tX;
        rewardSprite.y = tY;
        rewardTimer = 0;
      } else {
        rewardSprite.x += (dx / dist) * runSpeed * dt;
        rewardSprite.y += (dy / dist) * runSpeed * dt;
      }
    } else if (rewardSprite.state === 'SCENE_2_RETURN_ARRIVED') {
      rewardSprite.x = width / 2;
      rewardSprite.y = height - 80;
      rewardTimer += dt;
      // 顯示對話框 "我來接你了"
      push();
      rectMode(CENTER);
      fill(255);
      stroke(0);
      rect(rewardSprite.x, rewardSprite.y - 60, 100, 30, 5);
      noStroke();
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(14);
      text("我來接你了", rewardSprite.x, rewardSprite.y - 60);
      pop();

      if (rewardTimer > 2.0) {
        rewardSprite.state = 'SCENE_2_RETURN_RIDING';
        ridingMode = true;
      }
    } else if (rewardSprite.state === 'SCENE_2_RETURN_RIDING') {
      // 騎乘並往畫面外跑
      rewardSprite.x += 300 * dt;
      posX = rewardSprite.x;
      posY = rewardSprite.y - 50;
      facing = 1;
      
      // 當騎乘超出畫面右側，切換到仙境場景 (Scene 3)
      if (rewardSprite.x > width + 100 && sceneStage === 2) {
        sceneStage = 3; // 切換背景
        rewardSprite.x = -100; // 重置到左側
        rewardSprite.state = 'SCENE_3_RUNNING'; // 進入第三階段奔跑
        // all13 已移除
      }
    } else if (rewardSprite.state === 'SCENE_3_RUNNING') {
      // 第三階段：從左側跑到中間
      rewardSprite.x += 200 * dt;
      posX = rewardSprite.x;
      posY = rewardSprite.y - 50;
      facing = 1;

      // 到達中間，主角停下，坐騎繼續跑
      if (rewardSprite.x >= width / 2) {
        rewardSprite.state = 'SCENE_3_LEAVING';
        ridingMode = false; // 解除騎乘模式
        posX = width / 2; // 主角固定在中間
        posY = baselineY; // 主角回到地面高度
        // all13 已移除，不觸發其他角色
      }
    } else if (rewardSprite.state === 'SCENE_3_LEAVING') {
      // 坐騎獨自往右跑並消失
      rewardSprite.x += 300 * dt; 
    }

    // 繪製
    const w = rewardSprite.frameW_source * mountScale;
    const h = rewardSprite.frameH_source * mountScale;
    // 固定面向右
    const flip = false;
    rewardSprite.draw(rewardSprite.x, rewardSprite.y, w, h, flip);
  }

  // 繪製主角（鏡像處理）
  push();
  translate(posX, posY);
  if (facing < 0) scale(-1, 1);
  image(activeSheet, 0, 0, frameW, frameH, sx, sy, frameW, frameH);
  pop();

  // 繪製主角對話框 (若有)
  if (playerDialogText) {
    playerDialogTimer += dt;
    if (playerDialogTimer > 1.5) {
      playerDialogText = '';
      playerDialogTimer = 0;
    }
    const bubbleX = posX;
    const bubbleY = posY - frameH / 2 - 40;
    push();
    textSize(14);
    const txtW = textWidth(playerDialogText) + 20;
    const txtH = 36;
    rectMode(CENTER);
    fill('#FFDDDD'); // 使用指定的淺粉色背景
    stroke(0);
    strokeWeight(1);
    rect(bubbleX, bubbleY, txtW, txtH, 6);
    noStroke();
    fill(0);
    textAlign(CENTER, CENTER);
    text(playerDialogText, bubbleX, bubbleY);
    pop();
  }

  // 繪製 leftSprite 的對話框文字（當接近時）
  if (leftSprite) {
    const bubbleX = LEFT_X();
    // 計算氣泡高度：Scene 2 時 all11 較矮，需調整
    let bubbleY = baselineY - ( (leftSprite && leftSprite.frameH) ? leftSprite.frameH : frameH) / 2 - 40;
    if (sceneStage === 2 && (leftSprite.sheet === all11Sheet || leftSprite.sheet === all11_2Sheet)) {
        // Scene 2: all11 繪製高度約為 200 (all7 height * 0.7)
        const charH = (all7Sheet && all7Sheet.height) ? (all7Sheet.height * LEFT_SCALE) : 200;
        bubbleY = baselineY - charH - 20;
    }

    if (dialogActive && (sceneStage === 1 || sceneStage === 2)) {
        // Scene 1 & 2: 繪製觸發者的對話氣泡
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
        const promptText = (sceneStage === 2) ? '繼續回答右邊題目！' : '請回答右邊的問題！';
        text(promptText, bubbleX, bubbleY);
        pop();
    // 修改：當正在顯示回饋時 (SHOWING_FEEDBACK)，不要進入此區塊，以免清除右邊角色的回饋文字
    } else if (sceneStage === 2 && all11State === 'IDLE' && quizState !== 'SHOWING_FEEDBACK') {
        // Scene 2: 當主角靠近時顯示對話
        const distLeft = Math.abs(posX - LEFT_X());
        if (distLeft <= PROXIMITY_DIST) {
            // 若按下兩次空白鍵(回答當然)，改變對話
            let txt = "準備好新的挑戰了嗎?";
            if (spaceKeyCount >= 2) {
                txt = "繼續回答右邊題目！";
            }
            push();
            textSize(14);
            const txtW = textWidth(txt) + 20;
            const txtH = 36;
            rectMode(CENTER);
            fill('#FFDDDD'); // 使用指定的淺粉色背景
            stroke(0);
            strokeWeight(1);
            rect(bubbleX, bubbleY, txtW, txtH, 6);
            noStroke();
            fill(0);
            textAlign(CENTER, CENTER);
            text(txt, bubbleX, bubbleY);
            pop();

            // 控制右邊角色文字顯示
            if (rightSprite) {
                rightSprite.alwaysShow = false;
                rightSprite.dialogText = "";
            }
        } else {
            // 離開範圍，隱藏右邊文字
            if (rightSprite) rightSprite.alwaysShow = false;
        }
    }
  }

  // 繪製 rightSprite 的對話文字（若有）
  if (rightSprite && (rightSprite.dialogText || rightSprite.alwaysShow)) {
    const bubbleX = RIGHT_X();
    const bubbleY = baselineY - ( (rightSprite && rightSprite.frameH) ? rightSprite.frameH : frameH) / 2 - 40;
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
  baselineY = height * (2 / 3);
  posY = baselineY;
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
    // 空白鍵：在主角右邊產生 all10 動畫特效，播放完畢後清除對話框
    spaceKeyCount++;
    if (all10Sheet && all10Sheet.width) {
      // 設定主角對話
      if (sceneStage === 2) {
        if (spaceKeyCount === 1) {
          playerDialogText = "當然";
          playerDialogTimer = 0;
        }
      }
      // 產生特效，位置在主角右方 (posX + 80)，並設定往右移動速度 (例如 300)
      const e = new Effect(posX + 80, posY, all10Sheet, ALL10_FRAME_COUNT, () => {
        // 動畫結束後的回呼函式：清除對話框
        dialogActive = false;
        if (inputElem) inputElem.hide();
        if (rightSprite) {
          rightSprite.dialogText = '';
          rightSprite.alwaysShow = false;
        }
        // 若處於問答狀態，重置為 IDLE
        if (quizState === 'ASKING' || quizState === 'SHOWING_FEEDBACK') {
          quizState = 'IDLE';
          if (leftSprite) leftSprite.restoreOriginalSheet();
          if (rightSprite) rightSprite.restoreOriginalSheet();
        }
      }, 300);
      effects.push(e);
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
      correctAnswerCount++;
      if (sceneStage === 2) {
        scene2CorrectCount++;
      }
    } else {
      let wrongFeedback = currentQuestionRow.getString('答錯時的回饋');
      // 答錯時加入提示 (不限階段，確保提示能出現)
      const hint = currentQuestionRow.getString('提示文字');
      if (hint) wrongFeedback += ' ' + hint;
      
      rightSprite.dialogText = wrongFeedback;
      // 答錯時：左右角色切換為 all9，連續重複播放（使用前 8 張），並放慢速度
      if (all9Sheet) {
        if (leftSprite) {
          leftSprite.useTemporarySheet(all9Sheet, ALL9_FRAME_COUNT);
          leftSprite.animFPS = Math.max(2, Math.floor(ANIM_FPS * 0.3)); // 更慢
        }
        if (rightSprite) {
          rightSprite.useTemporarySheet(all9Sheet, ALL9_FRAME_COUNT);
          rightSprite.animFPS = Math.max(2, Math.floor(ANIM_FPS * 0.3)); // 更慢
        }
      }
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
  if (!quizTable) return;

  // 若所有題目都問過了，則重新填滿列表（避免卡住，或視需求決定是否重置）
  if (availableQuestionIndices.length === 0) {
    for (let i = 0; i < quizTable.getRowCount(); i++) {
      availableQuestionIndices.push(i);
    }
  }

  const r = floor(random(availableQuestionIndices.length));
  const qIndex = availableQuestionIndices[r];
  // 從列表中移除該索引，避免重複
  availableQuestionIndices.splice(r, 1);

  currentQuestionRow = quizTable.getRow(qIndex);
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
      // 非僅播放一次時，把動畫速度放慢（讓 all9 看起來像連續慢速動畫）
      // 使用更慢的比率，確保最低 2fps
      this.animFPS = Math.max(2, Math.floor(ANIM_FPS * 0.25));
    }
  }

  // 恢復原始的 sprite sheet（切換回最初始的 sheet/frameCount）
  restoreOriginalSheet() {
    this.sheet = this._origSheet;
    this.frameCount = this._origFrameCount;
    this._usingTemp = false;
    // 恢復為放慢後的預設速度（不影響 all9 的特殊慢速設定）
    this.animFPS = EFFECTIVE_ANIM_FPS;
  }
}

// 簡單的一次性特效類別
class Effect {
  constructor(x, y, sheet, frameCount, onFinish, vx = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.sheet = sheet;
    this.frameCount = frameCount;
    this.frameW = Math.floor(sheet.width / frameCount);
    this.frameH = sheet.height;
    this.currentFrame = 0;
    this.accum = 0;
    this.animFPS = 12;
    this.onFinish = onFinish;
    this.finished = false;
  }
  update(dt) {
    this.x += this.vx * dt;
    this.accum += dt;
    const frameDuration = 1 / this.animFPS;
    if (this.accum >= frameDuration) {
      const adv = Math.floor(this.accum / frameDuration);
      this.currentFrame += adv;
      this.accum -= adv * frameDuration;
      if (this.currentFrame >= this.frameCount) {
        this.finished = true;
      }
    }
  }
  draw() {
    if (this.finished) return;
    // 確保不會超過最大影格
    const frameIndex = Math.min(this.currentFrame, this.frameCount - 1);
    const sx = frameIndex * this.frameW;
    push();
    translate(this.x, this.y);
    image(this.sheet, 0, 0, this.frameW, this.frameH, sx, 0, this.frameW, this.frameH);
    pop();
  }
}
