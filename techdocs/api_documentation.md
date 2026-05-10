# EasyPDF API 文档

## 1. 概述

本文档详细描述了 EasyPDF 项目中使用的 API 接口，包括 DeepSeek API、Netlify Functions 以及前端本地函数。这些 API 共同构成了 EasyPDF 的语音识别和语义理解系统，使用户能够通过语音指令控制 PDF 阅读器。

## 2. DeepSeek API

### 2.1 基本信息

- **API 端点**: `https://api.deepseek.com/v1/chat/completions`
- **HTTP 方法**: POST
- **认证方式**: API 密钥
- **内容类型**: application/json

### 2.2 请求参数

| 参数        | 类型    | 必需 | 描述                             |
| ----------- | ------- | ---- | -------------------------------- |
| model       | string  | 是   | 模型名称，固定为 "deepseek-chat" |
| messages    | array   | 是   | 消息列表，包含系统提示和用户指令 |
| temperature | number  | 否   | 采样温度，0-1 之间，默认 0.3     |
| max_tokens  | integer | 否   | 最大生成 token 数，默认 100      |
| top_p       | number  | 否   | 核采样参数，默认 0.95            |

### 2.3 消息格式

```json
{
  "role": "system",
  "content": "系统提示内容"
}
{
  "role": "user",
  "content": "用户指令内容"
}
```

### 2.4 系统提示

系统提示应包含以下内容：

- 助手的角色和任务
- 界面结构和按钮功能
- 支持的指令类型
- 预期的输出格式

### 2.5 响应格式

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "deepseek-chat",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "生成的内容"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

### 2.6 错误处理

| 错误代码 | 描述         | 解决方法              |
| -------- | ------------ | --------------------- |
| 401      | 未授权       | 检查 API 密钥是否正确 |
| 429      | 请求频率过高 | 减少请求频率          |
| 500      | 服务器错误   | 稍后重试              |

## 3. Netlify Functions

### 3.1 deepseek.js 函数

**功能**: 调用 DeepSeek API 处理语音指令

**路径**: `netlify/functions/deepseek.js`

**请求参数**:

| 参数         | 类型    | 必需 | 描述                        |
| ------------ | ------- | ---- | --------------------------- |
| transcript   | string  | 是   | 语音识别结果                |
| html         | string  | 否   | HTML 结构（缓存无效时需要） |
| isCacheValid | boolean | 否   | 缓存是否有效                |
| history      | array   | 否   | 历史记录列表                |

**响应格式**:

```json
{
  "command": {
    "type": "指令类型",
    "action": "指令动作" // 可选
  }
}
```

**环境变量**:

| 变量名           | 类型   | 必需 | 描述              |
| ---------------- | ------ | ---- | ----------------- |
| DEEPSEEK_API_KEY | string | 是   | DeepSeek API 密钥 |

## 4. 前端本地函数

### 4.1 语音识别相关函数

#### initVoiceRecognition()

**功能**: 初始化语音识别

**参数**: 无

**返回值**: 无

**功能描述**:

- 创建 SpeechRecognition 实例
- 配置语音识别参数
- 添加事件监听器
- 绑定语音按钮事件

#### processVoiceCommand(transcript)

**功能**: 处理语音指令

**参数**:

- transcript: string - 语音识别结果

**返回值**: Promise<void>

**功能描述**:

- 检查 HTML 缓存
- 获取历史记录
- 调用 DeepSeek API
- 处理响应结果

#### executeCommand(command)

**功能**: 执行指令

**参数**:

- command: object - 指令对象

**返回值**: 无

**功能描述**:

- 根据指令类型执行相应操作
- 操作 UI 元素
- 触发相关函数

### 4.2 视图控制相关函数

#### updateScale(event)

**功能**: 更新缩放比例

**参数**:

- event: Event - 事件对象

**返回值**: 无

**功能描述**:

- 获取新的缩放比例
- 更新 scaleInput 值
- 刷新 PDF 渲染

#### resetView()

**功能**: 重置视图

**参数**: 无

**返回值**: 无

**功能描述**:

- 恢复默认缩放比例
- 重置 PDF 位置
- 刷新 PDF 渲染

