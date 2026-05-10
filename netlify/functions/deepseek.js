const fs = require("fs");
const path = require("path");

exports.handler = async (event, context) => {
  try {
    // 解析请求体，处理可能的格式问题
    let body;
    if (typeof event.body === "string") {
      body = JSON.parse(event.body);
    } else if (typeof event.body === "object") {
      body = event.body;
    } else {
      throw new Error("Invalid request body");
    }

    const { transcript, html, isCacheValid, history } = body;

    // ============ 分级理解策略 ============
    // 第一级：仅使用知识库进行快速匹配
    // 第二级：当第一级无法匹配时，结合HTML代码进行深度理解

    // 从外部文件加载知识库
    const knowledgeBasePath = path.join(__dirname, "knowledge-base.md");
    let knowledgeBase;
    try {
      knowledgeBase = fs.readFileSync(knowledgeBasePath, "utf-8");
      console.log("[知识库] 成功加载:", knowledgeBasePath);
    } catch (err) {
      console.error("[知识库] 加载失败，使用默认知识库:", err);
      // 如果加载失败，使用内置默认知识库
      knowledgeBase = `# EasyPDF 功能知识库

## 核心操作指令

### 缩放操作
- "放大"：增加10%
- "缩小"：减少10%
- "放大至X%"：设置为X%（绝对模式）
- "缩小至X%"：设置为X%（绝对模式）
- "放大X%"：当前值+X%（相对模式）
- "缩小X%"：当前值-X%（相对模式）
- "放大X倍"：设置为X*100%（倍数模式）
- "缩小到X分之一"：设置为(1/X)*100%（倍数模式）
- 范围：25%-400%

### 移动操作
- "向上"、"向下"、"向左"、"向右"：移动1格（小网格）
- "向上移动一格"、"向下移动一格"、"向左移动一格"、"向右移动一格"：移动1格（小网格）
- "向上移动一个大网格"、"向下移动一个大网格"、"向左移动一个大网格"、"向右移动一个大网格"：移动4格（大网格=4个小网格）
- "沿红色方向"：向右移动1格
- "沿蓝色方向"：向左移动1格
- "沿绿色方向"：向上移动1格
- "沿黄色方向"：向下移动1格
- "沿红色方向挪动N格"：向右移动N格
- "挪动N格"：移动N个小网格

### 文件操作
- "打开文件"、"选择文件"：打开文件选择器
- "历史记录"、"打开历史"：显示历史列表
- "打开第一个"：打开历史第一个文件

### 视图操作
- "重置"、"重置视图"：恢复默认视图
- "全屏"、"进入全屏"：切换全屏模式
- "坐标系"、"网格"：切换坐标系显示

## 指令类型
zoom: 缩放, move: 移动, open: 打开文件, openHistory: 打开历史, 
coordinate: 坐标系, reset: 重置, fullscreen: 全屏`;
    }

    // 调用DeepSeek API的通用函数
    async function callDeepSeek(systemContent, userContent) {
      const response = await fetch(
        "https://api.deepseek.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NETSEEK_API_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemContent },
              { role: "user", content: userContent },
            ],
            temperature: 0.3,
          }),
        },
      );
      const result = await response.json();
      return result.choices[0].message.content;
    }

    // 解析命令响应
    function parseCommand(content) {
      const commandMatch = content.match(/\{.*\}/s);
      if (commandMatch) {
        try {
          const command = JSON.parse(commandMatch[0]);
          // 验证是否为有效命令
          if (command.command && command.command.type) {
            return command;
          }
        } catch (e) {
          console.error("命令解析失败:", e);
        }
      }
      return null;
    }

    // ============ 第一级：快速知识库匹配 ============
    console.log("[分级理解] 第一级：使用知识库快速匹配");

    const firstLevelSystem = `你是EasyPDF的智能指令解析器。根据知识库理解用户指令并输出JSON命令。

知识库：
${knowledgeBase}

返回格式要求：
{"command":{"type":"操作类型",...参数}}

如果无法理解或无法匹配任何指令，返回：{"command":null}

操作类型列表：zoom, move, open, openHistory, coordinate, reset, fullscreen`;

    const firstLevelUser = `用户指令: ${transcript}`;
    const firstLevelResponse = await callDeepSeek(
      firstLevelSystem,
      firstLevelUser,
    );
    const firstLevelCommand = parseCommand(firstLevelResponse);

    // 如果第一级成功匹配到命令，直接返回
    if (
      firstLevelCommand &&
      firstLevelCommand.command &&
      firstLevelCommand.command.type !== null
    ) {
      console.log("[分级理解] 第一级匹配成功:", firstLevelCommand);
      return {
        statusCode: 200,
        body: JSON.stringify(firstLevelCommand),
      };
    }

    // ============ 第二级：深度代码分析 ============
    console.log("[分级理解] 第一级无法匹配，进入第二级：深度代码分析");

    let secondLevelUser = `用户指令: ${transcript}`;

    // 添加HTML代码进行深度分析
    if (html) {
      secondLevelUser += `\n\nHTML代码结构: ${html.substring(0, 5000)}`;
    }

    // 添加历史记录
    if (history && history.length > 0) {
      secondLevelUser += `\n\n历史记录: ${JSON.stringify(history)}`;
    }

    const secondLevelSystem = `你是用户的智能管家，负责理解用户的语音指令并执行相应的操作。

# 核心原则
1. **理解语义而非字面**：用户说"放大至50%"意思是"设置为50%"，不是"增加50%"
2. **消除歧义**：当用户说"放大"时，结合上下文判断意图
3. **智能纠错**：理解用户的真实意图

# EasyPDF 功能手册

## 缩放操作
- 当前缩放值：parseInt(document.getElementById("scaleInput")?.textContent) || 100
- "放大至X%"：设置为X%（绝对模式，mode="absolute"）
- "放大X%"：当前值+X%（相对模式，mode="relative"）
- "放大X倍"：设置为当前比例×(X+1)（倍数模式，mode="multiple"）
- "缩小到X分之一"：设置为当前比例÷X（倍数模式，mode="multiple"）
- 范围：25% - 400%

## 移动操作
- 坐标系：红色(X轴正/右)、蓝色(X轴负/左)、绿色(Y轴负/上)、黄色(Y轴正/下)
- 网格大小：屏幕高度的1/29
- 小网格：移动1格（基础单位）
- 大网格：移动4格（一个大网格=4个小网格）
- "挪动N格"：N是具体数字（如1、2、3、4等），移动N个小网格
- "移动N个大网格"：移动N×4个小网格

## 文件操作
- 打开文件：点击fileBtn
- 历史记录：点击historyBtn
- 打开历史文件：loadFromSupabase(storage_path, file_name)

## 其他操作
- 坐标系：toggleCoordinateSystem()
- 重置：点击resetBtn
- 全屏：点击fullscreenBtn

# 指令格式
{"command":{"type":"操作类型",...参数}}

操作类型：
- zoom: {"type":"zoom","action":"in/out","value":数字,"mode":"absolute/relative"}
  - absolute模式：设置为指定百分比（如"放大至50%"、"放大2倍"）
  - relative模式：在当前值基础上增减（如"放大10%"）
- move: {"type":"move","axis":"x/y","directionValue":1/-1,"distance":数字}
  - axis: "x"表示水平方向，"y"表示垂直方向
  - directionValue: 1表示正方向，-1表示负方向
  - distance: 移动的网格数（大网格=4，小网格=1）
- open: {"type":"open"}
- openHistory: {"type":"openHistory","index":N} 或 {"type":"openHistory"}
- coordinate: {"type":"coordinate"}
- reset: {"type":"reset"}
- fullscreen: {"type":"fullscreen"}

# 语义示例
| 用户指令 | 返回命令 |
|---------|---------|
| "放大至50%" | {"type":"zoom","action":"in","value":50,"mode":"absolute"} |
| "放大10%" | {"type":"zoom","action":"in","value":10,"mode":"relative"} |
| "放大2倍" | {"type":"zoom","action":"in","value":2,"mode":"multiple"} |
| "放大3倍" | {"type":"zoom","action":"in","value":3,"mode":"multiple"} |
| "缩小到2分之一" | {"type":"zoom","action":"out","value":2,"mode":"multiple"} |
| "向上移动一个大网格" | {"type":"move","axis":"y","directionValue":-1,"distance":4} |
| "向下移动一个大网格" | {"type":"move","axis":"y","directionValue":1,"distance":4} |
| "向左移动一个大网格" | {"type":"move","axis":"x","directionValue":-1,"distance":4} |
| "向右移动一个大网格" | {"type":"move","axis":"x","directionValue":1,"distance":4} |
| "向上移动一格" | {"type":"move","axis":"y","directionValue":-1,"distance":1} |
| "向下移动一格" | {"type":"move","axis":"y","directionValue":1,"distance":1} |
| "向左移动一格" | {"type":"move","axis":"x","directionValue":-1,"distance":1} |
| "向右移动一格" | {"type":"move","axis":"x","directionValue":1,"distance":1} |
| "向上移动两个大网格" | {"type":"move","axis":"y","directionValue":-1,"distance":8} |
| "向右移动3格" | {"type":"move","axis":"x","directionValue":1,"distance":3} |
| "向左移动2格" | {"type":"move","axis":"x","directionValue":-1,"distance":2} |
| "向上移动5格" | {"type":"move","axis":"y","directionValue":-1,"distance":5} |
| "向下移动6格" | {"type":"move","axis":"y","directionValue":1,"distance":6} |
| "沿红色方向移动4格" | {"type":"move","axis":"x","directionValue":1,"distance":4} |
| "沿蓝色方向移动2格" | {"type":"move","axis":"x","directionValue":-1,"distance":2} |
| "沿绿色方向移动3格" | {"type":"move","axis":"y","directionValue":-1,"distance":3} |
| "沿黄色方向移动5格" | {"type":"move","axis":"y","directionValue":1,"distance":5} |

如果无法理解指令，返回：{"command":null}`;

    const secondLevelResponse = await callDeepSeek(
      secondLevelSystem,
      secondLevelUser,
    );
    const secondLevelCommand = parseCommand(secondLevelResponse);

    console.log("[分级理解] 第二级分析结果:", secondLevelCommand);

    return {
      statusCode: 200,
      body: JSON.stringify(secondLevelCommand || { command: null }),
    };
  } catch (error) {
    console.error("DeepSeek API调用失败:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "处理失败" }),
    };
  }
};
