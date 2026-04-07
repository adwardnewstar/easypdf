// 显示提示信息
function showToast(message) {
  // 创建提示元素
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  // 添加到页面
  document.body.appendChild(toast);

  // 2秒后自动移除
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
  // 检查是否已存在语音输入元素
  let voiceInputElement = document.getElementById("voiceInput");
  if (!voiceInputElement) {
    // 创建语音输入元素，位置与loadingMask一致
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

  // 更新显示文本
  voiceInputElement.textContent = text;

  // 如果文本为空，隐藏元素
  if (!text) {
    voiceInputElement.style.display = "none";
  } else {
    voiceInputElement.style.display = "block";
  }
}

// 语音识别功能
function initVoiceRecognition() {
  const speechBtn = document.getElementById("thumbCard");
  const viewportNav = document.getElementById("viewportNav");
  let recognition = null;
  let longPressTimer = null;
  let isListening = false;
  let isLongPress = false;

  console.log("初始化语音识别...");

  // 初始化语音识别实例
  function initRecognition() {
    if (!recognition) {
      if (
        "SpeechRecognition" in window ||
        "webkitSpeechRecognition" in window
      ) {
        recognition = new (
          window.SpeechRecognition || window.webkitSpeechRecognition
        )();
        recognition.lang = "zh-CN";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = async (event) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              // 最终结果
              console.log("语音输入:", transcript);
              isListening = false;
              // 延迟清空显示，让用户有时间看到最终结果
              setTimeout(() => {
                showVoiceInput("");
              }, 500);
              await processVoiceCommand(transcript);
            } else {
              // 中间结果，实时显示
              showVoiceInput(transcript);
            }
          }
        };

        recognition.onerror = (event) => {
          console.error("语音识别错误:", event.error);
          isListening = false;
          showVoiceInput("");
          showToast("语音识别失败，请重试");
        };

        recognition.onend = () => {
          isListening = false;
          // 延迟清空显示，让用户有时间看到最终结果
          setTimeout(() => {
            showVoiceInput("");
          }, 500);
        };

        console.log("语音识别初始化成功");
      } else {
        console.error("浏览器不支持语音识别");
        showToast("您的浏览器不支持语音识别");
      }
    }
  }

  // 长按处理
  speechBtn.addEventListener("mousedown", () => {
    isLongPress = false;
    longPressTimer = setTimeout(() => {
      isLongPress = true;
      if (!isListening) {
        initRecognition();
        if (recognition) {
          try {
            console.log("开始语音识别...");
            recognition.start();
            isListening = true;
            showVoiceInput(""); // 清空之前的显示
          } catch (error) {
            console.error("启动语音识别失败:", error);
            showToast("无法启动语音识别");
          }
        }
      }
    }, 500); // 500毫秒长按触发
  });

  // 鼠标释放处理
  speechBtn.addEventListener("mouseup", () => {
    clearTimeout(longPressTimer);
    if (isLongPress && isListening && recognition) {
      recognition.stop();
    }
  });

  // 鼠标离开处理
  speechBtn.addEventListener("mouseleave", () => {
    clearTimeout(longPressTimer);
    if (isLongPress && isListening && recognition) {
      recognition.stop();
    }
  });

  // 触摸设备支持
  speechBtn.addEventListener("touchstart", () => {
    isLongPress = false;
    longPressTimer = setTimeout(() => {
      isLongPress = true;
      if (!isListening) {
        initRecognition();
        if (recognition) {
          try {
            console.log("开始语音识别...");
            recognition.start();
            isListening = true;
            showVoiceInput(""); // 清空之前的显示
          } catch (error) {
            console.error("启动语音识别失败:", error);
            showToast("无法启动语音识别");
          }
        }
      }
    }, 500);
  });

  speechBtn.addEventListener("touchend", () => {
    clearTimeout(longPressTimer);
    if (isLongPress && isListening && recognition) {
      recognition.stop();
    }
  });

  // 单击处理：切换导航窗口
  speechBtn.addEventListener("click", () => {
    // 如果是长按触发的，不执行导航窗口切换
    if (!isLongPress) {
      if (viewportNav) {
        if (
          viewportNav.style.display === "none" ||
          viewportNav.style.display === ""
        ) {
          viewportNav.style.display = "block";
        } else {
          viewportNav.style.display = "none";
        }
      }
    }
  });
}

// 处理语音指令
async function processVoiceCommand(transcript) {
  // 取消"正在分析指令..."提醒，保持语音输入显示流畅

  try {
    // 检查本地存储中是否有HTML缓存
    let htmlContent = "";
    const cachedHtml = localStorage.getItem("cachedHtml");
    const cachedVersion = localStorage.getItem("cachedVersion");
    const currentVersion = "1.0.0"; // 可以根据实际版本号更新

    // 如果没有缓存或版本不匹配，重新获取HTML
    if (!cachedHtml || cachedVersion !== currentVersion) {
      htmlContent = document.documentElement.outerHTML;
      // 缓存HTML和版本号
      localStorage.setItem("cachedHtml", htmlContent);
      localStorage.setItem("cachedVersion", currentVersion);
    }

    // 获取历史记录
    let historyItems = [];
    try {
      // 检查是否存在fetchHistoryList函数
      if (typeof fetchHistoryList === "function") {
        historyItems = await fetchHistoryList();
      }
    } catch (error) {
      console.error("获取历史记录失败:", error);
    }

    // 调用DeepSeek API
    const response = await fetch("/.netlify/functions/deepseek", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    if (result.command) {
      executeCommand(result.command);
    } else {
      showToast("无法理解您的指令");
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
      document.getElementById("fileBtn").click();
      break;
    case "zoom":
      if (command.action === "in") {
        // 直接操作DOM来实现缩放
        const scaleInput = document.getElementById("scaleInput");
        if (scaleInput) {
          let currentScale = parseFloat(scaleInput.value) / 100;
          currentScale *= 1.2;
          scaleInput.value = (currentScale * 100).toFixed(1);
          // 触发缩放事件
          const event = new Event("change");
          scaleInput.dispatchEvent(event);
        }
      } else if (command.action === "out") {
        const scaleInput = document.getElementById("scaleInput");
        if (scaleInput) {
          let currentScale = parseFloat(scaleInput.value) / 100;
          currentScale /= 1.2;
          scaleInput.value = (currentScale * 100).toFixed(1);
          const event = new Event("change");
          scaleInput.dispatchEvent(event);
        }
      }
      break;
    case "reset":
      document.getElementById("resetBtn").click();
      break;
    case "fullscreen":
      document.getElementById("fullscreenBtn").click();
      break;
    case "history":
      document.getElementById("historyBtn").click();
      break;
    case "openHistory":
      // 打开历史记录中的文件
      if (
        typeof loadFromSupabase === "function" &&
        command.index !== undefined
      ) {
        // 先获取历史记录，然后加载指定索引的文件
        fetchHistoryList()
          .then((historyItems) => {
            if (historyItems && historyItems.length > command.index) {
              const item = historyItems[command.index];
              loadFromSupabase(item.storage_path, item.file_name);
            } else {
              showToast("历史记录中没有找到该文件");
            }
          })
          .catch((error) => {
            console.error("获取历史记录失败:", error);
            showToast("获取历史记录失败");
          });
      } else {
        showToast("无法打开历史文件");
      }
      break;
    default:
      showToast("不支持的指令");
  }
}

// 页面加载时初始化
window.addEventListener("load", initVoiceRecognition);
