---
name: entity-driven-ui
description: Metadata-driven CRUD with MUI X DataGrid + FormEngine — entity metadata model, server-driven UI, column/form generation, shared validation, access control, wizard flows
triggers:
  - entity metadata
  - CRUD generator
  - server-driven UI
  - metadata-driven
  - dynamic forms
  - admin panel
  - FormEngine
  - entity schema
  - admin CRUD
  - dynamic DataGrid
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Bash
globs:
  - "*.tsx"
  - "*.ts"
---

# Entity-Driven UI with MUI

Build fully dynamic CRUD interfaces from entity metadata — one schema drives DataGrid
columns, FormEngine forms, validation, access control, and wizard flows.

---

## Entity Metadata Model

The foundation: a single TypeScript schema that drives everything.

```ts
// entity-metadata.ts

type DataType = 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'json';

type WidgetType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'checkbox'
  | 'switch'
  | 'select'
  | 'autocomplete'
  | 'date'
  | 'datetime'
  | 'json-editor'
  | 'custom';

interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'regex' | 'email' | 'custom';
  value?: number | string;
  message?: string;
  key?: string; // backend validation key or expression
}

interface AccessRule {
  roles?: string[];
  claims?: string[];
  readOnly?: boolean;
  hidden?: boolean;
}

interface FieldMetadata {
  name: string;                   // "email"
  label: string;                  // "Email address"
  dataType: DataType;
  widget?: WidgetType;
  enumOptions?: { value: string; label: string }[] | string; // static or lookup key
  isPrimaryKey?: boolean;
  isFilterable?: boolean;
  isSortable?: boolean;
  validations?: ValidationRule[];
  access?: {
    read?: AccessRule;
    write?: AccessRule;
  };
  layout?: {
    group?: string;               // "Contact info"
    columnSpan?: 1 | 2 | 3 | 4;
    order?: number;
    step?: string;                // for wizard flows
  };
}

interface EntityMetadata {
  name: string;                   // "User"
  label: string;                  // "Users"
  api: {
    list: string;                 // "/api/users"
    get: string;                  // "/api/users/:id"
    create: string;               // "/api/users"
    update: string;               // "/api/users/:id"
    delete?: string;              // "/api/users/:id"
  };
  fields: FieldMetadata[];
}
```

This single model drives:
- **DataGrid columns** (types, sorting, filtering, editing, rendering)
- **FormEngine schemas** (form fields, validation, layout, wizards)
- **Access control** (field-level read/write visibility)
- **Shared validation** (one truth, many consumers)

---

## Server-Driven CRUD Page

### Next.js Route: `/admin/[entity]`

```tsx
// app/admin/[entity]/page.tsx
import { EntityPage } from '@/components/admin/EntityPage';

export default async function AdminEntityPage({
  params,
}: {
  params: { entity: string };
}) {
  const res = await fetch(
    `${process.env.ADMIN_API}/entities/${params.entity}/metadata`,
    { cache: 'no-store' },
  );
  const metadata: EntityMetadata = await res.json();

  return <EntityPage metadata={metadata} />;
}
```

### EntityPage Component

```tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { DataGrid } from '@mui/x-data-grid';
import { buildColumns } from '@/lib/entity/build-columns';
import { EntityForm } from '@/components/admin/EntityForm';
import { useEntityData } from '@/hooks/useEntityData';
import type { EntityMetadata } from '@/types/entity-metadata';

interface EntityPageProps {
  metadata: EntityMetadata;
}

export function EntityPage({ metadata }: EntityPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);

  const columns = useMemo(() => buildColumns(metadata), [metadata]);
  const { rows, rowCount, loading, paginationModel, setPaginationModel, refetch } =
    useEntityData(metadata);

  const handleEdit = useCallback((row: any) => {
    setEditingRow(row);
    setFormOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setEditingRow(null);
    setFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    async (data: Record<string, unknown>) => {
      const isNew = !editingRow;
      const url = isNew ? metadata.api.create : metadata.api.update;
      const method = isNew ? 'POST' : 'PUT';

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      setFormOpen(false);
      refetch();
    },
    [editingRow, metadata.api, refetch],
  );

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <h1>{metadata.label}</h1>
        <Button variant="contained" onClick={handleCreate}>
          Add {metadata.name}
        </Button>
      </Box>

      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        paginationMode="server"
        rowCount={rowCount}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        onRowDoubleClick={(params) => handleEdit(params.row)}
        pageSizeOptions={[10, 25, 50]}
      />

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <EntityForm
          metadata={metadata}
          initialValues={editingRow}
          onSubmit={handleFormSubmit}
          onCancel={() => setFormOpen(false)}
        />
      </Dialog>
    </Box>
  );
}
```

