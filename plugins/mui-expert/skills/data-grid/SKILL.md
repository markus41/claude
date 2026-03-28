---
name: data-grid
description: MUI X DataGrid configuration, server-side integration, and optimization
triggers:
  - DataGrid
  - data grid
  - table
  - MUI X
  - columns
  - sorting
  - filtering
  - pagination
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
  - "*.jsx"
---

# MUI X DataGrid

## Package Tiers

| Package | Import | Features |
|---------|--------|---------|
| `@mui/x-data-grid` | `DataGrid` | Sorting, filtering, pagination, export (free, MIT) |
| `@mui/x-data-grid-pro` | `DataGridPro` | Column pinning, row grouping, master-detail, infinite scroll |
| `@mui/x-data-grid-premium` | `DataGridPremium` | Aggregation, pivoting, Excel export, row spanning |

Always import `GridColDef` and the grid from the same package.

---

## Basic Setup

```tsx
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  active: boolean;
}

const columns: GridColDef<User>[] = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'name', headerName: 'Name', width: 180, flex: 1 },
  { field: 'email', headerName: 'Email', width: 220 },
  { field: 'role', headerName: 'Role', width: 120 },
  {
    field: 'createdAt',
    headerName: 'Created',
    width: 140,
    type: 'date',
    valueGetter: (value) => new Date(value),        // convert string to Date
    valueFormatter: (value: Date) =>
      value?.toLocaleDateString('en-US', { dateStyle: 'medium' }),
  },
  {
    field: 'active',
    headerName: 'Status',
    width: 100,
    type: 'boolean',
    renderCell: ({ value }) => (
      <Chip
        label={value ? 'Active' : 'Inactive'}
        color={value ? 'success' : 'default'}
        size="small"
      />
    ),
  },
];

function UsersGrid({ rows }: { rows: User[] }) {
  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
          sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        checkboxSelection
        disableRowSelectionOnClick
        density="compact"                   // 'compact' | 'standard' | 'comfortable'
        getRowId={(row) => row.id}          // only needed if row.id is not the key
      />
    </Box>
  );
}
```

---

## GridColDef Reference

```tsx
const col: GridColDef = {
  field: 'fieldName',          // must match row object key
  headerName: 'Display Name',
  description: 'Tooltip on header hover',
  width: 150,                  // fixed px width
  minWidth: 100,
  maxWidth: 300,
  flex: 1,                     // fill remaining space (like CSS flex-grow)
  type: 'string',              // 'string' | 'number' | 'date' | 'dateTime' | 'boolean' | 'singleSelect' | 'actions'
  align: 'left',               // 'left' | 'right' | 'center'
  headerAlign: 'left',
  sortable: true,
  filterable: true,
  hideable: true,
  pinnable: true,              // Pro/Premium only
  editable: false,

  // Transform raw value for display/sorting (not for renderCell)
  valueGetter: (value, row) => `${row.firstName} ${row.lastName}`,

  // Format value for display (runs after valueGetter)
  valueFormatter: (value: number) => `$${value.toFixed(2)}`,

  // Custom cell renderer — receives GridRenderCellParams
  renderCell: (params) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar src={params.row.avatar} sx={{ width: 24, height: 24 }} />
      {params.value}
    </Box>
  ),

  // Custom header renderer
  renderHeader: (params) => (
    <strong>{params.colDef.headerName} <span aria-hidden>*</span></strong>
  ),
};
```

### Actions column

```tsx
import { GridActionsCellItem, GridColDef } from '@mui/x-data-grid';

const actionsColumn: GridColDef = {
  field: 'actions',
  type: 'actions',
  headerName: 'Actions',
  width: 100,
  getActions: (params) => [
    <GridActionsCellItem
      key="edit"
      icon={<EditIcon />}
      label="Edit"
      onClick={() => handleEdit(params.row)}
    />,
    <GridActionsCellItem
      key="delete"
      icon={<DeleteIcon />}
      label="Delete"
      onClick={() => handleDelete(params.id)}
      showInMenu           // show in overflow menu instead of inline
    />,
  ],
};
```

---

## Client-Side Sorting, Filtering, Pagination

