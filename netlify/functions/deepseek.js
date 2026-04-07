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
    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是一个PDF阅读器的语音助手，需要分析用户的语音指令并生成相应的操作命令。
            分析HTML结构，识别可用的功能按钮和操作。
            可能的指令类型包括：
            - open: 打开文件
            - zoom: 缩放（in/out）
            - reset: 重置视图
            - fullscreen: 全屏
            - history: 历史记录
            - openHistory: 打开历史记录中的文件（需要指定文件索引或名称）
            
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
            }`
          },
          {
            role: 'user',
            content: userContent
          }
        ],
        temperature: 0.3
      })
    });
    
    const deepseekResult = await deepseekResponse.json();
    const content = deepseekResult.choices[0].message.content;
    
    // 解析DeepSeek的响应
    const commandMatch = content.match(/\{.*\}/s);
    if (commandMatch) {
      const command = JSON.parse(commandMatch[0]);
      return {
        statusCode: 200,
        body: JSON.stringify(command)
      };
    } else {
      return {
        statusCode: 200,
        body: JSON.stringify({ command: null })
      };
    }
  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '处理失败' })
    };
  }
};