@echo off
echo 🚀 Backend File Validation
echo ==================================================
echo 📅 Started at: %date% %time%
echo ==================================================

echo.
echo 🔍 Checking if Node.js is available...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo 💡 Please install Node.js from https://nodejs.org/
    echo.
    echo 🔧 Checking files without Node.js...
    goto :checkFiles
) else (
    echo ✅ Node.js is available
    node --version
    echo.
    echo 🔍 Running file validation...
    node check-files.js
    if %errorlevel% neq 0 (
        echo ❌ File validation failed
        goto :end
    )
)

:checkFiles
echo.
echo 📄 Checking for required files...
set "missingFiles="

if not exist "server.js" (
    echo ❌ server.js not found
    set "missingFiles=1"
)

if not exist "package.json" (
    echo ❌ package.json not found
    set "missingFiles=1"
)

if not exist "middleware" (
    echo ❌ middleware directory not found
    set "missingFiles=1"
)

if not exist "routes" (
    echo ❌ routes directory not found
    set "missingFiles=1"
)

if not exist "services" (
    echo ❌ services directory not found
    set "missingFiles=1"
)

if not exist "test-simple.js" (
    echo ❌ test-simple.js not found
    set "missingFiles=1"
)

if not exist "test-socket-client.js" (
    echo ❌ test-socket-client.js not found
    set "missingFiles=1"
)

if not exist "test-runner.js" (
    echo ❌ test-runner.js not found
    set "missingFiles=1"
)

if "%missingFiles%"=="" (
    echo ✅ All required files found
) else (
    echo ❌ Some required files are missing
)

echo.
echo 📁 Checking directory structure...
if exist "middleware" (
    echo ✅ middleware/ exists
    dir /b middleware\*.js >nul 2>&1 && echo   📄 Contains JavaScript files
)

if exist "routes" (
    echo ✅ routes/ exists
    dir /b routes\*.js >nul 2>&1 && echo   📄 Contains JavaScript files
)

if exist "services" (
    echo ✅ services/ exists
    dir /b services\*.js >nul 2>&1 && echo   📄 Contains JavaScript files
)

if exist "utils" (
    echo ✅ utils/ exists
    dir /b utils\*.js >nul 2>&1 && echo   📄 Contains JavaScript files
)

if exist "config" (
    echo ✅ config/ exists
    dir /b config\*.js >nul 2>&1 && echo   📄 Contains JavaScript files
)

echo.
echo 📦 Checking package.json...
if exist "package.json" (
    echo ✅ package.json exists
    findstr /C:"test:simple" package.json >nul 2>&1 && echo ✅ test:simple script found
    findstr /C:"test:realtime" package.json >nul 2>&1 && echo ✅ test:realtime script found
    findstr /C:"socket.io-client" package.json >nul 2>&1 && echo ✅ socket.io-client dependency found
) else (
    echo ❌ package.json not found
)

echo.
echo 📦 Checking node_modules...
if exist "node_modules" (
    echo ✅ node_modules exists
    dir /b node_modules | find /c /v "" >nul 2>&1 && echo   📦 Contains packages
) else (
    echo ❌ node_modules not found
    echo 💡 Run 'npm install' when Node.js is available
)

:end
echo.
echo ==================================================
echo 📋 SUMMARY
echo ==================================================
if "%missingFiles%"=="" (
    echo ✅ All required files are present
    echo ✅ Directory structure looks correct
    echo.
    echo 💡 Next steps:
    echo 1. Install Node.js from https://nodejs.org/
    echo 2. Open Command Prompt (not PowerShell)
    echo 3. Navigate to this directory
    echo 4. Run: npm install
    echo 5. Run: npm start
    echo 6. Run: npm run test:realtime
) else (
    echo ❌ Some files are missing
    echo 🔧 Please ensure all required files are present
)

echo.
echo ==================================================
pause 