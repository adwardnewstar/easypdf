<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
    <title>液态玻璃 · 修复版</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
            font-family: system-ui, -apple-system, 'Helvetica Neue', 'SF Pro Text', sans-serif;
        }

        body {
            background: radial-gradient(circle at 30% 30%, #1e2a36, #0c1218);
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
            touch-action: none;
        }

        #app {
            position: relative;
            width: 100%;
            height: 100dvh;
            display: flex;
            flex-direction: column;
            z-index: 2;
            padding: 8px 12px;
            max-width: 600px;
            margin: 0 auto;
        }

        /* ----- 地图框（上部） ----- */
        .map-frame {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
            background: rgba(10, 20, 30, 0.25);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 36px;
            box-shadow: 0 12px 24px rgba(0,0,0,0.4);
            overflow: hidden;
            margin-bottom: 12px;
            position: relative;
        }

        /* 地图框内顶部左右两个小按钮 */
        .map-top-left {
            position: absolute;
            top: 12px;
            left: 12px;
            z-index: 10;
        }
        .map-top-right {
            position: absolute;
            top: 12px;
            right: 12px;
            z-index: 10;
        }
        .map-small-btn {
            width: 44px;
            height: 44px;
            border-radius: 22px;
            background: rgba(25, 35, 50, 0.5);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.15);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(255,255,255,0.9);
            font-size: 22px;
            cursor: pointer;
            transition: all 0.15s;
        }
        .map-small-btn:active {
            transform: scale(0.92);
            background: rgba(60, 80, 110, 0.6);
        }

        /* 地图主体（画布+左右刻度条） */
        .map-body {
            flex: 1;
            display: flex;
            align-items: stretch;
            padding: 12px 8px 8px 8px;
            min-height: 0;
        }

        .wheel-inline {
            width: 36px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            touch-action: none;
            cursor: grab;
            overflow: hidden;
            border-radius: 18px;
            background: rgba(20, 30, 45, 0.3);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255,255,255,0.1);
        }
        .wheel-canvas {
            display: block;
            width: 100%;
            height: 100%;
            background: transparent;
            touch-action: none;
        }

        .map-canvas-container {
            flex: 1;
            margin: 0 6px;
            border-radius: 24px;
            overflow: hidden;
            position: relative;
        }
        #mapCanvas {
            display: block;
            width: 100%;
            height: 100%;
            background: transparent;
            touch-action: none;
            transform-origin: 0 0;
            will-change: transform;
        }

        /* 十字靶心 */
        .crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 32px;
            height: 32px;
            pointer-events: none;
            z-index: 5;
        }
        .crosshair::before,
        .crosshair::after {
            content: '';
            position: absolute;
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(4px);
        }
        .crosshair::before {
            width: 2px;
            height: 100%;
            left: 50%;
            transform: translateX(-50%);
        }
        .crosshair::after {
            width: 100%;
            height: 2px;
            top: 50%;
            transform: translateY(-50%);
        }
        .crosshair-dot {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 5px;
            height: 5px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            box-shadow: 0 0 8px #3a8cff;
        }

        /* ----- 工具框（下部） ----- */
        .toolbar {
            flex-shrink: 0;
            background: rgba(20, 30, 45, 0.45);
            backdrop-filter: blur(25px) saturate(180%);
            -webkit-backdrop-filter: blur(25px) saturate(180%);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 44px;
            padding: 12px 8px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: space-around;
        }

        .tool-btn {
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: rgba(30, 45, 65, 0.5);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.15);
            box-shadow: 0 8px 16px rgba(0,0,0,0.3);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: 500;
            text-shadow: 0 1px 3px black;
            cursor: pointer;
            transition: all 0.08s;
            touch-action: manipulation;
            position: relative;
        }
        .tool-btn:active {
            transform: scale(0.92);
            background: rgba(80, 120, 170, 0.6);
        }
        .tool-btn .icon {
            font-size: 24px;
            margin-bottom: 2px;
        }

        /* 历史下拉菜单 */
        .history-dropdown {
            position: absolute;
            bottom: 70px;
            left: 0;
            right: 0;
            background: rgba(15, 25, 38, 0.9);
            backdrop-filter: blur(30px);
            -webkit-backdrop-filter: blur(30px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px;
            padding: 8px;
            display: none;
            z-index: 100;
            max-height: 200px;
            overflow-y: auto;
            min-width: 160px;
            margin-left: -50px;
        }
        .history-dropdown.show {
            display: block;
        }
        .history-item {
            padding: 12px 16px;
            border-radius: 18px;
            color: white;
            font-size: 14px;
            cursor: pointer;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .history-item:active {
            background: rgba(80, 120, 170, 0.4);
        }

        /* 设置面板 */
        .settings-modal {
            position: absolute;
            top: 80px; left: 20px; right: 20px;
            background: rgba(15, 25, 38, 0.8);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 36px;
            padding: 20px 18px;
            z-index: 150;
            display: none;
            box-shadow: 0 25px 40px black;
        }
        .settings-modal.show { display: block; }
        .modal-title { color: white; font-size: 18px; margin-bottom: 18px; text-align: center; }
        .setting-item { margin-bottom: 16px; }
        .setting-label { color: rgba(255,255,255,0.7); font-size: 14px; display: flex; justify-content: space-between; }
        .setting-slider { width: 100%; margin: 6px 0; }
        .setting-number {
            width: 70px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15);
            border-radius: 20px; padding: 6px 10px; color: white; text-align: center; font-size: 14px;
        }
        .close-modal-btn {
            margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.1); border-radius: 36px;
            text-align: center; color: white; cursor: pointer;
        }

        /* 语音覆盖层 */
        .voice-overlay {
            position: fixed; top:0; left:0; right:0; bottom:0;
            background: rgba(5,10,16,0.9); backdrop-filter: blur(40px); z-index:200;
            display: none; align-items: center; justify-content: center;
        }
        .voice-overlay.active { display: flex; }
        .voice-exit {
            position: absolute; top:24px; right:24px; width:56px; height:56px; border-radius:28px;
            background: rgba(40,55,75,0.6); backdrop-filter: blur(20px); border:1px solid rgba(255,255,255,0.2);
            color:white; font-size:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;
        }
        .voice-main-btn {
            width:120px; height:120px; border-radius:60px; background:rgba(70,100,150,0.45);
            backdrop-filter: blur(30px); border:2px solid rgba(255,255,255,0.25); box-shadow:0 20px 40px black;
            display:flex; align-items:center; justify-content:center; font-size:60px; color:white;
            cursor:pointer; margin-bottom:16px;
        }
        .record-hint { color: rgba(255,255,255,0.7); font-size:16px; }
    </style>
