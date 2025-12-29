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
  '背景/樹林.jpg', // 根據紀錄，這是正確路徑，移到最前面
  'background/forest.png', 'background/forest.jpg', 'background/forest.jpeg',
  'background/forest1.png', 'background/forest1.jpg',
  'forest.png', 'forest.jpg',
  './background/forest.png', './background/forest.jpg',
  '../background/forest.png', '../background/forest.jpg',
  'Background/forest.png', 'background/Forest.png',
  // 中文資料夾/檔名（你的情況）
  '背景/樹林.png', '背景/森林.jpg', '背景/森林.png',
  './背景/樹林.jpg', './背景/樹林.png', '../背景/樹林.jpg',
  '背景/樹林.jpeg'
];
let bgFlower = null; // 花海背景
let bgWonderland = null; // 仙境背景
let bgStart = null; // 主畫面背景
let bgEnd = null; // 結束畫面背景
let startButton = null; // 開始按鈕
let bgMusicAudio = null; // 背景音樂 (HTML5 Audio)
let viewNotesButton = null; // 查看筆記按鈕
let tryAgainButton = null; // 重試按鈕
let playAgainButton = null; // 再玩一次按鈕
let notesContainer = null; // 筆記容器
let sceneStage = 0; // 0: 主畫面, 1: 樹林, 2: 花海, 3: 仙境

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
let scene3CorrectCount = 0; // 第三階段答對題數
let gameEnded = false; // 遊戲結束旗標
let playerKeys = 3; // 玩家擁有的鑰匙數量 (闖關者模式)
let screenShakeTimer = 0; // 螢幕震動計時器
let screenShakeAmount = 0; // 螢幕震動強度
let screenFlashTimer = 0; // 螢幕閃爍計時器
let screenFlashColor = null; // 螢幕閃爍顏色
let gameOverSoundPlayed = false; // 遊戲結束音效旗標
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
  const idlePaths = ['1/all1.png', 'all1.png', '2/all1.png', '3/all1.png', '4/all1.png'];
  const walkPaths = ['2/all2.png', 'all2.png', '1/all2.png', '3/all2.png', '4/all2.png'];
  const jumpPaths = ['4/all4.png', 'all4.png', '1/all4.png', '2/all4.png', '3/all4.png'];
  const spacePaths = ['3/all3.png', 'all3.png', '1/all3.png', '2/all3.png', '4/all3.png', '12/1/all3.png', 'all3/all3.png'];

  const all7Paths = ['7/all7.png', 'all7.png', '1/all7.png', '2/all7.png', '3/all7.png', '4/all7.png'];
  const all8Paths = ['8/all8.png', 'all8.png', '1/all8.png', '2/all8.png', '3/all8.png', '4/all8.png'];
  const all9Paths = ['9/all9.png', 'all9.png', '1/all9.png', '2/all9.png', '3/all9.png', '4/all9.png'];
  const all10Paths = ['10/all10.png', 'all10.png', '1/all10.png', '2/all10.png', '3/all10.png', '4/all10.png'];

  // all14 sprite (第三階段左側精靈)
  const all14Paths = ['14/all14.png', 'all14.png', '14/all14.jpg', '14/all14.png'];
  
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

  // 載入主畫面背景
  const startBgPaths = ['背景/開始.jpg', '背景/開始.png', 'background/開始.jpg', 'background/開始.png'];
  // (稍後在 tryLoadPaths 定義後呼叫)
  // 載入結束畫面背景
  const endBgPaths = ['背景/結束.jpg', '背景/結束.png', 'background/結束.jpg', 'background/結束.png'];

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

  // 嘗試載入主畫面背景
  tryLoadPaths(startBgPaths, (img, p) => { bgStart = img; });
  tryLoadPaths(endBgPaths, (img, p) => { bgEnd = img; });
  
  tryLoadPaths(idlePaths, (img, p) => { idleSheet = img; /*idleLoadedPath = p;*/ });
  tryLoadPaths(walkPaths, (img, p) => { walkSheet = img; /*walkLoadedPath = p;*/ });
  tryLoadPaths(jumpPaths, (img, p) => { jumpSheet = img; });
  tryLoadPaths(spacePaths, (img, p) => { spaceSheet = img; });
  tryLoadPaths(all7Paths, (img, p) => { all7Sheet = img; });
  tryLoadPaths(all8Paths, (img, p) => { all8Sheet = img; });
  tryLoadPaths(all9Paths, (img, p) => { all9Sheet = img; });
  tryLoadPaths(all10Paths, (img, p) => { all10Sheet = img; });
  tryLoadPaths(all14Paths, (img, p) => { 
    console.log('loaded all14 from', p);
    all14Sheet = img; 
  });
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

  // 建立開始按鈕
  startButton = createButton('開始遊戲');
  startButton.position(width / 2 - 60, height / 2 + 100); // 置中偏下
  startButton.size(120, 50);
  startButton.style('font-size', '20px');
  startButton.style('background-color', '#ffffff');
  startButton.style('border-radius', '10px');
  startButton.style('cursor', 'pointer');
  startButton.style('border', '2px solid #000');
  startButton.mousePressed(() => {
    playSound('15/click.mp3');

    // 播放背景音樂 (使用 HTML5 Audio 以避免網頁卡住)
    if (!bgMusicAudio) {
      bgMusicAudio = new Audio('15/背景音樂.mp3');
      bgMusicAudio.loop = true;
      bgMusicAudio.volume = 0.4; // 音量設為 0.4 避免太吵
      bgMusicAudio.play().catch(e => console.log('Music play error:', e));
    }

    sceneStage = 1; // 進入第一關
    playerKeys = 3; // 重置鑰匙數量
    startButton.hide();
  });

  // 建立重試按鈕 (失敗時顯示)
  tryAgainButton = createButton('Try again');
  tryAgainButton.position(width / 2 - 60, height / 2 + 100);
  tryAgainButton.size(120, 50);
  tryAgainButton.style('font-size', '20px');
  tryAgainButton.style('background-color', '#ffcccc'); // 淡紅色背景
  tryAgainButton.style('border-radius', '10px');
  tryAgainButton.style('cursor', 'pointer');
  tryAgainButton.style('border', '2px solid #000');
  tryAgainButton.hide();
  tryAgainButton.mousePressed(() => {
    playSound('15/click.mp3');
    // 重置遊戲狀態
    playerKeys = 3;
    sceneStage = 1;
    gameEnded = false;
    gameOverSoundPlayed = false;
    correctAnswerCount = 0;
    scene2CorrectCount = 0;
    scene3CorrectCount = 0;
    posX = width / 2;
    posY = baselineY;
    
    tryAgainButton.hide();
    viewNotesButton.hide();
    if (playAgainButton) playAgainButton.hide();
    
    // 重新開始迴圈
    loop();
    // 確保題庫重置 (可選)
    askNewQuestion();
  });

  // 建立 Play Again 按鈕 (通關後顯示)
  playAgainButton = createButton('Play again');
  playAgainButton.position(width / 2 - 60, height / 2 + 160); // 放在查看筆記下方
  playAgainButton.size(120, 50);
  playAgainButton.style('font-size', '20px');
  playAgainButton.style('background-color', '#ccffcc'); // 淡綠色背景
  playAgainButton.style('border-radius', '10px');
  playAgainButton.style('cursor', 'pointer');
  playAgainButton.style('border', '2px solid #000');
  playAgainButton.hide();
  playAgainButton.mousePressed(() => {
    playSound('15/click.mp3');
    // 重置遊戲狀態
    playerKeys = 3;
    sceneStage = 1;
    gameEnded = false;
    gameOverSoundPlayed = false;
    correctAnswerCount = 0;
    scene2CorrectCount = 0;
    scene3CorrectCount = 0;
    posX = width / 2;
    posY = baselineY;
    
    // 額外重置變數以確保回到第一階段初始狀態
    ridingMode = false;
    rewardSprite = null;
    leftSprite = null; // 強制重置左側角色 (draw 中會重新建立 all7)
    if (rightSprite) {
      rightSprite.dialogText = '';
      rightSprite.alwaysShow = false;
      rightSprite.restoreOriginalSheet();
    }
    projectiles = [];
    effects = [];
    spaceKeyCount = 0;
    scene2RewardTriggered = false;
    all11State = 'WAITING';
    all11Y = -150;
    all13State = 'WAITING';
    all13Y = -150;
    screenShakeTimer = 0;
    screenFlashTimer = 0;
    
    if (tryAgainButton) tryAgainButton.hide();
    if (viewNotesButton) viewNotesButton.hide();
    playAgainButton.hide();
    
    // 重新開始迴圈
    loop();
    askNewQuestion();
  });

  // 建立查看筆記按鈕 (通關後顯示)
  viewNotesButton = createButton('查看筆記');
  viewNotesButton.position(width / 2 - 60, height / 2 + 100); // 位置在遊戲結束文字下方
  viewNotesButton.size(120, 50);
  viewNotesButton.style('font-size', '20px');
  viewNotesButton.style('background-color', '#ffffff');
  viewNotesButton.style('border-radius', '10px');
  viewNotesButton.style('cursor', 'pointer');
  viewNotesButton.style('border', '2px solid #000');
  viewNotesButton.hide();
  viewNotesButton.mousePressed(() => {
    if (notesContainer) notesContainer.style('display', 'flex');
  });

  // 建立筆記 iframe 容器 (全螢幕覆蓋)
  notesContainer = createDiv('');
  notesContainer.position(0, 0);
  notesContainer.size(windowWidth, windowHeight);
  notesContainer.style('background-color', 'rgba(0,0,0,0.8)');
  notesContainer.style('display', 'none'); // 預設隱藏
  notesContainer.style('justify-content', 'center');
  notesContainer.style('align-items', 'center');
  notesContainer.style('flex-direction', 'column');
  notesContainer.style('z-index', '10000');

  const iframe = createElement('iframe');
  iframe.attribute('src', 'https://hackmd.io/@BaN-RevzTta1yPjQLaJ-Ew/B18UMtcZbl');
  iframe.style('width', '90%');
  iframe.style('height', '85%');
  iframe.style('border', 'none');
  iframe.style('background', 'white');
  iframe.style('border-radius', '8px');
  iframe.parent(notesContainer);

  const closeBtn = createButton('關閉筆記');
  closeBtn.size(120, 40);
  closeBtn.style('margin-top', '15px');
  closeBtn.style('font-size', '18px');
  closeBtn.style('cursor', 'pointer');
  closeBtn.style('background-color', '#ffdddd');
  closeBtn.style('border-radius', '5px');
  closeBtn.style('border', '1px solid #000');
  closeBtn.parent(notesContainer);
  closeBtn.mousePressed(() => {
    notesContainer.style('display', 'none');
  });

  // 初始化可用題目索引列表
  if (quizTable) {
    for (let i = 0; i < quizTable.getRowCount(); i++) {
      availableQuestionIndices.push(i);
    }
  }
}