Client-side is the default. All three happen automatically — just provide `rows` and
`columns`. Customise with `initialState` or controlled props.

```tsx
import { GridSortModel, GridFilterModel } from '@mui/x-data-grid';

// Controlled sort
const [sortModel, setSortModel] = React.useState<GridSortModel>([
  { field: 'name', sort: 'asc' },
]);

<DataGrid
  rows={rows}
  columns={columns}
  sortModel={sortModel}
  onSortModelChange={setSortModel}
/>

// Controlled filter
const [filterModel, setFilterModel] = React.useState<GridFilterModel>({
  items: [{ field: 'role', operator: 'equals', value: 'admin' }],
});

<DataGrid
  rows={rows}
  columns={columns}
  filterModel={filterModel}
  onFilterModelChange={setFilterModel}
/>
```

---

## Server-Side Pagination, Sorting, and Filtering

Set `paginationMode`, `filterMode`, and `sortingMode` to `"server"`. Provide `rowCount`
so the grid knows total records. Fetch data whenever the model changes.

```tsx
import {
  DataGrid,
  GridSortModel,
  GridFilterModel,
  GridPaginationModel,
} from '@mui/x-data-grid';

function ServerGrid() {
  const [rows, setRows] = React.useState<User[]>([]);
  const [rowCount, setRowCount] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [sortModel, setSortModel] = React.useState<GridSortModel>([]);
  const [filterModel, setFilterModel] = React.useState<GridFilterModel>({ items: [] });

  // Fetch whenever any model changes
  React.useEffect(() => {
    let active = true;
    setLoading(true);

    fetchUsers({
      page: paginationModel.page,
      pageSize: paginationModel.pageSize,
      sort: sortModel,
      filter: filterModel,
    }).then((result) => {
      if (active) {
        setRows(result.rows);
        setRowCount(result.total);
        setLoading(false);
      }
    });

    return () => { active = false; };
  }, [paginationModel, sortModel, filterModel]);

  return (
    <Box sx={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        loading={loading}
        // Server-side modes
        paginationMode="server"
        sortingMode="server"
        filterMode="server"
        // Controlled models
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        filterModel={filterModel}
        onFilterModelChange={(model) => {
          setFilterModel(model);
          // Reset to page 0 on filter change
          setPaginationModel((prev) => ({ ...prev, page: 0 }));
        }}
        pageSizeOptions={[25, 50, 100]}
        keepNonExistentRowsSelected     // preserve selection across pages
      />
    </Box>
  );
}
```

---

## Editable Grid

```tsx
import {
  DataGrid,
  GridRowId,
  GridRowModel,
  GridRowModesModel,
  GridRowModes,
  GridRowEditStopReasons,
  GridEventListener,
} from '@mui/x-data-grid';

function EditableGrid({ initialRows }: { initialRows: User[] }) {
  const [rows, setRows] = React.useState(initialRows);
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});

  const handleRowEditStop: GridEventListener<'rowEditStop'> = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true; // don't save on blur, only on Enter
    }
  };

  const handleSave = (id: GridRowId) => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View },
    }));
  };

  const handleCancel = (id: GridRowId) => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));
  };

  // Called when a row exits edit mode — validate and persist here
  const processRowUpdate = React.useCallback(
    async (updatedRow: GridRowModel, originalRow: GridRowModel) => {
      if (!updatedRow.name) throw new Error('Name is required');
      const saved = await api.updateUser(updatedRow);
      setRows((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      return saved;
    },
    [],
  );

  const handleProcessRowUpdateError = (error: Error) => {
    showSnackbar(error.message, 'error');
  };

  const editColumns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1, editable: true },
    {
      field: 'role',
      headerName: 'Role',
      width: 140,
      editable: true,
      type: 'singleSelect',
      valueOptions: ['admin', 'editor', 'viewer'],
    },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
      getActions: ({ id }) => {
        const isEditing = rowModesModel[id]?.mode === GridRowModes.Edit;
        if (isEditing) {
          return [
            <GridActionsCellItem key="save" icon={<SaveIcon />} label="Save" onClick={() => handleSave(id)} />,
            <GridActionsCellItem key="cancel" icon={<CancelIcon />} label="Cancel" onClick={() => handleCancel(id)} />,
          ];
        }
        return [
          <GridActionsCellItem
            key="edit"
            icon={<EditIcon />}
            label="Edit"
            onClick={() =>
              setRowModesModel((prev) => ({
                ...prev,
                [id]: { mode: GridRowModes.Edit, fieldToFocus: 'name' },
              }))
            }
          />,
        ];
      },
    },
  ];

  return (
    <Box sx={{ height: 500 }}>
      <DataGrid
        rows={rows}
        columns={editColumns}
        editMode="row"
        rowModesModel={rowModesModel}
        onRowModesModelChange={setRowModesModel}
        onRowEditStop={handleRowEditStop}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={handleProcessRowUpdateError}
      />
    </Box>
  );
}
```

