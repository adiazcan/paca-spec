<#
.SYNOPSIS
    Provisions Dataverse custom tables, global choices, columns, and relationships
    for the Event Approval Workflow application using PACX CLI.

.DESCRIPTION
    This script creates the complete schema defined in specs/002-dataverse-integration/data-model.md:
      - 8 global choices (option sets)
      - 4 custom tables with all columns
      - 3 one-to-many lookup relationships
    
    It uses PACX (Greg.Xrm.Command), a .NET global tool that extends PAC CLI with
    schema provisioning commands. Authenticates via the active PAC CLI auth profile.
    
    Prerequisites:
      - PAC CLI authenticated: pac auth create --environment <env>
      - PACX installed: dotnet tool install -g Greg.Xrm.Command
    
    The script is safe to re-run — PACX will error on existing entities.
    Use -ErrorAction Continue per step if idempotency is needed.

.PARAMETER SolutionName
    The unique name of the Dataverse solution to associate entities with.
    Defaults to "PacaEventApproval".

.EXAMPLE
    .\provision-dataverse-tables.ps1
    .\provision-dataverse-tables.ps1 -SolutionName "MyCustomSolution"
#>

param(
    [string]$SolutionName = "PacaEventApproval",
    [string]$PublisherPrefix = "paca"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$S = $SolutionName

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Dataverse Table Provisioning — Event Approval Workflow  " -ForegroundColor Green
Write-Host "  Using PACX (Greg.Xrm.Command)                         " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

# ─── Step 0: Verify PACX is installed ───

Write-Host "[0/6] Verifying PACX installation..." -ForegroundColor White
$pacxVersion = & pacx --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  PACX not found. Install with: dotnet tool install -g Greg.Xrm.Command" -ForegroundColor Red
    exit 1
}
Write-Host "  PACX version: $pacxVersion" -ForegroundColor Gray
Write-Host "  Solution: $S" -ForegroundColor Gray
Write-Host ""

# ─── Step 0.5: Ensure target solution exists ───

Write-Host "[0.5/6] Ensuring Dataverse solution '$S' exists..." -ForegroundColor White
$pacExe = Join-Path $env:USERPROFILE ".dotnet\tools\pac.exe"
if (-not (Test-Path $pacExe)) {
    $pacExe = "pac"
}

$solutionListOutput = & $pacExe solution list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Failed to list solutions using PAC CLI." -ForegroundColor Red
    Write-Host "  Output: $solutionListOutput" -ForegroundColor Red
    exit 1
}