function draw() {
  // --- 主畫面邏輯 ---
  if (sceneStage === 0) {
    if (bgStart && bgStart.width) {
      push();
      imageMode(CORNER);
      image(bgStart, 0, 0, width, height);
      pop();
    } else {
      background(220);
      // 若圖片未載入，顯示簡單背景
    }

    // 顯示遊戲標題
    push();
    textAlign(CENTER, CENTER);
    textSize(60); // 縮小一點
    textFont('Segoe Script'); // 改用較細的草寫字體
    fill(100); // 改為灰色
    text("Hidden Gem", width / 2, height / 2 - 50); // 稍微下移
    pop();

    return; // 停留在主畫面，不執行後續遊戲邏輯
  }

  // --- 遊戲結束邏輯 ---
  if (gameEnded) {
    // 播放結束音效 (只播一次)
    if (!gameOverSoundPlayed) {
      if (playerKeys <= 0) playSound('15/fail.mp3');
      else playSound('15/win.mp3');
      gameOverSoundPlayed = true;
    }

    // 震動效果 (延續之前的邏輯，讓失敗時的震動能播放)
    if (screenShakeTimer > 0) {
      const shake = screenShakeAmount * (screenShakeTimer / 0.5); // 隨時間遞減
      translate(random(-shake, shake), random(-shake, shake));
      screenShakeTimer -= deltaTime / 1000;
    }

    push();
    if (bgEnd && bgEnd.width) {
      imageMode(CORNER);
      image(bgEnd, 0, 0, width, height);
    } else {
      rectMode(CORNER);
      // 若失敗則顯示帶紅色的背景，否則黑色
      if (playerKeys <= 0) {
        fill(50, 0, 0, 200); // 深紅色半透明
      } else {
        fill(0, 200); // 半透明黑色背景
      }
      rect(0, 0, width, height);
    }

    // 更新並繪製特效 (讓特效在結束畫面也能播放)
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      e.update(deltaTime / 1000);
      e.draw();
      if (e.finished) {
        if (typeof e.onFinish === 'function') e.onFinish();
        effects.splice(i, 1);
      }
    }

    fill(255);
    textSize(60);
    textAlign(CENTER, CENTER);
    if (playerKeys <= 0) {
      fill('#FFB6C1'); // 淺粉色
      textFont('Segoe Script'); // 跟主畫面一樣的草寫字體
      text("Fail", width / 2, height / 2);
      if (tryAgainButton) tryAgainButton.show();
      if (viewNotesButton) viewNotesButton.hide();
      if (playAgainButton) playAgainButton.hide();
      
      // 失敗特效：持續產生紅色爆炸
      if (frameCount % 10 === 0 && all10Sheet && all10Sheet.width) {
         const ex = random(width * 0.1, width * 0.9);
         const ey = random(height * 0.1, height * 0.9);
         const s = random(1.0, 3.0);
         // 爆炸特效 (原色)
         const e = new Effect(ex, ey, all10Sheet, ALL10_FRAME_COUNT, null, 0, s);
         effects.push(e);
      }
    } else {
      fill('#FFD700'); // 金色
      textFont('Segoe Script');
      text("Finish", width / 2, height / 2);
      if (viewNotesButton) viewNotesButton.show();
      if (tryAgainButton) tryAgainButton.hide();
      if (playAgainButton) playAgainButton.show();
      
      // 勝利特效：持續產生彩色煙火 (粒子效果，非爆炸圖)
      if (frameCount % 15 === 0) {
         const ex = random(width * 0.1, width * 0.9);
         const ey = random(height * 0.1, height * 0.8);
         const f = new Firework(ex, ey);
         effects.push(f);
      }
    }
    pop();
    return; // 結束畫面時不執行後續遊戲邏輯
  }

  // 震動效果 (答錯時觸發)
  if (screenShakeTimer > 0) {
    const shake = screenShakeAmount * (screenShakeTimer / 0.5); // 隨時間遞減
    translate(random(-shake, shake), random(-shake, shake));
    screenShakeTimer -= deltaTime / 1000;
  }

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

  // -- 新增 fallback：當 all7 不存在但 all14 / all13 / all11 有載入時也建立 leftSprite --
  if (!leftSprite) {
    if (all14Sheet && all14Sheet.width) {
      leftSprite = new NonControlledSprite(LEFT_X(), baselineY, all14Sheet, ALL14_FRAME_COUNT);
      leftSprite.animFPS = Math.max(4, Math.floor(EFFECTIVE_ANIM_FPS));
      console.log('Fallback: created leftSprite from all14Sheet');
    } else if (all13Sheet && all13Sheet.width) {
      leftSprite = new NonControlledSprite(LEFT_X(), baselineY, all13Sheet, ALL13_FRAME_COUNT);
      leftSprite.animFPS = Math.max(4, Math.floor(EFFECTIVE_ANIM_FPS));
      console.log('Fallback: created leftSprite from all13Sheet');
    } else if (all11Sheet && all11Sheet.width) {
      leftSprite = new NonControlledSprite(LEFT_X(), baselineY, all11Sheet, ALL11_FRAME_COUNT);
      leftSprite.animFPS = Math.max(4, Math.floor(ANIM_FPS * 0.5));
      console.log('Fallback: created leftSprite from all11Sheet');
    }
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
      } else {
        // 若兩者皆未載入，隱藏左側顯示
      }
    }
    // 若主角靠近 leftSprite，暫時切換到 all9
    const distLeft = Math.abs(posX - LEFT_X());
    // 觸發問答：Scene 1 直接觸發；Scene 2 需按下兩次空白鍵後觸發
    // 且當 all12 出現後（達成答對題數），就不再觸發問答
    let canTrigger = false;
    if (sceneStage === 1) {
      canTrigger = (correctAnswerCount < 3);
    } else if (sceneStage === 2) {
      canTrigger = (spaceKeyCount >= 2 && scene2CorrectCount < 3);
    } else if (sceneStage === 3) {
      canTrigger = (!ridingMode && scene3CorrectCount < 2);
    }

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
        
        let displayH_local = Math.floor(leftOrigH * LEFT_SCALE);
        // Scene 3 (all14) 特殊處理：放大 4 倍，高度約 160
        if (sceneStage === 3 && leftSprite.sheet === all14Sheet) {
            displayH_local = 160;
        }

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
        const scale = 4.0; // 放大顯示 (因原圖高僅 40px)
        drawW = Math.max(1, Math.floor(fW * scale));
        drawH = Math.max(1, Math.floor(fH * scale));
        drawX = LEFT_X(); // 改回跟前兩階段一樣的位置 (1/4)
        drawY = baselineY; // 改回基準線高度
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
      // Scene 3 (all14) 預設面向右，若主角在左側則翻轉面向左
      let flip = false;
      if (sceneStage === 2) flip = (posX > LEFT_X());
      if (sceneStage === 3) flip = (posX < LEFT_X());
      leftSprite.draw(drawX, drawY, drawW, drawH, flip);
    }
  }

  // 如果正在顯示回饋，則計時
  if (quizState === 'SHOWING_FEEDBACK') {
    feedbackTimer += dt;
    if (feedbackTimer > 1.2) { // 顯示回饋 1.2 秒，結束後恢復原本精靈與狀態
      if (sceneStage === 3 && scene3CorrectCount >= 2) {
        gameEnded = true;
      }
      // 檢查鑰匙是否用完
      if (playerKeys <= 0) {
        gameEnded = true;
      }

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
      
      // 顯示對話框
      push();
      rectMode(CENTER);
      fill(255);
      stroke(0);
      rect(rewardSprite.x, rewardSprite.y - 60, 100, 30, 5);
      noStroke();
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(14);
      text("按 ↓ 騎乘", rewardSprite.x, rewardSprite.y - 60);
      pop();
    } else if (rewardSprite.state === 'RIDING_IDLE') {
      // 騎乘待機：主角已騎上，但尚未出發
      rewardSprite.x = targetX;
      rewardSprite.y = targetY;
      posX = rewardSprite.x;
      posY = rewardSprite.y - 50;
      facing = 1;
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
      // 顯示對話框
      push();
      rectMode(CENTER);
      fill(255);
      stroke(0);
      rect(rewardSprite.x, rewardSprite.y - 60, 100, 30, 5);
      noStroke();
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(14);
      text("按 ↓ 騎乘", rewardSprite.x, rewardSprite.y - 60);
      pop();
    } else if (rewardSprite.state === 'SCENE_2_RIDING_IDLE') {
      rewardSprite.x = width / 2;
      rewardSprite.y = height - 80;
      posX = rewardSprite.x;
      posY = rewardSprite.y - 50;
      facing = 1;
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
      } else if (sceneStage === 3 && leftSprite.sheet === all14Sheet) {
          // Scene 3: all14 放大 4 倍，高度約 160，將對話框移至角色上方
          const charH = 160;
          bubbleY = baselineY - (charH / 2) - 40;
    }

    if (dialogActive && (sceneStage === 1 || sceneStage === 2 || sceneStage === 3)) {
        // Scene 1 & 2 & 3: 繪製觸發者的對話氣泡
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
    // 且若已達成通關條件 (all12 出現)，也不顯示提示
    } else if (
      ((sceneStage === 2 && all11State === 'IDLE' && scene2CorrectCount < 3) || 
       (sceneStage === 3 && !ridingMode && scene3CorrectCount < 2)) 
      && quizState !== 'SHOWING_FEEDBACK'
    ) {
        // Scene 2 & 3: 當主角靠近時顯示對話
        const distLeft = Math.abs(posX - LEFT_X());
        if (distLeft <= PROXIMITY_DIST) {
            // 若按下兩次空白鍵(回答當然)，改變對話
            let txt = "準備好新的挑戰了嗎?";
            if (sceneStage === 2 && spaceKeyCount >= 2) {
                txt = "繼續回答右邊題目！";
            } else if (sceneStage === 3) {
                txt = "請回答右邊的問題！";
            }
            push();
            textSize(14);
            const txtW = textWidth(txt) + 20;
            const txtH = 36;
            rectMode(CENTER);
            fill(255); // 背景顏色跟第一階段一樣 (白色)
            stroke(0);
            strokeWeight(1);
            rect(bubbleX, bubbleY, txtW, txtH, 6);
            noStroke();
            fill(0);
            textAlign(CENTER, CENTER);
            text(txt, bubbleX, bubbleY);
            pop();

            // 控制右邊角色文字顯示：只要靠近就一直顯示
            if (rightSprite) {
                rightSprite.alwaysShow = true;
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
  fill(255);
  noStroke();
  // 若想微調位置，可更改 x,y（目前為距離邊緣 8px）
  text('414730027 王瑀瑄', 8, 8);
  pop();

  // 在右上角顯示鑰匙 (黃色圖案)
  for (let i = 0; i < playerKeys; i++) {
    push();
    // 從右向左排列，每個間隔 40px
    let kx = width - 40 - (i * 40);
    let ky = 30;
    translate(kx, ky);
    rotate(3 * PI / 4); // 斜著擺放 (右上-左下)
    
    // 鑰匙樣式
    fill(255, 215, 0); // 金黃色
    stroke(0);
    strokeWeight(1);
    
    // 鑰匙頭
    ellipse(-8, 0, 14, 14);
    // 鑰匙桿
    rectMode(CORNER);
    rect(-2, -3, 20, 6);
    // 鑰匙齒
    rect(10, 3, 3, 5);
    rect(15, 3, 3, 3);
    
    // 鑰匙孔 (裝飾)
    fill(255, 255, 200); // 淺色孔
    noStroke();
    ellipse(-8, 0, 5, 5);
    
    pop();
  }

  // 螢幕閃爍效果 (答對/答錯時的視覺回饋)
  if (screenFlashTimer > 0) {
    push();
    // 稍微擴大範圍以覆蓋震動時的邊緣
    translate(-50, -50);
    noStroke();
    let alphaVal = map(screenFlashTimer, 0, 0.5, 0, 150);
    if (screenFlashColor) {
      fill(red(screenFlashColor), green(screenFlashColor), blue(screenFlashColor), alphaVal);
      rect(0, 0, width + 100, height + 100);
    }
    pop();
    screenFlashTimer -= deltaTime / 1000;
  }

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  baselineY = height * (2 / 3);
  posY = baselineY;
  if (startButton) {
    startButton.position(width / 2 - 60, height / 2 + 100);
  }
  if (viewNotesButton) {
    viewNotesButton.position(width / 2 - 60, height / 2 + 100);
  }
  if (tryAgainButton) {
    tryAgainButton.position(width / 2 - 60, height / 2 + 100);
  }
  if (playAgainButton) {
    playAgainButton.position(width / 2 - 60, height / 2 + 160);
  }
  if (notesContainer) {
    notesContainer.size(windowWidth, windowHeight);
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    // 檢查是否處於騎乘待機狀態，若是則按右鍵開始移動
    if (rewardSprite) {
      if (rewardSprite.state === 'RIDING_IDLE') {
        rewardSprite.state = 'RIDING';
        return;
      } else if (rewardSprite.state === 'SCENE_2_RIDING_IDLE') {
        rewardSprite.state = 'SCENE_2_RETURN_RIDING';
        return;
      }
    }

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
    // 檢查是否處於獎勵坐騎互動狀態
    if (rewardSprite) {
      if (rewardSprite.state === 'ARRIVED') {
        rewardSprite.state = 'RIDING_IDLE';
        ridingMode = true;
        return; // 攔截按鍵，不發射投射物
      } else if (rewardSprite.state === 'SCENE_2_RETURN_ARRIVED') {
        rewardSprite.state = 'SCENE_2_RIDING_IDLE';
        ridingMode = true;
        return;
      }
    }

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
      playSound('15/正確.mp3');
      rightSprite.dialogText = currentQuestionRow.getString('答對時的回饋');
      correctAnswerCount++;
      
      // 答對特效：綠色閃爍
      screenFlashColor = color(0, 255, 0);
      screenFlashTimer = 0.5;

      if (sceneStage === 2) {
        scene2CorrectCount++;
      } else if (sceneStage === 3) {
        scene3CorrectCount++;
      }
    } else {
      playSound('15/錯誤.mp3');
      let wrongFeedback = currentQuestionRow.getString('答錯時的回饋');
      // 答錯時加入提示 (不限階段，確保提示能出現)
      const hint = currentQuestionRow.getString('提示文字');
      if (hint) wrongFeedback += ' ' + hint;
      
      // 扣除鑰匙
      playerKeys--;

      // 答錯特效：使用 all10 在主角位置顯示，並加強效果 (浮誇一點)
      if (all10Sheet && all10Sheet.width) {
        // 產生多個放大版的特效
        for (let i = 0; i < 8; i++) { // 增加數量
          const ox = random(-60, 60);
          const oy = random(-60, 60);
          const s = random(1.5, 3.0); // 隨機放大 1.5 ~ 3.0 倍
          const e = new Effect(posX + ox, posY - 50 + oy, all10Sheet, ALL10_FRAME_COUNT, null, 0, s);
          effects.push(e);
        }
      }

      // 觸發震動
      screenShakeAmount = 20;
      screenShakeTimer = 0.5;

      if (playerKeys <= 0) {
        wrongFeedback += " (鑰匙已用完)";
      } else {
        wrongFeedback += " (損失一把鑰匙)";
      }
      
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
  constructor(x, y, sheet, frameCount, onFinish, vx = 0, scale = 1.0, tintColor = null) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.sheet = sheet;
    this.frameCount = frameCount;
    this.scale = scale;
    this.tintColor = tintColor;
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
    const drawW = this.frameW * this.scale;
    const drawH = this.frameH * this.scale;
    push();
    translate(this.x, this.y);
    if (this.tintColor) tint(this.tintColor); // 套用顏色濾鏡
    image(this.sheet, 0, 0, drawW, drawH, sx, 0, this.frameW, this.frameH);
    if (this.tintColor) noTint(); // 恢復
    pop();
  }
}

// 安全播放音效函式 (使用 HTML5 Audio，不依賴 p5.sound，避免載入失敗導致當機)
function playSound(path) {
  try {
    const audio = new Audio(path);
    audio.volume = 0.5;
    audio.play().catch(e => {
      // 忽略自動播放限制或找不到檔案的錯誤
      console.log('Sound play prevented or file missing:', path);
    });
  } catch (e) {
    console.log('Audio error:', e);
  }
}

// 新增：煙火粒子特效類別 (用於 Finish 畫面)
class Firework {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.particles = [];
    this.finished = false;
    const c = color(random(150, 255), random(150, 255), random(150, 255));
    // 產生粒子
    for (let i = 0; i < 40; i++) {
      const angle = random(TWO_PI);
      const speed = random(50, 150);
      this.particles.push({
        x: 0,
        y: 0,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        alpha: 255,
        col: c
      });
    }
  }

  update(dt) {
    let alive = false;
    for (let p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt; // 重力效果
      p.alpha -= 200 * dt; // 淡出
      if (p.alpha > 0) alive = true;
    }
    if (!alive) this.finished = true;
  }

  draw() {
    push();
    translate(this.x, this.y);
    noStroke();
    for (let p of this.particles) {
      if (p.alpha <= 0) continue;
      fill(red(p.col), green(p.col), blue(p.col), p.alpha);
      ellipse(p.x, p.y, 4, 4);
    }
    pop();
  }
}
