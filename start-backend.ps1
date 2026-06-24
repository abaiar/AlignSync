# AlignSync Backend Startup Script
Write-Host "Starting AlignSync Backend..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\backend"
# Check if .env exists, copy from .env.example if not
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example. Please update database credentials." -ForegroundColor Yellow
}
# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt
# Run database migration
Write-Host "Running database migrations..." -ForegroundColor Cyan
alembic upgrade head
# Seed data
Write-Host "Seeding initial data..." -ForegroundColor Cyan
python -m scripts.seed_data
# Start server
Write-Host "Starting FastAPI server at http://localhost:8000" -ForegroundColor Green
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
