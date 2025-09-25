param(
    [switch]$Reinstall,
    [int]$PortClint = 3000,
    [int]$PortAdmin = 3001,
    [switch]$OpenBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Ensure-Tool($name) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        throw "Missing dependency: $name is not installed."
    }
}

function Ensure-Deps($appPath) {
    Push-Location $appPath
    try {
        if ($Reinstall -or -not (Test-Path -Path 'node_modules')) {
            Write-Host "[deps] install $appPath" -ForegroundColor Cyan
            npm i --no-fund --no-audit | Out-Host
        } else {
            Write-Host "[deps] exists, skip $appPath" -ForegroundColor DarkGray
        }
    } finally {
        Pop-Location
    }
}

function Next-FreePort([int]$startPort) {
    $p = $startPort
    while ($true) {
        $ok = Test-NetConnection -ComputerName localhost -Port $p -InformationLevel Quiet
        if (-not $ok) { return $p }
        $p++
    }
}

function Wait-Port([int]$port, [int]$timeoutSec = 25) {
    $deadline = (Get-Date).AddSeconds($timeoutSec)
    while ((Get-Date) -lt $deadline) {
        $ok = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
        if ($ok) { return $true }
        Start-Sleep -Milliseconds 500
    }
    return $false
}

function Start-App($appPath, [int]$desiredPort, $title) {
    $port = Next-FreePort $desiredPort
    $root = Split-Path -Parent $appPath
    $logName = if ($title -eq 'clint') { 'clint-dev.log' } else { 'admin-dev.log' }
    $logPath = Join-Path $root $logName

    $cmd = "/c cd /d `"$appPath`" && npm run dev -- --port $port --host > `"$logPath`" 2>&1"
    Write-Host "[start] $title -> http://localhost:$port" -ForegroundColor Green
    Start-Process -FilePath cmd.exe -ArgumentList $cmd -WorkingDirectory $appPath -WindowStyle Normal | Out-Null

    if (Wait-Port -port $port -timeoutSec 25) {
        if ($OpenBrowser) {
            try { Start-Process "http://localhost:$port" | Out-Null } catch {}
        }
    } else {
        Write-Host "[warn] port $port not ready, tail logs: $logPath" -ForegroundColor Yellow
        if (Test-Path $logPath) { Get-Content $logPath -Tail 80 | Out-Host }
    }

    return $port
}

# 1) checks
Ensure-Tool node
Ensure-Tool npm

# 2) paths
$Root = Split-Path -Parent $PSCommandPath
$Clint = Join-Path $Root 'clint'
$Admin = Join-Path $Root 'admin'
if (-not (Test-Path $Clint)) { throw "Path not found: $Clint" }
if (-not (Test-Path $Admin)) { throw "Path not found: $Admin" }

# 3) deps
Ensure-Deps $Clint
Ensure-Deps $Admin

# 4) start apps
$pc = Start-App $Clint $PortClint 'clint'
$pa = Start-App $Admin $PortAdmin 'admin'

Write-Host ""
Write-Host "Started:" -ForegroundColor Yellow
Write-Host (" - clint:  http://localhost:{0}" -f $pc)
Write-Host (" - admin:  http://localhost:{0}" -f $pa)
Write-Host "If a port is in use, script picks the next free one." -ForegroundColor DarkGray
