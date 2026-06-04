# run_schema.ps1 — Run schema.sql against a Postgres connection string
# Usage (interactive):
#   .\run_schema.ps1
# Usage (env var):
#   $env:SUPABASE_DB_URL = 'postgresql://user:pass@host:5432/dbname'
#   .\run_schema.ps1

param(
  [string]$Conn = $env:SUPABASE_DB_URL
)

if (-not $Conn) {
  Write-Host "No connection string found in SUPABASE_DB_URL." -ForegroundColor Yellow
  $Conn = Read-Host "Paste Supabase Postgres connection string (format: postgresql://user:pass@host:port/dbname)"
}

if (-not $Conn) {
  Write-Error "No connection string provided. Aborting."
  exit 1
}

# Ensure psql is available
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
  Write-Error "psql not found. Please install PostgreSQL client tools and ensure 'psql' is in your PATH."
  exit 1
}

$schemaPath = Join-Path -Path (Split-Path -Parent $MyInvocation.MyCommand.Definition) -ChildPath 'schema.sql'
if (-not (Test-Path $schemaPath)) {
  Write-Error "schema.sql not found at: $schemaPath"
  exit 1
}

Write-Host "Running schema.sql against: $Conn" -ForegroundColor Cyan
# Execute schema
psql $Conn -f $schemaPath

if ($LASTEXITCODE -eq 0) {
  Write-Host "Schema applied successfully." -ForegroundColor Green
} else {
  Write-Error "psql exited with code $LASTEXITCODE"
}
