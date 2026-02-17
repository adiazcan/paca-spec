# Quickstart: Dataverse Integration & Environment Data Strategy

## 1. Prerequisites

- Node.js LTS (v20+)
- .NET runtime (for PACX global tool)
- Power Platform CLI (`pac`) version 1.51.1+ (for connection references support)
- PACX CLI: `dotnet tool install -g Greg.Xrm.Command`
- Access to a Power Platform environment with Dataverse enabled
- Browser profile signed into Entra ID tenant account
- Power Automate license for Cloud Flow creation
- `@microsoft/power-apps` SDK (included via `pac code init`)

## 2. Dataverse Table Provisioning

### 2a. Authenticate and select environment

```powershell
pac auth create --environment "<ENVIRONMENT_NAME_OR_URL>"
pac env select --environment "<ENVIRONMENT_ID>"
```

### 2b. Run the provisioning script

The provisioning script uses [PACX](https://github.com/neronotte/Greg.Xrm.Command) (Greg.Xrm.Command), a .NET global tool that extends PAC CLI with Dataverse schema provisioning commands. It creates all custom tables, global choices, columns, and lookup relationships.

```powershell
# Install PACX (one-time)
dotnet tool install -g Greg.Xrm.Command

# From the repository root
.\scripts\provision-dataverse-tables.ps1
```

Optional parameters:
```powershell
.\scripts\provision-dataverse-tables.ps1 -SolutionName "MyCustomSolution"
```

The script executes 6 steps using PACX commands:
1. Verifies PACX is installed (`pacx --version`)
2. Creates 8 global choices via `pacx optionset create`
3. Creates 4 custom tables via `pacx table create`
4. Adds all columns (String, Money, DateTime, Choice, WholeNumber, Memo) via `pacx column create`
5. Creates 3 one-to-many lookup relationships via `pacx rel create n1`
6. Publishes customizations via `pacx publish all`

PACX uses the active PAC CLI auth profile — no additional authentication setup required.

**Key PACX commands used:**
- `pacx optionset create -n "Name" -o "Label1:Value1,Label2:Value2" -s Solution`
- `pacx table create --name "Table" --schemaName "prefix_table" --solution Solution`
- `pacx column create -t tableName -n "Column" --type <String|Memo|Money|DateTime|Integer|Picklist> -s Solution`
- `pacx rel create n1 -c childTable -p parentTable -s Solution`
- `pacx publish all`

### 2c. Verify provisioning

The script verifies all entities after creation. For additional manual verification:
- Open [Power Apps Maker Portal](https://make.powerapps.com/) → Tables → confirm all 4 `paca_*` tables
- Create and retrieve a test row for each table to confirm column correctness

## 3. Add Dataverse Data Sources to the Code App

```powershell
cd apps/event-approval-codeapp

# Add each table as a Dataverse data source
pac code add-data-source -a dataverse -t paca_eventapprovalrequest
pac code add-data-source -a dataverse -t paca_approvaldecision
pac code add-data-source -a dataverse -t paca_requesthistoryentry
pac code add-data-source -a dataverse -t paca_statusnotification
```

This generates typed model and service files under `src/generated/services/` and `src/generated/models/`.

## 4. Add Office 365 Users Connector (Entra ID Identity)

### 4a. Create or identify the connection

Go to [Power Apps Connections](https://make.powerapps.com/) → Connections → ensure an Office 365 Users connection exists.

### 4b. Get connection metadata

```powershell
pac connection list
```

Note the Connection ID and API Name (`shared_office365users`).

### 4c. Add to code app

```powershell
pac code add-data-source -a "shared_office365users" -c "<connectionId>"
```

This generates `Office365UsersModel.ts` and `Office365UsersService.ts`.

## 5. Security Role Setup

### 5a. Create "Event Approver" security role

In the Power Platform Admin Center or maker portal:
1. Create a new security role named "Event Approver"
2. Grant **organization-level read** on `paca_eventapprovalrequest`
3. Grant **user-level create** on `paca_approvaldecision` and `paca_requesthistoryentry`
4. Grant **user-level write** on `paca_eventapprovalrequest` (status and version fields)
5. Default employee access: user-level read/create on own rows only

### 5b. Assign role to approver users

Assign the "Event Approver" role to designated approver accounts via the Admin Center.

## 6. Power Automate Cloud Flow Setup

### 6a. Create the notification flow

1. In Power Automate, create a new Cloud Flow
2. Trigger: "When a row is added, modified or deleted" on `paca_eventapprovalrequest`
3. Filter: `paca_status` changed to `approved` (2) or `rejected` (3)
4. Actions:
   - Get submitter details using the `paca_submitterid` field
   - Post an adaptive card or message to the submitter via Teams
   - Create a `paca_statusnotification` row with `channel = teams`, `deliveryStatus = sent`
5. Error handling:
   - On failure, create a `paca_statusnotification` row with `deliveryStatus = failed`

## 7. Local Development (Mock Mode)

```powershell
$env:VITE_APP_DATA_MODE = "mock"
npm run dev
```

Mock mode uses `MockDataProvider` with in-memory fixture data. No Dataverse access.

## 8. Dev Environment (Dataverse Mode)

```powershell
$env:VITE_APP_DATA_MODE = "dataverse"
npm run dev
```

Requires authenticated PAC CLI session and Dataverse tables provisioned per steps 2–3.

## 9. Build and Publish

```powershell
npm run build | pac code push
```

In the deployed environment, `VITE_APP_DATA_MODE` defaults to `dataverse` via build configuration.

## 10. Quality Gates (must pass)

```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:contract
npm run test:e2e:smoke
```

## 11. Manual Acceptance Checklist

- [ ] All four Dataverse tables exist with correct columns and choice values
- [ ] Lookup relationships between child and parent tables are functional
- [ ] Employee can submit a request; record appears in Dataverse with correct Entra ID identity
- [ ] Employee can only see their own requests
- [ ] Approver (with "Event Approver" role) sees all submitted requests
- [ ] Approver can approve/reject; decision, status update, and history entry are created
- [ ] Version conflict is detected when two approvers attempt to decide the same request
- [ ] Power Automate Cloud Flow fires on status change and delivers Teams notification
- [ ] Notification row is created in `paca_statusnotification` with correct delivery status
- [ ] Local mock mode returns fixture data with no Dataverse calls
- [ ] Loading, error, and empty states display correctly in both modes

## 12. Performance Validation Targets

| Operation                        | Local (mock) | Dev (Dataverse) |
|----------------------------------|-------------|-----------------|
| Request submit p95               | < 2s        | < 5s            |
| Dashboard load p95               | < 3s        | < 5s            |
| Decision record p95              | < 2s        | < 5s            |
| History retrieval p95            | < 1s        | < 3s            |
| Notification delivery (end-to-end)| N/A        | < 120s          |

## 13. Release-Readiness Checklist

1. Run all quality gates in Section 10.
2. Verify smoke e2e: employee submit → approver decision → notification delivery.
3. Confirm optimistic concurrency conflict scenario is covered in integration tests.
4. Confirm `DataverseDataProvider` passes all contract tests against the OpenAPI spec.
5. Confirm traceability matrix in `checklists/requirements.md` covers FR-001..FR-016.
