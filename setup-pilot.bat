@echo off
echo ====================================
echo  ACCOS Visual Flow Builder Setup
echo  Pilot Project Deployment
echo ====================================
echo.

echo [1/5] Creating directory structure...
mkdir src 2>nul
mkdir scripts 2>nul
mkdir public 2>nul

echo [2/5] Copying Visual Flow Builder files...
echo Copying from: C:\Users\MarkusAhling\claude system\frontend\src
echo To: C:\Users\MarkusAhling\pro\alpha-0.1\claude\src
xcopy "C:\Users\MarkusAhling\claude system\frontend\src\*" "src\" /E /Y /I
if %errorlevel% neq 0 (
    echo ERROR: Failed to copy source files. Please check paths.
    pause
    exit /b 1
)

echo [3/5] Copying configuration files...
copy "C:\Users\MarkusAhling\claude system\frontend\package.json" "." 2>nul
copy "C:\Users\MarkusAhling\claude system\frontend\tsconfig.json" "." 2>nul
copy "C:\Users\MarkusAhling\claude system\frontend\vite.config.ts" "." 2>nul
copy "C:\Users\MarkusAhling\claude system\frontend\tailwind.config.js" "." 2>nul
copy "C:\Users\MarkusAhling\claude system\frontend\index.html" "." 2>nul
copy "C:\Users\MarkusAhling\claude system\frontend\.env.example" ".env" 2>nul

echo [4/5] Installing dependencies...
echo This may take a few minutes...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed. Please check your Node.js installation.
    pause
    exit /b 1
)

echo [5/5] Setting up environment...
echo Creating pilot project configuration...

echo # Visual Flow Builder - Pilot Configuration > .env
echo VITE_API_BASE_URL=http://localhost:3000/api/v1 >> .env
echo VITE_WS_BASE_URL=ws://localhost:3000/ws >> .env
echo VITE_ENABLE_DEBUG=true >> .env
echo VITE_PROJECT_NAME=Alpha Pilot >> .env

echo.
echo ====================================
echo  ✅ Setup Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Start your backend server (if not running)
echo 2. Run: npm run dev
echo 3. Open: http://localhost:5173
echo.
echo For detailed instructions, see:
echo PILOT_DEPLOYMENT_GUIDE.md
echo.
echo Press any key to start the dev server now...
pause >nul

echo Starting Visual Flow Builder...
call npm run dev