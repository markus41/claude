---
name: advanced-widgets
description: Top 0.01% MUI patterns — sparkline grid cells, heatmap DataGrids, real-time WebSocket grids, AI assistant, save/restore grid state, bi-directional chart+grid, pivot tables, clipboard paste, progress cells
triggers:
  - sparkline cell
  - heatmap grid
  - live data grid
  - real-time grid
  - WebSocket DataGrid
  - SignalR grid
  - AI assistant grid
  - save grid state
  - restore grid state
  - grid profiles
  - chart grid sync
  - pivot table
  - clipboard paste
  - progress cell
  - creative widget
  - unique UI
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
globs:
  - "*.tsx"
  - "*.ts"
---

# Advanced MUI Widgets — Top 0.01% Patterns

These patterns transform MUI from a component library into a living application platform.

---

## DataGrid as a Living Application Surface

### Sparkline Charts in Grid Cells

Every row becomes a mini dashboard with inline trend visualization.

```tsx
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import type { GridColDef } from '@mui/x-data-grid';

// Custom column type — reuse across multiple columns
const sparklineColumn = (field: string, label: string, plotType: 'line' | 'bar' = 'line'): GridColDef => ({
  field,
  headerName: label,
  width: 180,
  sortable: false,
  filterable: false,
  renderCell: (params) => {
    const data = params.value as number[];
    if (!data?.length) return null;
    const isUp = data[data.length - 1] > data[0];

    return (
      <SparkLineChart
        data={data}
        width={160}
        height={48}
        plotType={plotType}
        curve="natural"
        showTooltip
        showHighlight
        area={plotType === 'line'}
        colors={[isUp ? '#16a34a' : '#dc2626']}
      />
    );
  },
});

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Contractor', width: 200 },
  sparklineColumn('weeklyTrend', '12-Week Trend', 'line'),
  sparklineColumn('weeklyHours', 'Weekly Hours', 'bar'),
  {
    field: 'utilization',
    headerName: 'Utilization',
    width: 120,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        <Typography variant="body2" fontWeight={600} sx={{ minWidth: 40 }}>
          {params.value}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={params.value}
          sx={{
            flex: 1, height: 8, borderRadius: 4,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              bgcolor: params.value > 80 ? 'error.main'
                : params.value > 60 ? 'warning.main'
                : 'success.main',
            },
          }}
        />
      </Box>
    ),
  },
];
```

### Heatmap Color Scaling

Map numeric values to a continuous color gradient across cells.

```tsx
function heatmapColor(value: number, min = 0, max = 100): string {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));

  // Cool → Warm gradient (blue → yellow → red)
  if (pct < 0.5) {
    const t = pct * 2;
    return `rgb(${Math.round(59 + 196 * t)}, ${Math.round(130 + 70 * t)}, ${Math.round(246 - 186 * t)})`;
  }
  const t = (pct - 0.5) * 2;
  return `rgb(${Math.round(255)}, ${Math.round(200 - 140 * t)}, ${Math.round(60 - 60 * t)})`;
}

const heatmapColumn: GridColDef = {
  field: 'score',
  headerName: 'Score',
  width: 100,
  renderCell: (params) => (
    <Box
      sx={{
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: heatmapColor(params.value),
        color: params.value > 60 ? '#fff' : '#000',
        fontWeight: 700, fontSize: '0.875rem',
        transition: 'background-color 300ms ease',
      }}
    >
      {params.value}
    </Box>
  ),
};
```

### Real-Time WebSocket Grid

Stream data updates from SignalR/WebSocket → `apiRef.updateRows()` with flash animation.

```tsx
function LiveDataGrid({ initialRows, columns }: { initialRows: any[]; columns: GridColDef[] }) {
  const apiRef = useGridApiRef();
  const flashTimeouts = useRef(new Map<GridRowId, NodeJS.Timeout>());

  useEffect(() => {
    // Connect to SignalR hub or WebSocket
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/data')
      .withAutomaticReconnect()
      .build();

    connection.on('RowsUpdated', (deltas: any[]) => {
      // Patch only changed rows — no full re-render
      apiRef.current.updateRows(deltas);

      // Flash animation per updated row
      for (const delta of deltas) {
        const el = apiRef.current.getRowElement(delta.id);
        if (el) {
          el.classList.add('row-flash');
          // Clear previous timeout for this row
          const prev = flashTimeouts.current.get(delta.id);
          if (prev) clearTimeout(prev);
          flashTimeouts.current.set(
            delta.id,
            setTimeout(() => el.classList.remove('row-flash'), 600),
          );
        }
      }
    });

    connection.start();
    return () => { connection.stop(); };
  }, [apiRef]);

  return (
    <DataGrid
      apiRef={apiRef}
      rows={initialRows}
      columns={columns}
      sx={{
        '@keyframes rowFlash': {
          '0%': { backgroundColor: 'rgba(56,189,248,0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
        '& .row-flash': {
          animation: 'rowFlash 600ms ease-out',
        },
        // Green flash for price up, red for down
        '& .row-flash-up': {
          animation: 'rowFlash 600ms ease-out',
          '@keyframes rowFlash': { '0%': { bgcolor: 'rgba(22,163,74,0.25)' } },
        },
      }}
    />
  );
}
```

