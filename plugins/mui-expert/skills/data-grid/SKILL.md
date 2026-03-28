---
name: mui-data-grid
description: MUI X DataGrid expert skill. Covers all tiers (free/Pro/Premium), column and row configuration, sorting, filtering, pagination, selection, editing, server-side data, export, styling, and performance patterns.
triggers:
  - DataGrid
  - data grid
  - table
  - data-grid
  - grid
  - MUI X
  - columns
  - rows
  - sorting
  - filtering
  - pagination
  - GridColDef
  - GridRowsProp
  - processRowUpdate
  - renderCell
globs:
  - "*.tsx"
  - "*.ts"
  - "*.jsx"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
  - Bash
---

# MUI X DataGrid Skill

## Package Tiers

| Package | License | Key Features |
|---------|---------|--------------|
| `@mui/x-data-grid` | MIT (free) | Core grid, sorting, filtering, pagination, selection, export |
| `@mui/x-data-grid-pro` | Commercial | Column pinning, row grouping, master-detail, tree data, lazy loading |
| `@mui/x-data-grid-premium` | Commercial | Excel export, clipboard, aggregation, row grouping (advanced) |

Always import from the correct tier:
```ts
import { DataGrid } from '@mui/x-data-grid';           // free
import { DataGridPro } from '@mui/x-data-grid-pro';     // Pro
import { DataGridPremium } from '@mui/x-data-grid-premium'; // Premium
```

---

## Core Concepts

### GridColDef — Column Definition

```ts
import { GridColDef, GridRenderCellParams, GridValueGetterParams } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 90,
    type: 'number',
    hideable: false,
  },
  {
    field: 'fullName',
    headerName: 'Full Name',
    flex: 1,           // takes remaining space
    minWidth: 150,
    valueGetter: (params: GridValueGetterParams) =>
      `${params.row.firstName} ${params.row.lastName}`,
  },
  {
    field: 'salary',
    headerName: 'Salary',
    type: 'number',
    width: 130,
    valueFormatter: (params) =>
      params.value != null
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(params.value as number)
        : '',
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={params.value as string}
        color={params.value === 'active' ? 'success' : 'default'}
        size="small"
      />
    ),
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 100,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    renderCell: (params) => (
      <IconButton size="small" onClick={() => handleEdit(params.row)}>
        <EditIcon fontSize="small" />
      </IconButton>
    ),
  },
];
```

Column types: `'string'` | `'number'` | `'date'` | `'dateTime'` | `'boolean'` | `'singleSelect'` | `'actions'`

### Basic DataGrid Setup

```tsx
import React, { useState } from 'react';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';

const rows: GridRowsProp = [
  { id: 1, firstName: 'Jane', lastName: 'Doe', age: 30 },
  { id: 2, firstName: 'John', lastName: 'Smith', age: 25 },
];

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'firstName', headerName: 'First Name', flex: 1 },
  { field: 'lastName', headerName: 'Last Name', flex: 1 },
  { field: 'age', headerName: 'Age', type: 'number', width: 100 },
];

export default function BasicDataGrid() {
  return (
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        checkboxSelection
        disableRowSelectionOnClick
      />
    </div>
  );
}
```

---

## Sorting

```tsx
import { GridSortModel } from '@mui/x-data-grid';

// Controlled sort
const [sortModel, setSortModel] = useState<GridSortModel>([
  { field: 'lastName', sort: 'asc' },
]);

<DataGrid
  rows={rows}
  columns={columns}
  sortModel={sortModel}
  onSortModelChange={(model) => setSortModel(model)}
/>

// Custom sort comparator on a column
const column: GridColDef = {
  field: 'priority',
  sortComparator: (v1, v2) => {
    const order = { high: 3, medium: 2, low: 1 };
    return (order[v1 as string] ?? 0) - (order[v2 as string] ?? 0);
  },
};
```

Multi-column sorting is available in Pro/Premium with `Ctrl+Click` on column headers.

---

## Filtering

