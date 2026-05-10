// 显示提示信息
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

// 显示加载状态
function showLoading(show, msg = "加载中...") {
  const loadingMask = document.getElementById("loadingMask");
  if (loadingMask) {
    if (show) {
      loadingMask.textContent = msg;
      loadingMask.style.display = "flex";
    } else {
      loadingMask.style.display = "none";
    }
  }
}

// 显示实时语音输入
function showVoiceInput(text) {
  let voiceInputElement = document.getElementById("voiceInput");
  if (!voiceInputElement) {
    voiceInputElement = document.createElement("div");
    voiceInputElement.id = "voiceInput";
    voiceInputElement.style.position = "fixed";
    voiceInputElement.style.top = "50%";
    voiceInputElement.style.left = "50%";
    voiceInputElement.style.transform = "translate(-50%, -50%)";
    voiceInputElement.style.background = "rgba(0, 0, 0, 0.75)";
    voiceInputElement.style.backdropFilter = "blur(12px)";
    voiceInputElement.style.color = "white";
    voiceInputElement.style.padding = "12px 24px";
    voiceInputElement.style.borderRadius = "60px";
    voiceInputElement.style.fontSize = "15px";
    voiceInputElement.style.fontWeight = "500";
    voiceInputElement.style.pointerEvents = "none";
    voiceInputElement.style.zIndex = "300";
    voiceInputElement.style.whiteSpace = "nowrap";
    document.body.appendChild(voiceInputElement);
  }
  voiceInputElement.innerHTML = text;
  voiceInputElement.style.display = text ? "block" : "none";
}

// 激活语音模式
function activateVoiceMode(activate) {
  const topBar = document.getElementById("topBar");
  const bottomToolbar = document.getElementById("bottomToolbar");

  if (topBar) {
    topBar.classList.toggle("voice-active", activate);
  }
  if (bottomToolbar) {
    bottomToolbar.classList.toggle("voice-active", activate);
  }
}

// 语音识别功能 - 使用腾讯云ASR
function initVoiceRecognition() {
  const speechBtn = document.getElementById("thumbCard");
  let isRecording = false;
  let mediaRecorder = null;
  let audioChunks = [];
  let longPressTimer = null;

  // 开始录音
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.start(100);
      isRecording = true;
      activateVoiceMode(true);
      showVoiceInput("正在录音...");
      console.log("开始录音");
    } catch (error) {
      console.error("录音启动失败:", error);
      showToast("无法访问麦克风，请检查权限");
      activateVoiceMode(false);
    }
  }

  // 停止录音并调用腾讯云ASR
  async function stopRecording() {
    if (!mediaRecorder || !isRecording) return;

    mediaRecorder.stop();
    isRecording = false;
    showVoiceInput("识别中...");

    try {
      const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
      const pcmData = await convertToPCM(audioBlob);

      const response = await fetch("/.netlify/functions/tencent-asr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recognize",
          audioData: pcmData,
        }),
      });

      // 调试：查看原始响应
      const rawText = await response.text();
      console.log("=== ASR原始响应 ===");
      console.log("状态码:", response.status);
      console.log("响应内容:", rawText);
      console.log("响应长度:", rawText.length);
      console.log("前10个字符:", rawText.slice(0, 10));

      const result = JSON.parse(rawText);

      if (result.result) {
        showVoiceInput(result.result);
        await processVoiceCommand(result.result);
      } else {
        throw new Error(result.error || "识别失败");
      }
    } catch (error) {
      console.error("语音识别失败:", error);
      showToast("语音识别失败: " + error.message);
    }

    activateVoiceMode(false);
    setTimeout(() => showVoiceInput(""), 500);
  }

  // 复用AudioContext（减少初始化开销）
  let audioContext = null;
  function getAudioContext() {
    if (!audioContext) {
      audioContext = new AudioContext({ sampleRate: 16000 });
    } else if (audioContext.state === "closed") {
      audioContext = new AudioContext({ sampleRate: 16000 });
    }
    return audioContext;
  }

  // 格式转换：WebM → PCM 16-bit
  async function convertToPCM(audioBlob) {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const ctx = getAudioContext(); // 复用AudioContext
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const offlineContext = new OfflineAudioContext(
      1,
      (audioBuffer.length * 16000) / audioBuffer.sampleRate,
      16000,
    );
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start();

    const resampledBuffer = await offlineContext.startRendering();
    const channelData = resampledBuffer.getChannelData(0);

    const pcmArray = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      pcmArray[i] = Math.max(
        -32768,
        Math.min(32767, Math.round(channelData[i] * 32767)),
      );
    }

    return btoa(String.fromCharCode(...new Uint8Array(pcmArray.buffer)));
  }

  // 鼠标事件
  speechBtn.addEventListener("mousedown", () => {
    if (typeof isLoggedIn !== "undefined" && !isLoggedIn) {
      if (typeof showLoginOverlay === "function") showLoginOverlay();
      return;
    }

    longPressTimer = setTimeout(() => {
      if (!isRecording) startRecording();
    }, 500);
  });

  speechBtn.addEventListener("mouseup", () => {
    clearTimeout(longPressTimer);
    if (isRecording) stopRecording();
  });

  speechBtn.addEventListener("mouseleave", () => {
    clearTimeout(longPressTimer);
    if (isRecording) stopRecording();
  });

  // 触摸事件
  speechBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (typeof isLoggedIn !== "undefined" && !isLoggedIn) {
      if (typeof showLoginOverlay === "function") showLoginOverlay();
      return;
    }

    longPressTimer = setTimeout(() => {
      if (!isRecording) startRecording();
    }, 500);
  });

  speechBtn.addEventListener("touchend", () => {
    clearTimeout(longPressTimer);
    if (isRecording) stopRecording();
  });
}

