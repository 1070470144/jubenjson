@echo off
setlocal enabledelayedexpansion

set SCRIPT_DIR=%~dp0
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start-dev.ps1" %*

endlocal
