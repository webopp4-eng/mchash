$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $root 'frontend'
$adminUrl = 'http://localhost:3001'

Write-Host 'Checking frontend dependencies...'
if (-not (Test-Path (Join-Path $frontendDir 'node_modules'))) {
  Write-Host 'Dependency folder not found. Running install-dependencies.ps1...'
  & (Join-Path $root 'install-dependencies.ps1')
}

$env:NEXT_PUBLIC_API_URL = 'https://mchash.onrender.com'
$env:NEXT_PUBLIC_RENDER_API_URL = 'https://mchash.onrender.com'
$env:NEXT_PUBLIC_ADMIN_API_URL = 'https://mchash.onrender.com'
$env:NEXT_PUBLIC_DEPLOY_MODE = 'local-admin'
$env:NEXT_PUBLIC_ADMIN_PANEL_LOCAL_ONLY = 'true'
$env:NEXT_PUBLIC_ALLOWED_ADMIN_ORIGIN = 'http://localhost:3001'
$env:NEXT_PUBLIC_ADMIN_ORIGIN = 'http://localhost:3001'
$env:NEXT_PUBLIC_ADMIN_LOCAL_URL = 'http://localhost:3001'
$env:NEXT_PUBLIC_ADMIN_ROLE_REQUIRED = 'admin'

Set-Location $frontendDir
Write-Host 'Starting local admin application...'
Start-Process -FilePath 'npm' -ArgumentList 'run', 'dev', '--', '-H', 'localhost', '-p', '3001' -WorkingDirectory $frontendDir

Start-Sleep -Seconds 2
Write-Host "Opening local admin URL: $adminUrl"
Start-Process $adminUrl

Write-Host 'Admin app is starting locally on http://localhost:3001'