---

## Custom renderCell Examples

```tsx
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';

// Progress bar cell
const progressCol: GridColDef = {
  field: 'progress',
  headerName: 'Progress',
  width: 150,
  renderCell: ({ value }) => (
    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{ flex: 1, height: 8, borderRadius: 4 }}
      />
      <Typography variant="caption">{value}%</Typography>
    </Box>
  ),
};

// Link cell
const nameCol: GridColDef = {
  field: 'name',
  renderCell: ({ value, row }) => (
    <Link component={RouterLink} to={`/users/${row.id}`} underline="hover">
      {value}
    </Link>
  ),
};

// Multi-line cell (needs rowHeight adjustment on the grid)
const descriptionCol: GridColDef = {
  field: 'description',
  width: 300,
  renderCell: ({ value }) => (
    <Box sx={{ py: 1 }}>
      <Typography variant="body2" sx={{ whiteSpace: 'normal', lineHeight: 1.4 }}>
        {value}
      </Typography>
    </Box>
  ),
};
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
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

function CustomToolbar({ onAddRow }: { onAddRow: () => void }) {
  return (
    <GridToolbarContainer sx={{ justifyContent: 'space-between', px: 1, py: 0.5 }}>
      <Stack direction="row" spacing={0.5}>
        <GridToolbarColumnsButton />
        <GridToolbarFilterButton />
        <GridToolbarDensitySelector />
        <GridToolbarExport
          csvOptions={{ fileName: 'users-export', utf8WithBom: true }}
          printOptions={{ hideFooter: true }}
        />
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <GridToolbarQuickFilter
          quickFilterParser={(input) => input.split(',').map((s) => s.trim())}
          debounceMs={300}
        />
        <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={onAddRow}>
          Add row
        </Button>
      </Stack>
    </GridToolbarContainer>
  );
}

// Pass to DataGrid
<DataGrid
  slots={{ toolbar: CustomToolbar }}
  slotProps={{ toolbar: { onAddRow: handleAddRow } }}
/>
```

---

## Column Pinning (Pro/Premium)

```tsx
import { DataGridPro } from '@mui/x-data-grid-pro';

<DataGridPro
  rows={rows}
  columns={columns}
  initialState={{
    pinnedColumns: { left: ['name'], right: ['actions'] },
  }}
  // Or controlled:
  pinnedColumns={pinnedColumns}
  onPinnedColumnsChange={setPinnedColumns}
/>
```

---

## Performance Tips

1. **Memoize `columns`** — define outside the component or with `React.useMemo`.
   Re-creating the array on every render causes unnecessary column re-registration.

```tsx
// Bad: new array every render
function MyGrid({ data }) {
  const columns: GridColDef[] = [ ... ]; // recreated each render
  return <DataGrid rows={data} columns={columns} />;
}

// Good: stable reference
const COLUMNS: GridColDef[] = [ ... ]; // defined at module scope

function MyGrid({ data }) {
  return <DataGrid rows={data} columns={COLUMNS} />;
}
```

2. **Use `getRowId`** only when rows do not have an `id` field. Providing it
   unnecessarily adds overhead.

3. **Virtualization** is on by default and handles thousands of rows efficiently. Do not
   disable it (`disableVirtualization`) in production.

4. **`rowBuffer`** (default 3) controls how many off-screen rows to render. Increase for
   smoother scrolling on fast machines; decrease to reduce DOM nodes on slow devices.

```tsx
<DataGrid rowBuffer={5} columnBuffer={3} />
```