```tsx
import { GridFilterModel } from '@mui/x-data-grid';

// Controlled filter
const [filterModel, setFilterModel] = useState<GridFilterModel>({
  items: [
    { field: 'status', operator: 'equals', value: 'active' },
  ],
  quickFilterValues: [],
});

<DataGrid
  rows={rows}
  columns={columns}
  filterModel={filterModel}
  onFilterModelChange={(model) => setFilterModel(model)}
  slots={{ toolbar: GridToolbarQuickFilter }}
/>

// Custom filter operator
import { GridFilterOperator } from '@mui/x-data-grid';

const startsWithOperator: GridFilterOperator = {
  label: 'Starts with',
  value: 'startsWith',
  getApplyFilterFn: (filterItem) => {
    if (!filterItem.value) return null;
    return (params) =>
      String(params.value).toLowerCase().startsWith(String(filterItem.value).toLowerCase());
  },
  InputComponent: GridFilterInputValue,
};

const column: GridColDef = {
  field: 'name',
  filterOperators: [startsWithOperator, ...getGridStringOperators()],
};
```

### Quick Filter

```tsx
import { GridToolbar } from '@mui/x-data-grid';

<DataGrid
  slots={{ toolbar: GridToolbar }}
  slotProps={{
    toolbar: {
      showQuickFilter: true,
      quickFilterProps: { debounceMs: 300 },
    },
  }}
/>
```

---

## Pagination

```tsx
import { GridPaginationModel } from '@mui/x-data-grid';

// Client-side pagination
const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
  page: 0,
  pageSize: 25,
});

<DataGrid
  rows={rows}
  columns={columns}
  paginationModel={paginationModel}
  onPaginationModelChange={setPaginationModel}
  pageSizeOptions={[10, 25, 50, 100]}
/>
```

---

## Selection

```tsx
import { GridRowSelectionModel } from '@mui/x-data-grid';

const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

<DataGrid
  rows={rows}
  columns={columns}
  checkboxSelection
  rowSelectionModel={rowSelectionModel}
  onRowSelectionModelChange={(newModel) => setRowSelectionModel(newModel)}
  disableRowSelectionOnClick
  // Keep selection when paginating:
  keepNonExistentRowsSelected
/>

// Read selected row data
const selectedRows = rows.filter((r) => rowSelectionModel.includes(r.id));
```

---

## Editing

### Cell Editing

```tsx
const columns: GridColDef[] = [
  {
    field: 'name',
    editable: true,
    preProcessEditCellProps: (params) => {
      const hasError = params.props.value.length < 1;
      return { ...params.props, error: hasError };
    },
  },
  {
    field: 'age',
    type: 'number',
    editable: true,
    preProcessEditCellProps: (params) => {
      const hasError = params.props.value < 0 || params.props.value > 150;
      return { ...params.props, error: hasError };
    },
  },
];

const processRowUpdate = async (newRow: GridRowModel, oldRow: GridRowModel) => {
  // Validate
  if (!newRow.name) throw new Error('Name is required');
  // Persist to server
  const updatedRow = await updateUserAPI(newRow);
  // Update local state
  setRows((prev) => prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)));
  return updatedRow; // Must return the new row
};

const handleProcessRowUpdateError = (error: Error) => {
  setSnackbar({ children: error.message, severity: 'error' });
};

<DataGrid
  rows={rows}
  columns={columns}
  processRowUpdate={processRowUpdate}
  onProcessRowUpdateError={handleProcessRowUpdateError}
  editMode="cell"  // or "row"
/>
```

### Row Editing Mode

```tsx
<DataGrid
  rows={rows}
  columns={columns}
  editMode="row"
  processRowUpdate={processRowUpdate}
  // Include action column with Save/Cancel
  columns={[
    ...dataColumns,
    {
      field: 'actions',
      type: 'actions',
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        if (isInEditMode) {
          return [
            <GridActionsCellItem icon={<SaveIcon />} label="Save" onClick={handleSaveClick(id)} />,
            <GridActionsCellItem icon={<CancelIcon />} label="Cancel" onClick={handleCancelClick(id)} />,
          ];
        }
        return [
          <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={handleEditClick(id)} />,
          <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={handleDeleteClick(id)} />,
        ];
      },
    },
  ]}
  rowModesModel={rowModesModel}
  onRowModesModelChange={setRowModesModel}
/>
```

---

## Server-Side Data

### Full Server-Side Pattern with React Query

