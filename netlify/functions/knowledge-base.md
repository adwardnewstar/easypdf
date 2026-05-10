# EasyPDF 功能知识库

## 核心操作指令

### 缩放操作

- "放大"：增加10%
- "缩小"：减少10%
- "放大至X%"：设置为X%（绝对模式）
- "缩小至X%"：设置为X%（绝对模式）
- "放大X%"：当前值+X%（相对模式）
- "缩小X%"：当前值-X%（相对模式）
- "放大X倍"：设置为X\*100%（倍数模式）
- "缩小到X分之一"：设置为(1/X)\*100%（倍数模式）
- "最佳缩放"：自动调整到最佳显示比例
- "适应窗口"：自动调整到最佳显示比例
- "自动调整"：自动调整到最佳显示比例
- 范围：25%-400%

### 移动操作

- "向上"、"向下"、"向左"、"向右"：移动1格（小网格）
- "向上移动一格"、"向下移动一格"、"向左移动一格"、"向右移动一格"：移动1格（小网格）
- "向上移动一个大网格"、"向下移动一个大网格"、"向左移动一个大网格"、"向右移动一个大网格"：移动4格（大网格=4个小网格）
- "向上移动两个大网格"、"向下移动两个大网格"：移动8格
- "沿红色方向"：向右移动1格
- "沿蓝色方向"：向左移动1格
- "沿绿色方向"：向上移动1格
- "沿黄色方向"：向下移动1格
- "沿红色方向挪动N格"、"沿红色方向移动N格"：向右移动N格（N是具体数字）
- "沿蓝色方向挪动N格"、"沿蓝色方向移动N格"：向左移动N格（N是具体数字）
- "沿绿色方向挪动N格"、"沿绿色方向移动N格"：向上移动N格（N是具体数字）
- "沿黄色方向挪动N格"、"沿黄色方向移动N格"：向下移动N格（N是具体数字）
- "挪动N格"、"移动N格"、"平移N格"：移动N个小网格（N是具体数字，如1、2、3、4等）
- "移动N个大网格"：移动N×4个小网格（N是具体数字）

### 文件操作

- "打开文件"、"选择文件"、"上传文件"：打开文件选择器
- "历史记录"、"打开历史"、"查看历史记录"：显示历史列表
- "打开第一个"：打开历史第一个文件
- "打开第二个"：打开历史第二个文件
- "打开第三个"：打开历史第三个文件
- "打开第四个"：打开历史第四个文件

### 视图操作

- "重置"、"重置视图"、"恢复默认"：恢复默认视图
- "全屏"、"进入全屏"、"退出全屏"：切换全屏模式
- "坐标系"、"网格"、"显示网格"：切换坐标系显示

## 语音指令映射表

| 语音指令           | 目标按钮      | 执行函数                 | 预期结果           |
| ------------------ | ------------- | ------------------------ | ------------------ |
| 打开文件           | fileBtn       | handleFileSelect()       | 打开文件选择对话框 |
| 选择文件           | fileBtn       | handleFileSelect()       | 打开文件选择对话框 |
| 上传文件           | fileBtn       | handleFileSelect()       | 打开文件选择对话框 |
| 放大               | scaleInput    | updateScale()            | 增加缩放比例       |
| 缩小               | scaleInput    | updateScale()            | 减小缩放比例       |
| 放大至X%           | scaleInput    | updateScale()            | 设置为指定缩放比例 |
| 最佳缩放           | bestScaleBtn  | setBestScale()           | 自动调整到最佳缩放 |
| 适应窗口           | bestScaleBtn  | setBestScale()           | 自动调整到最佳缩放 |
| 自动调整           | bestScaleBtn  | setBestScale()           | 自动调整到最佳缩放 |
| 重置视图           | resetBtn      | resetView()              | 重置到初始视图     |
| 恢复默认           | resetBtn      | resetView()              | 重置到初始视图     |
| 重置               | resetBtn      | resetView()              | 重置到初始视图     |
| 全屏               | fullscreenBtn | toggleFullscreen()       | 切换全屏模式       |
| 进入全屏           | fullscreenBtn | toggleFullscreen()       | 进入全屏模式       |
| 退出全屏           | fullscreenBtn | toggleFullscreen()       | 退出全屏模式       |
| 查看历史记录       | historyBtn    | toggleHistoryMenu()      | 显示历史文件列表   |
| 历史文件           | historyBtn    | toggleHistoryMenu()      | 显示历史文件列表   |
| 打开历史           | historyBtn    | toggleHistoryMenu()      | 显示历史文件列表   |
| 打开第一个历史文件 | N/A           | loadFromSupabase()       | 打开第一个历史文件 |
| 坐标系             | N/A           | toggleCoordinateSystem() | 切换坐标系显示     |
| 网格               | N/A           | toggleCoordinateSystem() | 切换坐标系显示     |

## 指令类型

### 指令类型列表

- **zoom**: 缩放操作
- **move**: 移动操作
- **open**: 打开文件
- **openHistory**: 打开历史文件
- **coordinate**: 坐标系切换
- **reset**: 重置视图
- **fullscreen**: 全屏切换

### 指令格式说明

#### zoom（缩放）

- 相对模式：当前值增加或减少
- 绝对模式：直接设置为目标值
- 倍数模式：设置为当前值的倍数

#### move（移动）

- 方向：上、下、左、右
- 距离：网格数量
- 坐标系：红色(X轴正/右)、蓝色(X轴负/左)、绿色(Y轴负/上)、黄色(Y轴正/下)

#### openHistory（打开历史）

- 无参数：显示历史列表
- index参数：打开指定索引的历史文件（从0开始）

## 快捷键参考

| 快捷键 | 功能         | 对应按钮      |
| ------ | ------------ | ------------- |
| Ctrl+O | 打开文件     | fileBtn       |
| Ctrl++ | 放大         | scaleInput    |
| Ctrl+- | 缩小         | scaleInput    |
| Ctrl+0 | 重置视图     | resetBtn      |
| F11    | 全屏         | fullscreenBtn |
| Ctrl+H | 显示历史记录 | historyBtn    |

## 功能分组

### 文件操作组

- fileBtn → fileInput → loadPDF() → renderPDF()
- historyBtn → historyMenu → loadFromSupabase() → renderPDF()

### 视图控制组

- scaleInput → updateScale() → refreshRender()
- bestScaleBtn → setBestScale() → updateScale() → refreshRender()
- resetBtn → resetView() → updateScale() → refreshRender()
- fullscreenBtn → toggleFullscreen()

### 语音控制组

- thumbCard (长按) → initVoiceRecognition() → processVoiceCommand() → executeCommand()
- thumbCard (单击) → viewportNav 显示/隐藏