### Save/Restore Grid State as User Profiles

```tsx
function GridWithProfiles({ rows, columns }: { rows: any[]; columns: GridColDef[] }) {
  const apiRef = useGridApiRef();
  const [profiles, setProfiles] = useState<Record<string, any>>(() =>
    JSON.parse(localStorage.getItem('grid-profiles') ?? '{}'),
  );
  const [activeProfile, setActiveProfile] = useState<string | null>(null);

  const saveProfile = useCallback(() => {
    const name = prompt('Profile name:');
    if (!name) return;
    const state = apiRef.current.exportState();
    const next = { ...profiles, [name]: state };
    setProfiles(next);
    localStorage.setItem('grid-profiles', JSON.stringify(next));
    setActiveProfile(name);
  }, [apiRef, profiles]);

  const loadProfile = useCallback((name: string) => {
    if (profiles[name]) {
      apiRef.current.restoreState(profiles[name]);
      setActiveProfile(name);
    }
  }, [apiRef, profiles]);

  return (
    <>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
        <Typography variant="caption" color="text.secondary">Views:</Typography>
        {Object.keys(profiles).map((name) => (
          <Chip
            key={name}
            label={name}
            variant={activeProfile === name ? 'filled' : 'outlined'}
            color={activeProfile === name ? 'primary' : 'default'}
            size="small"
            onClick={() => loadProfile(name)}
            onDelete={() => {
              const { [name]: _, ...rest } = profiles;
              setProfiles(rest);
              localStorage.setItem('grid-profiles', JSON.stringify(rest));
              if (activeProfile === name) setActiveProfile(null);
            }}
          />
        ))}
        <Button size="small" startIcon={<SaveIcon />} onClick={saveProfile}>
          Save View
        </Button>
      </Stack>
      <DataGrid apiRef={apiRef} rows={rows} columns={columns} />
    </>
  );
}
```

### Custom Domain Toolbar

```tsx
function DomainToolbar({ onAssign, onExport }: { onAssign: () => void; onExport: () => void }) {
  const apiRef = useGridApiContext();
  const selectedRows = useGridSelector(apiRef, gridRowSelectionStateSelector);
  const hasSelection = selectedRows.length > 0;

  return (
    <GridToolbarContainer sx={{ gap: 1, p: 1 }}>
      <GridToolbarFilterButton />
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <Divider orientation="vertical" flexItem />

      <Button
        size="small"
        startIcon={<PersonAddIcon />}
        disabled={!hasSelection}
        onClick={onAssign}
      >
        Assign ({selectedRows.length})
      </Button>

      <Button size="small" startIcon={<FileDownloadIcon />} onClick={onExport}>
        Export Filtered
      </Button>

      <Box sx={{ flex: 1 }} />

      {/* Date range filter */}
      <DateRangePicker
        slotProps={{
          textField: { size: 'small', sx: { width: 260 } },
          shortcuts: {
            items: [
              { label: 'This Week', getValue: () => [dayjs().startOf('week'), dayjs()] },
              { label: 'This Month', getValue: () => [dayjs().startOf('month'), dayjs()] },
            ],
          },
        }}
      />
    </GridToolbarContainer>
  );
}

<DataGrid
  rows={rows}
  columns={columns}
  checkboxSelection
  slots={{ toolbar: DomainToolbar }}
  slotProps={{ toolbar: { onAssign: handleAssign, onExport: handleExport } }}
/>
```

---

## Premium Tier — Transformative Features

### AI Assistant (Premium)

Natural language grid interaction — users type queries, the grid updates.

```tsx
import { DataGridPremium, GridAiAssistantPanel } from '@mui/x-data-grid-premium';

<DataGridPremium
  rows={rows}
  columns={columns}
  aiAssistant
  slots={{ aiAssistantPanel: GridAiAssistantPanel }}
  allowAiAssistantDataSampling
  aiAssistantSuggestions={[
    { value: 'Show overdue invoices' },
    { value: 'Group by department, sort by total revenue' },
    { value: 'Filter to active contractors with utilization > 80%' },
    { value: 'Show month-over-month growth' },
  ]}
/>
```