// 处理语音指令（统一由DeepSeek理解语义，作为用户的管家）
async function processVoiceCommand(transcript) {
  // 显示识别结果（即时反馈）
  showVoiceInput(` ${transcript}`);

  try {
    // 所有指令都交给DeepSeek理解语义，不显示中间状态
    let htmlContent = "";
    const cachedHtml = localStorage.getItem("cachedHtml");
    const cachedVersion = localStorage.getItem("cachedVersion");
    const currentVersion = "1.0.0";

    if (!cachedHtml || cachedVersion !== currentVersion) {
      htmlContent = document.documentElement.outerHTML.substring(0, 5000);
      localStorage.setItem("cachedHtml", htmlContent);
      localStorage.setItem("cachedVersion", currentVersion);
    }

    let historyItems = [];
    try {
      if (typeof fetchHistoryList === "function") {
        historyItems = await fetchHistoryList();
      }
    } catch (error) {
      console.error("获取历史记录失败:", error);
    }

    const response = await fetch("/.netlify/functions/deepseek", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript: transcript,
        html: htmlContent,
        isCacheValid: !!cachedHtml,
        history: historyItems,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    console.log(
      "[语音指令] DeepSeek返回结果:",
      JSON.stringify(result, null, 2),
    );

    if (result.command) {
      // 使用三个点动画表示执行中（与loadingMask样式一致）
      showVoiceInput(
        `<span style="display: flex; align-items: center; justify-content: center; gap: 2px;">` +
          `<span style="width: 6px; height: 6px; border-radius: 50%; background: #c2c2c2; opacity: 0; animation: dotFade 1.4s infinite ease-in-out;"></span>` +
          `<span style="width: 6px; height: 6px; border-radius: 50%; background: #c2c2c2; opacity: 0; animation: dotFade 1.4s infinite ease-in-out; animation-delay: 0.2s;"></span>` +
          `<span style="width: 6px; height: 6px; border-radius: 50%; background: #c2c2c2; opacity: 0; animation: dotFade 1.4s infinite ease-in-out; animation-delay: 0.4s;"></span>` +
          `</span>`,
      );
      console.log(
        "[语音指令] 准备执行命令:",
        JSON.stringify(result.command, null, 2),
      );
      executeCommand(result.command);
    }
  } catch (error) {
    console.error("处理指令失败:", error);
    showToast("处理指令失败，请重试");
  }
}

// 执行指令
function executeCommand(command) {
  switch (command.type) {
    case "open":
      // 如果有storage_path，说明是从历史记录打开文件
      if (command.storage_path && typeof loadFromSupabase === "function") {
        loadFromSupabase(command.storage_path, command.file_name || "");
      } else {
        // 否则点击文件选择按钮
        document.getElementById("fileBtn")?.click();
      }
      break;
    case "zoom":
      const currentScale =
        parseInt(document.getElementById("scaleInput")?.textContent) || 100;

      console.log("[缩放指令] 参数:", { currentScale, command });

      if (command.mode === "absolute") {
        // 绝对模式："放大至50%" → 设置为50%
        const targetScale = Math.max(25, Math.min(400, command.value));
        animateScale(targetScale); // 使用动画
      } else if (command.mode === "multiple") {
        // 倍数模式：基于当前比例的相对倍数
        // 例如：当前30%，放大两倍 = 30% × 3 = 90%
        // 放大X倍 = 当前比例 × (X + 1)
        const targetScalePercent = Math.max(
          25,
          Math.min(400, currentScale * (command.value + 1)),
        );
        const targetScaleRatio = targetScalePercent / 100;

        console.log("[倍数模式] 计算:", {
          currentScale,
          multiple: command.value,
          targetScalePercent,
          targetScaleRatio,
        });

        // 如果有scaleAtPoint函数，直接调用它（最可靠）
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        if (typeof scaleAtPoint === "function") {
          scaleAtPoint(targetScaleRatio, centerX, centerY);
        } else {
          animateScale(targetScalePercent); // 使用动画回退
        }
      } else if (command.value !== undefined) {
        // 相对模式："放大10%" → 增加10个百分点
        let newScale = currentScale;
        if (command.action === "in") {
          newScale = currentScale + command.value;
        } else if (command.action === "out") {
          newScale = currentScale - command.value;
        }
        newScale = Math.max(25, Math.min(400, newScale));
        animateScale(newScale); // 使用动画
      } else {
        // 默认模式：增加/减少10%
        if (command.action === "in") {
          animateScale(Math.min(400, currentScale + 10)); // 使用动画
        } else if (command.action === "out") {
          animateScale(Math.max(25, currentScale - 10)); // 使用动画
        }
      }
      break;
    case "reset":
      document.getElementById("resetBtn")?.click();
      break;
    case "fullscreen":
      document.getElementById("fullscreenBtn")?.click();
      break;
    case "history":
      document.getElementById("historyBtn")?.click();
      break;
    case "openHistory":
      if (typeof loadFromSupabase === "function") {
        // 优先使用 storage_path 和 file_name（直接打开）
        if (command.storage_path && command.file_name) {
          loadFromSupabase(command.storage_path, command.file_name);
          // 收起历史菜单
          const historyMenu = document.getElementById("historyMenu");
          if (historyMenu) {
            historyMenu.classList.remove("show");
          }
        } else if (
          command.index !== undefined &&
          typeof fetchHistoryList === "function"
        ) {
          // 如果只有 index，先获取历史记录再打开对应位置的文件
          fetchHistoryList()
            .then((history) => {
              const item = history[command.index];
              if (item && item.storage_path && item.file_name) {
                loadFromSupabase(item.storage_path, item.file_name);
                // 收起历史菜单
                const historyMenu = document.getElementById("historyMenu");
                if (historyMenu) {
                  historyMenu.classList.remove("show");
                }
              } else {
                showToast("未找到对应历史文件");
              }
            })
            .catch(() => {
              showToast("获取历史记录失败");
            });
        } else {
          // 没有 index，点击历史按钮展开列表（用户说"打开历史文档"）
          document.getElementById("historyBtn")?.click();
        }
      }
      break;
    case "coordinate":
      if (typeof toggleCoordinateSystem === "function") {
        toggleCoordinateSystem();
      } else {
        showToast("坐标系功能不可用");
      }
      break;
    case "move":
      executeMoveCommand(command);
      break;
    default:
      showToast("未知指令");
  }
}

// 更新缩放值（辅助函数）
function updateScaleValue(value) {
  const scaleInput = document.getElementById("scaleInput");
  if (scaleInput) {
    scaleInput.textContent = `${value}%`;
    if (typeof scaleAtPoint === "function") {
      const canvas = document.querySelector("canvas");
      if (canvas) {
        scaleAtPoint(value / 100, canvas.width / 2, canvas.height / 2);
      } else {
        scaleAtPoint(
          value / 100,
          window.innerWidth / 2,
          window.innerHeight / 2,
        );
      }
    }
  }
}

// 语音缩放控制（无缝切换版本）
// 核心逻辑：
// 1. 创建临时画布用于渲染目标比例的高清结果
// 2. CSS动画进行时，后台并行渲染到临时画布
// 3. 动画结束前，临时画布已准备好，放在主canvas下方
// 4. 执行淡入淡出过渡，实现无缝切换
// 5. 切换完成后清理临时画布
function animateScale(targetScale, duration = 300) {
  const startScale =
    parseInt(document.getElementById("scaleInput")?.textContent) || 100;
  const startScaleRatio = startScale / 100;
  const targetScaleRatio = targetScale / 100;

  // 屏幕中心作为缩放锚点
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // 获取canvas元素
  const canvas = document.querySelector("canvas");
  if (!canvas) {
    if (typeof scaleAtPoint === "function") {
      scaleAtPoint(targetScaleRatio, centerX, centerY);
    }
    return;
  }

  // 保存当前状态
  const startOffsetX = window.offsetX || 0;
  const startOffsetY = window.offsetY || 0;
  const startTime = performance.now();

  // 计算目标偏移量（与scaleAtPoint公式一致）
  const targetOffsetX =
    centerX - (centerX - startOffsetX) * (targetScaleRatio / startScaleRatio);
  const targetOffsetY =
    centerY - (centerY - startOffsetY) * (targetScaleRatio / startScaleRatio);

  // 创建临时画布用于渲染目标比例
  const tempCanvas = document.createElement("canvas");
  tempCanvas.id = "tempRenderCanvas";
  tempCanvas.style.position = "absolute";
  tempCanvas.style.top = "0";
  tempCanvas.style.left = "0";
  tempCanvas.style.width = "100%";
  tempCanvas.style.height = "100%";
  tempCanvas.style.opacity = "0";
  tempCanvas.style.pointerEvents = "none";
  tempCanvas.style.zIndex = "0";

  // 将临时画布插入到主canvas之前（作为底层）
  canvas.parentElement.insertBefore(tempCanvas, canvas);
  canvas.style.zIndex = "1";

  // 后台并行渲染目标比例到临时画布
  const renderPromise = new Promise(async (resolve) => {
    try {
      // 临时保存当前状态
      const originalScale = window.scale;
      const originalOffsetX = window.offsetX;
      const originalOffsetY = window.offsetY;

      // 临时设置目标状态
      window.scale = targetScaleRatio;
      window.offsetX = targetOffsetX;
      window.offsetY = targetOffsetY;

      // 渲染到临时画布
      if (typeof refreshRenderToCanvas === "function") {
        await refreshRenderToCanvas(tempCanvas);
      } else if (typeof currentPage !== "undefined" && currentPage) {
        // 备选方案：直接渲染到临时画布
        const viewport = currentPage.getViewport({
          scale: targetScaleRatio * (window.devicePixelRatio || 1),
        });
        tempCanvas.width = viewport.width;
        tempCanvas.height = viewport.height;
        const tempCtx = tempCanvas.getContext("2d");
        await currentPage.render({
          canvasContext: tempCtx,
          viewport: viewport,
          background: window.isCadPDF ? "transparent" : "white",
        }).promise;
        // 绘制到正确位置
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(tempCanvas, targetOffsetX, targetOffsetY);
      }

      // 恢复原始状态（因为动画还在进行中）
      window.scale = originalScale;
      window.offsetX = originalOffsetX;
      window.offsetY = originalOffsetY;

      resolve();
    } catch (e) {
      console.error("后台渲染失败:", e);
      resolve();
    }
  });

  // 计算初始transform状态
  const initialTranslateX = startOffsetX * startScaleRatio;
  const initialTranslateY = startOffsetY * startScaleRatio;

  // CSS动画过渡
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    // 计算当前缩放比例和偏移
    const currentScaleRatio =
      startScaleRatio + (targetScaleRatio - startScaleRatio) * easeProgress;
    const currentOffsetX =
      startOffsetX + (targetOffsetX - startOffsetX) * easeProgress;
    const currentOffsetY =
      startOffsetY + (targetOffsetY - startOffsetY) * easeProgress;

    // 更新缩放输入框
    const scaleInput = document.getElementById("scaleInput");
    if (scaleInput) {
      scaleInput.textContent = `${Math.round(currentScaleRatio * 100)}%`;
    }

    // 设置transform-origin为屏幕中心
    canvas.style.transformOrigin = `${centerX}px ${centerY}px`;

    // 计算位移变化
    const currentTranslateX = currentOffsetX * currentScaleRatio;
    const currentTranslateY = currentOffsetY * currentScaleRatio;
    const deltaX = currentTranslateX - initialTranslateX;
    const deltaY = currentTranslateY - initialTranslateY;

    // 应用transform
    canvas.style.transform = `scale(${currentScaleRatio}) translate(${deltaX}px, ${deltaY}px)`;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      // 动画结束，等待渲染完成后执行淡入淡出
      renderPromise.then(() => {
        // 执行淡入淡出过渡
        const fadeDuration = 150; // 淡入淡出时间
        const fadeStartTime = performance.now();

        function fadeUpdate(currentTime) {
          const fadeElapsed = currentTime - fadeStartTime;
          const fadeProgress = Math.min(fadeElapsed / fadeDuration, 1);

          // 主canvas淡出，临时画布淡入
          canvas.style.opacity = 1 - fadeProgress;
          tempCanvas.style.opacity = fadeProgress;

          if (fadeProgress < 1) {
            requestAnimationFrame(fadeUpdate);
          } else {
            // 切换完成，清理
            canvas.style.transform = "";
            canvas.style.transformOrigin = "";
            canvas.style.opacity = "1";
            canvas.style.zIndex = "";

            // 调用scaleAtPoint更新主应用状态
            if (typeof scaleAtPoint === "function") {
              scaleAtPoint(targetScaleRatio, centerX, centerY);
            }

            // 移除临时画布
            tempCanvas.remove();
          }
        }

        requestAnimationFrame(fadeUpdate);
      });
    }
  }

  requestAnimationFrame(update);
}

