# Research: Dataverse Integration & Environment Data Strategy

## Decision 1: Dataverse connection via PAC CLI `pac code add-data-source` (not raw Web API)

- **Decision**: Use the Power Apps SDK generated services/models pattern. Add each Dataverse table as a data source with `pac code add-data-source -a dataverse -t <table-logical-name>`, which auto-generates typed `*Model.ts` and `*Service.ts` files under `src/generated/services/`.
- **Rationale**: The official Code Apps architecture (https://learn.microsoft.com/en-us/power-apps/developer/code-apps/architecture) shows that the Power Apps SDK manages connector communication through generated models/services. The Dataverse how-to guide (https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-dataverse) confirms CRUD operations are performed through generated `*Service.create()`, `.get()`, `.getAll()`, `.update()`, `.delete()` methods — not direct Web API HTTP calls.
- **Alternatives considered**:
  - Direct Dataverse Web API calls via `fetch()`: rejected because Code Apps runtime proxies connector traffic through the Power Apps host; direct HTTP calls would bypass authentication and not work at runtime.
  - Dataverse OData SDK package: rejected because Code Apps have their own SDK layer (`@microsoft/power-apps`) that wraps connectors.

## Decision 2: Dataverse table provisioning via PACX CLI (`Greg.Xrm.Command`)

- **Decision**: Create custom Dataverse tables, columns, global choices, and relationships using PACX — a .NET global tool that extends PAC CLI with schema provisioning commands. The provisioning script (`scripts/provision-dataverse-tables.ps1`) calls PACX commands sequentially.
- **Rationale**: PAC CLI has **no `pac table create` command**. PACX ([Greg.Xrm.Command](https://github.com/neronotte/Greg.Xrm.Command)) fills this gap with declarative one-liner commands:
  - `pacx table create --name "Table Name" --solution SolutionName` — creates tables with auto-generated schema names
  - `pacx column create -t tableName -n columnName --type <String|Memo|Money|DateTime|Integer|Boolean|Picklist>` — adds typed columns with full argument support (maxLength, min/max, format, requiredLevel, globalOptionSetName, precision, etc.)
  - `pacx optionset create -n "Choice Name" -o "Label1:Value1,Label2:Value2" -s SolutionName` — creates global choices with explicit values
  - `pacx rel create n1 -c childTable -p parentTable -s SolutionName` — creates N:1 relationships with auto-created lookup columns
  - `pacx publish all` — publishes all customizations
  - `pacx script table --tableName "table" --customPrefixs "paca_"` — reverse-engineers existing tables into PACX scripts (for documentation/migration)
  - Auth: shares PAC CLI auth profiles natively (`pac auth create` / `pac auth select`)
  - Install: `dotnet tool install -g Greg.Xrm.Command`
  - Project: MIT license, 136 stars, 71 releases (latest Dec 2025), actively maintained
- **Alternatives considered**:
  - PAC CLI `pac table create`: **does not exist** — PAC CLI is for auth, data sources, solution export/import, and code push only.
  - Custom PowerShell script calling Dataverse Web API metadata endpoints (`POST EntityDefinitions`, `POST Attributes`, etc.): viable and fully functional, but produces ~500 lines of raw JSON payload construction vs ~60 PACX one-liners. Higher maintenance burden and error-prone OData metadata JSON.
  - PAC-MCP tools: inspected available commands — no entity creation tools exist.
  - Power Apps maker portal UI: viable for one-off but not scriptable/repeatable; rejected.
  - Solution XML export/import: viable for ALM promotion but requires initial manual creation; not suitable for first-time provisioning.
  - Dataverse SDK for .NET (`Microsoft.Xrm.Sdk`): viable but heavier dependency than PACX global tool.

## Decision 3: Cost fields embedded on `paca_eventapprovalrequest` (no separate CostEstimate table)

- **Decision**: Embed Registration Fee, Travel Cost, Hotel Cost, Meals, Other Expenses, Currency Code, and Total as direct columns on `paca_eventapprovalrequest`. Do not create a separate `paca_costestimate` table.
- **Rationale**: Clarified in the spec session — the user chose embedded cost columns to simplify the schema and avoid an extra 1:1 join. The original `001` data model had a separate `CostEstimate` entity, but the `002` spec explicitly states cost fields are embedded directly.
- **Alternatives considered**:
  - Separate `paca_costestimate` table with 1:1 lookup: rejected per user clarification in spec.

## Decision 4: Entra ID user identity via Office 365 Users connector

- **Decision**: Add the Office 365 Users connector as a data source using `pac code add-data-source -a "shared_office365users" -c <connectionId>`. Use the generated `Office365UsersService.MyProfile_V2()` to resolve the signed-in user's `id` and `displayName` at runtime.
- **Rationale**: The "Connect to data" documentation (https://learn.microsoft.com/en-us/power-apps/developer/code-apps/how-to/connect-to-data) shows Office 365 Users as the standard connector for resolving tenant user identity in Code Apps. It provides `id`, `displayName`, `userPrincipalName`, and `jobTitle` from Entra ID.
- **Alternatives considered**:
  - Microsoft Graph API direct calls: rejected because Code Apps connectors proxy through Power Apps host; direct Graph calls won't have auth context.
  - Power Apps host `window` context: not documented as providing user identity; unreliable.

## Decision 5: `DataverseDataProvider` wraps generated services

- **Decision**: The existing `DataverseDataProvider` class (currently throwing `NOT_IMPLEMENTED`) will be updated to delegate CRUD operations to the generated `*Service` methods (e.g., `PacaEventapprovalrequestService.create()`, `.getAll()`, `.get()`, `.update()`). The provider acts as a mapping layer between app domain types and Dataverse column shapes.
- **Rationale**: Preserves the `IDataProvider` abstraction and `providerFactory` pattern from `001`. The generated services handle authentication and transport; the provider handles type mapping and business logic (e.g., multi-record decision flow).
- **Alternatives considered**:
  - Bypassing the IDataProvider layer: rejected because it would break the mock/dataverse switching architecture.
  - Auto-generating the provider from OpenAPI: not feasible because Dataverse column names differ from app domain types and require manual mapping.

## Decision 6: Atomic multi-record writes use sequential service calls (not `$batch`)

- **Decision**: For `decideRequest` (which must create a decision record, update request status, and create a history entry), use sequential generated service calls. The generated `*Service` API does not expose `$batch` endpoints.
- **Rationale**: The Dataverse Code Apps SDK supports `create`, `get`, `getAll`, `update`, `delete` — no batch/changeset support is documented. The spec mentions `$batch` as the ideal approach, but the SDK doesn't surface it. We implement sequential writes with error handling: if a downstream write fails, we log the partial state and surface an error to the user.
- **Alternatives considered**:
  - Dataverse Web API `$batch` via direct HTTP: rejected because Code Apps don't support direct Web API calls (traffic proxied through SDK).
  - Power Automate flow for atomic writes: considered but rejected for v1 — adds latency and complexity. Could be reconsidered if data consistency issues arise.
- **Risk mitigation**: The decision create → status update → history create sequence uses "best-effort sequential" approach. The most critical state change (request status update) happens first after decision creation. History entry creation failure is logged but doesn't roll back the decision.

## Decision 7: Approver role detection via security role presence

- **Decision**: The "Event Approver" Dataverse security role governs who can see all requests and record decisions. Row-level security is enforced by Dataverse natively — employees see only their own rows, approvers see all rows with status `submitted`.
- **Rationale**: Specified in FR-012a and FR-012b. Dataverse's built-in security role and row-level access controls handle this without custom code. The app detects the user's role by attempting to list pending approvals — if permitted by Dataverse security, the user is an approver.
- **Alternatives considered**:
  - Custom role lookup table: rejected because Dataverse security roles already provide this capability.
  - App-side role claim from token: rejected because Dataverse enforces access regardless of what the app thinks.

## Decision 8: Power Automate Cloud Flow for notifications (no app code)

- **Decision**: A Power Automate Cloud Flow is triggered by the Dataverse trigger "When a row is added, modified or deleted" filtered on `paca_eventapprovalrequest.status` changes to `approved` or `rejected`. The flow sends a Teams adaptive card to the submitter and creates a `paca_statusnotification` row to track delivery.
- **Rationale**: FR-009 and FR-010 specify this approach explicitly. The flow is autonomous — no app code invocation required. The `StatusNotification` row provides delivery tracking (queued → sent | failed).
- **Alternatives considered**:
  - App-code HTTP call to Power Automate: rejected because the spec says the trigger is automatic from Dataverse.
  - Direct Teams API from app: rejected because the app runs in browser without service-side capability.

## Decision 9: Connection references for environment portability

- **Decision**: Use connection references (available since PAC CLI 1.51.1, December 2025) to bind data sources to the code app. This makes the solution portable across Dev/Test/Prod environments without reconfiguring connection IDs.
- **Rationale**: The "Connect to data" guide recommends connection references for ALM portability. The app targets multiple environments (local mock, dev Dataverse), so environment-aware binding is essential.
- **Alternatives considered**:
  - Direct connection ID binding: works for single-environment but breaks on deployment promotion.

## Decision 10: Unsupported Dataverse features — workarounds

- **Decision**: Acknowledge that the Code Apps Dataverse SDK does not yet support: polymorphic lookups, Dataverse actions/functions, FetchXML, alternate keys, or deleting data sources via CLI.
- **Rationale**: Per the official unsupported scenarios list. Our schema avoids these — all lookups are single-valued, queries use OData filter/sort/top via `getAll()` options, and no custom actions are required.
- **Alternatives considered**: None needed — our schema is compatible with the supported feature set.

## Decision 11: Lookup relationships via `associate on create` pattern

- **Decision**: When creating child records (`paca_approvaldecision`, `paca_requesthistoryentry`, `paca_statusnotification`) that reference a parent `paca_eventapprovalrequest`, use the "associate records on create" pattern documented for Code Apps Dataverse lookups.
- **Rationale**: The Dataverse how-to guide notes that lookups currently require the guidance for "associate with a single-valued navigation property" or "associate records on create." The lookup column is set as part of the create payload.
- **Alternatives considered**:
  - Separate associate API call after create: adds an extra round trip; rejected.

## Unknowns Resolution Summary

All Technical Context unknowns resolved:
- **Dataverse connectivity pattern**: Generated services via PAC CLI, not raw Web API (Decision 1)
- **Table provisioning**: PACX CLI (`Greg.Xrm.Command`) via PowerShell provisioning script (Decision 2)
- **Cost field strategy**: Embedded on request table (Decision 3)
- **User identity resolution**: Office 365 Users connector (Decision 4)
- **Data provider implementation**: Wraps generated services (Decision 5)
- **Atomic writes**: Sequential service calls with error handling (Decision 6)
- **Role detection**: Dataverse security role (Decision 7)
- **Notification delivery**: Power Automate Cloud Flow (Decision 8)
- **Environment portability**: Connection references (Decision 9)
- **SDK limitations**: Schema is compatible with supported features (Decision 10)
- **Lookup relationships**: Associate on create (Decision 11)
