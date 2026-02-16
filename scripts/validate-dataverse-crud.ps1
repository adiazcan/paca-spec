param(
    [string]$EnvironmentUrl,
    [switch]$KeepRecords
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-ActiveEnvironmentUrl {
    param([string]$ProvidedUrl)

    if (-not [string]::IsNullOrWhiteSpace($ProvidedUrl)) {
        return $ProvidedUrl.TrimEnd('/')
    }

    $envWhoOutput = pac env who 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to resolve active environment URL from PAC CLI. Output: $envWhoOutput"
    }

    $match = ($envWhoOutput | Out-String) | Select-String -Pattern 'Org URL:\s*(https?://[^\s]+)'
    if (-not $match) {
        throw 'Could not parse Org URL from `pac env who` output.'
    }

    return $match.Matches[0].Groups[1].Value.TrimEnd('/')
}

function Get-DataverseAccessToken {
    param([string]$Resource)

    $token = az account get-access-token --resource "$Resource/" --query accessToken -o tsv 2>&1
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($token)) {
        throw "Failed to acquire Dataverse access token from Azure CLI. Output: $token"
    }

    return $token
}

function Invoke-DataverseRequest {
    param(
        [ValidateSet('GET', 'POST', 'DELETE')]
        [string]$Method,
        [string]$Uri,
        [hashtable]$Headers,
        [object]$Body
    )

    if ($Method -eq 'POST') {
        return Invoke-RestMethod -Method Post -Uri $Uri -Headers $Headers -ContentType 'application/json' -Body ($Body | ConvertTo-Json -Depth 10)
    }

    if ($Method -eq 'DELETE') {
        Invoke-RestMethod -Method Delete -Uri $Uri -Headers $Headers | Out-Null
        return $null
    }

    return Invoke-RestMethod -Method Get -Uri $Uri -Headers $Headers
}

function Assert-Equal {
    param(
        [string]$Label,
        [object]$Actual,
        [object]$Expected
    )

    if ($Actual -ne $Expected) {
        throw "Validation failed for $Label. Expected '$Expected' but got '$Actual'."
    }
}

$orgUrl = Get-ActiveEnvironmentUrl -ProvidedUrl $EnvironmentUrl
$token = Get-DataverseAccessToken -Resource $orgUrl
$apiBase = "$orgUrl/api/data/v9.2"

$headers = @{
    Authorization = "Bearer $token"
    Accept = 'application/json'
    'OData-Version' = '4.0'
    'OData-MaxVersion' = '4.0'
    Prefer = 'return=representation'
}

$runId = [Guid]::NewGuid().ToString('N').Substring(0, 8)
$timestamp = (Get-Date).ToUniversalTime().ToString('o')

$createdIds = [ordered]@{}

