exports.handler = async (event, context) => {
  try {
    const { transcript, html, isCacheValid, history } = JSON.parse(event.body);

    // 构建用户消息内容
    let userContent = `用户指令: ${transcript}`;

    // 只有当缓存无效时才包含HTML结构
    if (!isCacheValid && html) {
      userContent += `\n            HTML结构: ${html.substring(0, 5000)}`;
    }

    // 如果有历史记录，添加到用户消息中
    if (history && history.length > 0) {
      userContent += `\n            历史记录: ${JSON.stringify(history)}`;
    }

    // 调用DeepSeek API
    const deepseekResponse = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `你是一个PDF阅读器的语音助手，需要分析用户的语音指令并生成相应的操作命令。

# EasyPDF 技术文档

## 项目结构
- index.html: 主页面文件
- voice.js: 语音识别功能模块
- netlify/functions/deepseek.js: DeepSeek API调用函数

## UI元素

### 顶部工具栏按钮
- fileBtn: 打开文件按钮，位于左侧，功能是打开本地PDF文件
- scaleInput: 缩放输入框，位于中间，功能是调整PDF显示比例
- bestScaleBtn: 最佳缩放按钮，位于中间，功能是自动调整到最佳缩放比例
- resetBtn: 重置按钮，位于右侧，功能是重置PDF视图到初始状态
- fullscreenBtn: 全屏按钮，位于右侧，功能是切换全屏模式
- historyBtn: 历史记录按钮，位于右侧，功能是显示历史文件列表

### 左侧工具栏按钮
- thumbCard: 语音按钮，位于底部，长按触发语音识别，单击切换导航窗口

### 其他UI元素
- viewportNav: 导航窗口，位于右下角，显示PDF缩略图和当前视图位置
- historyMenu: 历史记录菜单，位于历史按钮下方，显示历史文件列表
- loadingMask: 加载遮罩，位于中央，显示加载状态

## 支持的指令类型
- open: 打开文件，目标按钮是fileBtn
- zoom: 缩放PDF，目标元素是scaleInput，支持in/out动作
- reset: 重置视图，目标按钮是resetBtn
- fullscreen: 切换全屏，目标按钮是fullscreenBtn
- history: 显示历史记录，目标按钮是historyBtn
- openHistory: 打开历史记录中的文件，需要指定文件索引

## 按钮关联关系
- 文件操作组: fileBtn → fileInput → loadPDF() → renderPDF()
- 视图控制组: scaleInput → updateScale() → refreshRender()
- 语音控制组: thumbCard(长按) → initVoiceRecognition() → processVoiceCommand() → executeCommand()

## 语音指令映射
- 打开文件: 点击fileBtn
- 放大: 增加scaleInput值
- 缩小: 减小scaleInput值
- 最佳缩放: 点击bestScaleBtn
- 重置视图: 点击resetBtn
- 全屏: 点击fullscreenBtn
- 查看历史记录: 点击historyBtn
- 打开第一个历史文件: 调用loadFromSupabase()加载第一个历史文件

请根据用户指令和技术文档，生成准确的操作命令。

请返回JSON格式的指令，例如：
{
  "command": {
    "type": "zoom",
    "action": "in"
  }
}
{
  "command": {
    "type": "openHistory",
    "index": 0
  }
}`,

            },
            {
              role: "user",
              content: userContent,
            },
          ],
          temperature: 0.3,
        }),
      },
    );

    const deepseekResult = await deepseekResponse.json();
    const content = deepseekResult.choices[0].message.content;

    // 解析DeepSeek的响应
    const commandMatch = content.match(/\{.*\}/s);
    if (commandMatch) {
      const command = JSON.parse(commandMatch[0]);
      return {
        statusCode: 200,
        body: JSON.stringify(command),
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ command: null }),
      };
    }
  } catch (error) {
    console.error("DeepSeek API调用失败:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "处理失败" }),
    };
  }
};
