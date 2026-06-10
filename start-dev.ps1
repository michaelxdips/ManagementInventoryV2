$ErrorActionPreference = "Continue"

Write-Host "Cleaning up old processes..." -ForegroundColor Cyan
# Kill processes holding port 3000 (Backend)
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "Killing zombie backend process..." -ForegroundColor Yellow
    $port3000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

# Kill processes holding frontend ports
$frontendPorts = @(5173, 4173)
foreach ($port in $frontendPorts) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        Write-Host "Killing zombie frontend process on port $port..." -ForegroundColor Yellow
        $connections | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
    }
}

# ── Auto-detect best local IPv4 (skip APIPA 169.254.x.x, loopback, prefer smaller subnet) ──
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -ne "127.0.0.1" -and
    -not $_.IPAddress.StartsWith("169.254") -and
    $_.PrefixOrigin -ne "WellKnown"
} | Sort-Object PrefixLength -Descending | Select-Object -First 1).IPAddress

if (-not $localIP) {
    Write-Host "[WARN] Tidak ada jaringan aktif terdeteksi. Menggunakan localhost." -ForegroundColor Red
    $localIP = "localhost"
}

# ── Auto-update frontend/.env ──
$frontendEnvPath = "$PSScriptRoot\frontend\.env"
$frontendEnvContent = "VITE_API_BASE_URL=http://${localIP}:3000/api`nVITE_LOCAL_IP=$localIP"
Set-Content -Path $frontendEnvPath -Value $frontendEnvContent -Encoding UTF8
Write-Host "  [OK] frontend/.env diupdate: API -> http://${localIP}:3000/api" -ForegroundColor DarkGray

# ── Auto-update backend CORS_ORIGINS ──
$backendEnvPath = "$PSScriptRoot\backend\.env"
$backendEnvRaw = Get-Content $backendEnvPath -Raw
$newCors = "CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://${localIP}:5173"
$backendEnvRaw = $backendEnvRaw -replace "CORS_ORIGINS=.*", $newCors
Set-Content -Path $backendEnvPath -Value $backendEnvRaw.TrimEnd() -Encoding UTF8
Write-Host "  [OK] backend/.env CORS diupdate: $newCors" -ForegroundColor DarkGray

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Inventory System - Network Access Info  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Local:    http://localhost:5173" -ForegroundColor White
if ($localIP -ne "localhost") {
    Write-Host "  Hotspot:  http://${localIP}:5173  <-- buka di HP" -ForegroundColor Green
    Write-Host "  Pastikan HP terhubung ke hotspot yang sama!" -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Starting Inventory System..." -ForegroundColor Cyan
$wt = Get-Command wt.exe -ErrorAction SilentlyContinue

if ($wt) {
    Write-Host "Windows Terminal detected! Opening split-pane..." -ForegroundColor Yellow
    wt.exe new-tab -d "$PSScriptRoot\backend" cmd /k "title Backend Server && set DB_SSL=false && npm run dev" `; split-pane -d "$PSScriptRoot\frontend" cmd /k "title Frontend Server && npm run dev"
}
else {
    Write-Host "Opening Split Command Prompt..." -ForegroundColor Yellow
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Backend Server && cd `"$PSScriptRoot\backend`" && set DB_SSL=false && npm run dev"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Frontend Server && cd `"$PSScriptRoot\frontend`" && npm run dev"
}

Write-Host "Server booting! Tunggu ~5 detik lalu buka URL di atas." -ForegroundColor Green
