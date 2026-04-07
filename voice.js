// 语音识别功能
function initVoiceRecognition() {
  const speechBtn = document.getElementById('thumbCard');
  let recognition = null;
  
  // 检查浏览器支持
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('语音输入:', transcript);
      await processVoiceCommand(transcript);
    };
    
    recognition.onerror = (event) => {
      console.error('语音识别错误:', event.error);
      showToast('语音识别失败，请重试');
    };
    
    speechBtn.addEventListener('click', () => {
      try {
        recognition.start();
        showToast('请说出您的指令...');
      } catch (error) {
        console.error('启动语音识别失败:', error);
        showToast('无法启动语音识别');
      }
    });
  } else {
    console.error('浏览器不支持语音识别');
    showToast('您的浏览器不支持语音识别');
  }
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
        scale *= 1.2;
        refreshRender();
      } else if (command.action === 'out') {
        scale /= 1.2;
        refreshRender();
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