@echo off
chcp 65001 >nul
title EasyPDF 局域网服务器

echo ============================================
echo   EasyPDF 局域网服务器启动脚本
echo ============================================
echo.

:: 获取本机局域网IP地址
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set "LOCAL_IP=%%a"
    goto :got_ip
)
:got_ip
set "LOCAL_IP=%LOCAL_IP: =%"

echo 本机局域网IP: %LOCAL_IP%
echo.
echo 请确保手机/其他设备与电脑连接在同一个局域网下
echo.

:: 检查 Node.js 是否安装
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

:: 检查依赖是否安装
if not exist "node_modules" (
    echo [提示] 正在安装依赖...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
    echo [完成] 依赖安装成功
    echo.
)

:: 设置环境变量
set PORT=8000
set NODE_ENV=development

echo ============================================
echo   启动信息
echo ============================================
echo.
echo   本地访问地址:
echo     http://localhost:8000
echo.
echo   局域网访问地址:
echo     http://%LOCAL_IP%:8000
echo.
echo   手机端控制地址:
echo     http://%LOCAL_IP%:8000/controller.html?session=default
echo.
echo   分屏显示地址:
echo     http://%LOCAL_IP%:8000/split-screen.html?session=default
echo.
echo ============================================
echo.
echo 按 Ctrl+C 停止服务器
echo.

:: 启动服务器
node server.js

pause
