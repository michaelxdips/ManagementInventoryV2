# setup-network.ps1
# Jalankan SEKALI sebagai Administrator untuk setup jaringan hotspot
# Klik kanan file ini -> "Run with PowerShell" sebagai Admin

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Jaringan Hotspot - Inventory    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Cek apakah running sebagai Admin
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[ERROR] Script ini harus dijalankan sebagai Administrator!" -ForegroundColor Red
    Write-Host "        Klik kanan file ini -> Run as Administrator" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "[1/4] Membuka port Frontend (5173)..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="Inventory-Frontend-5173" 2>&1 | Out-Null
netsh advfirewall firewall add rule name="Inventory-Frontend-5173" dir=in action=allow protocol=TCP localport=5173 profile=private,public
Write-Host "      Port 5173 (Frontend) - OK" -ForegroundColor Green

Write-Host "[2/4] Membuka port Backend (3000)..." -ForegroundColor Yellow
netsh advfirewall firewall delete rule name="Inventory-Backend-3000" 2>&1 | Out-Null
netsh advfirewall firewall add rule name="Inventory-Backend-3000" dir=in action=allow protocol=TCP localport=3000 profile=private,public
Write-Host "      Port 3000 (Backend)  - OK" -ForegroundColor Green

# ── KRITIS: Ubah Wi-Fi profile ke Private ──
# Windows memblokir koneksi masuk di jaringan Public meski firewall rule sudah ada!
Write-Host "[3/4] Mengatur Wi-Fi Network Profile ke Private..." -ForegroundColor Yellow
$wifiProfile = Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -eq "Wi-Fi" } | Select-Object -First 1
if ($wifiProfile) {
    if ($wifiProfile.NetworkCategory -ne "Private") {
        Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
        Write-Host "      Wi-Fi '$($wifiProfile.Name)' -> Private - OK" -ForegroundColor Green
        Write-Host "      [INFO] Ini perlu diulang setiap ganti hotspot baru!" -ForegroundColor DarkYellow
    } else {
        Write-Host "      Wi-Fi sudah Private - OK" -ForegroundColor Green
    }
} else {
    Write-Host "      [SKIP] Tidak ada koneksi Wi-Fi aktif" -ForegroundColor DarkGray
}

Write-Host "[4/4] Mendeteksi IP Hotspot..." -ForegroundColor Yellow
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -ne "127.0.0.1" -and
    -not $_.IPAddress.StartsWith("169.254") -and
    $_.PrefixOrigin -ne "WellKnown"
} | Sort-Object PrefixLength -Descending | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Selesai!                        " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
if ($localIP) {
    Write-Host ""
    Write-Host "  Buka di HP (hotspot yang sama):" -ForegroundColor White
    Write-Host "  --> http://${localIP}:5173" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  CATATAN: Jika ganti hotspot, jalankan" -ForegroundColor Yellow
    Write-Host "  setup-network.ps1 lagi sebagai Admin!" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Sekarang jalankan start-dev.ps1 seperti biasa" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

pause
