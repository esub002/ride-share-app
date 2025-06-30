@echo off
setlocal enabledelayedexpansion

echo.
echo ==================================================
echo 🚀 RIDE-SHARE BACKEND VALIDATION
echo ==================================================
echo 📅 Date: %date% %time%
echo ==================================================

echo.
echo 🔍 Checking system requirements...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js is installed
    for /f "tokens=*" %%i in ('node --version') do echo   Version: %%i
) else (
    echo ❌ Node.js is NOT installed
    echo 💡 Please install Node.js from https://nodejs.org/
    echo.
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ npm is available
    for /f "tokens=*" %%i in ('npm --version') do echo   Version: %%i
) else (
    echo ❌ npm is NOT available
    echo 💡 This may be due to Node.js installation issues
    echo.
)

echo.
echo ==================================================
echo 📁 CHECKING BACKEND STRUCTURE
echo ==================================================

set "missingFiles="
set "totalFiles=0"
set "foundFiles=0"

echo.
echo 📄 Checking core files...

REM Check main server files
call :checkFile "server.js" "Main server file"
call :checkFile "package.json" "Package configuration"
call :checkFile "start-dev.js" "Development server"
call :checkFile "jest.config.js" "Jest configuration"
call :checkFile "jest.setup.js" "Jest setup"

echo.
echo 🧪 Checking test files...
call :checkFile "test-simple.js" "Simple test file"
call :checkFile "test-server-basic.js" "Basic server test"
call :checkFile "test-socket-client.js" "Socket.IO test client"
call :checkFile "test-runner.js" "Test runner"
call :checkFile "check-files.js" "File checker"

echo.
echo 📚 Checking documentation...
call :checkFile "README.md" "Main README"
call :checkFile "SECURITY_README.md" "Security documentation"
call :checkFile "REALTIME_TESTING.md" "Real-time testing guide"
call :checkFile "API_DOCUMENTATION.md" "API documentation"
call :checkFile "DEPLOYMENT.md" "Deployment guide"
call :checkFile "env.example" "Environment template"

echo.
echo 🔧 Checking configuration files...
call :checkFile "Dockerfile" "Docker configuration"
call :checkFile "docker-compose.yml" "Docker Compose"
call :checkFile ".gitignore" "Git ignore file"

echo.
echo ==================================================
echo 📁 CHECKING DIRECTORIES
echo ==================================================

echo.
echo 📂 Checking middleware directory...
if exist "middleware" (
    echo ✅ middleware/ exists
    dir /b middleware\*.js >nul 2>&1 && (
        echo   📄 Contains JavaScript files:
        for %%f in (middleware\*.js) do echo     - %%~nxf
    )
) else (
    echo ❌ middleware/ not found
    set "missingFiles=1"
)

echo.
echo 📂 Checking routes directory...
if exist "routes" (
    echo ✅ routes/ exists
    dir /b routes\*.js >nul 2>&1 && (
        echo   📄 Contains JavaScript files:
        for %%f in (routes\*.js) do echo     - %%~nxf
    )
) else (
    echo ❌ routes/ not found
    set "missingFiles=1"
)

echo.
echo 📂 Checking services directory...
if exist "services" (
    echo ✅ services/ exists
    dir /b services\*.js >nul 2>&1 && (
        echo   📄 Contains JavaScript files:
        for %%f in (services\*.js) do echo     - %%~nxf
    )
) else (
    echo ❌ services/ not found
    set "missingFiles=1"
)

echo.
echo 📂 Checking config directory...
if exist "config" (
    echo ✅ config/ exists
    dir /b config\*.js >nul 2>&1 && (
        echo   📄 Contains JavaScript files:
        for %%f in (config\*.js) do echo     - %%~nxf
    )
) else (
    echo ❌ config/ not found
    set "missingFiles=1"
)

echo.
echo 📂 Checking utils directory...
if exist "utils" (
    echo ✅ utils/ exists
    dir /b utils\*.js >nul 2>&1 && (
        echo   📄 Contains JavaScript files:
        for %%f in (utils\*.js) do echo     - %%~nxf
    )
) else (
    echo ❌ utils/ not found
    set "missingFiles=1"
)

echo.
echo 📂 Checking scripts directory...
if exist "scripts" (
    echo ✅ scripts/ exists
    dir /b scripts\*.js >nul 2>&1 && (
        echo   📄 Contains JavaScript files:
        for %%f in (scripts\*.js) do echo     - %%~nxf
    )
) else (
    echo ❌ scripts/ not found
    set "missingFiles=1"
)

echo.
echo 📂 Checking test directories...
if exist "tests" (
    echo ✅ tests/ exists
    dir /b tests\*.js >nul 2>&1 && (
        echo   📄 Contains test files:
        for %%f in (tests\*.js) do echo     - %%~nxf
    )
) else (
    echo ❌ tests/ not found
    set "missingFiles=1"
)

if exist "__tests__" (
    echo ✅ __tests__/ exists
    dir /b __tests__\*.js >nul 2>&1 && (
        echo   📄 Contains test files:
        for %%f in (__tests__\*.js) do echo     - %%~nxf
    )
) else (
    echo ❌ __tests__/ not found
    set "missingFiles=1"
)

echo.
echo 📂 Checking node_modules...
if exist "node_modules" (
    echo ✅ node_modules/ exists
    dir /b node_modules | find /c /v "" >nul 2>&1 && (
        echo   📦 Contains packages
        echo   💡 Dependencies are installed
    )
) else (
    echo ❌ node_modules/ not found
    echo 💡 Run 'npm install' when Node.js is available
    set "missingFiles=1"
)

echo.
echo ==================================================
echo 📋 VALIDATION SUMMARY
echo ==================================================
echo 📄 Files checked: %totalFiles%
echo ✅ Files found: %foundFiles%
echo ❌ Files missing: !missingFiles!

if "%missingFiles%"=="" (
    echo.
    echo 🎉 BACKEND STRUCTURE IS COMPLETE!
    echo ✅ All required files and directories are present
    echo ✅ Directory structure is correct
    echo.
    echo 💡 Next steps:
    echo 1. Install Node.js from https://nodejs.org/
    echo 2. Open Command Prompt (not PowerShell)
    echo 3. Navigate to this directory
    echo 4. Run: npm install
    echo 5. Run: npm start
    echo 6. Run: npm run test:realtime
) else (
    echo.
    echo ⚠️ Some files or directories are missing
    echo 🔧 Please ensure all required files are present
)

echo.
echo ==================================================
echo 🛠️ TROUBLESHOOTING
echo ==================================================
echo.
echo If you can't install Node.js:
echo 1. Try downloading from https://nodejs.org/
echo 2. Use nvm-windows: https://github.com/coreybutler/nvm-windows
echo 3. Use Chocolatey: choco install nodejs
echo.
echo If npm doesn't work:
echo 1. Reinstall Node.js and check "Add to PATH"
echo 2. Restart your computer after installation
echo 3. Use Command Prompt instead of PowerShell
echo.
echo ==================================================
pause
goto :eof

:checkFile
set "filename=%~1"
set "description=%~2"
set /a totalFiles+=1
if exist "%filename%" (
    echo ✅ %filename% - %description%
    set /a foundFiles+=1
) else (
    echo ❌ %filename% - %description% (MISSING)
    set "missingFiles=1"
)
goto :eof 