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

Write-Host "Server booting!." -ForegroundColor Green