5. **Server-side for large datasets** — use `paginationMode="server"` when rowCount
   exceeds ~10,000 rows to avoid loading the full dataset into memory.

6. **`keepNonExistentRowsSelected`** prevents selection loss during server-side
   pagination page changes.

---

## Pro / Premium Features Reference

### Column Pinning (Pro)

```tsx
<DataGridPro
  initialState={{
    pinnedColumns: { left: ['id', 'name'], right: ['actions'] },
  }}
/>

// Programmatic
apiRef.current.pinColumn('id', 'left');
apiRef.current.unpinColumn('id');
```

### Row Grouping (Premium)

```tsx
<DataGridPremium
  initialState={{
    rowGrouping: { model: ['category', 'status'] },
  }}
  groupingColDef={{
    headerName: 'Group',
    width: 200,
  }}
/>
```

### Aggregation (Premium)

```tsx
<DataGridPremium
  initialState={{
    aggregation: {
      model: {
        revenue: 'sum',
        rating: 'avg',
        orders: 'max',
      },
    },
  }}
/>
```

Built-in functions: `sum`, `avg`, `min`, `max`, `size` (count).

### Master-Detail (Pro)

```tsx
<DataGridPro
  getDetailPanelContent={({ row }) => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Orders for {row.name}</Typography>
      <DataGrid rows={row.orders} columns={orderColumns} autoHeight />
    </Box>
  )}
  getDetailPanelHeight={() => 'auto'}
/>
```

### Excel Export (Premium)

```tsx
// Toolbar button
<DataGridPremium slots={{ toolbar: GridToolbar }} />

// Programmatic
apiRef.current.exportDataAsExcel({
  fileName: 'report',
  includeHeaders: true,
  utf8WithBom: true,
});
```

### Cell Selection (Premium)

```tsx
<DataGridPremium
  cellSelection
  onCellSelectionModelChange={(model) => {
    // model: Record<GridRowId, Record<string, boolean>>
    console.log('Selected cells:', model);
  }}
/>
```

### Clipboard Paste (Premium)

```tsx
<DataGridPremium
  cellSelection
  ignoreValueFormatterDuringExport
  splitClipboardPastedText={(text) =>
    text.split('\n').map((row) => row.split('\t'))
  }
/>
```

### Header Filters (Pro)

```tsx
<DataGridPro
  headerFilters
  slots={{
    headerFilterMenu: null,  // hide filter menu icon
  }}
/>
```

### Custom Filter Operators

```tsx
const ratingAboveOperator: GridFilterOperator<any, number> = {
  label: 'Above',
  value: 'above',
  getApplyFilterFn: (filterItem) => {
    if (!filterItem.value) return null;
    return (value) => Number(value) > Number(filterItem.value);
  },
  InputComponent: GridFilterInputValue,
};

const columns: GridColDef[] = [
  {
    field: 'rating',
    type: 'number',
    filterOperators: [...getGridNumericOperators(), ratingAboveOperator],
  },
];
```

### Server-Side Data Source (Pro)

The `GridDataSource` API (v7+) replaces manual server-side patterns:

```tsx
const dataSource: GridDataSource = {
  getRows: async (params) => {
    const { paginationModel, sortModel, filterModel } = params;
    const response = await fetch('/api/data', {
      method: 'POST',
      body: JSON.stringify({
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
        sort: sortModel[0],
        filters: filterModel.items,
      }),
    });
    const { rows, totalCount } = await response.json();
    return { rows, rowCount: totalCount };
  },
};

<DataGridPro
  dataSource={dataSource}
  paginationModel={{ page: 0, pageSize: 25 }}
  dataSourceCache={null}      // disable caching
  // or: dataSourceCache={{ ttl: 60_000 }}  // 60s cache
/>
```

### Row Reordering (Pro)

```tsx
<DataGridPro
  rowReordering
  onRowOrderChange={(params) => {
    // params.row, params.oldIndex, params.targetIndex
    updateOrder(params.row.id, params.targetIndex);
  }}
/>
```

### Tree Data (Pro)