### Bi-Directional Chart + Grid Sync (Premium)

Filtering/grouping in the grid instantly updates connected charts.

```tsx
import { DataGridPremium, useGridApiRef, gridFilteredSortedRowIdsSelector } from '@mui/x-data-grid-premium';
import { BarChart } from '@mui/x-charts/BarChart';

function DashboardWithSync({ rows, columns }) {
  const apiRef = useGridApiRef();
  const [chartData, setChartData] = useState(rows);

  // Sync chart with grid's visible rows
  const handleStateChange = useCallback(() => {
    const visibleIds = gridFilteredSortedRowIdsSelector(apiRef);
    const visibleRows = visibleIds.map((id) => apiRef.current.getRow(id)).filter(Boolean);
    setChartData(visibleRows);
  }, [apiRef]);

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2, height: 300 }}>
        <BarChart
          dataset={chartData}
          xAxis={[{ scaleType: 'band', dataKey: 'department' }]}
          series={[
            { dataKey: 'revenue', label: 'Revenue', color: '#2563eb' },
            { dataKey: 'expenses', label: 'Expenses', color: '#dc2626' },
          ]}
        />
      </Paper>

      <Box sx={{ height: 500 }}>
        <DataGridPremium
          apiRef={apiRef}
          rows={rows}
          columns={columns}
          onFilterModelChange={handleStateChange}
          onSortModelChange={handleStateChange}
          onRowGroupingModelChange={handleStateChange}
        />
      </Box>
    </Stack>
  );
}
```

### Pivoting (Premium)

No-code SQL GROUP BY in the browser — users drag fields to rows/columns/values.

```tsx
<DataGridPremium
  rows={rows}
  columns={columns}
  initialState={{
    rowGrouping: { model: ['department'] },
    aggregation: {
      model: {
        salary: 'avg',
        revenue: 'sum',
        headcount: 'size',
      },
    },
  }}
/>
```

### Excel-Style Clipboard (Premium)

Multi-cell selection + `Ctrl+C`/`Ctrl+V` with Excel/Sheets.

```tsx
<DataGridPremium
  rows={rows}
  columns={columns}
  cellSelection
  ignoreValueFormatterDuringExport
  onBeforeClipboardPasteStart={async ({ data }) => {
    // Confirmation dialog for bulk paste
    const rowCount = data.length;
    if (rowCount > 10) {
      const confirmed = await showConfirmDialog(
        `Paste ${rowCount} rows?`,
        'This will update existing values.',
      );
      if (!confirmed) throw new Error('Paste cancelled');
    }
  }}
  splitClipboardPastedText={(text) =>
    text.split('\n').map((row) => row.split('\t'))
  }
/>
```

---

## Patterns That Make Apps Genuinely Unique

| Pattern | Effect |
|---------|--------|
| Grid IS the form | Users never open separate forms for simple edits |
| Data speaks first | Sparklines, progress bars, heatmaps give semantic meaning at a glance |
| Natural language UX | AI assistant transforms power-user grid into conversational interface |
| Persistent views | Saved grid states give users ownership over their workspace |
| Schema-first forms | Forms adapt to roles and entity types without touching React code |
| Motion + Base UI | Hardware switches, spring toggles, animated wizards feel crafted |
| Tree as navigation | RichTreeView replaces sidebar with interactive, searchable hierarchy |
| Chart + grid sync | Live bi-directional updates create a BI-tool experience |

---

## Community vs Pro vs Premium Capability Map

| Capability | Community | Pro | Premium |
|------------|:---------:|:---:|:-------:|
| Sparkline/progress/heatmap cells | ✓ `renderCell` | ✓ | ✓ |
| Real-time `updateRows` | ✓ | ✓ | ✓ |
| Save/restore grid state | ✓ | ✓ | ✓ |
| Custom filter operators | ✓ | ✓ | ✓ |
| Custom toolbar slots | ✓ | ✓ | ✓ |
| Master-detail panels | — | ✓ | ✓ |
| Column pinning | — | ✓ | ✓ |
| Tree data | — | ✓ | ✓ |
| Row grouping + aggregation | — | — | ✓ |
| Pivoting | — | — | ✓ |
| Excel clipboard copy/paste | — | — | ✓ |
| Charts + DataGrid sync | — | — | ✓ |
| AI assistant (NL queries) | — | — | ✓ |
