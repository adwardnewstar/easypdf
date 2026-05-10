const http = require("http");
const fs = require("fs");
const path = require("path");
const {
  BasicCredential,
} = require("tencentcloud-sdk-nodejs/tencentcloud/common/credential");
const { Client } =
  require("tencentcloud-sdk-nodejs/tencentcloud/services/asr/v20190614").v20190614;

const PORT = 3000;

// 环境变量
const TENCENT_APP_ID = process.env.TENCENT_APP_ID || "1429591060";
const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID || "";
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY || "";
const NETSEEK_API_KEY = process.env.NETSEEK_API_KEY || "";

// 系统提示词（整合技术文档）
const SYSTEM_PROMPT = `你是用户的智能管家，负责理解用户的语音指令并执行相应的操作。你的目标是像真人管家一样理解用户的意图，而不是机械地匹配指令。

# 核心原则
1. **理解语义而非字面**：用户说"放大至50%"意思是"设置为50%"，不是"增加50%"
2. **消除歧义**：当用户说"放大"时，结合上下文判断是"放大一点"还是"放大到某个值"
3. **智能纠错**：如果用户说反了（如当前100%却说"放大至50%"），理解用户的真实意图是"缩小到50%"

# EasyPDF 功能手册

## 缩放操作（重要语义区分）
- 当前缩放值：parseInt(document.getElementById("scaleInput")?.textContent) || 100
- "放大"：增加缩放值
- "缩小"：减少缩放值
- "放大至X%"或"缩放至X%"：直接设置为目标值X%（绝对模式）
- "放大X%"或"缩小X%"：在当前基础上增加或减少X个百分点（相对模式）
- "放大X倍"：设置为 X * 100%
- 缩放范围：25% - 400%

## 移动操作（坐标系）
- 坐标系有4个方向：红色(X轴正/右)、蓝色(X轴负/左)、绿色(Y轴负/上)、黄色(Y轴正/下)
- "沿X方向挪动N格"：沿指定颜色方向移动N个网格
- 网格大小：基于屏幕高度的1/29

## 文件操作
- 打开文件：点击fileBtn按钮
- 历史记录：点击historyBtn按钮
- 打开历史文件：调用loadFromSupabase(storage_path, file_name)

## 其他操作
- 坐标系开关：toggleCoordinateSystem()函数
- 重置视图：点击resetBtn
- 全屏切换：click fullscreenBtn

# 指令格式要求

## 必须返回JSON格式：
{
  "command": {
    "type": "操作类型",
    ...其他参数
  }
}

## 操作类型详解：

### 1. zoom（缩放）
- 绝对模式（设置到指定值）：
  {"type":"zoom","action":"in","value":50,"mode":"absolute"}
  → 含义：设置为50%（无论当前是多少）

- 相对模式（增加或减少）：
  {"type":"zoom","action":"in","value":10,"mode":"relative"}
  → 含义：当前值+10%

- 倍数模式：
  {"type":"zoom","action":"in","value":2,"mode":"multiple"}
  → 含义：设置为200%

### 2. move（移动）
{"type":"move","axis":"x","directionValue":1,"distance":1}
- axis: "x"（红色/蓝色方向）或 "y"（绿色/黄色方向）
- directionValue: 1（正方向）或 -1（负方向）
- distance: 网格数量（数字）

### 3. open（打开文件）
{"type":"open"}
- 点击fileBtn按钮

### 4. openHistory（打开历史）
{"type":"openHistory","index":N} - 直接打开历史列表中第N+1个文件（index从0开始）
{"type":"openHistory"} - 无index参数时，点击历史按钮展开列表

语义理解：
- "打开历史文档"、"打开历史文件" → {"type":"openHistory"}
- "打开第一个"、"第一个" → {"type":"openHistory","index":0}
- "打开第二个"、"第二个" → {"type":"openHistory","index":1}
- "打开第三个"、"第三个" → {"type":"openHistory","index":2}
- "打开第四个"、"第四个" → {"type":"openHistory","index":3}
- "打开历史文件第一个" → {"type":"openHistory","index":0}
- "打开历史文档第二个" → {"type":"openHistory","index":1}
- "历史记录第三个" → {"type":"openHistory","index":2}

### 5. coordinate（坐标系）
{"type":"coordinate"}
- 调用toggleCoordinateSystem()

### 6. reset（全屏、重置等）
{"type":"reset"} 或 {"type":"fullscreen"} 等

# 语义理解示例

| 用户指令 | 正确理解 | 返回命令 |
|---------|---------|---------|
| "放大至50%" | 设置为50% | {"type":"zoom","action":"in","value":50,"mode":"absolute"} |
| "当前200%，放大至150%" | 减少到150% | {"type":"zoom","action":"out","value":50,"mode":"absolute"} |
| "放大10%" | 增加10% | {"type":"zoom","action":"in","value":10,"mode":"relative"} |
| "缩小一倍" | 设置为50% | {"type":"zoom","action":"out","value":50,"mode":"absolute"} |
| "沿红色方向挪动2格" | 向右移动2格 | {"type":"move","axis":"x","directionValue":1,"distance":2} |
| "沿蓝色方向挪动" | 向左移动1格 | {"type":"move","axis":"x","directionValue":-1,"distance":1} |

请理解用户的真实意图，返回对应的操作命令。`;

