
# ==============================================
# ITF HUB V2 - ACTUALITZACIO DE GITHUB
# ==============================================

param(
    [string]$Message = "chore: update ITF Hub v2"
)

$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "====================================="
Write-Host " ITF HUB V2 - GITHUB"
Write-Host "====================================="
Write-Host ""

# Comprovar que Git funciona
git --version
if ($LASTEXITCODE -ne 0) {
    throw "Git no esta disponible."
}

# Comprovar la branca
$branch = git branch --show-current

if ($branch -ne "main") {
    throw "La branca actual es '$branch', no 'main'."
}

# Preparar els fitxers
git add .
if ($LASTEXITCODE -ne 0) {
    throw "No s'han pogut preparar els fitxers."
}

# Mostrar els canvis preparats
Write-Host ""
Write-Host "Fitxers preparats:"
git diff --cached --name-only

# Comprovar si hi ha canvis
git diff --cached --quiet

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "No hi ha canvis per publicar."
    exit 0
}

# Confirmar abans de publicar
Write-Host ""
$confirmation = Read-Host "Has revisat els fitxers i confirmes el commit? (s/n)"

if ($confirmation -ne "s") {
    Write-Host "Operacio cancel.lada."
    exit 0
}

# Crear el commit
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    throw "No s'ha pogut crear el commit."
}

# Publicar a GitHub
git push origin main
if ($LASTEXITCODE -ne 0) {
    throw "El commit es local, pero el push ha fallat."
}

Write-Host ""
Write-Host "Actualitzacio publicada correctament!"
Write-Host "https://github.com/Sgallartfanlo/itf-hub"