---

## DataGrid Column Generation from Metadata

```ts
// lib/entity/build-columns.ts
import type {
  GridColDef,
  GridRenderEditCellParams,
  GridPreProcessEditCellProps,
} from '@mui/x-data-grid';
import type { EntityMetadata, FieldMetadata } from '@/types/entity-metadata';
import { validateCell } from './validate-cell';
import { renderEditCellForField } from './edit-cells';

export function buildColumns(meta: EntityMetadata): GridColDef[] {
  return meta.fields
    .filter((f) => !f.access?.read?.hidden)
    .map<GridColDef>((field) => {
      const col: GridColDef = {
        field: field.name,
        headerName: field.label,
        sortable: field.isSortable !== false,
        filterable: field.isFilterable !== false,
        editable: !field.access?.write?.readOnly,
        flex: field.layout?.columnSpan ?? 1,
      };

      // Map data types to DataGrid column types
      switch (field.dataType) {
        case 'number':
          col.type = 'number';
          break;
        case 'boolean':
          col.type = 'boolean';
          break;
        case 'date':
          col.type = 'date';
          col.valueGetter = (value) => value ? new Date(value) : null;
          break;
        case 'enum':
          col.type = 'singleSelect';
          col.valueOptions = Array.isArray(field.enumOptions)
            ? field.enumOptions
            : [];
          break;
      }

      // Custom valueFormatter for enums
      if (field.widget === 'select' && Array.isArray(field.enumOptions)) {
        col.valueFormatter = (value) => {
          const opt = field.enumOptions!.find(
            (o: any) => (typeof o === 'string' ? o : o.value) === value,
          );
          return typeof opt === 'string' ? opt : opt?.label ?? value;
        };
      }

      // Custom edit cell renderers for complex widgets
      if (col.editable) {
        col.renderEditCell = (params: GridRenderEditCellParams) =>
          renderEditCellForField(field, params);
      }

      // Shared validation via preProcessEditCellProps
      if (field.validations?.length) {
        col.preProcessEditCellProps = (params: GridPreProcessEditCellProps) =>
          validateCell(field, params);
      }

      return col;
    });
}
```

### Custom Edit Cell Renderers

```tsx
// lib/entity/edit-cells.tsx
import type { GridRenderEditCellParams } from '@mui/x-data-grid';
import type { FieldMetadata } from '@/types/entity-metadata';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

export function renderEditCellForField(
  field: FieldMetadata,
  params: GridRenderEditCellParams,
) {
  const { id, field: colField, value, api } = params;

  const updateValue = (newValue: unknown) => {
    api.setEditCellValue({ id, field: colField, value: newValue });
  };

  switch (field.widget) {
    case 'select':
    case 'autocomplete': {
      const options = Array.isArray(field.enumOptions) ? field.enumOptions : [];
      return (
        <Autocomplete
          value={options.find((o) => o.value === value) ?? null}
          onChange={(_, opt) => updateValue(opt?.value ?? null)}
          options={options}
          getOptionLabel={(o) => o.label}
          renderInput={(p) => <TextField {...p} size="small" />}
          fullWidth
          disableClearable={field.validations?.some((v) => v.type === 'required')}
          sx={{ minWidth: 150 }}
        />
      );
    }

    case 'date':
    case 'datetime':
      return (
        <DatePicker
          value={value ? dayjs(value) : null}
          onChange={(d) => updateValue(d?.toISOString() ?? null)}
          slotProps={{ textField: { size: 'small', fullWidth: true } }}
        />
      );

    case 'switch':
    case 'checkbox':
      return (
        <Switch
          checked={!!value}
          onChange={(e) => updateValue(e.target.checked)}
          size="small"
        />
      );

    default:
      return (
        <TextField
          value={value ?? ''}
          onChange={(e) => updateValue(e.target.value)}
          size="small"
          fullWidth
          type={field.dataType === 'number' ? 'number' : 'text'}
          multiline={field.widget === 'textarea'}
          rows={field.widget === 'textarea' ? 3 : undefined}
        />
      );
  }
}
```

