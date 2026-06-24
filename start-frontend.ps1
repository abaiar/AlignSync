# AlignSync Frontend Startup Script
Write-Host "Starting AlignSync Frontend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"
# Install dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
npm install
# Start dev server
Write-Host "Starting Next.js dev server at http://localhost:3000" -ForegroundColor Green
npm run dev
