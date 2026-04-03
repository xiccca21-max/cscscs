# Запуск из корня репозитория: .\setup.ps1
# Если скрипт «заблокирован»: один раз Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (-not (Test-Path ".env")) {
    Write-Error "Нет файла .env. Скопируйте .env.example в .env и заполните."
}

npm run setup

Write-Host ""
Write-Host "Готово. Запуск: npm run dev → http://localhost:3000"
