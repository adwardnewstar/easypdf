# EasyPDF 项目技术文档

## 1. 项目概述

EasyPDF 是一个基于 Web 的 PDF 阅读器，提供了丰富的功能，包括文件打开、缩放、重置视图、全屏和历史记录等。项目支持语音识别功能，通过 DeepSeek API 理解用户的语音指令并执行相应操作。

## 2. 项目结构

```
├── index.html          # 主页面文件（电脑端主屏）
├── controller.html     # 手机控制端页面
├── split-screen.html   # 分屏幕页面（次屏）
├── server.js           # WebSocket 服务器（部署到 Render）
├── render.yaml         # Render 部署配置文件
├── voice.js            # 语音识别功能模块
├── assets/             # 资源文件夹
│   └── icon/           # 图标文件
├── netlify/            # Netlify配置
│   └── functions/      # Netlify Functions
│       ├── deepseek.js # DeepSeek API调用函数
│       └── tencent-asr.js # 腾讯云语音识别函数
└── techdocs/           # 技术文档
    ├── api_documentation.md # API 文档
    ├── project_structure.md # 项目结构文档
    └── ui_elements.md       # UI 元素文档
```

## 3. 功能模块

### 3.1 核心功能

- **文件管理**：打开本地 PDF 文件
- **视图控制**：缩放、重置视图、全屏
- **历史记录**：查看和打开历史文件
- **语音识别**：通过语音指令控制阅读器

### 3.2 语音识别功能

- **语音输入**：使用浏览器 Web Speech API 进行语音识别
- **语义理解**：通过 DeepSeek API 理解用户意图
- **指令执行**：根据理解结果执行相应操作
- **实时反馈**：实时显示语音输入内容

## 4. UI 元素

### 4.1 顶部工具栏

| 元素 ID       | 名称         | 功能                    | 位置 | 关联功能          |
| ------------- | ------------ | ----------------------- | ---- | ----------------- |
| fileBtn       | 打开文件按钮 | 打开本地 PDF 文件       | 左侧 | handleFileSelect  |
| scaleInput    | 缩放输入框   | 调整 PDF 显示比例       | 中间 | updateScale       |
| bestScaleBtn  | 最佳缩放按钮 | 自动调整到最佳缩放比例  | 中间 | setBestScale      |
| resetBtn      | 重置按钮     | 重置 PDF 视图到初始状态 | 右侧 | resetView         |
| fullscreenBtn | 全屏按钮     | 切换全屏模式            | 右侧 | toggleFullscreen  |
| historyBtn    | 历史记录按钮 | 显示历史文件列表        | 右侧 | toggleHistoryMenu |

### 4.2 左侧工具栏

| 元素 ID   | 名称     | 功能                               | 位置 | 关联功能             |
| --------- | -------- | ---------------------------------- | ---- | -------------------- |
| thumbCard | 语音按钮 | 长按触发语音识别，单击切换导航窗口 | 底部 | initVoiceRecognition |

### 4.3 其他 UI 元素

| 元素 ID     | 名称         | 功能                          | 位置         | 关联功能          |
| ----------- | ------------ | ----------------------------- | ------------ | ----------------- |
| viewportNav | 导航窗口     | 显示 PDF 缩略图和当前视图位置 | 右下角       | updateViewportNav |
| historyMenu | 历史记录菜单 | 显示历史文件列表              | 历史按钮下方 | fetchHistoryList  |
| loadingMask | 加载遮罩     | 显示加载状态                  | 中央         | showLoading       |

## 5. 语音指令系统

### 5.1 支持的指令类型

| 指令类型    | 描述         | 目标元素         | 示例指令             |
| ----------- | ------------ | ---------------- | -------------------- |
| open        | 打开文件     | fileBtn          | "打开文件"           |
| zoom        | 缩放 PDF     | scaleInput       | "放大"、"缩小"       |
| reset       | 重置视图     | resetBtn         | "重置视图"           |
| fullscreen  | 切换全屏     | fullscreenBtn    | "全屏"               |
| history     | 显示历史记录 | historyBtn       | "查看历史记录"       |
| openHistory | 打开历史文件 | loadFromSupabase | "打开第一个历史文件" |