$solutionExists = ($solutionListOutput | Out-String) -match "(?im)^\s*$([regex]::Escape($S))\s+"
if (-not $solutionExists) {
    $publisherUniqueName = ("{0}Publisher" -f $S) -replace "[^A-Za-z0-9]", ""
    $publisherFriendlyName = "$S Publisher"
    Write-Host "  Solution not found. Creating solution '$S' with publisher prefix '$PublisherPrefix'..." -ForegroundColor Yellow
    $createOutput = & pacx solution create -n $S -un $S -puf $publisherFriendlyName -pun $publisherUniqueName -pp $PublisherPrefix 2>&1
    if ($LASTEXITCODE -ne 0) {
        $createOutputText = $createOutput | Out-String
        if ($createOutputText -match "(?i)already exists") {
            Write-Host "  Solution '$S' already exists (detected during create). Continuing..." -ForegroundColor Gray
        } else {
            Write-Host "  Failed to create solution '$S'." -ForegroundColor Red
            Write-Host "  Output: $createOutputText" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "  Solution '$S' created." -ForegroundColor Gray
    }
} else {
    Write-Host "  Solution '$S' already exists." -ForegroundColor Gray
}
Write-Host ""

# ─── Step 1: Create Global Choices (Option Sets) ───

Write-Host "[1/6] Creating global choices..." -ForegroundColor White

pacx optionset create -n "Role Type" --schemaName "paca_roletype" `
    -o "Speaker:0,Organizer:1,Assistant:2" -s $S

pacx optionset create -n "Transportation Mode" --schemaName "paca_transportationmode" `
    -o "Air:0,Rail:1,Car:2,Bus:3,Other:4" -s $S

pacx optionset create -n "Request Status" --schemaName "paca_requeststatus" `
    -o "Draft:0,Submitted:1,Approved:2,Rejected:3" -s $S

pacx optionset create -n "Decision Type" --schemaName "paca_decisiontype" `
    -o "Approved:0,Rejected:1" -s $S

pacx optionset create -n "History Event Type" --schemaName "paca_historyeventtype" `
    -o "Submitted:0,Approved:1,Rejected:2,Commented:3,Notification Sent:4,Stale Detected:5" -s $S

pacx optionset create -n "Actor Role" --schemaName "paca_actorrole" `
    -o "Employee:0,Approver:1,System:2" -s $S

pacx optionset create -n "Notification Channel" --schemaName "paca_notificationchannel" `
    -o "In App:0,Email:1,Teams:2" -s $S

pacx optionset create -n "Notification Delivery Status" --schemaName "paca_notificationdeliverystatus" `
    -o "Queued:0,Sent:1,Failed:2" -s $S

Write-Host ""

# ─── Step 2: Create Tables ───

Write-Host "[2/6] Creating tables..." -ForegroundColor White

pacx table create --name "Event Approval Request" --schemaName "paca_eventapprovalrequest" `
    --primaryAttributeName "Request Number" --primaryAttributeSchemaName "paca_requestnumber" `
    --primaryAttributeMaxLength 100 --solution $S

pacx table create --name "Approval Decision" --schemaName "paca_approvaldecision" `
    --primaryAttributeName "Approver Display Name" --primaryAttributeSchemaName "paca_approverdisplayname" `
    --primaryAttributeMaxLength 200 --solution $S

pacx table create --name "Request History Entry" --schemaName "paca_requesthistoryentry" `
    --primaryAttributeName "Actor ID" --primaryAttributeSchemaName "paca_actorid" `
    --primaryAttributeMaxLength 100 --solution $S

pacx table create --name "Status Notification" --schemaName "paca_statusnotification" `
    --primaryAttributeName "Recipient ID" --primaryAttributeSchemaName "paca_recipientid" `
    --primaryAttributeMaxLength 100 --solution $S

Write-Host ""

# ─── Step 3: Add Columns to Tables ───

Write-Host "[3/6] Adding columns to tables..." -ForegroundColor White

# --- paca_eventapprovalrequest columns ---
Write-Host "  Table: paca_eventapprovalrequest" -ForegroundColor White

pacx column create -t paca_eventapprovalrequest -n "Submitter ID" --schemaName paca_submitterid `
    --len 100 -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Submitter Display Name" --schemaName paca_submitterdisplayname `
    --len 200 -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Event Name" --schemaName paca_eventname `
    --len 200 -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Event Website" --schemaName paca_eventwebsite `
    --len 500 --stringFormat Url -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Origin" --schemaName paca_origin `
    --len 150 -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Destination" --schemaName paca_destination `
    --len 150 -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Currency Code" --schemaName paca_currencycode `
    --len 3 -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Role" --schemaName paca_role `
    --type Picklist --globalOptionSetName paca_roletype -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Transportation Mode" --schemaName paca_transportationmode `
    --type Picklist --globalOptionSetName paca_transportationmode -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Status" --schemaName paca_status `
    --type Picklist --globalOptionSetName paca_requeststatus -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Registration Fee" --schemaName paca_registrationfee `
    --type Money -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Travel Cost" --schemaName paca_travelcost `
    --type Money -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Hotel Cost" --schemaName paca_hotelcost `
    --type Money -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Meals Cost" --schemaName paca_mealscost `
    --type Money -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Other Expenses" --schemaName paca_otherexpenses `
    --type Money -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Total Cost" --schemaName paca_totalcost `
    --type Money -r ApplicationRequired -s $S

pacx column create -t paca_eventapprovalrequest -n "Submitted At" --schemaName paca_submittedat `
    --type DateTime -s $S

pacx column create -t paca_eventapprovalrequest -n "Version" --schemaName paca_version `
    --type Integer --min 1 --max 2147483647 -r ApplicationRequired -s $S

# --- paca_approvaldecision columns ---
Write-Host "  Table: paca_approvaldecision" -ForegroundColor White

pacx column create -t paca_approvaldecision -n "Approver ID" --schemaName paca_approverid `
    --len 100 -r ApplicationRequired -s $S

pacx column create -t paca_approvaldecision -n "Decision Type" --schemaName paca_decisiontype `
    --type Picklist --globalOptionSetName paca_decisiontype -r ApplicationRequired -s $S

pacx column create -t paca_approvaldecision -n "Comment" --schemaName paca_comment `
    --type Memo --len 2000 -r ApplicationRequired -s $S

pacx column create -t paca_approvaldecision -n "Decided At" --schemaName paca_decidedat `
    --type DateTime -r ApplicationRequired -s $S

# --- paca_requesthistoryentry columns ---
Write-Host "  Table: paca_requesthistoryentry" -ForegroundColor White

pacx column create -t paca_requesthistoryentry -n "Event Type" --schemaName paca_eventtype `
    --type Picklist --globalOptionSetName paca_historyeventtype -r ApplicationRequired -s $S

pacx column create -t paca_requesthistoryentry -n "Actor Role" --schemaName paca_actorrole `
    --type Picklist --globalOptionSetName paca_actorrole -r ApplicationRequired -s $S

pacx column create -t paca_requesthistoryentry -n "Comment" --schemaName paca_comment `
    --type Memo --len 2000 -s $S

pacx column create -t paca_requesthistoryentry -n "Metadata" --schemaName paca_metadata `
    --type Memo --len 4000 -s $S

pacx column create -t paca_requesthistoryentry -n "Occurred At" --schemaName paca_occurredat `
    --type DateTime -r ApplicationRequired -s $S

# --- paca_statusnotification columns ---
Write-Host "  Table: paca_statusnotification" -ForegroundColor White

pacx column create -t paca_statusnotification -n "Channel" --schemaName paca_channel `
    --type Picklist --globalOptionSetName paca_notificationchannel -r ApplicationRequired -s $S

pacx column create -t paca_statusnotification -n "Payload" --schemaName paca_payload `
    --type Memo --len 4000 -r ApplicationRequired -s $S

pacx column create -t paca_statusnotification -n "Delivery Status" --schemaName paca_deliverystatus `
    --type Picklist --globalOptionSetName paca_notificationdeliverystatus -r ApplicationRequired -s $S

pacx column create -t paca_statusnotification -n "Sent At" --schemaName paca_sentat `
    --type DateTime -s $S

Write-Host ""

# ─── Step 4: Create Lookup Relationships ───

Write-Host "[4/6] Creating lookup relationships..." -ForegroundColor White

# N:1 from approvaldecision → eventapprovalrequest
pacx rel create n1 -c paca_approvaldecision -p paca_eventapprovalrequest `
    --lookupDisplayName "Request" --lookupSchemaName paca_requestid `
    --cascadeDelete Restrict -s $S

# N:1 from requesthistoryentry → eventapprovalrequest
pacx rel create n1 -c paca_requesthistoryentry -p paca_eventapprovalrequest `
    --lookupDisplayName "Request" --lookupSchemaName paca_requestid `
    --cascadeDelete Restrict -s $S

# N:1 from statusnotification → eventapprovalrequest
pacx rel create n1 -c paca_statusnotification -p paca_eventapprovalrequest `
    --lookupDisplayName "Request" --lookupSchemaName paca_requestid `
    --cascadeDelete Restrict -s $S

Write-Host ""

# ─── Step 5: Publish Customizations ───

Write-Host "[5/6] Publishing customizations..." -ForegroundColor White
pacx publish all
Write-Host ""

# ─── Step 6: Verification ───

Write-Host "[6/6] Provisioning complete." -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Provisioning complete.                                  " -ForegroundColor Green
Write-Host "  Verify in Power Apps Maker Portal → Tables.             " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Next steps:" -ForegroundColor White
Write-Host "  1. Open https://make.powerapps.com/ → Tables" -ForegroundColor Gray
Write-Host "  2. Confirm 4 paca_* tables and their columns" -ForegroundColor Gray
Write-Host "  3. Run: pac code add-data-source -a dataverse -t paca_eventapprovalrequest" -ForegroundColor Gray
Write-Host ""
