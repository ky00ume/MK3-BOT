# RisuAI Project Build Script
# BOM 자동 제거 버전
$ErrorActionPreference = "Stop"

# BOM 제거 함수
function Read-FileNoBom {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) {
        Write-Host "ERROR: Read-FileNoBom - Path is null or empty!" -ForegroundColor Red
        return ""
    }
    if (-not (Test-Path $Path)) {
        Write-Host "ERROR: Read-FileNoBom - File not found: $Path" -ForegroundColor Red
        return ""
    }
    $bytes = [System.IO.File]::ReadAllBytes($Path)
    # UTF-8 BOM 제거
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $bytes = $bytes[3..($bytes.Length - 1)]
    }
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

# BOM 없이 저장 함수
function Write-FileNoBom {
    param([string]$Path, [string]$Content)
    if ([string]::IsNullOrWhiteSpace($Path)) {
        Write-Host "ERROR: Write-FileNoBom - Path is null or empty!" -ForegroundColor Red
        return
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
    Write-Host "  File written successfully: $Path" -ForegroundColor DarkGray
}

try {
    $baseDir = $PSScriptRoot
    if (-not $baseDir) { $baseDir = Get-Location }
    $risuDir = Join-Path $baseDir "risu"
    if (-not (Test-Path $risuDir)) {
        New-Item -ItemType Directory -Path $risuDir -Force | Out-Null
    }

    function Build-CSS {
        Write-Host "[CSS] Merging..." -ForegroundColor Yellow
        $cssDir = Join-Path $baseDir "css"
        $cssOutput = ""
        if (Test-Path $cssDir) {
            Get-ChildItem "$cssDir\*" -Include "*.txt","*.css" | Sort-Object Name | ForEach-Object {
                Write-Host "  + $($_.Name)" -ForegroundColor Gray
                $cssOutput += (Read-FileNoBom $_.FullName)
            }
            Write-FileNoBom (Join-Path $risuDir "Background_Embedding.txt") $cssOutput
            Write-Host "  >> risu/Background_Embedding.txt DONE!" -ForegroundColor Green
        } else {
            Write-Host "  >> css folder not found" -ForegroundColor Red
        }
        Write-Host ""
    }

    function Build-Lua {
        Write-Host "[Lua] Merging..." -ForegroundColor Yellow
        $luaDir = Join-Path $baseDir "lua"
        $luaOutput = ""
        if (Test-Path $luaDir) {
            Get-ChildItem "$luaDir\*.lua" | Sort-Object Name | ForEach-Object {
                Write-Host "  + $($_.Name)" -ForegroundColor Gray
                $luaOutput += (Read-FileNoBom $_.FullName)
                $luaOutput += "`n`n"
            }
            Write-FileNoBom (Join-Path $risuDir "Lua.txt") $luaOutput
            Write-Host "  >> risu/Lua.txt DONE!" -ForegroundColor Green
        } else {
            Write-Host "  >> lua folder not found" -ForegroundColor Red
        }
        Write-Host ""
    }

    function Build-Regex {
        Write-Host "[Regex] Merging..." -ForegroundColor Yellow
        $regexDir = Join-Path $baseDir "regex"
        $dataList = New-Object System.Collections.Generic.List[string]
        if (Test-Path $regexDir) {
            Get-ChildItem "$regexDir\*.json" | Sort-Object Name | ForEach-Object {
                Write-Host "  + $($_.Name)" -ForegroundColor Gray
                $content = Read-FileNoBom $_.FullName
                $startIdx = $content.IndexOf('"data"')
                $bracketIdx = $content.IndexOf('[', $startIdx)
                $endIdx = $content.LastIndexOf(']')
                if ($endIdx -gt $bracketIdx) {
                    $dataContent = $content.Substring($bracketIdx + 1, $endIdx - $bracketIdx - 1).Trim()
                    if ($dataContent) { $dataList.Add($dataContent) }
                }
            }
            $joined = [string]::Join(",", $dataList)
            $finalJson = '{"type":"regex","data":[' + $joined + ']}'
            Write-FileNoBom (Join-Path $risuDir "regexscript_export.json") $finalJson
            Write-Host "  >> risu/regexscript_export.json DONE!" -ForegroundColor Green
        } else {
            Write-Host "  >> regex folder not found" -ForegroundColor Red
        }
        Write-Host ""
    }

    # UUID 생성 함수
    function New-Guid-String {
        return [guid]::NewGuid().ToString()
    }

    # 폴더 항목 생성 함수
    function New-FolderEntry {
        param([string]$Name, [string]$FolderId)
        return @"
{"key":"$FolderId","comment":"$Name","content":"","mode":"folder","insertorder":100,"alwaysActive":false,"secondkey":"","selective":false,"bookVersion":2}
"@
    }

    # 항목에 folder 속성 추가 함수
    function Add-FolderProperty {
        param([string]$JsonItem, [string]$FolderId)
        if ([string]::IsNullOrWhiteSpace($JsonItem)) {
            return $JsonItem
        }
        # 마지막 }를 찾아서 그 앞에 folder 속성 추가
        $lastBrace = $JsonItem.LastIndexOf('}')
        if ($lastBrace -gt 0) {
            $before = $JsonItem.Substring(0, $lastBrace)
            return $before + ",`"folder`":`"$FolderId`"}"
        }
        return $JsonItem
    }

    function Build-Lorebook {
        Write-Host "[Lorebook] Merging..." -ForegroundColor Yellow
        $lorebookDir = Join-Path $baseDir "lorebook"
        $dataList = New-Object System.Collections.Generic.List[string]

        if (-not (Test-Path $lorebookDir)) {
            Write-Host "  >> lorebook folder not found" -ForegroundColor Red
            Write-Host ""
            return
        }

        try {
            # lorebook/*.json (루트 레벨)
            $rootFiles = Get-ChildItem "$lorebookDir\*.json" -ErrorAction SilentlyContinue
            foreach ($file in $rootFiles) {
                try {
                    Write-Host "  + $($file.Name)" -ForegroundColor Gray
                    $content = Read-FileNoBom $file.FullName
                    $startIdx = $content.IndexOf('"data"')
                    if ($startIdx -ge 0) {
                        $bracketIdx = $content.IndexOf('[', $startIdx)
                        $endIdx = $content.LastIndexOf(']')
                        if ($endIdx -gt $bracketIdx -and $bracketIdx -ge 0) {
                            $dataContent = $content.Substring($bracketIdx + 1, $endIdx - $bracketIdx - 1).Trim()
                            if ($dataContent) { $dataList.Add($dataContent) }
                        }
                    }
                } catch {
                    Write-Host "    ERROR reading $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
                }
            }

            # lorebook/data-* 폴더들 처리 (카테고리별)
            $dataFolders = Get-ChildItem "$lorebookDir\data-*" -Directory -ErrorAction SilentlyContinue
            foreach ($folder in ($dataFolders | Sort-Object Name)) {
                $folderName = $folder.Name
                if ($folderName -match '^data-([a-z]+)$') {
                    $className = (Get-Culture).TextInfo.ToTitleCase($matches[1])

                    $folderId = "folder:" + (New-Guid-String)
                    $folderEntry = New-FolderEntry "DATA_$className" $folderId
                    $dataList.Add($folderEntry)

                    Write-Host "  [DATA_$className]" -ForegroundColor Cyan

                    $files = Get-ChildItem "$($folder.FullName)\*.json" -ErrorAction SilentlyContinue
                    foreach ($file in ($files | Sort-Object Name)) {
                        try {
                            Write-Host "    + $($file.Name)" -ForegroundColor Gray
                            $content = Read-FileNoBom $file.FullName
                            $startIdx = $content.IndexOf('"data"')
                            if ($startIdx -ge 0) {
                                $bracketIdx = $content.IndexOf('[', $startIdx)
                                $endIdx = $content.LastIndexOf(']')
                                if ($endIdx -gt $bracketIdx -and $bracketIdx -ge 0) {
                                    $dataContent = $content.Substring($bracketIdx + 1, $endIdx - $bracketIdx - 1).Trim()
                                    if ($dataContent) {
                                        $dataContentWithFolder = Add-FolderProperty $dataContent $folderId
                                        $dataList.Add($dataContentWithFolder)
                                    }
                                }
                            }
                        } catch {
                            Write-Host "      ERROR reading $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
                        }
                    }
                }
            }

            # lorebook/rp-* 폴더들 처리 (카테고리별)
            $rpFolders = Get-ChildItem "$lorebookDir\rp-*" -Directory -ErrorAction SilentlyContinue
            foreach ($folder in ($rpFolders | Sort-Object Name)) {
                $folderName = $folder.Name
                if ($folderName -match '^rp-([a-z]+)$') {
                    $className = (Get-Culture).TextInfo.ToTitleCase($matches[1])

                    $folderId = "folder:" + (New-Guid-String)
                    $folderEntry = New-FolderEntry "RP_$className" $folderId
                    $dataList.Add($folderEntry)

                    Write-Host "  [RP_$className]" -ForegroundColor Cyan

                    $files = Get-ChildItem "$($folder.FullName)\*.json" -ErrorAction SilentlyContinue
                    foreach ($file in ($files | Sort-Object Name)) {
                        try {
                            Write-Host "    + $($file.Name)" -ForegroundColor Gray
                            $content = Read-FileNoBom $file.FullName
                            $startIdx = $content.IndexOf('"data"')
                            if ($startIdx -ge 0) {
                                $bracketIdx = $content.IndexOf('[', $startIdx)
                                $endIdx = $content.LastIndexOf(']')
                                if ($endIdx -gt $bracketIdx -and $bracketIdx -ge 0) {
                                    $dataContent = $content.Substring($bracketIdx + 1, $endIdx - $bracketIdx - 1).Trim()
                                    if ($dataContent) {
                                        $dataContentWithFolder = Add-FolderProperty $dataContent $folderId
                                        $dataList.Add($dataContentWithFolder)
                                    }
                                }
                            }
                        } catch {
                            Write-Host "      ERROR reading $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
                        }
                    }
                }
            }

            $joined = [string]::Join(",", $dataList)
            $finalJson = '{"type":"risu","ver":1,"data":[' + $joined + ']}'

            $outputPath = Join-Path $risuDir "lorebook_export.json"
            Write-FileNoBom $outputPath $finalJson
            Write-Host "  >> risu/lorebook_export.json DONE!" -ForegroundColor Green
        } catch {
            Write-Host "  >> ERROR: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "  >> ERROR Line: $($_.InvocationInfo.ScriptLineNumber)" -ForegroundColor Red
        }
        Write-Host ""
    }

    function Build-HTML {
        Write-Host "[HTML] Merging..." -ForegroundColor Yellow
        $htmlDir = Join-Path $baseDir "html"
        $htmlOutput = ""
        if (Test-Path $htmlDir) {
            Get-ChildItem "$htmlDir\*.html" | Sort-Object Name | ForEach-Object {
                Write-Host "  + $($_.Name)" -ForegroundColor Gray
                $htmlOutput += (Read-FileNoBom $_.FullName)
                $htmlOutput += "`n"
            }
            Write-FileNoBom (Join-Path $risuDir "first_message.txt") $htmlOutput
            Write-Host "  >> risu/first_message.txt DONE!" -ForegroundColor Green
        } else {
            Write-Host "  >> html folder not found" -ForegroundColor Red
        }
        Write-Host ""
    }

    function Build-Globalnote {
        Write-Host "[Globalnote] Merging..." -ForegroundColor Yellow
        $gnDir = Join-Path $baseDir "globalnote"
        $gnOutput = ""
        if (Test-Path $gnDir) {
            Get-ChildItem "$gnDir\*.txt" | Sort-Object Name | ForEach-Object {
                Write-Host "  + $($_.Name)" -ForegroundColor Gray
                $gnOutput += (Read-FileNoBom $_.FullName)
                $gnOutput += "`n`n"
            }
            Write-FileNoBom (Join-Path $risuDir "globalnote.txt") $gnOutput
            Write-Host "  >> risu/globalnote.txt DONE!" -ForegroundColor Green
        } else {
            Write-Host "  >> globalnote folder not found" -ForegroundColor Red
        }
        Write-Host ""
    }

    while ($true) {
        Clear-Host
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  RisuAI Project Build Script (No BOM)" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "  [1] CSS    [2] Lua    [3] Regex" -ForegroundColor Yellow
        Write-Host "  [4] Lore   [5] HTML   [6] Global" -ForegroundColor Yellow
        Write-Host "  [7] ALL    [0] Exit" -ForegroundColor Green
        Write-Host ""
        $choice = Read-Host "Choice"

        if ($choice -eq "0") { break }

        Write-Host ""
        switch ($choice) {
            "1" { Build-CSS }
            "2" { Build-Lua }
            "3" { Build-Regex }
            "4" { Build-Lorebook }
            "5" { Build-HTML }
            "6" { Build-Globalnote }
            "7" { Build-CSS; Build-Lua; Build-Regex; Build-Lorebook; Build-HTML; Build-Globalnote }
        }
        Write-Host "Press any key..." -ForegroundColor DarkGray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host
}
