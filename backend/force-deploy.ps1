# Force deploy Lambda functions

Write-Host "🔧 Force deploying Lambda functions..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Set-Location src/analyze
npm install --silent
Set-Location ../history
npm install --silent
Set-Location ../location
npm install --silent
Set-Location ../..

# Step 2: Build
Write-Host "🏗️  Building..." -ForegroundColor Yellow
sam build

# Step 3: Force update by changing template version
$templatePath = "template.yaml"
$content = Get-Content $templatePath -Raw
$newVersion = "v1.0." + (Get-Date -Format "HHmmss")
$content = $content -replace "Description: Serverless backend for Pashu Krishi Rakshak v[\d\.]+", "Description: Serverless backend for Pashu Krishi Rakshak $newVersion"
Set-Content $templatePath $content

Write-Host "🚀 Deploying (version $newVersion)..." -ForegroundColor Yellow
sam deploy --no-confirm-changeset

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
