Add-Type -AssemblyName System.Drawing

function Get-DominantColors([System.Drawing.Bitmap]$bmp, [int]$sampleStep = 4) {
    $colors = @{}
    $width = $bmp.Width
    $height = $bmp.Height
    
    for ($y = 0; $y -lt $height; $y += $sampleStep) {
        for ($x = 0; $x -lt $width; $x += $sampleStep) {
            $px = $bmp.GetPixel($x, $y)
            if ($px.A -lt 200) { continue }
            
            # Quantize to reduce noise
            $qr = [Math]::Round($px.R / 16) * 16
            $qg = [Math]::Round($px.G / 16) * 16
            $qb = [Math]::Round($px.B / 16) * 16
            $key = "$qr,$qg,$qb"
            
            if ($colors.ContainsKey($key)) {
                $colors[$key]++
            } else {
                $colors[$key] = 1
            }
        }
    }
    return $colors
}

function ConvertTo-Hex([int]$r, [int]$g, [int]$b) {
    return "#" + $r.ToString("X2") + $g.ToString("X2") + $b.ToString("X2")
}

function Test-Image([string]$filePath, [string]$label) {
    Write-Host "`n=== $label ===" -ForegroundColor Cyan
    Write-Host "File: $filePath"
    
    $bmp = New-Object System.Drawing.Bitmap($filePath)
    Write-Host "Dimensions: $($bmp.Width)x$($bmp.Height)"
    
    $colors = Get-DominantColors $bmp 4
    $total = ($colors.Values | Measure-Object -Sum).Sum
    $sorted = $colors.GetEnumerator() | Sort-Object -Property Value -Descending | Select-Object -First 20
    
    Write-Host "`nTop 20 colors:"
    foreach ($entry in $sorted) {
        $parts = $entry.Key.Split(',')
        $r = [int]$parts[0]; $g = [int]$parts[1]; $b = [int]$parts[2]
        $hex = ConvertTo-Hex $r $g $b
        $pct = [Math]::Round(($entry.Value / $total) * 100, 1)
        Write-Host "  $hex ($r,$g,$b) - $pct%"
    }
    
    # Horizontal band analysis
    Write-Host "`nHorizontal bands (sampled every 8px):"
    $bands = @(
        @{Name="Top (0-12%)"; Y1=0; Y2=[int]($bmp.Height * 0.12)},
        @{Name="Upper (12-30%)"; Y1=[int]($bmp.Height * 0.12); Y2=[int]($bmp.Height * 0.30)},
        @{Name="UpperMid (30-50%)"; Y1=[int]($bmp.Height * 0.30); Y2=[int]($bmp.Height * 0.50)},
        @{Name="LowerMid (50-70%)"; Y1=[int]($bmp.Height * 0.50); Y2=[int]($bmp.Height * 0.70)},
        @{Name="Lower (70-88%)"; Y1=[int]($bmp.Height * 0.70); Y2=[int]($bmp.Height * 0.88)},
        @{Name="Bottom (88-100%)"; Y1=[int]($bmp.Height * 0.88); Y2=$bmp.Height}
    )
    
    foreach ($band in $bands) {
        $bandColors = @{}
        for ($y = $band.Y1; $y -lt $band.Y2; $y += 8) {
            for ($x = 0; $x -lt $bmp.Width; $x += 8) {
                $px = $bmp.GetPixel($x, $y)
                if ($px.A -lt 200) { continue }
                $qr = [Math]::Round($px.R / 32) * 32
                $qg = [Math]::Round($px.G / 32) * 32
                $qb = [Math]::Round($px.B / 32) * 32
                $key = "$qr,$qg,$qb"
                if ($bandColors.ContainsKey($key)) { $bandColors[$key]++ } else { $bandColors[$key] = 1 }
            }
        }
        $bandTotal = ($bandColors.Values | Measure-Object -Sum).Sum
        $top3 = $bandColors.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 3
        $parts3 = @()
        foreach ($e in $top3) {
            $p = $e.Key.Split(',')
            $hex3 = ConvertTo-Hex ([int]$p[0]) ([int]$p[1]) ([int]$p[2])
            $pct3 = [Math]::Round(($e.Value / $bandTotal) * 100)
            $parts3 += "$hex3 ($pct3%)"
        }
        Write-Host "  $($band.Name): $($parts3 -join ', ')"
    }
    
    # Vertical band analysis
    Write-Host "`nVertical bands (sampled every 8px):"
    $vBands = @(
        @{Name="Left (0-15%)"; X1=0; X2=[int]($bmp.Width * 0.15)},
        @{Name="LeftMid (15-40%)"; X1=[int]($bmp.Width * 0.15); X2=[int]($bmp.Width * 0.40)},
        @{Name="Center (40-60%)"; X1=[int]($bmp.Width * 0.40); X2=[int]($bmp.Width * 0.60)},
        @{Name="RightMid (60-85%)"; X1=[int]($bmp.Width * 0.60); X2=[int]($bmp.Width * 0.85)},
        @{Name="Right (85-100%)"; X1=[int]($bmp.Width * 0.85); X2=$bmp.Width}
    )
    
    foreach ($band in $vBands) {
        $bandColors = @{}
        for ($y = 0; $y -lt $bmp.Height; $y += 8) {
            for ($x = $band.X1; $x -lt $band.X2; $x += 8) {
                $px = $bmp.GetPixel($x, $y)
                if ($px.A -lt 200) { continue }
                $qr = [Math]::Round($px.R / 32) * 32
                $qg = [Math]::Round($px.G / 32) * 32
                $qb = [Math]::Round($px.B / 32) * 32
                $key = "$qr,$qg,$qb"
                if ($bandColors.ContainsKey($key)) { $bandColors[$key]++ } else { $bandColors[$key] = 1 }
            }
        }
        $bandTotal = ($bandColors.Values | Measure-Object -Sum).Sum
        $top3 = $bandColors.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 3
        $parts3 = @()
        foreach ($e in $top3) {
            $p = $e.Key.Split(',')
            $hex3 = ConvertTo-Hex ([int]$p[0]) ([int]$p[1]) ([int]$p[2])
            $pct3 = [Math]::Round(($e.Value / $bandTotal) * 100)
            $parts3 += "$hex3 ($pct3%)"
        }
        Write-Host "  $($band.Name): $($parts3 -join ', ')"
    }
    
    # Blue element detection
    Write-Host "`nBlue element detection (blue where B > R+30 and B > G+20 and B > 120):"
    $blueRegions = @()
    for ($y = 0; $y -lt $bmp.Height; $y += 6) {
        for ($x = 0; $x -lt $bmp.Width; $x += 6) {
            $px = $bmp.GetPixel($x, $y)
            if ($px.B -gt 120 -and ($px.B - $px.R) -gt 30 -and ($px.B - $px.G) -gt 20 -and $px.A -gt 200) {
                $found = $false
                foreach ($region in $blueRegions) {
                    if ([Math]::Abs($region.CenterX - $x) -lt ($bmp.Width * 0.08) -and [Math]::Abs($region.CenterY - $y) -lt ($bmp.Height * 0.04)) {
                        $region.Pixels += @(@{X=$x; Y=$y; R=$px.R; G=$px.G; B=$px.B})
                        $region.CenterX = ($region.Pixels | ForEach-Object { $_.X } | Measure-Object -Average).Average
                        $region.CenterY = ($region.Pixels | ForEach-Object { $_.Y } | Measure-Object -Average).Average
                        $found = $true
                        break
                    }
                }
                if (-not $found) {
                    $blueRegions += @{ Pixels = @(@{X=$x; Y=$y; R=$px.R; G=$px.G; B=$px.B}); CenterX=$x; CenterY=$y }
                }
            }
        }
    }
    
    $sigRegions = $blueRegions | Where-Object { $_.Pixels.Count -gt 5 } | Sort-Object { $_.Pixels.Count } -Descending | Select-Object -First 8
    Write-Host "  Found $($sigRegions.Count) significant blue regions:"
    $i = 0
    foreach ($region in $sigRegions) {
        $i++
        $xPct = [Math]::Round(($region.CenterX / $bmp.Width) * 100)
        $yPct = [Math]::Round(($region.CenterY / $bmp.Height) * 100)
        $avgR = [int](($region.Pixels | ForEach-Object { $_.R } | Measure-Object -Average).Average)
        $avgG = [int](($region.Pixels | ForEach-Object { $_.G } | Measure-Object -Average).Average)
        $avgB = [int](($region.Pixels | ForEach-Object { $_.B } | Measure-Object -Average).Average)
        $hex = ConvertTo-Hex $avgR $avgG $avgB
        Write-Host "  Region $i : at ($xPct%, $yPct%), $($region.Pixels.Count) samples, avg color ~$hex"
    }
    
    # Detect card/panel boundaries - look for white/light regions
    Write-Host "`nLight/White region detection:"
    $lightRegions = @()
    for ($y = 0; $y -lt $bmp.Height; $y += 4) {
        for ($x = 0; $x -lt $bmp.Width; $x += 4) {
            $px = $bmp.GetPixel($x, $y)
            if ($px.R -gt 230 -and $px.G -gt 230 -and $px.B -gt 230 -and $px.A -gt 200) {
                $found = $false
                foreach ($region in $lightRegions) {
                    if ([Math]::Abs($region.CenterX - $x) -lt ($bmp.Width * 0.12) -and [Math]::Abs($region.CenterY - $y) -lt ($bmp.Height * 0.06)) {
                        $region.Pixels += 1
                        $region.CenterX = ($x + $region.CenterX) / 2
                        $region.CenterY = ($y + $region.CenterY) / 2
                        $found = $true
                        break
                    }
                }
                if (-not $found) {
                    $lightRegions += @{ Pixels = 1; CenterX=$x; CenterY=$y }
                }
            }
        }
    }
    $sigLight = $lightRegions | Where-Object { $_.Pixels -gt 10 } | Sort-Object { $_.Pixels } -Descending | Select-Object -First 8
    Write-Host "  Found $($sigLight.Count) significant light regions:"
    $j = 0
    foreach ($region in $sigLight) {
        $j++
        $xPct = [Math]::Round(($region.CenterX / $bmp.Width) * 100)
        $yPct = [Math]::Round(($region.CenterY / $bmp.Height) * 100)
        Write-Host "  Region $j : center at ($xPct%, $yPct%), $($region.Pixels) samples"
    }
    
    $bmp.Dispose()
}

# Analyze all reference images
$files = @(
    @{Path="new IU UPDATE REF.png"; Label="NEW IU UPDATE REF"},
    @{Path="home .png"; Label="HOME"},
    @{Path="mine.png"; Label="MINE"},
    @{Path="profile.png"; Label="PROFILE"},
    @{Path="wallets.png"; Label="WALLETS"}
)

foreach ($f in $files) {
    try {
        Test-Image $f.Path $f.Label
    } catch {
        Write-Host "`nError analyzing $($f.Path): $($_.Exception.Message)" -ForegroundColor Red
    }
}