### 5.2 指令执行流程

1. 用户长按语音按钮开始语音输入
2. 浏览器 Web Speech API 识别语音内容
3. 识别结果发送到 DeepSeek API 进行语义理解
4. DeepSeek API 生成相应的操作指令
5. 前端执行指令，操作相应的 UI 元素

## 6. API 接口

### 6.1 DeepSeek API

- **端点**：`https://api.deepseek.com/v1/chat/completions`
- **方法**：POST
- **参数**：
  - model: "deepseek-chat"
  - messages: 包含系统提示和用户指令
  - temperature: 0.3
  - max_tokens: 100

### 6.2 本地函数

| 函数名               | 描述           | 参数                                      | 返回值         |
| -------------------- | -------------- | ----------------------------------------- | -------------- |
| initVoiceRecognition | 初始化语音识别 | 无                                        | 无             |
| processVoiceCommand  | 处理语音指令   | transcript: 语音识别结果                  | Promise<void>  |
| executeCommand       | 执行指令       | command: 指令对象                         | 无             |
| fetchHistoryList     | 获取历史记录   | 无                                        | Promise<Array> |
| loadFromSupabase     | 加载历史文件   | storage_path: 存储路径, file_name: 文件名 | Promise<void>  |

## 7. 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **语音识别**：Web Speech API
- **语义理解**：DeepSeek API
- **后端**：Netlify Functions
- **存储**：Supabase

## 8. 性能优化

- **HTML 缓存**：使用 localStorage 缓存 HTML 结构，避免重复读取
- **流式识别**：使用 Web Speech API 的 interimResults 实现实时语音显示
- **延迟处理**：添加适当的延迟，确保用户体验流畅

## 9. 安全考虑

- **API 密钥保护**：使用 Netlify 环境变量存储 API 密钥，不暴露给前端
- **输入验证**：对用户输入进行验证，防止恶意指令
- **错误处理**：完善的错误处理机制，确保系统稳定性

## 10. 部署方案

### 10.1 局域网部署（推荐）

局域网部署适合在家庭或办公室网络中使用，所有设备通过本地网络通信。

**启动方式**：

1. 双击 `start-local.bat` 启动服务器
2. 脚本会自动获取本机局域网 IP 地址
3. 手机或其他设备通过 `http://[局域网IP]:8000` 访问

**访问地址**：

- 主页面：`http://[局域网IP]:8000`
- 手机控制端：`http://[局域网IP]:8000/controller.html?session=default`
- 分屏显示：`http://[局域网IP]:8000/split-screen.html?session=default`

**WebSocket 连接策略**：
所有前端页面（index.html、controller.html、split-screen.html）的 `getWsServer()` 函数已统一为以下策略：

1. 优先使用全局配置变量 `window.__WS_SERVER__`
2. 检查 URL 参数 `?server=...`
3. 检查 localStorage 中保存的 `easypdf_ws_server`
4. 默认使用当前域名（自动适配局域网环境）

### 10.2 Render 部署（线上）

适用于需要公网访问的场景，WebSocket 服务器部署到 Render。

**部署文件**：

- `render.yaml`：Render 部署配置文件
- `server.js`：WebSocket 服务器（已适配 Render 环境）

**配置说明**：

- 服务类型：Web Service
- 启动命令：`node server.js`
- 端口：通过 `PORT` 环境变量指定（Render 自动分配）
- 健康检查：`/health` 端点

### 10.3 Netlify 部署（前端）

前端静态页面部署到 Netlify，与 Render 后端配合使用。

**部署文件**：

- `netlify.toml`：Netlify 部署配置
- `netlify/functions/`：Netlify Functions（DeepSeek API、腾讯云语音识别）

## 11. 未来扩展

- **多语言支持**：添加对其他语言的支持
- **个性化设置**：允许用户自定义语音指令
- **离线功能**：添加离线语音识别能力
