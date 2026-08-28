$path = 'C:\Users\user\Downloads\CM Hash\frontend\app\terms\page.tsx'
$t = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$t = $t.Replace(([string][char]0x00E2) + ([string][char]0x20AC) + ([string][char]0x2122), ([string][char]0x2019))
$t = $t.Replace(([string][char]0x00E2) + ([string][char]0x20AC) + ([string][char]0x009D), ([string][char]0x201D))
[System.IO.File]::WriteAllText($path, $t, (New-Object System.Text.UTF8Encoding($false)))
$check = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
$bad = [regex]::Matches($check, '\u00e2\u20ac[\u201d\u2019\u0153\u201c\u009d\u2122]|\ufffd')
Write-Output ("remaining mojibake: " + $bad.Count)