```tsx
<DataGridPro
  treeData
  getTreeDataPath={(row) => row.path}  // e.g., ['Company', 'Engineering', 'Frontend']
  groupingColDef={{
    headerName: 'Organization',
    width: 300,
  }}
/>
```

---

## Tier Quick Reference

| Feature | Community | Pro | Premium |
|---------|:---------:|:---:|:-------:|
| Sorting, filtering, pagination | ✓ | ✓ | ✓ |
| Inline editing | ✓ | ✓ | ✓ |
| CSV export | ✓ | ✓ | ✓ |
| Column resizing/reordering | — | ✓ | ✓ |
| Column pinning | — | ✓ | ✓ |
| Row reordering | — | ✓ | ✓ |
| Tree data | — | ✓ | ✓ |
| Master-detail | — | ✓ | ✓ |
| Header filters | — | ✓ | ✓ |
| Lazy loading | — | ✓ | ✓ |
| Server-side data source | — | ✓ | ✓ |
| Row grouping | — | — | ✓ |
| Aggregation | — | — | ✓ |
| Excel export | — | — | ✓ |
| Cell selection | — | — | ✓ |
| Clipboard paste | — | — | ✓ |

---

## Community Tier — Advanced Recipes

These powerful patterns work with the free `@mui/x-data-grid` (MIT).

### Detail Panels — Single Open at a Time

```tsx
const [expandedRowId, setExpandedRowId] = useState<GridRowId | null>(null);

<DataGrid
  rows={rows}
  columns={columns}
  getDetailPanelContent={({ row }) => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">{row.name}</Typography>
      <Typography color="text.secondary">{row.description}</Typography>
    </Box>
  )}
  getDetailPanelHeight={() => 'auto'}
  detailPanelExpandedRowIds={expandedRowId ? [expandedRowId] : []}
  onDetailPanelExpandedRowIdsChange={(ids) => {
    // Only keep the last clicked — single panel open at a time
    const newId = ids.find((id) => id !== expandedRowId);
    setExpandedRowId(newId ?? null);
  }}
/>
```

### Expand/Collapse All Detail Panels

```tsx
const apiRef = useGridApiRef();

<Button onClick={() => {
  const allIds = rows.map((r) => r.id);
  apiRef.current.setExpandedDetailPanels(new Set(allIds));
}}>
  Expand All
</Button>
<Button onClick={() => apiRef.current.setExpandedDetailPanels(new Set())}>
  Collapse All
</Button>

<DataGrid apiRef={apiRef} rows={rows} columns={columns} ... />
```

### Custom Edit Components — Linked Selects

When changing one field should update another's options (e.g., Type → Account):

```tsx
function LinkedSelectEditCell({ id, field, api, row }: GridRenderEditCellParams) {
  // Account options depend on the selected Type
  const typeValue = row.type; // current type in the row
  const accountOptions = useMemo(
    () => getAccountsForType(typeValue),
    [typeValue],
  );

  return (
    <Select
      value={row.account ?? ''}
      onChange={(e) => api.setEditCellValue({ id, field, value: e.target.value })}
      fullWidth
      size="small"
    >
      {accountOptions.map((opt) => (
        <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
      ))}
    </Select>
  );
}

const columns: GridColDef[] = [
  {
    field: 'type',
    headerName: 'Type',
    editable: true,
    type: 'singleSelect',
    valueOptions: ['Income', 'Expense', 'Transfer'],
  },
  {
    field: 'account',
    headerName: 'Account',
    editable: true,
    renderEditCell: (params) => <LinkedSelectEditCell {...params} />,
  },
];
```

### Bulk Editing — Save/Discard Pattern

Collect edits locally, then batch-commit to the server:

```tsx
function BulkEditGrid({ rows: initialRows, columns }) {
  const [pendingChanges, setPendingChanges] = useState<Map<GridRowId, any>>(new Map());
  const [deletedIds, setDeletedIds] = useState<Set<GridRowId>>(new Set());

  // Merge pending changes into display rows
  const displayRows = useMemo(
    () => initialRows
      .filter((r) => !deletedIds.has(r.id))
      .map((r) => (pendingChanges.has(r.id) ? { ...r, ...pendingChanges.get(r.id) } : r)),
    [initialRows, pendingChanges, deletedIds],
  );

  const processRowUpdate = useCallback((newRow: any, oldRow: any) => {
    setPendingChanges((prev) => new Map(prev).set(newRow.id, newRow));
    return newRow; // optimistic — don't call API yet
  }, []);

  const handleSave = async () => {
    // Batch all changes to server
    await fetch('/api/users/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: Array.from(pendingChanges.values()),
        deletes: Array.from(deletedIds),
      }),
    });
    setPendingChanges(new Map());
    setDeletedIds(new Set());
  };

  const handleDiscard = () => {
    setPendingChanges(new Map());
    setDeletedIds(new Set());
  };

  const hasChanges = pendingChanges.size > 0 || deletedIds.size > 0;

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        <Button variant="contained" disabled={!hasChanges} onClick={handleSave}>
          Save ({pendingChanges.size} edits, {deletedIds.size} deletes)
        </Button>
        <Button disabled={!hasChanges} onClick={handleDiscard}>Discard</Button>
      </Box>
      <DataGrid
        rows={displayRows}
        columns={columns}
        editMode="row"
        processRowUpdate={processRowUpdate}
      />
    </>
  );
}
```

### Conditional Row Styling

```tsx
<DataGrid
  rows={rows}
  columns={columns}
  getRowClassName={(params) => {
    if (params.row.status === 'overdue') return 'row-overdue';
    if (params.row.isAggregate) return 'row-aggregate';
    return '';
  }}
  sx={{
    '& .row-overdue': {
      bgcolor: 'error.light',
      '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' },
    },
    '& .row-aggregate': {
      fontWeight: 700,
      bgcolor: 'action.hover',
    },
    // Alternate row backgrounds
    '& .MuiDataGrid-row:nth-of-type(even)': {
      bgcolor: 'action.hover',
    },
    // Remove focus outline
    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
      outline: 'none',
    },
    // Custom selection color
    '& .MuiDataGrid-row.Mui-selected': {
      bgcolor: 'primary.light',
      '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
    },
  }}
/>
```

### Action Column with Row Operations

```tsx
const columns: GridColDef[] = [
  // ... data columns
  {
    field: 'actions',
    headerName: 'Actions',
    type: 'actions',
    width: 120,
    getActions: (params) => [
      <GridActionsCellItem
        icon={<EditIcon />}
        label="Edit"
        onClick={() => handleEdit(params.row)}
      />,
      <GridActionsCellItem
        icon={<DeleteIcon />}
        label="Delete"
        onClick={() => handleDelete(params.id)}
        showInMenu  // moves to "..." overflow menu
      />,
      <GridActionsCellItem
        icon={<ContentCopyIcon />}
        label="Duplicate"
        onClick={() => handleDuplicate(params.row)}
        showInMenu
      />,
    ],
  },
];
```

### Custom Filter Operators

```tsx
// "Overdue by X days" custom operator
const overdueOperator: GridFilterOperator = {
  label: 'Overdue by (days)',
  value: 'overdueByDays',
  getApplyFilterFn: (filterItem) => {
    if (!filterItem.value) return null;
    const days = Number(filterItem.value);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return (value) => {
      if (!value) return false;
      return new Date(value) < cutoff;
    };
  },
  InputComponent: GridFilterInputValue,
  InputComponentProps: { type: 'number' },
};

// "Is any of" multi-value operator
const isAnyOfOperator: GridFilterOperator = {
  label: 'Is any of',
  value: 'isAnyOf',
  getApplyFilterFn: (filterItem) => {
    if (!filterItem.value?.length) return null;
    const values = new Set(filterItem.value);
    return (value) => values.has(value);
  },
  InputComponent: MultiValueFilterInput, // your custom multi-select input
};

const columns: GridColDef[] = [
  {
    field: 'dueDate',
    headerName: 'Due Date',
    type: 'date',
    filterOperators: [...getGridDateOperators(), overdueOperator],
  },
  {
    field: 'status',
    headerName: 'Status',
    filterOperators: [...getGridStringOperators(), isAnyOfOperator],
  },
];
```

### "Always Show Selected" Filter Wrapper

Keep selected rows visible even when they don't match the active filter:

```tsx
function wrapFilterToKeepSelected(
  operator: GridFilterOperator,
  selectedIds: Set<GridRowId>,
): GridFilterOperator {
  return {
    ...operator,
    getApplyFilterFn: (filterItem, column) => {
      const baseFn = operator.getApplyFilterFn(filterItem, column);
      if (!baseFn) return null;
      return (value, row) => {
        if (selectedIds.has(row.id)) return true; // always show selected
        return baseFn(value, row);
      };
    },
  };
}
```

### Custom Detail Panel Toggle Column (Pro)

Replace the default chevron with your own toggle button:

```tsx
import {
  GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
  useGridApiContext,
} from '@mui/x-data-grid-pro';

function DetailToggleCell({ id }: { id: GridRowId }) {
  const apiRef = useGridApiContext();
  const isExpanded = apiRef.current.getExpandedDetailPanels().has(id);

  return (
    <IconButton
      size="small"
      aria-label={isExpanded ? 'collapse' : 'expand'}
      onClick={(e) => {
        e.stopPropagation();
        const expanded = new Set(apiRef.current.getExpandedDetailPanels());
        isExpanded ? expanded.delete(id) : expanded.add(id);
        apiRef.current.setExpandedDetailPanels(expanded);
      }}
    >
      {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
    </IconButton>
  );
}

const columns: GridColDef[] = [
  {
    ...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
    renderCell: (params) => <DetailToggleCell id={params.id} />,
  },
  // ... other columns
];
```

### Toggle Detail on Row Click

```tsx
<DataGridPro
  apiRef={apiRef}
  rows={rows}
  columns={columns}
  onRowClick={(params, event) => {
    // Skip if clicking inside a button or link
    if ((event.target as HTMLElement).closest('button, a, [data-no-toggle]')) return;

    const expanded = new Set(apiRef.current.getExpandedDetailPanels());
    expanded.has(params.id) ? expanded.delete(params.id) : expanded.add(params.id);
    apiRef.current.setExpandedDetailPanels(expanded);
  }}
  getDetailPanelContent={({ row }) => <RowDetail row={row} />}
  getDetailPanelHeight={() => 'auto'}
/>
```

### Form Inside Detail Panel (Master-Detail Editing)

Embed a full edit form inside the detail panel instead of inline row editing:

```tsx
function DetailFormPanel({ row }: { row: any }) {
  const apiRef = useGridApiContext();

  return (
    <Box sx={{ p: 2, maxWidth: 600 }}>
      <EntityForm
        metadata={userMetadata}
        initialValues={row}
        onSubmit={async (data) => {
          await fetch(`/api/users/${row.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          apiRef.current.updateRows([data]); // refresh row in grid
          // Collapse the panel after save
          const expanded = new Set(apiRef.current.getExpandedDetailPanels());
          expanded.delete(row.id);
          apiRef.current.setExpandedDetailPanels(expanded);
        }}
        onCancel={() => {
          const expanded = new Set(apiRef.current.getExpandedDetailPanels());
          expanded.delete(row.id);
          apiRef.current.setExpandedDetailPanels(expanded);
        }}
      />
    </Box>
  );
}

<DataGridPro
  apiRef={apiRef}
  rows={rows}
  columns={columns}
  getDetailPanelContent={({ row }) => <DetailFormPanel row={row} />}
  getDetailPanelHeight={() => 'auto'}
/>
```

### Expand/Collapse All from Header

```tsx
function ExpandAllHeader() {
  const apiRef = useGridApiContext();
  const expanded = apiRef.current.getExpandedDetailPanels();
  const allExpanded = expanded.size === rows.length;

  return (
    <IconButton
      size="small"
      aria-label={allExpanded ? 'collapse all' : 'expand all'}
      onClick={() => {
        if (allExpanded) {
          apiRef.current.setExpandedDetailPanels(new Set());
        } else {
          apiRef.current.setExpandedDetailPanels(new Set(rows.map((r) => r.id)));
        }
      }}
    >
      {allExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
    </IconButton>
  );
}

const columns: GridColDef[] = [
  {
    ...GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
    renderHeader: () => <ExpandAllHeader />,
    renderCell: (params) => <DetailToggleCell id={params.id} />,
  },
  // ...
];
```
