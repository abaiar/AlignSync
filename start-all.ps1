# AlignSync Full Stack Startup Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AlignSync 车轮定位仪生产协同管理系统" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting backend and frontend..." -ForegroundColor Yellow
Write-Host ""
# Start backend in new window
Start-Process powershell -ArgumentList "-File", "$PSScriptRoot\start-backend.ps1"
# Start frontend in new window
Start-Process powershell -ArgumentList "-File", "$PSScriptRoot\start-frontend.ps1"
Write-Host "Backend: http://localhost:8000 (API docs: http://localhost:8000/docs)" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host ""
Write-Host "Demo accounts (password: 123456):" -ForegroundColor Yellow
Write-Host "  Core Tech: cam_user, sw_admin, biz_staff, fin_staff, qa_staff"
Write-Host "  Manufacturer: purchaser, assembler, mfr_admin"