</head>
<body>
<div id="app">
    <!-- 地图框 -->
    <div class="map-frame">
        <!-- 左上设置按钮 -->
        <div class="map-top-left">
            <div class="map-small-btn" id="settingsBtn">⚙️</div>
        </div>
        <!-- 右上全屏按钮 -->
        <div class="map-top-right">
            <div class="map-small-btn" id="fullscreenBtn">⛶</div>
        </div>

        <!-- 地图主体（内嵌刻度条） -->
        <div class="map-body">
            <div class="wheel-inline" id="leftWheelContainer">
                <canvas id="leftWheelCanvas" class="wheel-canvas"></canvas>
            </div>
            <div class="map-canvas-container">
                <canvas id="mapCanvas"></canvas>
                <div class="crosshair"><div class="crosshair-dot"></div></div>
            </div>
            <div class="wheel-inline" id="rightWheelContainer">
                <canvas id="rightWheelCanvas" class="wheel-canvas"></canvas>
            </div>
        </div>
    </div>

    <!-- 工具框（五个按钮：打开、最佳、切换、历史、语音） -->
    <div class="toolbar">
        <!-- 1.打开文件 -->
        <div class="tool-btn" id="openFileBtn">
            <span class="icon">📂</span>
            <span>打开</span>
        </div>
        <!-- 2.设为最佳 -->
        <div class="tool-btn" id="setBestBtn">
            <span class="icon">⭐</span>
            <span>最佳</span>
        </div>
        <!-- 3.切换比例 -->
        <div class="tool-btn" id="toggleScaleBtn">
            <span class="icon">🔍</span>
            <span>切换</span>
        </div>
        <!-- 4.历史记录 -->
        <div class="tool-btn" id="historyBtn" style="position:relative;">
            <span class="icon">🕒</span>
            <span>历史</span>
            <div class="history-dropdown" id="historyDropdown"></div>
        </div>
        <!-- 5.语音话筒 -->
        <div class="tool-btn" id="micBtn">
            <span class="icon">🎤</span>
            <span>语音</span>
        </div>
    </div>

    <!-- 语音覆盖层 -->
    <div class="voice-overlay" id="voiceOverlay">
        <div class="voice-exit" id="exitVoiceBtn">✕</div>
        <div class="voice-main-area">
            <div class="voice-main-btn" id="voiceRecordBtn">🎤</div>
            <div class="record-hint" id="recordHint">长按录音</div>
        </div>
    </div>

    <!-- 设置面板 -->
    <div class="settings-modal" id="settingsModal">
        <div class="modal-title">滚轮灵敏度</div>
        <div class="setting-item">
            <div class="setting-label">左轮 <input type="number" id="leftSensInput" step="0.1" min="0.2" max="3.0" value="1.0" class="setting-number"></div>
            <input type="range" min="0.2" max="3.0" step="0.1" value="1.0" class="setting-slider" id="leftSensSlider">
        </div>
        <div class="setting-item">
            <div class="setting-label">右轮 <input type="number" id="rightSensInput" step="0.1" min="0.2" max="3.0" value="1.0" class="setting-number"></div>
            <input type="range" min="0.2" max="3.0" step="0.1" value="1.0" class="setting-slider" id="rightSensSlider">
        </div>
        <div class="close-modal-btn" id="closeSettingsBtn">完成</div>
    </div>

    <!-- 隐藏文件input -->
    <input type="file" id="fileInput" accept=".pdf,application/pdf" style="display:none;">