#### toggleFullscreen()

**功能**: 切换全屏模式

**参数**: 无

**返回值**: 无

**功能描述**:

- 检查当前是否为全屏
- 进入或退出全屏
- 更新 UI 状态

### 4.3 文件操作相关函数

#### handleFileSelect(event)

**功能**: 处理文件选择

**参数**:

- event: Event - 事件对象

**返回值**: 无

**功能描述**:

- 获取选择的文件
- 验证文件类型
- 加载 PDF 文件

#### loadPDF(file)

**功能**: 加载 PDF 文件

**参数**:

- file: File - PDF 文件对象

**返回值**: Promise<void>

**功能描述**:

- 使用 PDF.js 加载文件
- 渲染 PDF 页面
- 更新 UI 状态

#### fetchHistoryList()

**功能**: 获取历史记录

**参数**: 无

**返回值**: Promise<Array>

**功能描述**:

- 从 Supabase 获取历史记录
- 处理错误情况
- 返回历史记录列表

#### loadFromSupabase(storage_path, file_name)

**功能**: 从 Supabase 加载文件

**参数**:

- storage_path: string - 文件存储路径
- file_name: string - 文件名

**返回值**: Promise<void>

**功能描述**:

- 从 Supabase 下载文件
- 加载 PDF 文件
- 渲染 PDF 页面

## 5. API 调用流程

### 5.1 语音指令处理流程

1. **用户输入**: 用户长按语音按钮并说话
2. **语音识别**: Web Speech API 识别语音内容
3. **指令处理**: processVoiceCommand()处理识别结果
4. **API 调用**: 调用 DeepSeek API 进行语义理解
5. **指令执行**: executeCommand()执行生成的指令
6. **结果反馈**: 操作 UI 元素并显示反馈

### 5.2 文件加载流程

1. **用户操作**: 用户点击打开文件按钮或说出打开文件指令
2. **文件选择**: 打开文件选择对话框
3. **文件加载**: handleFileSelect()处理文件选择
4. **PDF 渲染**: loadPDF()加载并渲染 PDF
5. **状态更新**: 更新 UI 状态和缩放比例

### 5.3 历史记录流程

1. **用户操作**: 用户点击历史记录按钮或说出查看历史记录指令
2. **获取记录**: fetchHistoryList()从 Supabase 获取历史记录
3. **显示菜单**: 显示历史记录菜单
4. **文件选择**: 用户选择历史文件
5. **文件加载**: loadFromSupabase()加载历史文件
6. **PDF 渲染**: 渲染 PDF 文件

## 6. 性能优化

### 6.1 API 调用优化

- **缓存 HTML 结构**: 使用 localStorage 缓存 HTML，避免重复传输
- **批量请求**: 合并多个操作的 API 调用
- **错误重试**: 实现自动重试机制
- **超时处理**: 设置合理的超时时间

### 6.2 前端优化

- **防抖处理**: 对频繁触发的事件进行防抖
- **懒加载**: 延迟加载非关键资源
- **预加载**: 预加载可能需要的资源
- **减少 DOM 操作**: 批量更新 DOM

## 7. 安全性

### 7.1 API 密钥保护

- **环境变量**: 使用 Netlify 环境变量存储 API 密钥
- **后端调用**: 所有 API 调用通过后端进行，不暴露给前端
- **密钥轮换**: 定期轮换 API 密钥

### 7.2 输入验证

- **文件验证**: 验证文件类型和大小
- **指令验证**: 验证语音指令的合法性
- **参数验证**: 验证 API 调用参数

### 7.3 错误处理

- **错误捕获**: 捕获并处理所有可能的错误
- **错误反馈**: 向用户提供清晰的错误信息
- **安全日志**: 记录错误但不暴露敏感信息

## 8. 调试

### 8.1 前端调试

- **控制台日志**: 使用 console.log()记录关键信息
- **断点调试**: 在关键函数处设置断点
- **网络监控**: 使用浏览器开发者工具监控网络请求

### 8.2 后端调试

