# Vehicle Maintenance Request Portal

Arabic-first RTL internal portal for managing the lifecycle of vehicle maintenance requests, approvals, routing, execution, comments, notifications, and Camunda-backed task forms.

## Overview

This project is a React application that simulates a vehicle maintenance workflow inside an internal organization. It includes:

- Authentication with seeded demo users
- Role-based request routing
- Request details, timeline, comments, and documents
- Dashboard and notifications views
- Camunda form rendering in two modes:
  - a custom React renderer
  - the official Camunda renderer based on `@bpmn-io/form-js`

The Camunda integration is the most important part of this codebase when discussing dynamic workflow forms.

## Runtime Compatibility

This project is now pinned to support the client baseline of **Node `20.17.0`**.

Project engines:

- Node: `>=20.17.0 <21 || >=22.0.0`
- npm: `>=10`

Pinned tooling versions that were adjusted specifically for Node `20.17.0` compatibility:

- `vite`: `5.4.11`
- `@vitejs/plugin-react`: `4.7.0`
- `typescript-eslint`: `8.32.1`
- `@types/node`: `^20.17.0`

Important:

- Do not bump `vite`, `@vitejs/plugin-react`, or `typescript-eslint` casually.
- Re-check Node engine requirements before upgrading the frontend toolchain.
- `.nvmrc` is included and set to `20.17.0`.

## Tech Stack

- React 19
- TypeScript
- Vite 5
- Tailwind CSS v4
- Zustand
- React Hook Form
- Zod
- React Router
- Radix UI
- `@bpmn-io/form-js` for the official Camunda renderer

## Getting Started

Prerequisites:

- Node `20.17.0`
- npm `10+`

Install and run:

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Preview production build:

```bash
npm run preview
```

## Scripts

- `npm run dev`: starts the Vite dev server
- `npm run build`: runs TypeScript project build and Vite production build
- `npm run lint`: runs ESLint
- `npm run preview`: serves the production build locally

## Project Structure

```text
src/
  app/                    Router and app bootstrap
  components/
    layout/               App shell, sidebar, topbar
    shared/               Shared UI and workflow components
  data/                   Seeded demo data
  features/
    auth/                 Login page and auth flow
    dashboard/            Dashboard views
    notifications/        Notifications center
    requests/             Request list, request details, new request
  lib/                    Shared utilities
  store/                  Zustand stores
  styles/                 Global theme and CSS tokens
  types/                  Application and Camunda types
  utils/                  Workflow helpers, labels, formatters
```

## Core Business Flow

At a high level, the app models a request from creation through review, routing, execution, and final outcome recording.

Core responsibilities are split across:

- `src/store/requestStore.ts`: request state, actions, comments, workflow mutations
- `src/store/authStore.ts`: current user and session state
- `src/store/notificationStore.ts`: notification state
- `src/utils/workflow.ts`: allowed transitions by status and role
- `src/features/requests/RequestDetailsPage.tsx`: the main operational screen

## Camunda Integration

### Why This Matters

The Camunda form rendering path is the most important technical area in this project because it answers the core product question:

How do we take a Camunda-generated form schema and render it inside this React application in a way that can later connect to a real workflow backend?

This repository intentionally contains **two** rendering approaches.

### The Two Renderers

### 1. `OfficialCamundaFormViewer`

File:

- `src/components/shared/OfficialCamundaFormViewer.tsx`

This is the **preferred integration surface** when the goal is to stay close to actual Camunda behavior.

It uses the official Camunda renderer:

- package: `@bpmn-io/form-js`

Current responsibilities:

- owns a DOM container with `useRef`
- creates a `new Form({ container })` instance
- imports a Camunda schema via `form.importSchema(schema, data)`
- listens to the official `submit` event
- forwards submitted form data to the parent component
- destroys the form instance on unmount

This is the renderer to highlight in demos, architecture discussions, and future backend integration work because it is the closest thing to a real Camunda-driven UI flow.

### 2. `CamundaFormRenderer`

File:

- `src/components/shared/CamundaFormRenderer.tsx`

This is a custom React implementation that maps the schema into app-owned inputs using:

- React Hook Form
- app styling tokens
- app-controlled validation messages

This renderer is useful when you want:

- full design-system control
- tight RTL control
- custom UX not limited by the official renderer
- a fallback path for fields the official viewer does not style the way you want

### Where The Camunda Demo Is Wired

The current demo is wired inside:

- `src/features/requests/RequestDetailsPage.tsx`

That page currently:

- defines `DEMO_CAMUNDA_SCHEMA`
- exposes a `Camunda Forms` tab
- lets the user switch between:
  - custom renderer
  - official renderer
- sends submitted form data to a demo handler

This means the request-details page is the current integration playground for Camunda behavior.

### Camunda Schema Type

Type definitions live in:

- `src/types/camunda.ts`

Main types:

- `CamundaFormSchema`
- `CamundaFormComponent`

The schema currently models:

- platform metadata
- exporter metadata
- schema version
- component list
- component validation
- localized labels through `properties.labelAr` and `properties.labelEn`

