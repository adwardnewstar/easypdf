const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const { createClient } = require("@supabase/supabase-js");

const PORT = process.env.PORT || 8000;

// Supabase 配置（从环境变量获取）
const SUPABASE_URL = process.env.SUPABASE_URL || "https://zwnluqynchoidpiittdp.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 创建HTTP服务器
const server = http.createServer(async (req, res) => {
  let pathname = req.url.split("?")[0];

  console.log("收到请求:", req.url, "pathname:", pathname);

  // API端点处理
  if (pathname === "/api/history") {
    try {
      const { data, error } = await supabase
        .from("pdf_history")
        .select("file_name, storage_path")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        throw error;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data || []));
      return;
    } catch (err) {
      console.error("获取历史失败:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "获取历史失败" }));
      return;
    }
  }

  // 下载文件API
  if (pathname === "/api/download") {
    try {
      console.log("处理下载请求:", req.url);

      // 解析URL参数
      const urlParts = req.url.split("?");
      const queryString = urlParts[1] || "";
      const params = new URLSearchParams(queryString);
      const filePath = params.get("path");

      console.log("文件路径参数:", filePath);

      if (!filePath) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "缺少文件路径参数" }));
        return;
      }

      // URL解码路径
      const decodedPath = decodeURIComponent(filePath);
      console.log("解码后的路径:", decodedPath);

      const { data, error } = await supabase.storage
        .from("PDFs")
        .download(decodedPath);

      if (error) {
        console.error("Supabase下载错误:", error);
        throw error;
      }

      const buffer = await data.arrayBuffer();

      res.writeHead(200, {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(path.basename(decodedPath))}"`,
        "Content-Length": buffer.byteLength,
      });
      res.end(Buffer.from(buffer));
      return;
    } catch (err) {
      console.error("下载文件失败:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "下载文件失败" }));
      return;
    }
  }

  let filePath = "." + pathname;

  if (filePath === "./") {
    filePath = "./index.html";
  }

  let extname = path.extname(filePath);
  if (!extname) {
    filePath += ".html";
    extname = ".html";
  }

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
});

// 创建WebSocket服务器（增加消息大小限制，支持大图片传输）
const wss = new WebSocket.Server({
  server,
  maxPayload: 10 * 1024 * 1024, // 10MB
});

// 存储连接的客户端
const clients = {};

// 存储各session的登录状态
const loginStatus = {};

