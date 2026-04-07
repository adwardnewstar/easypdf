// 显示提示信息
function showToast(message) {
  // 创建提示元素
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  // 添加到页面
  document.body.appendChild(toast);
  
  // 2秒后自动移除
  setTimeout(() => {
    toast.remove();
  }, 2000);
}

// 显示加载状态
function showLoading(show, msg = '加载中...') {
  const loadingMask = document.getElementById('loadingMask');
  if (loadingMask) {
    if (show) {
      loadingMask.textContent = msg;
      loadingMask.style.display = 'flex';
    } else {
      loadingMask.style.display = 'none';
    }
  }
}

// 语音识别功能
function initVoiceRecognition() {
  const speechBtn = document.getElementById('thumbCard');
  const viewportNav = document.getElementById('viewportNav');
  let recognition = null;
  let longPressTimer = null;
  let isListening = false;
  
  console.log('初始化语音识别...');
  
  // 初始化语音识别实例
  function initRecognition() {
    if (!recognition) {
      if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'zh-CN';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = async (event) => {
          const transcript = event.results[0][0].transcript;
          console.log('语音输入:', transcript);
          isListening = false;
          await processVoiceCommand(transcript);
        };
        
        recognition.onerror = (event) => {
          console.error('语音识别错误:', event.error);
          isListening = false;
          showToast('语音识别失败，请重试');
        };
        
        recognition.onend = () => {
          isListening = false;
        };
        
        console.log('语音识别初始化成功');
      } else {
        console.error('浏览器不支持语音识别');
        showToast('您的浏览器不支持语音识别');
      }
    }
  }
  
  // 长按处理
  speechBtn.addEventListener('mousedown', () => {
    longPressTimer = setTimeout(() => {
      if (!isListening) {
        initRecognition();
        if (recognition) {
          try {
            console.log('开始语音识别...');
            recognition.start();
            isListening = true;
            showToast('请说出您的指令...');
          } catch (error) {
            console.error('启动语音识别失败:', error);
            showToast('无法启动语音识别');
          }
        }
      }
    }, 500); // 500毫秒长按触发
  });
  
  // 鼠标释放处理
  speechBtn.addEventListener('mouseup', () => {
    clearTimeout(longPressTimer);
  });
  
  // 鼠标离开处理
  speechBtn.addEventListener('mouseleave', () => {
    clearTimeout(longPressTimer);
  });
  
  // 触摸设备支持
  speechBtn.addEventListener('touchstart', () => {
    longPressTimer = setTimeout(() => {
      if (!isListening) {
        initRecognition();
        if (recognition) {
          try {
            console.log('开始语音识别...');
            recognition.start();
            isListening = true;
            showToast('请说出您的指令...');
          } catch (error) {
            console.error('启动语音识别失败:', error);
            showToast('无法启动语音识别');
          }
        }
      }
    }, 500);
  });
  
  speechBtn.addEventListener('touchend', () => {
    clearTimeout(longPressTimer);
  });
  
  // 单击处理：切换导航窗口
  speechBtn.addEventListener('click', () => {
    if (viewportNav) {
      if (viewportNav.style.display === 'none' || viewportNav.style.display === '') {
        viewportNav.style.display = 'block';
      } else {
        viewportNav.style.display = 'none';
      }
    }
  });
}

// 处理语音指令
async function processVoiceCommand(transcript) {
  showLoading(true, '正在分析指令...');
  
  try {
    // 调用DeepSeek API
    const response = await fetch('/.netlify/functions/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript: transcript,
        html: document.documentElement.outerHTML
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.command) {
      executeCommand(result.command);
    } else {
      showToast('无法理解您的指令');
    }
  } catch (error) {
    console.error('处理指令失败:', error);
    showToast('处理指令失败，请重试');
  } finally {
    showLoading(false);
  }
}

// 执行指令
function executeCommand(command) {
  switch (command.type) {
    case 'open':
      document.getElementById('fileBtn').click();
      break;
    case 'zoom':
      if (command.action === 'in') {
        // 直接操作DOM来实现缩放
        const scaleInput = document.getElementById('scaleInput');
        if (scaleInput) {
          let currentScale = parseFloat(scaleInput.value) / 100;
          currentScale *= 1.2;
          scaleInput.value = (currentScale * 100).toFixed(1);
          // 触发缩放事件
          const event = new Event('change');
          scaleInput.dispatchEvent(event);
        }
      } else if (command.action === 'out') {
        const scaleInput = document.getElementById('scaleInput');
        if (scaleInput) {
          let currentScale = parseFloat(scaleInput.value) / 100;
          currentScale /= 1.2;
          scaleInput.value = (currentScale * 100).toFixed(1);
          const event = new Event('change');
          scaleInput.dispatchEvent(event);
        }
      }
      break;
    case 'reset':
      document.getElementById('resetBtn').click();
      break;
    case 'fullscreen':
      document.getElementById('fullscreenBtn').click();
      break;
    case 'history':
      document.getElementById('historyBtn').click();
      break;
    default:
      showToast('不支持的指令');
  }
}

// 页面加载时初始化
window.addEventListener('load', initVoiceRecognition);