If a backend starts returning richer Camunda schemas, this file is the first place to extend.

### Official Renderer Data Flow

The current official renderer flow is:

1. Parent page provides `schema`
2. Parent page optionally provides existing `data`
3. `OfficialCamundaFormViewer` mounts a container
4. `form-js` imports the schema into that container
5. Camunda handles field behavior and validation internally
6. On submit, the viewer forwards `event.data` back to React

In simplified form:

```tsx
<OfficialCamundaFormViewer
  schema={schema}
  data={initialData}
  onSubmit={handleSubmit}
/>
```

### Why The Official Renderer Should Be Treated As Primary

If the client's real requirement is "render the same form definitions Camunda produces", the official renderer should be the primary path because it gives you:

- closer parity with Camunda's schema semantics
- less custom field mapping code to maintain
- lower risk of behavior drift from backend-defined forms
- a cleaner migration path from demo data to real workflow tasks

The custom renderer is still valuable, but it should be treated as the app-owned UX fallback, not the canonical integration path.

### Official Renderer Extension Guide

If you want to productionize the official renderer, extend it in this order.

#### 1. Move schema sourcing out of the page

Right now the schema is hardcoded in `RequestDetailsPage.tsx`.

Production target:

- fetch task form schema from the backend
- fetch previously entered values for the active task
- pass both into `OfficialCamundaFormViewer`

Recommended shape:

```ts
type TaskFormPayload = {
  schema: CamundaFormSchema;
  data: Record<string, unknown>;
  taskId: string;
};
```

#### 2. Expand the component API

The current props are minimal:

- `schema`
- `data`
- `onSubmit`

Good next props to add:

- `onChange`
- `onError`
- `className`
- `readOnly`
- `loading`
- `taskId`
- `submissionLabel`

Suggested direction:

```ts
interface OfficialCamundaFormViewerProps {
  schema: CamundaFormSchema;
  data?: Record<string, unknown>;
  readOnly?: boolean;
  className?: string;
  onSubmit: (data: Record<string, unknown>) => void;
  onChange?: (data: Record<string, unknown>) => void;
  onError?: (error: unknown) => void;
}
```

#### 3. Surface more official form events

Today only submit is handled.

For a stronger integration, also listen for:

- value changes
- validation errors
- import failures
- lifecycle cleanup issues

That allows the parent page to:

- autosave drafts
- show task-level validation banners
- log integration failures
- disable outer workflow actions until the form is valid

#### 4. Add a backend adapter layer

Do not let feature pages manually transform backend payloads everywhere.

Create a dedicated adapter that converts:

- backend task payload -> `CamundaFormSchema`
- backend variables -> renderer `data`
- renderer submit payload -> backend completion payload

That adapter can live in a dedicated folder later, for example:

```text
src/lib/camunda/
  adapters.ts
  submitters.ts
  mappers.ts
```

#### 5. Centralize styling and RTL strategy

The official renderer is mounted inside a wrapper component, and that wrapper is the correct place to centralize:

- spacing
- border radius
- typography adjustments
- field spacing
- surrounding cards and headings
- any RTL compatibility overrides

Important current note:

- the container is explicitly rendered with `dir="ltr"` in `OfficialCamundaFormViewer.tsx`

That was done because official Camunda form rendering can be strongly LTR-oriented. If full Arabic RTL is required for the official renderer too, the clean way forward is:

- keep the internal form engine stable
- add focused CSS overrides at the wrapper level
- test each supported Camunda component type carefully

#### 6. Keep unsupported logic out of the page

As the renderer grows, `RequestDetailsPage.tsx` should stop owning renderer-specific demo logic.

Move out:

- demo schema constants
- renderer mode toggles
- schema preview helpers
- submit transformation logic

Keep the feature page responsible only for:

- loading task context
- deciding which renderer mode to show
- handling submit success or failure

### Recommended Next Step For Real Camunda Adoption

If this repository is going to connect to a real Camunda environment, the best next milestone is:

1. keep `OfficialCamundaFormViewer` as the primary path
2. fetch real schema + task variables from an API
3. submit official form payloads back to the workflow task endpoint
4. keep `CamundaFormRenderer` as an app-controlled alternative for special cases

That approach minimizes rework and keeps the integration aligned with actual Camunda semantics.

### Current Limitations

Known limitations in the current demo:

- schema is hardcoded in the page instead of coming from an API
- official renderer currently exposes only submit handling
- official renderer still needs stronger RTL theming strategy
- request details page still contains demo-only Camunda wiring
- custom renderer supports only a subset of possible Camunda components

## Demo Accounts

Seeded users and mock requests live in the repo for demonstration purposes. See:

- `src/data/mockUsers.ts`
- `src/store/requestStore.ts`

## Notes For Future Maintainers

- The official Camunda renderer is the key integration surface. Treat it as the main path when discussing backend readiness.
- The custom renderer is best viewed as a controlled UX layer, not the canonical Camunda engine.
- Before upgrading frontend tooling, verify Node `20.17.0` compatibility again.
