# Quickstart: Event Approval Workflow Code App

## 1. Prerequisites
- Node.js LTS (v20+)
- Power Platform CLI (`pac`)
- Access to Power Platform environment(s)
- Browser profile signed into tenant account

## 2. Scaffold code app (React + TypeScript)
```bash
npx degit github:microsoft/PowerAppsCodeApps/templates/vite apps/event-approval-codeapp
cd apps/event-approval-codeapp
npm install
pac auth create
pac env select --environment <ENVIRONMENT_ID>
pac code init --displayname "Event Approval Workflow"
```

## 3. Local development mode (fully mocked)
1. Set environment variable:
   - PowerShell:
     ```powershell
     $env:VITE_APP_DATA_MODE="mock"
     ```
2. Start app:
   ```bash
   npm run dev
   ```
3. Open `Local Play` URL in the same browser profile as the authenticated tenant.
4. If browser blocks localhost access, allow local network access (Edge/Chrome Dec 2025 behavior).

## 4. Pro environment mode (Dataverse)
1. Set environment variable:
   - PowerShell:
     ```powershell
     $env:VITE_APP_DATA_MODE="dataverse"
     ```
2. Ensure Dataverse tables and relationships exist per `data-model.md`.
3. Configure connector bindings/permissions for current environment.
4. Run and verify:
   ```bash
   npm run dev
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