// 创建服务器
const server = http.createServer(async (req, res) => {
  let pathname = req.url.split("?")[0];

  // CORS头
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // 预检请求
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  // 腾讯云ASR代理
  if (pathname === "/.netlify/functions/tencent-asr") {
    await handleASRRequest(req, res);
    return;
  }

  // DeepSeek代理
  if (pathname === "/.netlify/functions/deepseek") {
    await handleDeepseekRequest(req, res);
    return;
  }

  // 静态文件服务
  serveStaticFile(pathname, res);
});

// 处理ASR请求
async function handleASRRequest(req, res) {
  try {
    const body = await parseRequestBody(req);
    const { action, audioData } = body;

    if (action !== "recognize") {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "无效的 action" }));
      return;
    }

    // 验证配置
    if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "腾讯云密钥未配置" }));
      return;
    }

    // 创建腾讯云ASR客户端
    const credential = new BasicCredential(
      TENCENT_SECRET_ID,
      TENCENT_SECRET_KEY,
    );
    const client = new Client({
      credential: credential,
      region: "ap-beijing",
    });

    // 构建请求参数
    const params = {
      ProjectId: 0,
      SubServiceType: 2,
      EngSerViceType: "16k_zh",
      SourceType: 1,
      VoiceFormat: "pcm",
      UsrAudioKey: "voice_" + Date.now(),
      Data: audioData,
      DataLen: Buffer.from(audioData, "base64").length,
    };

    console.log("=== 腾讯云ASR请求 ===");
    console.log("参数:", {
      EngSerViceType: params.EngSerViceType,
      VoiceFormat: params.VoiceFormat,
      DataLen: params.DataLen,
      UsrAudioKey: params.UsrAudioKey,
    });

    // 调用API
    const response = await client.SentenceRecognition(params);

    console.log("=== 腾讯云ASR响应 ===");
    console.log("完整响应:", JSON.stringify(response, null, 2));
    console.log("响应类型:", typeof response);
    console.log("响应键:", Object.keys(response || {}));

    // 处理响应格式（腾讯云ASR直接返回Result字段）
    let result = null;
    if (response && response.Result) {
      result = response.Result;
    } else if (response && response.response && response.response.Result) {
      result = response.response.Result;
    } else if (response && response.Response && response.Response.Result) {
      result = response.Response.Result;
    } else if (response && response.result) {
      result = response.result;
    }

    if (result) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ result: result }));
    } else {
      // 如果没有识别结果（静音或无语音），返回空结果而不是错误
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ result: "" }));
    }
  } catch (error) {
    console.error("ASR处理失败:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "服务器错误: " + error.message }));
  }
}

