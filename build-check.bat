@echo off
echo ====================================
echo Starting Build Verification
echo ====================================
echo.

cd /d d:\AT

echo Step 1: Type Check
echo -----------------------------------
call node_modules\.bin\tsc --noEmit
if errorlevel 1 (
    echo ERROR: TypeScript compilation failed
    exit /b 1
)
echo SUCCESS: Type check passed
echo.

echo Step 2: Build
echo -----------------------------------
call node_modules\.bin\next build
if errorlevel 1 (
    echo ERROR: Build failed
    exit /b 1
)
echo SUCCESS: Build completed
echo.

echo ====================================
echo All checks passed!
echo ====================================