</div>

<script>
    (function(){
        "use strict";

        // 状态
        const state = {
            mapScale: 1.0,
            leftSens: 1.0,
            rightSens: 1.0,
            offsetX: 0, offsetY: 0,
            leftWheelPos: 0.125,  // 1.0 / 8.0
            rightWheelPos: 0.125,
            bestView: { scale: 1.0, offsetX: 0, offsetY: 0 },
            historyList: []
        };

        // DOM
        const canvas = document.getElementById('mapCanvas');
        const ctx = canvas.getContext('2d');
        const leftWheelCanvas = document.getElementById('leftWheelCanvas');
        const rightWheelCanvas = document.getElementById('rightWheelCanvas');
        const leftWheelCtx = leftWheelCanvas.getContext('2d');
        const rightWheelCtx = rightWheelCanvas.getContext('2d');
        const leftContainer = document.getElementById('leftWheelContainer');
        const rightContainer = document.getElementById('rightWheelContainer');
        const settingsModal = document.getElementById('settingsModal');
        const settingsBtn = document.getElementById('settingsBtn');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        const leftSensSlider = document.getElementById('leftSensSlider');
        const leftSensInput = document.getElementById('leftSensInput');
        const rightSensSlider = document.getElementById('rightSensSlider');
        const rightSensInput = document.getElementById('rightSensInput');
        const openFileBtn = document.getElementById('openFileBtn');
        const fileInput = document.getElementById('fileInput');
        const historyBtn = document.getElementById('historyBtn');
        const historyDropdown = document.getElementById('historyDropdown');
        const setBestBtn = document.getElementById('setBestBtn');
        const toggleScaleBtn = document.getElementById('toggleScaleBtn');
        const micBtn = document.getElementById('micBtn');
        const voiceOverlay = document.getElementById('voiceOverlay');
        const exitVoiceBtn = document.getElementById('exitVoiceBtn');
        const voiceRecordBtn = document.getElementById('voiceRecordBtn');
        const recordHint = document.getElementById('recordHint');

        // 常量
        const MIN_SCALE = 0.0;
        const MAX_SCALE = 8.0;
        const vibrateSupported = 'vibrate' in navigator;

        // 滚轮交互
        let activeWheel = null, wheelStartY = 0, wheelStartPos = 0.5;
        // 地图拖拽
        let isDragging = false, dragStart = {x:0,y:0}, lastOffset = {x:0,y:0}, dragTouchId = null;
        let initDist = 0, initScale = 1.0;

        // 辅助函数
        function scaleFromPos(pos) { return MIN_SCALE + pos * (MAX_SCALE - MIN_SCALE); }
        function posFromScale(scale) { return Math.min(1, Math.max(0, (scale - MIN_SCALE) / (MAX_SCALE - MIN_SCALE))); }

        // 初始化尺寸
        function resizeCanvas() {
            const container = canvas.parentElement;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width || 300;
            canvas.height = rect.height || 200;
            const wheelH = rect.height || 200;
            leftWheelCanvas.width = 36; leftWheelCanvas.height = wheelH;
            rightWheelCanvas.width = 36; rightWheelCanvas.height = wheelH;
            drawWheels();
            drawMap();
        }
        window.addEventListener('resize', resizeCanvas);

        // 绘制左侧滚轮（简化：仅显示大刻度0~8）
        function drawLeftWheel(ctx, pos) {
            const w = ctx.canvas.width, h = ctx.canvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = 'rgba(15,25,38,0.3)';
            ctx.beginPath(); ctx.roundRect(0,0,w,h,12); ctx.fill();
            
            const tickHeight = 32;          // 每大格像素
            const totalTicks = 9;           // 0~8共9个
            const contentHeight = tickHeight * (totalTicks - 1);
            const maxOffset = Math.max(0, contentHeight - h);
            const offset = pos * maxOffset;
            
            ctx.save();
            ctx.beginPath(); ctx.rect(0,0,w,h); ctx.clip();
            const startIdx = Math.floor(offset / tickHeight);
            const startY = - (offset % tickHeight);
            ctx.textAlign = 'center'; ctx.font = '10px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.7)';
            for (let i = 0; i <= totalTicks + 2; i++) {
                const val = startIdx + i;
                const y = startY + i * tickHeight;
                if (y < -40 || y > h + 40) continue;
                const lineW = w * 0.7, lineX = (w - lineW) / 2;
                ctx.beginPath(); ctx.moveTo(lineX, y); ctx.lineTo(lineX + lineW, y);
                ctx.strokeStyle = 'rgba(200,220,255,0.8)'; ctx.lineWidth = 2.5; ctx.stroke();
                if (val >= 0 && val <= 8) {
                    ctx.fillText(val.toFixed(0), w/2, y - 6);
                }
            }
            ctx.restore();
            ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
            ctx.strokeStyle = '#5a9cff'; ctx.lineWidth = 2; ctx.shadowBlur=6; ctx.shadowColor='#3a8cff'; ctx.stroke();
            ctx.shadowBlur=0;
        }

        // 绘制右侧滚轮（精细，每大格40小格）
        function drawRightWheel(ctx, pos) {
            const w = ctx.canvas.width, h = ctx.canvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = 'rgba(15,25,38,0.3)';
            ctx.beginPath(); ctx.roundRect(0,0,w,h,12); ctx.fill();
            
            const smallTickH = 1.6;
            const bigTickInterval = 40;
            const totalSmallTicks = 8 * bigTickInterval;
            const contentHeight = smallTickH * totalSmallTicks;
            const maxOffset = Math.max(0, contentHeight - h);
            const offset = pos * maxOffset;
            
            ctx.save();
            ctx.beginPath(); ctx.rect(0,0,w,h); ctx.clip();
            const startIdx = Math.floor(offset / smallTickH);
            const startY = - (offset % smallTickH);
            ctx.textAlign = 'center'; ctx.font = '8px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.5)';
            for (let i = 0; i <= totalSmallTicks + 10; i++) {
                const tickIdx = startIdx + i;
                const y = startY + i * smallTickH;
                if (y < -30 || y > h + 30) continue;
                const isBig = tickIdx % bigTickInterval === 0;
                const lineW = isBig ? w * 0.5 : w * 0.2;
                const lineX = (w - lineW) / 2;
                ctx.beginPath(); ctx.moveTo(lineX, y); ctx.lineTo(lineX + lineW, y);
                ctx.strokeStyle = isBig ? 'rgba(200,220,255,0.7)' : 'rgba(150,180,220,0.3)';
                ctx.lineWidth = isBig ? 1.5 : 0.8; ctx.stroke();
                if (isBig) {
                    const val = tickIdx / bigTickInterval;
                    ctx.fillText(val.toFixed(0), w/2, y - 4);
                }
            }
            ctx.restore();
            ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
            ctx.strokeStyle = '#5a9cff'; ctx.lineWidth = 1.5; ctx.shadowBlur=6; ctx.stroke();
            ctx.shadowBlur=0;
        }

        CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r) {
            if (w<2*r) r=w/2; if (h<2*r) r=h/2;
            this.moveTo(x+r,y); this.lineTo(x+w-r,y);
            this.quadraticCurveTo(x+w,y,x+w,y+r);
            this.lineTo(x+w,y+h-r); this.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
            this.lineTo(x+r,y+h); this.quadraticCurveTo(x,y+h,x,y+h-r);
            this.lineTo(x,y+r); this.quadraticCurveTo(x,y,x+r,y);
            return this;
        };

        function drawWheels() {
            drawLeftWheel(leftWheelCtx, state.leftWheelPos);
            drawRightWheel(rightWheelCtx, state.rightWheelPos);
        }

        function setMapScale(newScale, source) {
            newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
            if (Math.abs(newScale - state.mapScale) < 0.001) return;
            state.mapScale = newScale;
            if (source !== 'left') state.leftWheelPos = posFromScale(newScale);
            if (source !== 'right') state.rightWheelPos = posFromScale(newScale);
            drawWheels();
            drawMap();
        }

        function drawMap() {
            if (!ctx) return;
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            ctx.save();
            ctx.translate(w/2, h/2);
            ctx.scale(state.mapScale, state.mapScale);
            ctx.translate(-w/2 + state.offsetX, -h/2 + state.offsetY);
            
            ctx.strokeStyle = 'rgba(180,210,255,0.15)';
            ctx.lineWidth = 1 / state.mapScale;
            const step = 40;
            const startX = -state.offsetX, startY = -state.offsetY;
            const endX = startX + w / state.mapScale, endY = startY + h / state.mapScale;
            for (let i = Math.floor(startX/step)*step; i < endX; i+=step) {
                ctx.beginPath(); ctx.moveTo(i, startY); ctx.lineTo(i, endY); ctx.stroke();
            }
            for (let i = Math.floor(startY/step)*step; i < endY; i+=step) {
                ctx.beginPath(); ctx.moveTo(startX, i); ctx.lineTo(endX, i); ctx.stroke();
            }
            ctx.restore();
        }

        function animate() { drawMap(); requestAnimationFrame(animate); }
        requestAnimationFrame(animate);

        // 触摸事件
        function handleMapDragStart(e) {
            e.preventDefault(); const touch = e.touches[0];
            if (e.touches.length===1 && !activeWheel) {
                isDragging=true; dragTouchId=touch.identifier;
                dragStart.x=touch.clientX; dragStart.y=touch.clientY;
                lastOffset.x=state.offsetX; lastOffset.y=state.offsetY;
            }
        }
        function handleMapDragMove(e) {
            if (!isDragging) return; e.preventDefault();
            let touch=null; for (let i=0;i<e.touches.length;i++) if(e.touches[i].identifier===dragTouchId){touch=e.touches[i];break;}
            if(!touch) return;
            const dx=touch.clientX-dragStart.x, dy=touch.clientY-dragStart.y;
            state.offsetX = lastOffset.x - dx/state.mapScale;
            state.offsetY = lastOffset.y - dy/state.mapScale;
            drawMap();
        }
        function handleMapDragEnd(e) { e.preventDefault(); isDragging=false; dragTouchId=null; }
        function handlePinchStart(e) {
            if(e.touches.length===2){ e.preventDefault();
                const t1=e.touches[0],t2=e.touches[1];
                initDist=Math.hypot(t1.clientX-t2.clientX,t1.clientY-t2.clientY);
                initScale=state.mapScale;
            }
        }
        function handlePinchMove(e) {
            if(e.touches.length===2){ e.preventDefault();
                const t1=e.touches[0],t2=e.touches[1];
                const dist=Math.hypot(t1.clientX-t2.clientX,t1.clientY-t2.clientY);
                if(initDist>0) setMapScale(initScale*(dist/initDist),'pinch');
            }
        }
        canvas.addEventListener('touchstart',(e)=>{
            if(e.touches.length===1) handleMapDragStart(e);
            else if(e.touches.length===2) handlePinchStart(e);
        },{passive:false});
        canvas.addEventListener('touchmove',(e)=>{
            if(e.touches.length===1) handleMapDragMove(e);
            else if(e.touches.length===2) handlePinchMove(e);
        },{passive:false});
        canvas.addEventListener('touchend',handleMapDragEnd);
        canvas.addEventListener('touchcancel',handleMapDragEnd);

        // 滚轮交互（修复死机）
        function wheelStart(e,side) {
            e.preventDefault(); const touch=e.touches[0];
            activeWheel=side; wheelStartY=touch.clientY;
            wheelStartPos = (side==='left')? state.leftWheelPos : state.rightWheelPos;
        }
        function wheelMove(e,side) {
            e.preventDefault(); if(activeWheel!==side) return;
            const touch=e.touches[0]; const deltaY=wheelStartY - touch.clientY;
            const container = (side==='left')? leftContainer : rightContainer;
            const h=container.clientHeight;
            if (h <= 0) return;
            const sens = (side==='left')? state.leftSens : state.rightSens;
            const deltaPos = deltaY / (h * 1.5) * sens;
            let newPos = Math.min(1, Math.max(0, wheelStartPos + deltaPos));
            if(side==='left') state.leftWheelPos=newPos; else state.rightWheelPos=newPos;
            drawWheels();
            const newScale = scaleFromPos(newPos);
            if(Math.abs(newScale-state.mapScale)>0.001){
                state.mapScale=newScale;
                if(side==='left') state.rightWheelPos=posFromScale(newScale);
                else state.leftWheelPos=posFromScale(newScale);
                drawWheels(); drawMap();
            }
            if(vibrateSupported && Math.abs(deltaY)>2) navigator.vibrate(3);
        }
        function wheelEnd(e) { e.preventDefault(); activeWheel=null; }
        leftContainer.addEventListener('touchstart',(e)=>wheelStart(e,'left'),{passive:false});
        leftContainer.addEventListener('touchmove',(e)=>wheelMove(e,'left'),{passive:false});
        leftContainer.addEventListener('touchend',wheelEnd);
        rightContainer.addEventListener('touchstart',(e)=>wheelStart(e,'right'),{passive:false});
        rightContainer.addEventListener('touchmove',(e)=>wheelMove(e,'right'),{passive:false});
        rightContainer.addEventListener('touchend',wheelEnd);

        // 底部按钮功能
        openFileBtn.addEventListener('click',()=> fileInput.click());
        fileInput.addEventListener('change',(e)=>{
            const file = fileInput.files[0];
            if(!file) return;
            if(file.type!=='application/pdf' && !file.name.endsWith('.pdf')) { alert('请选择PDF文件'); return; }
            if(file.size > 1*1024*1024) { alert('文件需小于1MB'); return; }
            state.historyList.unshift(file.name);
            if(state.historyList.length>5) state.historyList.pop();
            updateHistoryDropdown();
            alert(`已选择: ${file.name}`);
            fileInput.value='';
        });

        function updateHistoryDropdown() {
            historyDropdown.innerHTML = state.historyList.map(name => `<div class="history-item">${name}</div>`).join('');
        }
        historyBtn.addEventListener('click',(e)=>{
            e.stopPropagation();
            historyDropdown.classList.toggle('show');
        });
        document.addEventListener('click',()=> historyDropdown.classList.remove('show'));

        setBestBtn.addEventListener('click',()=>{
            state.bestView = { scale: state.mapScale, offsetX: state.offsetX, offsetY: state.offsetY };
            alert('已保存当前视图为最佳');
        });

        toggleScaleBtn.addEventListener('click',()=>{
            const best = state.bestView;
            const isBest = (Math.abs(state.mapScale-best.scale)<0.01 && Math.abs(state.offsetX-best.offsetX)<1 && Math.abs(state.offsetY-best.offsetY)<1);
            if(!isBest) {
                state.mapScale = best.scale;
                state.offsetX = best.offsetX;
                state.offsetY = best.offsetY;
            } else {
                state.mapScale = 1.0;
                state.offsetX = 0; state.offsetY = 0;
            }
            state.leftWheelPos = posFromScale(state.mapScale);
            state.rightWheelPos = state.leftWheelPos;
            drawWheels(); drawMap();
        });

        micBtn.addEventListener('click',()=>{ voiceOverlay.classList.add('active'); });
        exitVoiceBtn.addEventListener('click',()=>{ voiceOverlay.classList.remove('active'); recordHint.textContent='长按录音'; });
        let pressTimer, recording=false;
        voiceRecordBtn.addEventListener('touchstart',(e)=>{
            e.preventDefault();
            pressTimer=setTimeout(()=>{ recording=true; recordHint.textContent='录音中'; voiceRecordBtn.style.background='rgba(200,70,90,0.6)'; },300);
        });
        voiceRecordBtn.addEventListener('touchend',()=>{
            clearTimeout(pressTimer);
            if(recording){ recordHint.textContent='完成'; voiceRecordBtn.style.background=''; recording=false; }
        });

        // 设置面板
        function syncSettings() {
            leftSensSlider.value=state.leftSens; leftSensInput.value=state.leftSens;
            rightSensSlider.value=state.rightSens; rightSensInput.value=state.rightSens;
        }
        leftSensSlider.addEventListener('input',()=>{ state.leftSens=parseFloat(leftSensSlider.value); leftSensInput.value=state.leftSens; });
        leftSensInput.addEventListener('change',()=>{ let v=parseFloat(leftSensInput.value)||1; v=Math.min(3,Math.max(0.2,v)); state.leftSens=v; leftSensSlider.value=v; });
        rightSensSlider.addEventListener('input',()=>{ state.rightSens=parseFloat(rightSensSlider.value); rightSensInput.value=state.rightSens; });
        rightSensInput.addEventListener('change',()=>{ let v=parseFloat(rightSensInput.value)||1; v=Math.min(3,Math.max(0.2,v)); state.rightSens=v; rightSensSlider.value=v; });
        settingsBtn.addEventListener('click',()=>{ syncSettings(); settingsModal.classList.add('show'); });
        closeSettingsBtn.addEventListener('click',()=> settingsModal.classList.remove('show'));
        settingsModal.addEventListener('click',(e)=>e.stopPropagation());
        document.addEventListener('click',(e)=>{ if(!settingsModal.contains(e.target) && e.target!==settingsBtn) settingsModal.classList.remove('show'); });

        fullscreenBtn.addEventListener('click',()=>{
            if(!document.fullscreenElement) document.documentElement.requestFullscreen();
            else document.exitFullscreen();
        });

        document.body.addEventListener('touchmove',(e)=>{ if(e.target.closest('.wheel-inline, #mapCanvas, .tool-btn')) e.preventDefault(); },{passive:false});

        // 启动
        resizeCanvas();
        drawWheels();
        drawMap();
        state.leftWheelPos = posFromScale(1.0);
        state.rightWheelPos = posFromScale(1.0);
        drawWheels();
    })();
</script>
</body>
</html>