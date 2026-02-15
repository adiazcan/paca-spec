# Quickstart: Event Approval Workflow Code App

## 1. Prerequisites
- Node.js LTS (v20+)
- Power Platform CLI (`pac`)
- Access to Power Platform environment(s)
- Browser profile signed into tenant account

## 2. Install and initialize
```bash
npx degit github:microsoft/PowerAppsCodeApps/templates/vite apps/event-approval-codeapp
cd apps/event-approval-codeapp
npm install
pac auth create
pac env select --environment <ENVIRONMENT_ID>
pac code init --displayname "Event Approval Workflow"
```

## 3. Local mode runbook (`mock`)
1. Set mode in PowerShell:
   ```powershell
   $env:VITE_APP_DATA_MODE="mock"
   ```
2. Start local run:
   ```bash
   npm run dev
   ```
3. Validate local workflow:
   ```bash
   npm run test:contract
   npm run test:integration
   ```
4. Open Local Play URL in the same browser profile used for tenant auth.
5. If localhost is blocked, allow local network access in Edge/Chrome.

## 4. Pro mode runbook (`dataverse`)
1. Set mode in PowerShell:
   ```powershell
   $env:VITE_APP_DATA_MODE="dataverse"
   ```
2. Ensure Dataverse schema is provisioned per `data-model.md`.
3. Verify connector bindings and role permissions for employee + approver users.
4. Start app and validate core checks:
   ```bash
   npm run dev
   npm run test:e2e:smoke
   ```

## 5. Build and publish
```powershell
npm run build | pac code push
```

## 6. Quality gates (must pass)
```bash
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run test:contract
npm run test:e2e:smoke
```

## 7. Manual acceptance checklist
- Employee can submit valid request and receives confirmation.
- Required-field errors are shown clearly for invalid submission.
- Approver can approve/reject with mandatory comment.
- History timeline shows all lifecycle events in order.
- Notification payload includes request ID, new status, and latest comment.
- Loading/empty/error/stale states are visible and consistent across employee and approver views.

## 8. Performance validation targets
- Request submit p95: < 2s local, < 4s pro
- Dashboard load p95: < 3s local, < 5s pro
- Decision history update visibility: < 10s
- Notification delivery completion: < 60s

## 9. Release-readiness checklist
1. Run all quality gates in Section 6.
2. Verify smoke e2e includes employee submit -> approver decision -> employee notification.
3. Confirm retention validation tests pass for indefinite audit retrieval assumptions.
4. Confirm traceability matrix in `checklists/requirements.md` is current for FR-001..FR-019.