try {
    Write-Host "[T011] Using environment: $orgUrl" -ForegroundColor Cyan
    Write-Host "[T011] Run id: $runId" -ForegroundColor Cyan

    $requestPayload = @{
        paca_requestnumber = "T011-$runId"
        paca_submitterid = "employee-$runId"
        paca_submitterdisplayname = "T011 Employee $runId"
        paca_eventname = "T011 Event $runId"
        paca_eventwebsite = "https://example.com/t011/$runId"
        paca_rolecode = 1
        paca_transportationmodecode = 2
        paca_origin = 'Madrid'
        paca_destination = 'Barcelona'
        paca_statuscode = 1
        paca_registrationfee = 100.25
        paca_travelcost = 200.5
        paca_hotelcost = 300.75
        paca_mealscost = 50
        paca_otherexpenses = 20
        paca_currencycode = 'USD'
        paca_totalcost = 671.5
        paca_submittedat = $timestamp
        paca_version = 1
    }

    $request = Invoke-DataverseRequest -Method POST -Uri "$apiBase/paca_eventapprovalrequests?`$select=paca_eventapprovalrequestid,paca_requestnumber,paca_submitterid,paca_eventname,paca_statuscode,paca_totalcost,paca_version" -Headers $headers -Body $requestPayload
    $requestId = $request.paca_eventapprovalrequestid
    if ([string]::IsNullOrWhiteSpace($requestId)) {
        throw 'Create request failed: missing paca_eventapprovalrequestid in response.'
    }
    $createdIds['paca_eventapprovalrequest'] = $requestId

    $approvalPayload = @{
        paca_approverdisplayname = "T011 Approver $runId"
        paca_approverid = "approver-$runId"
        paca_decisiontypecode = 0
        paca_comment = 'Approved in T011 validation run'
        paca_decidedat = $timestamp
        'paca_requestid@odata.bind' = "/paca_eventapprovalrequests($requestId)"
    }

    $approval = Invoke-DataverseRequest -Method POST -Uri "$apiBase/paca_approvaldecisions?`$select=paca_approvaldecisionid,paca_approverid,paca_decisiontypecode,paca_requestid" -Headers $headers -Body $approvalPayload
    $approvalId = $approval.paca_approvaldecisionid
    if ([string]::IsNullOrWhiteSpace($approvalId)) {
        throw 'Create approval decision failed: missing paca_approvaldecisionid in response.'
    }
    $createdIds['paca_approvaldecision'] = $approvalId

    $historyMetadata = @{
        runId = $runId
        source = 'T011'
    } | ConvertTo-Json -Compress

    $historyPayload = @{
        paca_actorid = "system-$runId"
        paca_eventtypecode = 0
        paca_actorrolecode = 2
        paca_comment = 'Submitted event captured by T011'
        paca_metadata = $historyMetadata
        paca_occurredat = $timestamp
        'paca_requestid@odata.bind' = "/paca_eventapprovalrequests($requestId)"
    }

    $history = Invoke-DataverseRequest -Method POST -Uri "$apiBase/paca_requesthistoryentries?`$select=paca_requesthistoryentryid,paca_actorid,paca_eventtypecode,paca_actorrolecode,paca_requestid" -Headers $headers -Body $historyPayload
    $historyId = $history.paca_requesthistoryentryid
    if ([string]::IsNullOrWhiteSpace($historyId)) {
        throw 'Create request history failed: missing paca_requesthistoryentryid in response.'
    }
    $createdIds['paca_requesthistoryentry'] = $historyId

    $notificationBody = @{
        requestId = $requestId
        status = 'approved'
        comment = 'T011'
    } | ConvertTo-Json -Compress

    $notificationPayload = @{
        paca_recipientid = "employee-$runId"
        paca_channelcode = 2
        paca_payload = $notificationBody
        paca_deliverystatuscode = 1
        paca_sentat = $timestamp
        'paca_requestid@odata.bind' = "/paca_eventapprovalrequests($requestId)"
    }

    $notification = Invoke-DataverseRequest -Method POST -Uri "$apiBase/paca_statusnotifications?`$select=paca_statusnotificationid,paca_recipientid,paca_channelcode,paca_deliverystatuscode,paca_requestid" -Headers $headers -Body $notificationPayload
    $notificationId = $notification.paca_statusnotificationid
    if ([string]::IsNullOrWhiteSpace($notificationId)) {
        throw 'Create status notification failed: missing paca_statusnotificationid in response.'
    }
    $createdIds['paca_statusnotification'] = $notificationId

    $requestRead = Invoke-DataverseRequest -Method GET -Uri "$apiBase/paca_eventapprovalrequests($requestId)?`$select=paca_requestnumber,paca_submitterid,paca_statuscode,paca_totalcost,paca_version" -Headers $headers
    Assert-Equal -Label 'Request.requestnumber' -Actual $requestRead.paca_requestnumber -Expected "T011-$runId"
    Assert-Equal -Label 'Request.submitterid' -Actual $requestRead.paca_submitterid -Expected "employee-$runId"
    Assert-Equal -Label 'Request.statuscode' -Actual ([int]$requestRead.paca_statuscode) -Expected 1
    Assert-Equal -Label 'Request.version' -Actual ([int]$requestRead.paca_version) -Expected 1

    $approvalRead = Invoke-DataverseRequest -Method GET -Uri "$apiBase/paca_approvaldecisions($approvalId)?`$select=paca_approverid,paca_decisiontypecode,_paca_requestid_value" -Headers $headers
    Assert-Equal -Label 'Approval.approverid' -Actual $approvalRead.paca_approverid -Expected "approver-$runId"
    Assert-Equal -Label 'Approval.decisiontypecode' -Actual ([int]$approvalRead.paca_decisiontypecode) -Expected 0
    Assert-Equal -Label 'Approval.requestLookup' -Actual $approvalRead._paca_requestid_value -Expected $requestId

    $historyRead = Invoke-DataverseRequest -Method GET -Uri "$apiBase/paca_requesthistoryentries($historyId)?`$select=paca_actorid,paca_eventtypecode,paca_actorrolecode,_paca_requestid_value" -Headers $headers
    Assert-Equal -Label 'History.actorid' -Actual $historyRead.paca_actorid -Expected "system-$runId"
    Assert-Equal -Label 'History.eventtypecode' -Actual ([int]$historyRead.paca_eventtypecode) -Expected 0
    Assert-Equal -Label 'History.actorrolecode' -Actual ([int]$historyRead.paca_actorrolecode) -Expected 2
    Assert-Equal -Label 'History.requestLookup' -Actual $historyRead._paca_requestid_value -Expected $requestId

    $notificationRead = Invoke-DataverseRequest -Method GET -Uri "$apiBase/paca_statusnotifications($notificationId)?`$select=paca_recipientid,paca_channelcode,paca_deliverystatuscode,_paca_requestid_value" -Headers $headers
    Assert-Equal -Label 'Notification.recipientid' -Actual $notificationRead.paca_recipientid -Expected "employee-$runId"
    Assert-Equal -Label 'Notification.channelcode' -Actual ([int]$notificationRead.paca_channelcode) -Expected 2
    Assert-Equal -Label 'Notification.deliverystatuscode' -Actual ([int]$notificationRead.paca_deliverystatuscode) -Expected 1
    Assert-Equal -Label 'Notification.requestLookup' -Actual $notificationRead._paca_requestid_value -Expected $requestId

    Write-Host "[T011] PASS: sample CRUD validated for all 4 tables." -ForegroundColor Green
    Write-Host "[T011] Created record ids:" -ForegroundColor Green
    $createdIds.GetEnumerator() | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray }
}
finally {
    if (-not $KeepRecords) {
        foreach ($entity in @('paca_statusnotification', 'paca_requesthistoryentry', 'paca_approvaldecision', 'paca_eventapprovalrequest')) {
            if ($createdIds.Contains($entity)) {
                $id = $createdIds[$entity]
                $entitySet = "${entity}s"
                Write-Host "[T011] Cleanup: deleting $entity ($id)" -ForegroundColor DarkGray
                try {
                    Invoke-DataverseRequest -Method DELETE -Uri "$apiBase/$entitySet($id)" -Headers $headers -Body $null | Out-Null
                }
                catch {
                    Write-Warning "Failed to delete $entity ($id): $($_.Exception.Message)"
                }
            }
        }
    }
}
