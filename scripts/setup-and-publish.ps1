# uwu-deck: one-shot setup for Windows PowerShell.
# Run from the project folder:  powershell -ExecutionPolicy Bypass -File scripts\setup-and-publish.ps1
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)

function Need($cmd, $hint) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$cmd not found. $hint" }
}
Need node 'Install Node.js 20 LTS or newer from https://nodejs.org'
Need npm  'It ships with Node.js.'
Need git  'Install Git from https://git-scm.com/download/win'

Write-Host "Node $(node -v), npm $(npm -v)"
$major = [int]((node -v).TrimStart('v').Split('.')[0])
if ($major -lt 18) { throw 'Node 18 or newer is required (20 LTS recommended).' }

Write-Host '== Installing dependencies ==' -ForegroundColor Cyan
npm install

Write-Host '== Type check, lint, tests ==' -ForegroundColor Cyan
npm run typecheck
npm run lint
npm test

Write-Host '== Production build ==' -ForegroundColor Cyan
npm run build

# --- GitHub ---
$publish = Read-Host 'Create the GitHub repo "uwu-deck" and push now? (y/n)'
if ($publish -ne 'y') {
  Write-Host 'Skipped publishing. Start the app with: npm run dev' -ForegroundColor Yellow
  exit 0
}

if (-not (Test-Path .git)) { git init -b main }
git add -A
git commit -m "feat: initial uwu-deck dashboard" 2>$null

if (Get-Command gh -ErrorAction SilentlyContinue) {
  gh auth status 2>$null
  if ($LASTEXITCODE -ne 0) { gh auth login }
  $vis = Read-Host 'Visibility: public or private?'
  if ($vis -ne 'private') { $vis = 'public' }
  gh repo create uwu-deck --$vis --source=. --remote=origin --push
} else {
  Write-Host 'GitHub CLI (gh) not found.' -ForegroundColor Yellow
  Write-Host '1) Create an empty repo named uwu-deck at https://github.com/new (no README/license).'
  $user = Read-Host '2) Enter your GitHub username'
  git remote add origin "https://github.com/$user/uwu-deck.git" 2>$null
  git branch -M main
  git push -u origin main
}
Write-Host 'Done. Start the app with: npm run dev' -ForegroundColor Green