// 处理DeepSeek请求
async function handleDeepseekRequest(req, res) {
  try {
    const body = await parseRequestBody(req);
    const { transcript, html, isCacheValid, history } = body;

    console.log("=== DeepSeek请求 ===");
    console.log("语音识别结果:", transcript);

    // 如果没有配置DeepSeek API密钥，使用简单的规则匹配
    if (!NETSEEK_API_KEY) {
      console.log("未配置DeepSeek API密钥，使用本地规则匹配");
      const command = simpleCommandMatch(transcript);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(command));
      return;
    }

    // 构建用户内容（不再发送HTML，只发送必要信息）
    let userContent = `用户指令: ${transcript}`;
    if (history && history.length > 0) {
      userContent += `\n历史记录: ${JSON.stringify(history)}`;
    }

    console.log("发送给DeepSeek的内容:", userContent);

    const deepseekResponse = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NETSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT, // 使用预定义的系统提示词
            },
            { role: "user", content: userContent },
          ],
          temperature: 0.3,
        }),
      },
    );

    // 检查HTTP状态码
    if (!deepseekResponse.ok) {
      console.error(
        "DeepSeek HTTP错误:",
        deepseekResponse.status,
        deepseekResponse.statusText,
      );
      // 回退到本地规则匹配
      const command = simpleCommandMatch(transcript);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(command));
      return;
    }

    // 尝试解析响应
    let deepseekResult;
    try {
      deepseekResult = await deepseekResponse.json();
    } catch (jsonError) {
      console.error("DeepSeek响应不是有效JSON:", jsonError.message);
      // 回退到本地规则匹配
      const command = simpleCommandMatch(transcript);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(command));
      return;
    }

    console.log("DeepSeek响应:", JSON.stringify(deepseekResult, null, 2));

    if (deepseekResult.choices && deepseekResult.choices[0]) {
      const content = deepseekResult.choices[0].message.content;
      const commandMatch = content.match(/\{.*\}/s);
      if (commandMatch) {
        try {
          const command = JSON.parse(commandMatch[0]);
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(command));
          return;
        } catch (parseError) {
          console.error("解析DeepSeek响应失败:", parseError.message);
        }
      }
    }

    // 如果DeepSeek返回空或无效结果，回退到本地规则匹配
    console.log("DeepSeek返回无效结果，使用本地规则匹配");
    const command = simpleCommandMatch(transcript);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(command));
  } catch (error) {
    console.error("DeepSeek处理失败:", error);
    // 任何错误都回退到本地规则匹配
    const command = simpleCommandMatch(body?.transcript || "");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(command));
  }
}

// 简单的本地指令匹配（作为DeepSeek的回退）
function simpleCommandMatch(transcript) {
  if (!transcript) return { command: null };

  const lowerTranscript = transcript.toLowerCase();

  // 打开文件
  if (
    lowerTranscript.includes("打开") ||
    lowerTranscript.includes("选择") ||
    lowerTranscript.includes("文件") ||
    lowerTranscript.includes("上传")
  ) {
    return { command: { type: "open" } };
  }

  // 放大
  if (
    lowerTranscript.includes("放大") ||
    lowerTranscript.includes("变大") ||
    lowerTranscript.includes("zoom in") ||
    lowerTranscript.includes("放大一点")
  ) {
    return { command: { type: "zoom", action: "in" } };
  }

  // 缩小
  if (
    lowerTranscript.includes("缩小") ||
    lowerTranscript.includes("变小") ||
    lowerTranscript.includes("zoom out") ||
    lowerTranscript.includes("缩小一点")
  ) {
    return { command: { type: "zoom", action: "out" } };
  }

  // 重置
  if (
    lowerTranscript.includes("重置") ||
    lowerTranscript.includes("恢复") ||
    lowerTranscript.includes("还原")
  ) {
    return { command: { type: "reset" } };
  }

  // 全屏
  if (
    lowerTranscript.includes("全屏") ||
    lowerTranscript.includes("全屏模式")
  ) {
    return { command: { type: "fullscreen" } };
  }

  // 历史记录
  if (lowerTranscript.includes("历史") || lowerTranscript.includes("记录")) {
    return { command: { type: "history" } };
  }

  return { command: null };
}

// 解析请求体
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

// 静态文件服务
function serveStaticFile(pathname, res) {
  let filePath = "." + pathname;
  if (filePath === "./") {
    filePath = "./index.html";
  }

  const extname = path.extname(filePath);
  let contentType = "text/html";

  switch (extname) {
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
      contentType = "image/jpeg";
      break;
    case ".svg":
      contentType = "image/svg+xml";
      break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
        res.writeHead(404);
        res.end("File not found");
      } else {
        res.writeHead(500);
        res.end("Server Error: " + error.code);
      }
    } else {
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
}

// 启动服务器
server.listen(PORT, () => {
  console.log(`测试服务器运行在 http://localhost:${PORT}`);
  console.log("环境变量状态:");
  console.log("- TENCENT_APP_ID:", TENCENT_APP_ID ? "已配置" : "未配置");
  console.log("- TENCENT_SECRET_ID:", TENCENT_SECRET_ID ? "已配置" : "未配置");
  console.log(
    "- TENCENT_SECRET_KEY:",
    TENCENT_SECRET_KEY ? "已配置" : "未配置",
  );
  console.log("- NETSEEK_API_KEY:", NETSEEK_API_KEY ? "已配置" : "未配置");
});
