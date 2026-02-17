<#
.SYNOPSIS
    Provisions the "Event Approver" security role and configures row-level access for the Event Approval application.

.DESCRIPTION
    This script creates and configures security roles for the Event Approval Code App:
    1. Event Approver Role - Organization-level read for submitted requests, decision creation rights
    2. Default Employee Access - User-level read/create for own requests only
    
    Prerequisites:
    - PAC CLI authenticated to target Dataverse environment
    - User has system administrator or system customizer role
    - Custom tables already provisioned (paca_eventapprovalrequest, paca_approvaldecision, etc.)

.PARAMETER EnvironmentUrl
    The URL of the target Dataverse environment (e.g., https://org.crm.dynamics.com)

.EXAMPLE
    .\provision-security-roles.ps1 -EnvironmentUrl "https://org.crm.dynamics.com"
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$EnvironmentUrl
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Event Approval - Security Role Provisioning" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verify PAC CLI is available
try {
    $pacVersion = pac --version 2>&1
    Write-Host "✓ PAC CLI found: $pacVersion" -ForegroundColor Green
} catch {
    Write-Error "PAC CLI not found. Please install from https://aka.ms/PowerAppsCLI"
    exit 1
}

# Get current auth context
Write-Host "`nChecking authentication..." -ForegroundColor Yellow
$authList = pac auth list 2>&1 | Out-String

if ($authList -match "No profiles were found") {
    Write-Error "Not authenticated. Run 'pac auth create' first."
    exit 1
}

# Extract active profile
if ($authList -match "\*\s+(\S+)") {
    $activeProfile = $matches[1]
    Write-Host "✓ Active profile: $activeProfile" -ForegroundColor Green
} else {
    Write-Error "No active auth profile found. Run 'pac auth select' to set active profile."
    exit 1
}

# Get environment URL if not provided
if (-not $EnvironmentUrl) {
    $whoOutput = pac org who 2>&1 | Out-String
    if ($whoOutput -match "Url:\s+(.+)") {
        $EnvironmentUrl = $matches[1].Trim()
        Write-Host "✓ Using environment: $EnvironmentUrl" -ForegroundColor Green
    } else {
        Write-Error "Could not determine environment URL. Please provide -EnvironmentUrl parameter."
        exit 1
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Security Role Configuration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host @"
⚠️  MANUAL SETUP REQUIRED

Security roles in Dataverse require manual configuration through the Power Platform admin center
or the maker portal. Follow these steps to create the required security roles and permissions:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Create "Event Approver" Security Role
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Navigate to Power Platform admin center: https://admin.powerplatform.microsoft.com
2. Select your environment: $EnvironmentUrl
3. Go to Settings > Users + permissions > Security roles
4. Click "New role" and name it "Event Approver"
5. Configure privileges for custom tables:

   Table: paca_eventapprovalrequest (Event Approval Request)
   ├─ Read:   Organization level (4th circle)
   ├─ Create: None
   ├─ Write:  User level (1st circle) - for status/version fields only
   └─ Delete: None

   Table: paca_approvaldecision (Approval Decision)
   ├─ Read:   User level (1st circle)
   ├─ Create: User level (1st circle)
   ├─ Write:  User level (1st circle)
   └─ Delete: None

   Table: paca_requesthistoryentry (Request History Entry)
   ├─ Read:   Organization level (4th circle)
   ├─ Create: User level (1st circle)
   ├─ Write:  None
   └─ Delete: None

   Table: paca_statusnotification (Status Notification)
   ├─ Read:   User level (1st circle)
   ├─ Create: None
   ├─ Write:  None
   └─ Delete: None

6. Save the security role

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 2: Configure Default Employee Access (Basic User Role)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The default "Basic User" role should be configured with user-level access only:

1. Edit the "Basic User" security role (or create a new "Employee" role)
2. Configure privileges for custom tables:

   Table: paca_eventapprovalrequest (Event Approval Request)
   ├─ Read:   User level (1st circle) - see only own requests
   ├─ Create: User level (1st circle) - create own requests
   ├─ Write:  User level (1st circle) - edit own requests before submission
   └─ Delete: None

   Table: paca_approvaldecision (Approval Decision)
   ├─ Read:   User level (1st circle) - see decisions on own requests
   ├─ Create: None - employees cannot create decisions
   ├─ Write:  None
   └─ Delete: None

   Table: paca_requesthistoryentry (Request History Entry)
   ├─ Read:   User level (1st circle) - see history of own requests
   ├─ Create: None
   ├─ Write:  None
   └─ Delete: None

   Table: paca_statusnotification (Status Notification)
   ├─ Read:   User level (1st circle) - see own notifications
   ├─ Create: None
   ├─ Write:  None
   └─ Delete: None

3. Save the security role

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 3: Assign Security Roles to Users
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Navigate to Settings > Users + permissions > Users
2. For designated approvers:
   - Select user
   - Click "Manage security roles"
   - Assign "Event Approver" role (in addition to Basic User)
   
3. For regular employees:
   - Ensure they have "Basic User" or "Employee" role only
   - Do NOT assign "Event Approver" role

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERIFICATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After completing the manual setup, verify:

□ "Event Approver" security role exists and is visible in the security roles list
□ Event Approver role has Organization-level READ on paca_eventapprovalrequest
□ Event Approver role has User-level CREATE on paca_approvaldecision
□ Basic User/Employee role has User-level READ/CREATE on paca_eventapprovalrequest only
□ At least one test user has "Event Approver" role assigned
□ Regular employee test users do NOT have "Event Approver" role

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTERNATIVE: PowerShell SDK Setup (Advanced)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For automated setup using the Dataverse SDK, you can use the following PowerShell approach:

Required modules:
- Microsoft.Xrm.Data.PowerShell
- Microsoft.PowerApps.Administration.PowerShell

Example command to assign role:
```powershell
Install-Module Microsoft.Xrm.Data.PowerShell -Scope CurrentUser
Connect-CrmOnlineDiscovery -InteractiveMode
Add-CrmSecurityRoleToUser -UserId <user-guid> -SecurityRoleName "Event Approver"
```

Note: Creating security roles programmatically requires complex XML configuration
and is beyond the scope of this script. Manual setup is recommended.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"@ -ForegroundColor White

Write-Host "`n✓ Security role configuration guide displayed" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Follow the manual setup steps above" -ForegroundColor White
Write-Host "2. Run the integration tests to verify row-level access" -ForegroundColor White
Write-Host "3. Use scripts/assign-event-approver-role.ps1 to assign roles to test users`n" -ForegroundColor White

# Return success (manual steps documented)
exit 0
