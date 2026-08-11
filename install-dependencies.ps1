$ErrorActionPreference = 'Stop'

Write-Host 'Installing frontend dependencies...'
Set-Location "$PSScriptRoot\frontend"
if (-not (Test-Path 'node_modules')) {
  npm install
} else {
  Write-Host 'Frontend dependencies already installed.'
}

Write-Host 'Installing backend dependencies...'
Set-Location "$PSScriptRoot\backend"
if (-not (Test-Path 'node_modules')) {
  npm install
} else {
  Write-Host 'Backend dependencies already installed.'
}

Write-Host 'Dependencies verified.'