// 平滑移动动画（模拟人为操作，与鼠标拖拽行为一致）
function animateMove(targetOffsetX, targetOffsetY, duration = 300) {
  // 获取当前偏移量（优先使用主应用的局部变量）
  const startOffsetX =
    typeof offsetX !== "undefined" ? offsetX : window.offsetX || 0;
  const startOffsetY =
    typeof offsetY !== "undefined" ? offsetY : window.offsetY || 0;
  const diffX = targetOffsetX - startOffsetX;
  const diffY = targetOffsetY - startOffsetY;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // 缓动函数：easeOutCubic - 开始快，结束慢
    const easeProgress = 1 - Math.pow(1 - progress, 3);

    // 计算当前偏移量
    const currentOffsetX = startOffsetX + diffX * easeProgress;
    const currentOffsetY = startOffsetY + diffY * easeProgress;

    // 更新主应用的offsetX/Y变量（如果存在）
    if (typeof offsetX !== "undefined") {
      offsetX = currentOffsetX;
    }
    if (typeof offsetY !== "undefined") {
      offsetY = currentOffsetY;
    }

    // 更新window上的副本
    window.offsetX = currentOffsetX;
    window.offsetY = currentOffsetY;

    // 调用updatePan刷新显示（与鼠标拖拽一致）
    if (typeof updatePan === "function") {
      updatePan();
    }

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// 执行移动指令（使用平滑动画）
function executeMoveCommand(command) {
  const { axis, direction, directionValue, distance = 1 } = command;

  // 获取当前缩放比例
  const currentScale =
    parseInt(document.getElementById("scaleInput")?.textContent) || 100;
  const scale = currentScale / 100;

  // 计算网格大小（基于屏幕高度的1/29）
  const screenHeight = window.screen.height;
  const gridSize = screenHeight / 29; // 基础单位

  // 计算目标偏移量（考虑缩放比例）
  // 注意：由于坐标系网格定义的问题，需要乘以2来补偿
  const moveDistance = gridSize * distance * directionValue * scale * 2;

  console.log("[移动指令] 参数:", {
    axis,
    direction,
    directionValue,
    distance,
    moveDistance,
  });

  // 获取当前偏移量（优先使用主应用的局部变量）
  let targetOffsetX =
    typeof offsetX !== "undefined" ? offsetX : window.offsetX || 0;
  let targetOffsetY =
    typeof offsetY !== "undefined" ? offsetY : window.offsetY || 0;

  // 更新目标偏移量
  if (axis === "x") {
    targetOffsetX += moveDistance;
  } else if (axis === "y") {
    targetOffsetY += moveDistance;
  }

  // 使用平滑动画移动
  animateMove(targetOffsetX, targetOffsetY);
}

// 页面加载完成后自动初始化语音识别
document.addEventListener("DOMContentLoaded", () => {
  initVoiceRecognition();
});
