<#
.SYNOPSIS
    Assigns the "Event Approver" security role to designated users in the Dataverse environment.

.DESCRIPTION
    This script helps assign the Event Approver security role to test users for the Event Approval application.
    
    Note: Security role assignment in Dataverse is typically done through the Power Platform admin center UI.
    This script provides guidance and example commands for advanced scenarios using PowerShell modules.
    
    Prerequisites:
    - "Event Approver" security role already created (use provision-security-roles.ps1 guidance)
    - Power Platform admin access to the target environment
    - User principal names (emails) of approvers to assign

.PARAMETER EnvironmentUrl
    The URL of the target Dataverse environment (e.g., https://org.crm.dynamics.com)

.PARAMETER ApproverEmails
    Array of user email addresses (UPN) to assign the Event Approver role

.EXAMPLE
    .\assign-event-approver-role.ps1 -ApproverEmails @("approver1@contoso.com", "approver2@contoso.com")
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$EnvironmentUrl,
    
    [Parameter(Mandatory=$false)]
    [string[]]$ApproverEmails = @()
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Event Approval - Assign Event Approver Role" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host @"
⚠️  ROLE ASSIGNMENT GUIDANCE

Security role assignment in Dataverse is managed through the Power Platform admin center.
Follow these steps to assign the "Event Approver" role to designated users:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 1: Power Platform Admin Center (Recommended)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Navigate to: https://admin.powerplatform.microsoft.com
2. Select your environment
3. Go to Settings > Users + permissions > Users
4. Search for the user by name or email
5. Select the user and click "Manage security roles"
6. Check the "Event Approver" role
7. Click "Save"

Repeat for each approver.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 2: Dataverse Maker Portal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Navigate to: https://make.powerapps.com
2. Select your environment (top right)
3. Click Settings (gear icon) > Advanced settings
4. Go to Settings > Security > Users
5. Select the user
6. Click "Manage Roles" in the ribbon
7. Check "Event Approver"
8. Click "OK"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METHOD 3: PowerShell SDK (Advanced)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For scripted/automated role assignment, use the Microsoft.Xrm.Data.PowerShell module:

"@ -ForegroundColor White

if ($ApproverEmails.Count -gt 0) {
    Write-Host "`nApprovers to assign:" -ForegroundColor Yellow
    foreach ($email in $ApproverEmails) {
        Write-Host "  - $email" -ForegroundColor White
    }
    Write-Host ""
}

Write-Host @"
# Install required module
Install-Module Microsoft.Xrm.Data.PowerShell -Scope CurrentUser -Force

# Connect to Dataverse environment
`$conn = Connect-CrmOnline -InteractiveMode

# Find the Event Approver role
`$roles = Get-CrmRecords -conn `$conn -EntityLogicalName role ``
    -FilterAttribute name -FilterOperator eq -FilterValue "Event Approver"

if (`$roles.Count -eq 0) {
    Write-Error "Event Approver role not found. Create it first using provision-security-roles.ps1"
    exit 1
}

`$roleId = `$roles.CrmRecords[0].roleid

# Assign role to each user
"@ -ForegroundColor Gray

if ($ApproverEmails.Count -gt 0) {
    Write-Host "`n# Assign to specified approvers" -ForegroundColor Gray
    foreach ($email in $ApproverEmails) {
        Write-Host @"
`$user = Get-CrmRecords -conn `$conn -EntityLogicalName systemuser ``
    -FilterAttribute domainname -FilterOperator eq -FilterValue "$email"
if (`$user.Count -gt 0) {
    Add-CrmSecurityRoleToUser -conn `$conn ``
        -UserId `$user.CrmRecords[0].systemuserid ``
        -SecurityRoleId `$roleId
    Write-Host "✓ Assigned Event Approver role to $email"
} else {
    Write-Warning "User not found: $email"
}
"@ -ForegroundColor Gray
    }
} else {
    Write-Host @"
`$users = @("approver1@contoso.com", "approver2@contoso.com")
foreach (`$email in `$users) {
    `$user = Get-CrmRecords -conn `$conn -EntityLogicalName systemuser ``
        -FilterAttribute domainname -FilterOperator eq -FilterValue `$email
    if (`$user.Count -gt 0) {
        Add-CrmSecurityRoleToUser -conn `$conn ``
            -UserId `$user.CrmRecords[0].systemuserid ``
            -SecurityRoleId `$roleId
        Write-Host "✓ Assigned Event Approver role to `$email"
    } else {
        Write-Warning "User not found: `$email"
    }
}
"@ -ForegroundColor Gray
}

Write-Host @"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VERIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After assigning roles, verify:

□ User appears in Power Platform admin center with "Event Approver" role
□ User can access the approver dashboard in the application
□ User can see all submitted requests (not just their own)
□ User can approve/reject requests
□ Regular employees (without the role) cannot access approver features

Test Users Recommended Setup:
- At least 1 user with "Event Approver" role (for approver testing)
- At least 2 users without "Event Approver" role (for employee isolation testing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"@ -ForegroundColor White

Write-Host "✓ Role assignment guidance displayed" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "1. Follow the method above that best fits your workflow" -ForegroundColor White
Write-Host "2. Verify role assignments in Power Platform admin center" -ForegroundColor White
Write-Host "3. Run integration tests to validate row-level access`n" -ForegroundColor White

exit 0
