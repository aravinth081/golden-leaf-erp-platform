@echo off
echo Starting Golden Leaf Finance dev server...
set "PROJECT_DIR=%~dp0"
subst Z: /d >nul 2>&1
subst Z: "%PROJECT_DIR%" >nul 2>&1
if exist Z:\ (
    cd /d Z:\
    npm run dev
) else (
    cd /d "%PROJECT_DIR%"
    npm run dev
)