---

## Shared Validation Layer

One set of rules, consumed by DataGrid, FormEngine, and backend.

```ts
// lib/entity/validate-cell.ts
import type { GridPreProcessEditCellProps } from '@mui/x-data-grid';
import type { FieldMetadata, ValidationRule } from '@/types/entity-metadata';

export function validateCell(
  field: FieldMetadata,
  params: GridPreProcessEditCellProps,
) {
  const { props } = params;
  const value = props.value;
  const error = runValidation(field.validations ?? [], value, field.label);

  return { ...props, error: !!error, helperText: error };
}

export function runValidation(
  rules: ValidationRule[],
  value: unknown,
  label: string,
): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === '' || value == null) {
          return rule.message ?? `${label} is required`;
        }
        break;
      case 'min':
        if (typeof value === 'number' && value < Number(rule.value)) {
          return rule.message ?? `${label} must be >= ${rule.value}`;
        }
        if (typeof value === 'string' && value.length < Number(rule.value)) {
          return rule.message ?? `${label} must be at least ${rule.value} characters`;
        }
        break;
      case 'max':
        if (typeof value === 'number' && value > Number(rule.value)) {
          return rule.message ?? `${label} must be <= ${rule.value}`;
        }
        if (typeof value === 'string' && value.length > Number(rule.value)) {
          return rule.message ?? `${label} must be at most ${rule.value} characters`;
        }
        break;
      case 'regex':
        if (typeof value === 'string' && !new RegExp(String(rule.value)).test(value)) {
          return rule.message ?? `${label} format is invalid`;
        }
        break;
      case 'email':
        if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return rule.message ?? `${label} must be a valid email`;
        }
        break;
    }
  }
  return null;
}

// For row-level validation (used in processRowUpdate)
export function validateRow(
  meta: { fields: FieldMetadata[] },
  row: Record<string, unknown>,
): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];
  for (const field of meta.fields) {
    if (!field.validations?.length) continue;
    const error = runValidation(field.validations, row[field.name], field.label);
    if (error) errors.push({ field: field.name, message: error });
  }
  return errors;
}
```

### Validation in Row Editing (processRowUpdate)

```tsx
const processRowUpdate = useCallback(
  async (newRow: any, oldRow: any) => {
    // Validate entire row
    const errors = validateRow(metadata, newRow);
    if (errors.length > 0) {
      throw new Error(errors.map((e) => e.message).join(', '));
    }

    // Determine create vs update
    const pk = metadata.fields.find((f) => f.isPrimaryKey)?.name ?? 'id';
    const isNew = !oldRow[pk];
    const url = isNew
      ? metadata.api.create
      : metadata.api.update.replace(':id', String(newRow[pk]));

    const res = await fetch(url, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRow),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message ?? 'Failed to save');
    }

    return await res.json();
  },
  [metadata],
);
```

---

## FormEngine MUI Schema Generation

Convert entity metadata to FormEngine JSON schema.