wss.on("connection", (ws, req) => {
  console.log(`新连接尝试: ${req.url}`);

  // 正确解析URL中的查询字符串
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const sessionId = url.searchParams.get("session");
  const type = url.searchParams.get("type"); // 'main' 或 'controller'
  const windowId = url.searchParams.get("window"); // 窗口ID，用于多屏幕

  console.log(
    `解析参数 - session: ${sessionId}, type: ${type}, windowId: ${windowId}`,
  );

  if (!sessionId) {
    console.log("关闭连接: 缺少session参数");
    ws.close(1008, "缺少session参数");
    return;
  }

  if (!type) {
    console.log("关闭连接: 缺少type参数");
    ws.close(1008, "缺少type参数");
    return;
  }

  // 初始化session - 支持多屏幕
  if (!clients[sessionId]) {
    clients[sessionId] = { mains: [], controller: null };
  }

  // 存储客户端连接
  if (type === "main") {
    // 将窗口ID存储到ws对象上
    ws.windowId = windowId || "main";

    // 添加到主页面列表
    clients[sessionId].mains.push(ws);
    console.log(
      `主页面已连接: ${sessionId}, windowId: ${windowId}, 总屏幕数: ${clients[sessionId].mains.length}`,
    );

    // 主动发送当前登录状态给新连接的主页面
    const currentLoginStatus = loginStatus[sessionId] || false;
    console.log(
      `[登录同步] 主页面连接，主动发送当前登录状态: ${currentLoginStatus}`,
    );
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "loginStatus",
          isLoggedIn: currentLoginStatus,
        }),
      );
    }
  } else if (type === "controller") {
    // 如果已有手柄连接，先关闭旧连接
    if (clients[sessionId].controller) {
      clients[sessionId].controller.close(1001, "新的手柄连接");
    }
    clients[sessionId].controller = ws;
    console.log(`手柄已连接: ${sessionId}`);

    // 如果主页面已连接，通知双方
    if (clients[sessionId].mains.length > 0) {
      // 通知所有主页面
      clients[sessionId].mains.forEach((mainWs) => {
        mainWs.send(
          JSON.stringify({
            type: "controllerConnected",
            message: "手柄已连接",
          }),
        );
      });
      clients[sessionId].controller.send(
        JSON.stringify({
          type: "connected",
          message: "已连接到主页面",
        }),
      );
    }
  }

  // 监听消息
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log(`收到消息: ${sessionId} - ${data.type}`);

      // 登录状态消息处理
      if (data.type === "loginStatus") {
        console.log(`[登录同步] 收到登录状态消息: ${data.isLoggedIn}`);
        console.log(`[登录同步] 发送方类型: ${type}`);
        // 更新服务器端存储的登录状态
        loginStatus[sessionId] = data.isLoggedIn;

        // 广播到所有连接的客户端
        console.log(`[登录同步] 广播登录状态到所有客户端: ${data.isLoggedIn}`);
        console.log(
          `[登录同步] 主页面数量: ${clients[sessionId].mains.length}, 是否有手柄: ${!!clients[sessionId].controller}`,
        );

        // 发送给所有主页面连接（包括发送者）
        clients[sessionId].mains.forEach((mainWs, index) => {
          if (mainWs.readyState === WebSocket.OPEN) {
            mainWs.send(JSON.stringify(data));
            console.log(`[登录同步] 已发送登录状态到主页面 ${index + 1}`);
          } else {
            console.log(
              `[登录同步] 主页面 ${index + 1} 连接未打开，状态: ${mainWs.readyState}`,
            );
          }
        });
        // 发送给手柄（包括发送者）
        if (clients[sessionId].controller) {
          clients[sessionId].controller.send(JSON.stringify(data));
          console.log("[登录同步] 已发送登录状态到手柄");
        }
      } else if (data.type === "getLoginStatus") {
        console.log(
          `[登录同步] 收到登录状态请求，当前状态: ${loginStatus[sessionId]}`,
        );
        // 直接返回当前登录状态给请求者
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "loginStatus",
              isLoggedIn: loginStatus[sessionId] || false,
            }),
          );
          console.log(
            `[登录同步] 已返回登录状态给请求者: ${loginStatus[sessionId] || false}`,
          );
        } else {
          console.log(`[登录同步] 连接未打开，无法返回登录状态`);
        }
      } else {
        // 转发消息
        if (type === "controller" && clients[sessionId].mains.length > 0) {
          console.log(
            `转发消息到所有主页面: ${data.type}, 数量: ${clients[sessionId].mains.length}`,
          );
          // 发送给所有主页面连接
          clients[sessionId].mains.forEach((mainWs) => {
            if (mainWs.readyState === WebSocket.OPEN) {
              mainWs.send(JSON.stringify(data));
            }
          });
        } else if (type === "main" && clients[sessionId].controller) {
          console.log(`转发消息到手柄: ${data.type}`);
          clients[sessionId].controller.send(JSON.stringify(data));
        } else {
          console.warn(`无法转发消息: ${data.type} - 目标客户端未连接`);
          console.warn(
            `mains数量: ${clients[sessionId]?.mains?.length || 0}, controller已连接: ${!!clients[sessionId]?.controller}`,
          );
        }
      }
    } catch (error) {
      console.error("消息解析错误:", error);
    }
  });

  // 监听关闭
  ws.on("close", () => {
    console.log(`连接关闭: ${sessionId}, type: ${type}, windowId: ${windowId}`);
    // 检查session是否存在
    if (!clients[sessionId]) {
      return;
    }
    if (type === "main") {
      // 从列表中移除
      const index = clients[sessionId].mains.indexOf(ws);
      if (index > -1) {
        clients[sessionId].mains.splice(index, 1);
      }
      console.log(
        `主页面已断开: ${sessionId}, 剩余屏幕数: ${clients[sessionId].mains.length}`,
      );
    } else {
      clients[sessionId].controller = null;
    }

    // 如果没有任何客户端，清理session
    if (
      clients[sessionId].mains.length === 0 &&
      !clients[sessionId].controller
    ) {
      delete clients[sessionId];
    }
  });

  ws.on("error", (error) => {
    console.error(`WebSocket错误: ${sessionId}`, error);
  });
});

server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
