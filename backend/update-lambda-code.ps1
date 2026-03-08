# Update Lambda function code directly (bypasses CloudFormation)

Write-Host "Update Lambda Function Code" -ForegroundColor Cyan
Write-Host ""

$region = "us-east-1"

# Get function names
$analyzeFn = "pashu-krishi-rakshak-app-AnalyzeFunction-ZbbkBQ5ZTJEK"
$historyFn = "pashu-krishi-rakshak-app-HistoryFunction-vd54DFHCkPgk"
$locationFn = "pashu-krishi-rakshak-app-LocationFunction-qdndIsAQVrZo"

# Create zip files from build output
Write-Host "Creating deployment packages..." -ForegroundColor Yellow

# Analyze function
Write-Host "  - AnalyzeFunction..." -ForegroundColor Gray
Set-Location .aws-sam/build/AnalyzeFunction
Compress-Archive -Path * -DestinationPath ../AnalyzeFunction.zip -Force
Set-Location ../../..

# History function
Write-Host "  - HistoryFunction..." -ForegroundColor Gray
Set-Location .aws-sam/build/HistoryFunction
Compress-Archive -Path * -DestinationPath ../HistoryFunction.zip -Force
Set-Location ../../..

# Location function
Write-Host "  - LocationFunction..." -ForegroundColor Gray
Set-Location .aws-sam/build/LocationFunction
Compress-Archive -Path * -DestinationPath ../LocationFunction.zip -Force
Set-Location ../../..

Write-Host ""
Write-Host "Updating Lambda functions..." -ForegroundColor Cyan

# Update Analyze function
Write-Host "  - Updating AnalyzeFunction..." -ForegroundColor Yellow
aws lambda update-function-code --function-name $analyzeFn --zip-file fileb://.aws-sam/build/AnalyzeFunction.zip --region $region --no-cli-pager | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Success" -ForegroundColor Green
}

# Update History function
Write-Host "  - Updating HistoryFunction..." -ForegroundColor Yellow
aws lambda update-function-code --function-name $historyFn --zip-file fileb://.aws-sam/build/HistoryFunction.zip --region $region --no-cli-pager | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Success" -ForegroundColor Green
}

# Update Location function
Write-Host "  - Updating LocationFunction..." -ForegroundColor Yellow
aws lambda update-function-code --function-name $locationFn --zip-file fileb://.aws-sam/build/LocationFunction.zip --region $region --no-cli-pager | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "    Success" -ForegroundColor Green
}

Write-Host ""
Write-Host "Done! Test at: https://main.dz4umnvfh0vrz.amplifyapp.com" -ForegroundColor Green
