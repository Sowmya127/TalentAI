<#
  perf-report.ps1 — turn Gatling run stats into an HTML report and compare the
  latest run against a saved baseline to detect performance degradation.

  Usage (from anywhere):
    powershell -ExecutionPolicy Bypass -File D:\TalentAI\LoadTests\perf-report.ps1 -SaveBaseline
        -> saves the latest Gatling run as the baseline (the "previous run")
    powershell -ExecutionPolicy Bypass -File D:\TalentAI\LoadTests\perf-report.ps1
        -> compares the latest run to the baseline and writes the HTML report

  Reads <run>/js/global_stats.json (produced by every `mvn gatling:test`).
#>
param(
  [switch]$SaveBaseline,
  [string]$Baseline   = "$PSScriptRoot\baseline\global_stats.json",
  [string]$Out        = "$PSScriptRoot\..\Docs\load-test-comparison.html",
  [string]$GatlingDir = "$PSScriptRoot\target\gatling",
  [double]$ThresholdPct = 10.0
)

function Get-Metrics([string]$statsPath) {
  $g = Get-Content $statsPath -Raw | ConvertFrom-Json
  $total = [int]$g.numberOfRequests.total
  $ko    = [int]$g.numberOfRequests.ko
  [pscustomobject]@{
    Requests   = $total
    Ok         = [int]$g.numberOfRequests.ok
    Ko         = $ko
    ErrorPct   = if ($total -gt 0) { [math]::Round(100.0 * $ko / $total, 2) } else { 0 }
    MeanMs     = [int]$g.meanResponseTime.total
    P95Ms      = [int]$g.percentiles3.total
    P99Ms      = [int]$g.percentiles4.total
    MaxMs      = [int]$g.maxResponseTime.total
    Throughput = [math]::Round([double]$g.meanNumberOfRequestsPerSecond.total, 2)
  }
}

# --- locate the latest Gatling run ---
$latest = Get-ChildItem $GatlingDir -Directory -ErrorAction SilentlyContinue |
          Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $latest) { Write-Error "No Gatling run found under $GatlingDir. Run 'mvn gatling:test' first."; exit 1 }
$curStats = Join-Path $latest.FullName 'js\global_stats.json'
if (-not (Test-Path $curStats)) { Write-Error "No global_stats.json in $($latest.Name)."; exit 1 }
$cur = Get-Metrics $curStats

# --- save-baseline mode ---
if ($SaveBaseline) {
  New-Item -ItemType Directory -Force -Path (Split-Path $Baseline) | Out-Null
  Copy-Item $curStats $Baseline -Force
  "Baseline saved from run '$($latest.Name)': p95=$($cur.P95Ms)ms mean=$($cur.MeanMs)ms err=$($cur.ErrorPct)%" | Write-Host
  exit 0
}

$hasBaseline = Test-Path $Baseline
$base = if ($hasBaseline) { Get-Metrics $Baseline } else { $null }

function Row([string]$label, $b, $c, [string]$unit, [bool]$higherIsWorse) {
  if ($null -eq $b) {
    return "<tr><td>$label</td><td>&mdash;</td><td>$c$unit</td><td>&mdash;</td></tr>"
  }
  $delta = [math]::Round([double]($c - $b), 2)
  $pct = if ($b -ne 0) { [math]::Round(100.0 * $delta / $b, 1) } else { 0 }
  $worse = if ($higherIsWorse) { $delta -gt 0 } else { $delta -lt 0 }
  $cls = if ([math]::Abs($pct) -lt 1) { 'flat' } elseif ($worse) { 'worse' } else { 'better' }
  $sign = if ($delta -gt 0) { '+' } else { '' }
  return "<tr><td>$label</td><td>$b$unit</td><td>$c$unit</td><td class='$cls'>$sign$delta$unit ($sign$pct%)</td></tr>"
}

# --- degradation verdict ---
$degraded = @()
if ($hasBaseline) {
  if ($base.P95Ms  -gt 0 -and $cur.P95Ms  -gt $base.P95Ms  * (1 + $ThresholdPct/100)) { $degraded += "p95 up >$ThresholdPct%" }
  if ($base.MeanMs -gt 0 -and $cur.MeanMs -gt $base.MeanMs * (1 + $ThresholdPct/100)) { $degraded += "mean up >$ThresholdPct%" }
  if ($cur.ErrorPct -gt $base.ErrorPct + 1) { $degraded += "error rate up" }
  if ($base.Throughput -gt 0 -and $cur.Throughput -lt $base.Throughput * (1 - $ThresholdPct/100)) { $degraded += "throughput down >$ThresholdPct%" }
}
$verdictText = if (-not $hasBaseline) { 'BASELINE ESTABLISHED' } elseif ($degraded.Count -eq 0) { 'NO DEGRADATION' } else { 'DEGRADED' }
$verdictCls  = if (-not $hasBaseline) { 'neutral' } elseif ($degraded.Count -eq 0) { 'pass' } else { 'fail' }
$verdictNote = if ($degraded.Count -gt 0) { "Regressions: " + ($degraded -join ', ') + " (threshold ${ThresholdPct}%)." } else { "" }