```ts
// lib/entity/build-form-schema.ts
import type { EntityMetadata, FieldMetadata, ValidationRule } from '@/types/entity-metadata';

export function buildFormEngineSchema(meta: EntityMetadata) {
  const fields = meta.fields
    .filter((f) => !f.access?.write?.hidden)
    .sort((a, b) => (a.layout?.order ?? 0) - (b.layout?.order ?? 0));

  // Group by layout.step for wizard mode
  const steps = new Map<string, FieldMetadata[]>();
  for (const field of fields) {
    const step = field.layout?.step ?? 'default';
    if (!steps.has(step)) steps.set(step, []);
    steps.get(step)!.push(field);
  }

  // Single step → flat form; multiple steps → wizard
  if (steps.size <= 1) {
    return {
      tooltipType: 'MuiTooltip',
      errorType: 'MuiErrorWrapper',
      form: {
        key: 'Screen',
        type: 'Screen',
        children: fields.map(buildFormField),
      },
    };
  }

  // Multi-step wizard
  return {
    tooltipType: 'MuiTooltip',
    errorType: 'MuiErrorWrapper',
    form: {
      key: 'Wizard',
      type: 'Wizard',
      children: Array.from(steps.entries()).map(([stepName, stepFields]) => ({
        key: stepName,
        type: 'Screen',
        props: { label: { value: stepName } },
        children: stepFields.map(buildFormField),
      })),
    },
  };
}

function buildFormField(field: FieldMetadata) {
  const node: any = {
    key: field.name,
    type: widgetToFormEngineType(field),
    props: {
      label: { value: field.label },
      name: { value: field.name },
    },
    schema: {
      validations: (field.validations ?? []).map(toFormEngineValidation),
    },
  };

  // Layout: column span → MUI Grid integration
  if (field.layout?.columnSpan) {
    node.props.gridColumn = { value: `span ${field.layout.columnSpan}` };
  }

  // Enum options
  if (field.widget === 'select' && Array.isArray(field.enumOptions)) {
    node.props.options = { value: field.enumOptions };
  }

  // Read-only
  if (field.access?.write?.readOnly) {
    node.props.disabled = { value: true };
  }

  // Multiline
  if (field.widget === 'textarea') {
    node.props.multiline = { value: true };
    node.props.rows = { value: 4 };
  }

  return node;
}

function widgetToFormEngineType(field: FieldMetadata): string {
  switch (field.widget) {
    case 'textarea':      return 'MuiTextField'; // with multiline prop
    case 'select':        return 'MuiSelect';
    case 'autocomplete':  return 'MuiAutocomplete';
    case 'switch':        return 'MuiSwitch';
    case 'checkbox':      return 'MuiCheckbox';
    case 'date':          return 'MuiDatePicker';
    case 'datetime':      return 'MuiDateTimePicker';
    case 'number':        return 'MuiTextField'; // with type=number
    default:              return 'MuiTextField';
  }
}

function toFormEngineValidation(rule: ValidationRule) {
  return {
    key: rule.type,
    args: { value: rule.value, message: rule.message },
  };
}
```

### EntityForm Component

```tsx
// components/admin/EntityForm.tsx
'use client';

import { useMemo, useCallback } from 'react';
import { FormViewer } from '@react-form-builder/core';
import { view as muiView } from '@react-form-builder/components-material-ui';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { buildFormEngineSchema } from '@/lib/entity/build-form-schema';
import type { EntityMetadata } from '@/types/entity-metadata';

interface EntityFormProps {
  metadata: EntityMetadata;
  initialValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}

export function EntityForm({ metadata, initialValues, onSubmit, onCancel }: EntityFormProps) {
  const isNew = !initialValues;

  const schema = useMemo(
    () => buildFormEngineSchema(metadata),
    [metadata],
  );

  const getForm = useCallback(
    () => JSON.stringify(schema),
    [schema],
  );

  const actions = useMemo(
    () => ({
      onSubmit: (e: { data: Record<string, unknown> }) => onSubmit(e.data),
    }),
    [onSubmit],
  );

  return (
    <>
      <DialogTitle>{isNew ? `Create ${metadata.name}` : `Edit ${metadata.name}`}</DialogTitle>
      <DialogContent>
        <FormViewer
          view={muiView}
          getForm={getForm}
          actions={actions}
          initialData={initialValues ?? {}}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" type="submit" form="form-engine-form">
          {isNew ? 'Create' : 'Save'}
        </Button>
      </DialogActions>
    </>
  );
}
```

---

## Access Control

Hide/disable fields based on user roles at three layers:

```ts
// lib/entity/apply-access.ts
import type { EntityMetadata, FieldMetadata, AccessRule } from '@/types/entity-metadata';

interface UserContext {
  roles: string[];
  claims: string[];
}

export function filterFieldsByAccess(
  fields: FieldMetadata[],
  user: UserContext,
  mode: 'read' | 'write',
): FieldMetadata[] {
  return fields.filter((field) => {
    const rule = mode === 'read' ? field.access?.read : field.access?.write;
    if (!rule) return true; // no restriction
    if (rule.hidden) return !isRestricted(rule, user);
    return true;
  });
}

export function isFieldReadOnly(field: FieldMetadata, user: UserContext): boolean {
  const rule = field.access?.write;
  if (!rule) return false;
  if (rule.readOnly) return true;
  return isRestricted(rule, user);
}

function isRestricted(rule: AccessRule, user: UserContext): boolean {
  if (rule.roles?.length && !rule.roles.some((r) => user.roles.includes(r))) {
    return true;
  }
  if (rule.claims?.length && !rule.claims.some((c) => user.claims.includes(c))) {
    return true;
  }
  return false;
}
```

