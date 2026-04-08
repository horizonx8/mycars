# Build frontend
Write-Host "Building frontend..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed" -ForegroundColor Red; exit 1 }

# Start backend (serves built frontend + API)
Write-Host "Starting server at http://localhost:8000" -ForegroundColor Green
Set-Location backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
