param()

$manifest = Get-Content manifest.json | ConvertFrom-Json
$pluginId = $manifest.id
$version = $manifest.version
$releaseDir = Join-Path (Get-Location) 'release'
$stageDir = Join-Path $releaseDir ($pluginId + '-' + $version)
$zipPath = Join-Path $releaseDir ($pluginId + '-' + $version + '.zip')
$shaPath = Join-Path $releaseDir ($pluginId + '-' + $version + '.sha256.txt')

if (Test-Path $stageDir) { Remove-Item -Recurse -Force $stageDir }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
if (Test-Path $shaPath) { Remove-Item -Force $shaPath }

New-Item -ItemType Directory -Force -Path $stageDir | Out-Null
Copy-Item -Force main.js, manifest.json, styles.css -Destination $stageDir
Compress-Archive -Path (Join-Path $stageDir '*') -DestinationPath $zipPath -CompressionLevel Optimal

$sha256 = [System.Security.Cryptography.SHA256]::Create()
$stream = [System.IO.File]::OpenRead($zipPath)
try {
  $hashBytes = $sha256.ComputeHash($stream)
} finally {
  $stream.Dispose()
  $sha256.Dispose()
}
$hash = ([System.BitConverter]::ToString($hashBytes)).Replace('-', '')
Set-Content -Path $shaPath -Value ($hash + ' *' + $pluginId + '-' + $version + '.zip')

Write-Host 'Created release package:' $zipPath
Write-Host 'SHA256:' $hash