**Enforcement layers:**
1. **DataGrid**: `buildColumns` filters hidden fields, marks read-only fields as `editable: false`
2. **FormEngine**: `buildFormEngineSchema` omits hidden fields, sets `disabled` on read-only
3. **Backend**: Same metadata used server-side to validate write permissions

---

## Wizard Flows

When fields have `layout.step`, the FormEngine schema becomes multi-step:

```ts
// Example entity with wizard steps
const userMetadata: EntityMetadata = {
  name: 'User',
  label: 'Users',
  api: { list: '/api/users', get: '/api/users/:id', create: '/api/users', update: '/api/users/:id' },
  fields: [
    { name: 'email', label: 'Email', dataType: 'string', widget: 'text',
      validations: [{ type: 'required' }, { type: 'email' }],
      layout: { step: 'Account', order: 1 } },
    { name: 'password', label: 'Password', dataType: 'string', widget: 'text',
      validations: [{ type: 'required' }, { type: 'min', value: 8 }],
      layout: { step: 'Account', order: 2 } },
    { name: 'name', label: 'Full Name', dataType: 'string', widget: 'text',
      validations: [{ type: 'required' }],
      layout: { step: 'Profile', order: 1 } },
    { name: 'role', label: 'Role', dataType: 'enum', widget: 'select',
      enumOptions: [{ value: 'admin', label: 'Admin' }, { value: 'user', label: 'User' }],
      layout: { step: 'Profile', order: 2 } },
    { name: 'bio', label: 'Bio', dataType: 'string', widget: 'textarea',
      layout: { step: 'Profile', order: 3, columnSpan: 2 } },
  ],
};
```

`buildFormEngineSchema(userMetadata)` produces a two-step wizard: Account → Profile.

---

## Data Fetching Hook

```ts
// hooks/useEntityData.ts
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import type { GridPaginationModel, GridSortModel, GridFilterModel } from '@mui/x-data-grid';
import type { EntityMetadata } from '@/types/entity-metadata';

export function useEntityData(metadata: EntityMetadata) {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  const { data, isLoading, refetch } = useQuery({
    queryKey: [metadata.api.list, paginationModel, sortModel, filterModel],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(paginationModel.page),
        pageSize: String(paginationModel.pageSize),
        ...(sortModel[0] && {
          sortField: sortModel[0].field,
          sortOrder: sortModel[0].sort ?? 'asc',
        }),
      });

      const res = await fetch(`${metadata.api.list}?${params}`);
      return res.json();
    },
    placeholderData: (prev) => prev,
  });

  return {
    rows: data?.rows ?? [],
    rowCount: data?.total ?? 0,
    loading: isLoading,
    paginationModel,
    setPaginationModel,
    sortModel,
    setSortModel,
    filterModel,
    setFilterModel,
    refetch,
  };
}
```

---

## Architecture Summary

```
┌─────────────────────┐
│   Entity Metadata    │  ← Single source of truth
│   (JSON / TypeScript)│
└──────┬──────┬────────┘
       │      │
       ▼      ▼
┌──────────┐ ┌──────────────┐
│ DataGrid │ │ FormEngine   │
│ Columns  │ │ MUI Schema   │
└────┬─────┘ └──────┬───────┘
     │               │
     ▼               ▼
┌──────────┐ ┌──────────────┐
│ List View│ │ Create/Edit  │
│ + Inline │ │ Dialog/Page  │
│ Editing  │ │ or Wizard    │
└────┬─────┘ └──────┬───────┘
     │               │
     ▼               ▼
┌────────────────────────────┐
│    Shared Validation       │  ← runValidation()
│ (DataGrid cells + Forms +  │
│  Backend API)              │
└────────────────────────────┘
     │
     ▼
┌────────────────────────────┐
│    Access Control Layer    │  ← filterFieldsByAccess()
│ (Roles/Claims → hide/      │
│  disable fields)           │
└────────────────────────────┘
```

No per-entity React code needed — the metadata drives everything.
