# Cloudflare credentials — one-time local setup
$example = Join-Path $PSScriptRoot "..\.env.cloudflare.local.example"
$target = Join-Path $PSScriptRoot "..\.env.cloudflare.local"

if (-not (Test-Path $target)) {
  Copy-Item $example $target
  Write-Host "Created .env.cloudflare.local — token ထည့်ပြီး save လုပ်ပါ"
  notepad $target
  exit 0
}

Write-Host "Found .env.cloudflare.local — running upload..."
Set-Location (Join-Path $PSScriptRoot "..")
npm run upload:apk
