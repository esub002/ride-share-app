# Ride Share Backend Validation Script
# PowerShell version

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🚀 RIDE-SHARE BACKEND VALIDATION" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📅 Date: $(Get-Date)" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "🔍 Checking system requirements..." -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js is installed" -ForegroundColor Green
        Write-Host "  Version: $nodeVersion" -ForegroundColor White
    } else {
        Write-Host "❌ Node.js is NOT installed" -ForegroundColor Red
        Write-Host "💡 Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Node.js is NOT installed" -ForegroundColor Red
    Write-Host "💡 Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
}

# Check if npm is available
try {
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "✅ npm is available" -ForegroundColor Green
        Write-Host "  Version: $npmVersion" -ForegroundColor White
    } else {
        Write-Host "❌ npm is NOT available" -ForegroundColor Red
        Write-Host "💡 This may be due to Node.js installation issues" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ npm is NOT available" -ForegroundColor Red
    Write-Host "💡 This may be due to Node.js installation issues" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📁 CHECKING BACKEND STRUCTURE" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

$missingFiles = @()
$totalFiles = 0
$foundFiles = 0

# Function to check file
function Check-File {
    param($filename, $description)
    $global:totalFiles++
    if (Test-Path $filename) {
        Write-Host "✅ $filename - $description" -ForegroundColor Green
        $global:foundFiles++
    } else {
        Write-Host "❌ $filename - $description (MISSING)" -ForegroundColor Red
        $global:missingFiles += $filename
    }
}

# Function to check directory
function Check-Directory {
    param($dirname, $description)
    if (Test-Path $dirname) {
        Write-Host "✅ $dirname/ exists" -ForegroundColor Green
        $jsFiles = Get-ChildItem -Path $dirname -Filter "*.js" -ErrorAction SilentlyContinue
        if ($jsFiles) {
            Write-Host "  📄 Contains JavaScript files:" -ForegroundColor White
            foreach ($file in $jsFiles) {
                Write-Host "    - $($file.Name)" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "❌ $dirname/ not found" -ForegroundColor Red
        $global:missingFiles += $dirname
    }
}

Write-Host ""
Write-Host "📄 Checking core files..." -ForegroundColor Yellow
Check-File "server.js" "Main server file"
Check-File "package.json" "Package configuration"
Check-File "start-dev.js" "Development server"
Check-File "jest.config.js" "Jest configuration"
Check-File "jest.setup.js" "Jest setup"

Write-Host ""
Write-Host "🧪 Checking test files..." -ForegroundColor Yellow
Check-File "test-simple.js" "Simple test file"
Check-File "test-server-basic.js" "Basic server test"
Check-File "test-socket-client.js" "Socket.IO test client"
Check-File "test-runner.js" "Test runner"
Check-File "check-files.js" "File checker"

Write-Host ""
Write-Host "📚 Checking documentation..." -ForegroundColor Yellow
Check-File "README.md" "Main README"
Check-File "SECURITY_README.md" "Security documentation"
Check-File "REALTIME_TESTING.md" "Real-time testing guide"
Check-File "API_DOCUMENTATION.md" "API documentation"
Check-File "DEPLOYMENT.md" "Deployment guide"
Check-File "env.example" "Environment template"

Write-Host ""
Write-Host "🔧 Checking configuration files..." -ForegroundColor Yellow
Check-File "Dockerfile" "Docker configuration"
Check-File "docker-compose.yml" "Docker Compose"
Check-File ".gitignore" "Git ignore file"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📁 CHECKING DIRECTORIES" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📂 Checking directories..." -ForegroundColor Yellow
Check-Directory "middleware" "Middleware directory"
Check-Directory "routes" "Routes directory"
Check-Directory "services" "Services directory"
Check-Directory "config" "Config directory"
Check-Directory "utils" "Utils directory"
Check-Directory "scripts" "Scripts directory"
Check-Directory "tests" "Tests directory"
Check-Directory "__tests__" "Jest tests directory"

Write-Host ""
Write-Host "📂 Checking node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules/ exists" -ForegroundColor Green
    $packageCount = (Get-ChildItem -Path "node_modules" -Directory | Measure-Object).Count
    Write-Host "  📦 Contains $packageCount packages" -ForegroundColor White
    Write-Host "  💡 Dependencies are installed" -ForegroundColor White
} else {
    Write-Host "❌ node_modules/ not found" -ForegroundColor Red
    Write-Host "💡 Run 'npm install' when Node.js is available" -ForegroundColor Yellow
    $missingFiles += "node_modules"
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📋 VALIDATION SUMMARY" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📄 Files checked: $totalFiles" -ForegroundColor White
Write-Host "✅ Files found: $foundFiles" -ForegroundColor Green
Write-Host "❌ Files missing: $($missingFiles.Count)" -ForegroundColor Red

if ($missingFiles.Count -eq 0) {
    Write-Host ""
    Write-Host "🎉 BACKEND STRUCTURE IS COMPLETE!" -ForegroundColor Green
    Write-Host "✅ All required files and directories are present" -ForegroundColor Green
    Write-Host "✅ Directory structure is correct" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Next steps:" -ForegroundColor Yellow
    Write-Host "1. Install Node.js from https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Open Command Prompt (not PowerShell)" -ForegroundColor White
    Write-Host "3. Navigate to this directory" -ForegroundColor White
    Write-Host "4. Run: npm install" -ForegroundColor White
    Write-Host "5. Run: npm start" -ForegroundColor White
    Write-Host "6. Run: npm run test:realtime" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "⚠️ Some files or directories are missing" -ForegroundColor Yellow
    Write-Host "🔧 Please ensure all required files are present" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Missing items:" -ForegroundColor Red
    foreach ($item in $missingFiles) {
        Write-Host "  - $item" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🛠️ TROUBLESHOOTING" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you can't install Node.js:" -ForegroundColor White
Write-Host "1. Try downloading from https://nodejs.org/" -ForegroundColor Gray
Write-Host "2. Use nvm-windows: https://github.com/coreybutler/nvm-windows" -ForegroundColor Gray
Write-Host "3. Use Chocolatey: choco install nodejs" -ForegroundColor Gray
Write-Host ""
Write-Host "If npm doesn't work:" -ForegroundColor White
Write-Host "1. Reinstall Node.js and check 'Add to PATH'" -ForegroundColor Gray
Write-Host "2. Restart your computer after installation" -ForegroundColor Gray
Write-Host "3. Use Command Prompt instead of PowerShell" -ForegroundColor Gray
Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan

Read-Host "Press Enter to continue" 