# Rebuild and deploy backend with fresh dependencies

Write-Host "🔧 Rebuilding Lambda functions with dependencies..." -ForegroundColor Cyan
Write-Host ""

# Install dependencies for each Lambda function
Write-Host "📦 Installing dependencies for analyze function..." -ForegroundColor Yellow
Set-Location src/analyze
npm install
Set-Location ../..

Write-Host "📦 Installing dependencies for history function..." -ForegroundColor Yellow
Set-Location src/history
npm install
Set-Location ../..

Write-Host "📦 Installing dependencies for location function..." -ForegroundColor Yellow
Set-Location src/location
npm install
Set-Location ../..

Write-Host ""
Write-Host "🏗️  Building SAM application..." -ForegroundColor Cyan
sam build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🚀 Deploying to AWS (forcing update)..." -ForegroundColor Cyan
sam deploy --no-confirm-changeset --force-upload

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor White
    Write-Host "1. Test the app: https://main.dz4umnvfh0vrz.amplifyapp.com" -ForegroundColor Gray
    Write-Host "2. Try uploading an image for diagnosis" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