```tsx
import { useQuery } from '@tanstack/react-query';
import {
  DataGrid,
  GridSortModel,
  GridFilterModel,
  GridPaginationModel,
} from '@mui/x-data-grid';

interface ServerResponse {
  rows: User[];
  total: number;
}

async function fetchUsers(params: {
  page: number;
  pageSize: number;
  sortModel: GridSortModel;
  filterModel: GridFilterModel;
}): Promise<ServerResponse> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    ...(params.sortModel[0] && {
      sortField: params.sortModel[0].field,
      sortOrder: params.sortModel[0].sort ?? 'asc',
    }),
  });
  const res = await fetch(`/api/users?${query}`);
  return res.json();
}

export default function ServerDataGrid() {
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = useState<GridFilterModel>({ items: [] });

  const { data, isLoading } = useQuery({
    queryKey: ['users', paginationModel, sortModel, filterModel],
    queryFn: () => fetchUsers({ ...paginationModel, sortModel, filterModel }),
    placeholderData: keepPreviousData, // v5 React Query
  });

  return (
    <DataGrid
      rows={data?.rows ?? []}
      rowCount={data?.total ?? 0}
      columns={columns}
      loading={isLoading}
      paginationMode="server"
      sortingMode="server"
      filterMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={setPaginationModel}
      sortModel={sortModel}
      onSortModelChange={setSortModel}
      filterModel={filterModel}
      onFilterModelChange={setFilterModel}
      pageSizeOptions={[10, 25, 50]}
    />
  );
}
```

---

## Custom Toolbar

```tsx
import {
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';

function CustomToolbar({ onAddRow }: { onAddRow: () => void }) {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', p: 1 }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <GridToolbarQuickFilter />
        <Button size="small" startIcon={<AddIcon />} onClick={onAddRow}>
          Add Row
        </Button>
      </Box>
    </GridToolbarContainer>
  );
}

<DataGrid
  slots={{ toolbar: CustomToolbar }}
  slotProps={{ toolbar: { onAddRow: handleAddRow } }}
/>
```

---

## Pro / Premium Features

### Column Pinning (Pro)

```tsx
import { DataGridPro } from '@mui/x-data-grid-pro';

<DataGridPro
  rows={rows}
  columns={columns}
  initialState={{
    pinnedColumns: { left: ['id', 'name'], right: ['actions'] },
  }}
/>
```

### Master-Detail (Pro)

```tsx
<DataGridPro
  rows={rows}
  columns={columns}
  getDetailPanelContent={({ row }) => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">{row.name} Details</Typography>
      <DataGrid rows={row.orders} columns={orderColumns} />
    </Box>
  )}
  getDetailPanelHeight={() => 300}
/>
```

### Row Grouping (Premium)

```tsx
import { DataGridPremium } from '@mui/x-data-grid-premium';

<DataGridPremium
  rows={rows}
  columns={columns}
  initialState={{
    rowGrouping: { model: ['department', 'team'] },
  }}
/>
```

---

## Styling

```tsx
// Via sx prop on DataGrid
<DataGrid
  sx={{
    '& .MuiDataGrid-columnHeaders': { backgroundColor: 'primary.main', color: 'white' },
    '& .MuiDataGrid-row:hover': { backgroundColor: 'action.hover' },
    '& .MuiDataGrid-cell:focus': { outline: 'none' },
    border: 'none',
  }}
/>

// getRowClassName — adds CSS class to rows
<DataGrid
  getRowClassName={(params) =>
    params.row.status === 'inactive' ? 'row-inactive' : ''
  }
  sx={{
    '& .row-inactive': { opacity: 0.5, fontStyle: 'italic' },
  }}
/>

// getCellClassName — adds CSS class to individual cells
<DataGrid
  getCellClassName={(params) => {
    if (params.field === 'salary' && (params.value as number) > 100000) {
      return 'cell-high-salary';
    }
    return '';
  }}
/>
```

---

## Export

```tsx
// CSV export (free)
<DataGrid
  slots={{ toolbar: GridToolbar }}
  slotProps={{
    toolbar: {
      csvOptions: {
        fileName: 'users-export',
        delimiter: ',',
        utf8WithBom: true,
      },
    },
  }}
/>

// Excel export (Premium only)
import { DataGridPremium } from '@mui/x-data-grid-premium';

<DataGridPremium
  slots={{ toolbar: GridToolbar }}
  slotProps={{
    toolbar: {
      excelOptions: {
        fileName: 'users-report',
        sheetName: 'Users',
      },
    },
  }}
/>
```

---

## Performance

```ts
// 1. Memoize columns array — never define inline in render
const columns = useMemo<GridColDef[]>(() => [
  { field: 'name', flex: 1 },
  // ...
], []);  // add dependencies if columns depend on state

// 2. Memoize rows if derived from data
const rows = useMemo(() => rawData.map(transformRow), [rawData]);

// 3. Set rowBuffer/columnBuffer for large datasets (default 3)
<DataGrid rowBuffer={10} columnBuffer={3} />

// 4. Avoid dynamic sx — use getRowClassName + styled instead
// Bad:
<DataGrid sx={{ '& .MuiDataGrid-row': { background: someStateVar ? 'red' : 'none' } }} />
// Good:
<DataGrid getRowClassName={(p) => p.row.error ? 'row-error' : ''} />
```