$rows = @(
  (Row 'Requests'          $(if($base){$base.Requests}else{$null})   $cur.Requests   ''      $false),
  (Row 'Errors'            $(if($base){$base.Ko}else{$null})         $cur.Ko         ''      $true),
  (Row 'Error rate'        $(if($base){$base.ErrorPct}else{$null})   $cur.ErrorPct   '%'     $true),
  (Row 'Mean response'     $(if($base){$base.MeanMs}else{$null})     $cur.MeanMs     'ms'    $true),
  (Row 'p95 response'      $(if($base){$base.P95Ms}else{$null})      $cur.P95Ms      'ms'    $true),
  (Row 'p99 response'      $(if($base){$base.P99Ms}else{$null})      $cur.P99Ms      'ms'    $true),
  (Row 'Max response'      $(if($base){$base.MaxMs}else{$null})      $cur.MaxMs      'ms'    $true),
  (Row 'Throughput'        $(if($base){$base.Throughput}else{$null}) $cur.Throughput ' req/s' $false)
) -join "`n"

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
$html = @"
<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TalentAI &mdash; Load Test Comparison</title>
<style>
:root{--navy:#14213D;--amber:#FCA311;--cream:#FDF6EC;--card:#fff;--line:#E7E1D5;--slate:#5C6784;--green:#16A34A;--red:#DC2626;}
body{margin:0;background:var(--cream);color:var(--navy);font-family:'Segoe UI',system-ui,Arial,sans-serif}
.wrap{max-width:820px;margin:0 auto;padding:32px 20px 56px}
header{background:var(--navy);color:#fff;border-radius:16px;padding:26px 30px}
header .eyebrow{color:var(--amber);font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase}
header h1{margin:8px 0 4px;font-size:24px}header p{margin:0;color:rgba(255,255,255,.72);font-size:13px}
.verdict{display:inline-block;margin:20px 0;padding:8px 16px;border-radius:999px;font-weight:800;font-size:14px}
.verdict.pass{background:#E4F4E9;color:var(--green)}.verdict.fail{background:#FBE7E7;color:var(--red)}
.verdict.neutral{background:#E5EDFB;color:#1D4ED8}
.note{color:var(--red);font-size:13px;margin:-8px 0 16px}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{text-align:left;padding:11px 16px;font-size:14px;border-bottom:1px solid var(--line)}
th{background:#F6EFE1;font-size:11.5px;text-transform:uppercase;letter-spacing:.03em}
tr:last-child td{border-bottom:none}
td.worse{color:var(--red);font-weight:700}td.better{color:var(--green);font-weight:700}td.flat{color:var(--slate)}
footer{margin-top:22px;color:var(--slate);font-size:12px}
</style></head><body><div class="wrap">
<header><div class="eyebrow">Gatling &middot; Performance comparison</div>
<h1>Load Test Comparison</h1>
<p>Current run: $($latest.Name) &middot; generated $stamp</p></header>
<div class="verdict $verdictCls">$verdictText</div>
$(if($verdictNote){"<div class='note'>$verdictNote</div>"})
<table><thead><tr><th>Metric</th><th>Baseline (previous)</th><th>Current</th><th>Change</th></tr></thead>
<tbody>
$rows
</tbody></table>
<footer>Baseline: $(if($hasBaseline){Split-Path $Baseline -Leaf}else{'none yet — run with -SaveBaseline to set one'}) &middot;
degradation threshold ${ThresholdPct}% on p95/mean/throughput, +1pt on error rate.<br>
Green = improved, red = regressed (higher is worse for response times/errors; lower is worse for throughput).</footer>
</div></body></html>
"@

New-Item -ItemType Directory -Force -Path (Split-Path $Out) | Out-Null
$html | Out-File -FilePath $Out -Encoding utf8
Write-Host "Verdict: $verdictText"
if ($verdictNote) { Write-Host $verdictNote }
Write-Host "Report written to: $Out"
"CUR p95=$($cur.P95Ms)ms mean=$($cur.MeanMs)ms err=$($cur.ErrorPct)% thru=$($cur.Throughput)req/s" | Write-Host
if ($hasBaseline) { "BASE p95=$($base.P95Ms)ms mean=$($base.MeanMs)ms err=$($base.ErrorPct)% thru=$($base.Throughput)req/s" | Write-Host }
