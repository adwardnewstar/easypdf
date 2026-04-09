# EasyPDF 项目技术文档

## 1. 项目概述

EasyPDF是一个基于Web的PDF阅读器，提供了丰富的功能，包括文件打开、缩放、重置视图、全屏和历史记录等。项目支持语音识别功能，通过DeepSeek API理解用户的语音指令并执行相应操作。

## 2. 项目结构

```
├── index.html          # 主页面文件
├── voice.js            # 语音识别功能模块
├── assets/             # 资源文件夹
│   └── icon/           # 图标文件
└── netlify/            # Netlify配置
    └── functions/      # Netlify Functions
        └── deepseek.js # DeepSeek API调用函数
```

## 3. 功能模块

### 3.1 核心功能

- **文件管理**：打开本地PDF文件
- **视图控制**：缩放、重置视图、全屏
- **历史记录**：查看和打开历史文件
- **语音识别**：通过语音指令控制阅读器

### 3.2 语音识别功能

- **语音输入**：使用浏览器Web Speech API进行语音识别
- **语义理解**：通过DeepSeek API理解用户意图
- **指令执行**：根据理解结果执行相应操作
- **实时反馈**：实时显示语音输入内容

## 4. UI元素

### 4.1 顶部工具栏

| 元素ID | 名称 | 功能 | 位置 | 关联功能 |
|--------|------|------|------|----------|
| fileBtn | 打开文件按钮 | 打开本地PDF文件 | 左侧 | handleFileSelect |
| scaleInput | 缩放输入框 | 调整PDF显示比例 | 中间 | updateScale |
| bestScaleBtn | 最佳缩放按钮 | 自动调整到最佳缩放比例 | 中间 | setBestScale |
| resetBtn | 重置按钮 | 重置PDF视图到初始状态 | 右侧 | resetView |
| fullscreenBtn | 全屏按钮 | 切换全屏模式 | 右侧 | toggleFullscreen |
| historyBtn | 历史记录按钮 | 显示历史文件列表 | 右侧 | toggleHistoryMenu |

### 4.2 左侧工具栏

| 元素ID | 名称 | 功能 | 位置 | 关联功能 |
|--------|------|------|------|----------|
| thumbCard | 语音按钮 | 长按触发语音识别，单击切换导航窗口 | 底部 | initVoiceRecognition |

### 4.3 其他UI元素

| 元素ID | 名称 | 功能 | 位置 | 关联功能 |
|--------|------|------|------|----------|
| viewportNav | 导航窗口 | 显示PDF缩略图和当前视图位置 | 右下角 | updateViewportNav |
| historyMenu | 历史记录菜单 | 显示历史文件列表 | 历史按钮下方 | fetchHistoryList |
| loadingMask | 加载遮罩 | 显示加载状态 | 中央 | showLoading |

## 5. 语音指令系统

### 5.1 支持的指令类型

| 指令类型 | 描述 | 目标元素 | 示例指令 |
|----------|------|----------|----------|
| open | 打开文件 | fileBtn | "打开文件" |
| zoom | 缩放PDF | scaleInput | "放大"、"缩小" |
| reset | 重置视图 | resetBtn | "重置视图" |
| fullscreen | 切换全屏 | fullscreenBtn | "全屏" |
| history | 显示历史记录 | historyBtn | "查看历史记录" |
| openHistory | 打开历史文件 | loadFromSupabase | "打开第一个历史文件" |

### 5.2 指令执行流程

1. 用户长按语音按钮开始语音输入
2. 浏览器Web Speech API识别语音内容
3. 识别结果发送到DeepSeek API进行语义理解
4. DeepSeek API生成相应的操作指令
5. 前端执行指令，操作相应的UI元素

## 6. API接口

### 6.1 DeepSeek API

- **端点**：`https://api.deepseek.com/v1/chat/completions`
- **方法**：POST
- **参数**：
  - model: "deepseek-chat"
  - messages: 包含系统提示和用户指令
  - temperature: 0.3
  - max_tokens: 100

### 6.2 本地函数

| 函数名 | 描述 | 参数 | 返回值 |
|--------|------|------|--------|
| initVoiceRecognition | 初始化语音识别 | 无 | 无 |
| processVoiceCommand | 处理语音指令 | transcript: 语音识别结果 | Promise<void> |
| executeCommand | 执行指令 | command: 指令对象 | 无 |
| fetchHistoryList | 获取历史记录 | 无 | Promise<Array> |
| loadFromSupabase | 加载历史文件 | storage_path: 存储路径, file_name: 文件名 | Promise<void> |

## 7. 技术栈

- **前端**：HTML5, CSS3, JavaScript
- **语音识别**：Web Speech API
- **语义理解**：DeepSeek API
- **后端**：Netlify Functions
- **存储**：Supabase

## 8. 性能优化

- **HTML缓存**：使用localStorage缓存HTML结构，避免重复读取
- **流式识别**：使用Web Speech API的interimResults实现实时语音显示
- **延迟处理**：添加适当的延迟，确保用户体验流畅

## 9. 安全考虑

- **API密钥保护**：使用Netlify环境变量存储API密钥，不暴露给前端
- **输入验证**：对用户输入进行验证，防止恶意指令
- **错误处理**：完善的错误处理机制，确保系统稳定性

## 10. 未来扩展

- **多语言支持**：添加对其他语言的支持
- **个性化设置**：允许用户自定义语音指令
- **离线功能**：添加离线语音识别能力
- **智能推荐**：基于用户使用习惯推荐功能