---

## Complete CRUD DataGrid Example

```tsx
import React, { useState, useMemo } from 'react';
import {
  DataGrid,
  GridColDef,
  GridRowModel,
  GridActionsCellItem,
  GridRowModes,
  GridRowModesModel,
  GridToolbarContainer,
} from '@mui/x-data-grid';
import { Button, Snackbar, Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

type User = { id: number; name: string; email: string; role: string; isNew?: boolean };

const initialRows: User[] = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'admin' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'user' },
];

function EditToolbar({ onAdd }: { onAdd: () => void }) {
  return (
    <GridToolbarContainer>
      <Button color="primary" startIcon={<AddIcon />} onClick={onAdd}>
        Add Record
      </Button>
    </GridToolbarContainer>
  );
}

export default function CRUDDataGrid() {
  const [rows, setRows] = useState<User[]>(initialRows);
  const [rowModesModel, setRowModesModel] = useState<GridRowModesModel>({});
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const handleAddRow = () => {
    const id = Math.max(0, ...rows.map((r) => r.id)) + 1;
    setRows((prev) => [...prev, { id, name: '', email: '', role: 'user', isNew: true }]);
    setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' } }));
  };

  const handleEditClick = (id: number) => () =>
    setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.Edit } }));

  const handleSaveClick = (id: number) => () =>
    setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.View } }));

  const handleCancelClick = (id: number) => () => {
    setRowModesModel((prev) => ({ ...prev, [id]: { mode: GridRowModes.View, ignoreModifications: true } }));
    setRows((prev) => prev.filter((r) => !(r.id === id && r.isNew)));
  };

  const handleDeleteClick = (id: number) => () =>
    setRows((prev) => prev.filter((r) => r.id !== id));

  const processRowUpdate = async (newRow: GridRowModel) => {
    if (!newRow.name || !newRow.email) throw new Error('Name and email are required');
    // In real app: await api.saveUser(newRow);
    const updated = { ...newRow, isNew: false } as User;
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSnackbar({ message: 'Row saved', severity: 'success' });
    return updated;
  };

  const columns = useMemo<GridColDef[]>(() => [
    { field: 'name', headerName: 'Name', flex: 1, editable: true },
    { field: 'email', headerName: 'Email', flex: 1, editable: true },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      editable: true,
      type: 'singleSelect',
      valueOptions: ['admin', 'user', 'readonly'],
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: ({ id }) => {
        const numId = id as number;
        if (rowModesModel[numId]?.mode === GridRowModes.Edit) {
          return [
            <GridActionsCellItem icon={<SaveIcon />} label="Save" onClick={handleSaveClick(numId)} />,
            <GridActionsCellItem icon={<CancelIcon />} label="Cancel" onClick={handleCancelClick(numId)} />,
          ];
        }
        return [
          <GridActionsCellItem icon={<EditIcon />} label="Edit" onClick={handleEditClick(numId)} />,
          <GridActionsCellItem icon={<DeleteIcon />} label="Delete" onClick={handleDeleteClick(numId)} color="error" />,
        ];
      },
    },
  ], [rowModesModel]);

  return (
    <>
      <div style={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={setRowModesModel}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={(err) => setSnackbar({ message: err.message, severity: 'error' })}
          slots={{ toolbar: EditToolbar }}
          slotProps={{ toolbar: { onAdd: handleAddRow } }}
        />
      </div>
      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
        {snackbar && <Alert severity={snackbar.severity}>{snackbar.message}</Alert>}
      </Snackbar>
    </>
  );
}
```

---

## Common Gotchas

- **`rowCount` is required for server-side pagination** — omitting it causes the DataGrid to assume all rows are loaded.
- **Column array must be stable** — define outside component or with `useMemo`, otherwise columns are re-created each render and cause focus loss during editing.
- **`getRowId` for non-`id` primary keys** — `<DataGrid getRowId={(row) => row.userId} />`.
- **`processRowUpdate` must return a row** — returning `undefined` will cause errors.
- **`disableVirtualization` is for tests only** — never use in production, it renders all rows at once.
- **Pro/Premium license activation** — call `LicenseInfo.setLicenseKey('YOUR_KEY')` at app entry point.