- **函数日志**: 在 Netlify 控制台查看函数日志
- **错误监控**: 监控 API 调用错误
- **性能监控**: 监控函数执行时间

## 9. 部署

### 9.1 Netlify 部署（前端页面）

1. **连接 GitHub**: 将项目连接到 Netlify
2. **配置环境变量**: 在 Netlify 控制台设置 DEEPSEEK_API_KEY
3. **自动部署**: 推送代码到 GitHub 触发自动部署
4. **函数部署**: Netlify 自动部署 functions 目录下的函数

### 9.2 Render 部署（WebSocket 服务器）

由于 Netlify 不支持 WebSocket 长连接，WebSocket 服务器需要单独部署到 Render。

#### 部署步骤

1. **注册 Render 账号**: 访问 https://render.com 注册账号（推荐使用 GitHub 登录）
2. **创建 Web Service**:
   - 点击 "New +" → "Web Service"
   - 连接你的 GitHub 仓库
   - 选择 `easypdf-ws` 作为服务名称
   - 选择 `Node` 环境
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - 选择 `Free` 免费计划
   - 选择 `Singapore` 区域（对亚洲用户延迟较低）
3. **配置环境变量**:
   - `NODE_VERSION`: `18`
   - `PORT`: `10000`
4. **部署**: 点击 "Create Web Service" 开始部署
5. **获取服务器地址**: 部署完成后，Render 会提供一个 URL，如 `https://easypdf-ws.onrender.com`

#### 更新前端配置

部署完成后，需要更新前端页面中的 WebSocket 服务器地址：

1. 在 `index.html`、`controller.html`、`split-screen.html` 中找到 `getWsServer()` 函数
2. 将 `return "wss://easypdf-ws.onrender.com"` 中的地址替换为你的实际 Render 服务器地址

### 9.3 环境变量配置

| 变量名            | 描述                 | 示例值                                  | 部署平台 |
| ----------------- | -------------------- | --------------------------------------- | -------- |
| DEEPSEEK_API_KEY  | DeepSeek API 密钥    | sk-xxxxxxxxxxxxxxxxxxxxxxxx             | Netlify  |
| SUPABASE_URL      | Supabase 项目 URL    | https://xxxxxxxxxxxx.supabase.co        | Netlify  |
| SUPABASE_ANON_KEY | Supabase 匿名密钥    | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... | Netlify  |
| NODE_VERSION      | Node.js 版本         | 18                                      | Render   |
| PORT              | 服务器端口           | 10000                                   | Render   |
| WS_SERVER         | WebSocket 服务器地址 | wss://easypdf-ws.onrender.com           | Render   |

## 10. 故障排除

### 10.1 常见问题

| 问题                  | 可能原因                    | 解决方案           |
| --------------------- | --------------------------- | ------------------ |
| 语音识别无响应        | 浏览器不支持 Web Speech API | 使用支持的浏览器   |
| DeepSeek API 调用失败 | API 密钥无效                | 检查 API 密钥      |
| 历史记录加载失败      | Supabase 配置错误           | 检查 Supabase 配置 |
| 缩放功能不工作        | scaleInput 元素不存在       | 检查 HTML 结构     |

### 10.2 错误代码

| 错误代码                  | 描述         | 解决方案       |
| ------------------------- | ------------ | -------------- |
| 401 Unauthorized          | API 密钥无效 | 检查 API 密钥  |
| 404 Not Found             | 资源不存在   | 检查文件路径   |
| 500 Internal Server Error | 服务器错误   | 检查服务器日志 |
| 504 Gateway Timeout       | 请求超时     | 检查网络连接   |

## 11. 未来扩展

### 11.1 新 API 集成

- **语音合成 API**: 添加语音反馈功能
- **图像识别 API**: 添加图像识别功能
- **翻译 API**: 添加多语言支持

### 11.2 功能扩展

- **多模态输入**: 支持语音和文本混合输入
- **个性化模型**: 根据用户习惯调整识别模型
- **离线功能**: 添加离线语音识别能力

### 11.3 性能优化

- **边缘计算**: 使用边缘函数减少延迟
- **模型微调**: 微调语音识别模型
- **缓存策略**: 优化缓存策略
