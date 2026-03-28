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

---

## 100+ Custom Widget Ideas Catalog

Exhaustive reference of buildable widgets organized by category. Every cell in a
DataGrid is a React portal — anything that renders can live there.

### DataGrid Cell Widgets (renderCell)

**Status & State Cells:**
- Animated status pill — Chip with Framer Motion layout animation between states (Active → Paused → Terminated)
- Multi-state traffic light — three dots (availability, billing, compliance) each independently green/yellow/red
- Pulse dot — CSS `@keyframes` radiate animation indicating "live" or "recently updated" rows
- Countdown timer cell — live deadline countdown; amber at 48h, red at 24h, blinking colon
- SLA breach indicator — thin bar draining left-to-right as SLA window closes (health bar)
- Confidence score ring — tiny circular progress arc replacing a plain percentage number
- Dual-state toggle cell — inline MUI Switch committing directly to API with optimistic rollback

**Data Visualization Cells:**
- Inline sparkline (trend) — area sparkline with highlighted last point, directional color
- Bullet chart cell — thin bar against background range band (actual vs target in one cell)
- Mini bar chart cell — 5-7 vertical SVG bars showing weekly totals with hover tooltip
- Waterfall delta cell — positive/negative delta with colored arrow and background tint
- Heatmap cell background — continuous color scale (white → orange → red) with auto-contrast text
- Radial gauge cell — tiny half-circle gauge arc, fits in 60px column
- Stacked proportion bar — full-width bar split into 2-4 colored segments (time split: design/dev/review)
- Trend arrow with magnitude — arrow size scales logarithmically with change magnitude
- Rating stars cell — interactive half-star rating committing on click
- Scatter dot cluster — 10-30 tiny dots at x/y positions showing distribution

**Content & Identity Cells:**
- Avatar stack cell — up to 5 overlapping Avatars with "+N more" chip
- Tag cloud cell — colored Chips, overflow-hidden with "+3 more" popover on hover
- File type icon cell — richly styled icon (PDF/XLSX/PNG) with one-click download on hover
- Image thumbnail cell — 40×40 lazy-loaded thumbnail with Popover zoom on hover
- Code snippet cell — monospace syntax-highlighted text with popover expansion
- Flag + country cell — 16×16 flag emoji/SVG beside country name
- Severity badge cell — rounded square with color-coded left border
- Priority indicator cell — 3-segment vertical bar like a battery icon for urgency

**Action & Interaction Cells:**
- One-click action cell — single IconButton for the most common row action
- Split-button action cell — primary action + chevron opening secondary Menu
- Inline numeric stepper — `-` / value / `+` for quantity without opening a form
- Inline date edit cell — click opens DatePicker popover anchored to cell
- Inline rich text cell — click opens Tiptap editor in Popover anchored to cell
- Expandable JSON viewer — collapsed `{ ... }` expanding to formatted JSON tree in Collapse
- Drag handle cell — DragIndicatorIcon enabling manual row reorder, persists on drop
- Copy-to-clipboard cell — hover reveals clipboard icon, click copies with toast confirmation

### DataGrid Row-Level Widgets

- Detail panel as mini-form — row expansion reveals RHF form pre-populated from row data
- Detail panel as micro-dashboard — expansion reveals sparklines, stat grid, event timeline
- Detail panel as nested sub-grid — second DataGrid scoped to row's children (project → tasks)
- Row-level activity feed — chronological event feed with avatars and timestamps
- Row comparison mode — select two rows, diff-style view highlights differing cells
- Pinned summary row — custom footer with aggregated statistics per column
- Ghost row (drafts) — dashed border + transparent background for unsaved rows
- Row-level skeleton loader — individual rows animate as skeletons during lazy load
- Row health score bar — thin colored bar along left edge (like VS Code diagnostic markers)
- Animated row flash on update — WebSocket-triggered green/red flash with CSS keyframe

### DataGrid Toolbar & Panel Widgets

- Global entity search bar — full-width Autocomplete searching across multiple fields
- Live row count badge — Badge on filter button: "12 of 450 rows visible"
- Saved views dropdown — Select restoring named grid state snapshots (filter/sort/columns)
- Bulk action bar — toolbar morphs with Framer Motion to reveal bulk actions on selection
- Density slider — Slider controlling row density beyond MUI's three built-in options
- Column group toggle — toggle buttons showing/hiding logical column groups ("Financial", "Contact")
- Time travel scrubber — Slider that reloads grid with historical snapshot data for that date
- Import zone in toolbar — drag-drop CSV zone with column-mapping modal
- Export format picker — split button for CSV/XLSX/JSON/filtered subset export
- Active filter chips strip — removable Chips below toolbar showing each active filter

### Form Widgets

**Input Patterns:**
- Autosave status indicator — floating Chip ("Saving…" / "Saved ✓" / "Error") near form title
- Field completion progress ring — circular arc above submit button filling as fields complete
- Smart address field — single TextField with Google Places autocomplete → splits into parts
- Phone input with flag selector — flag picker Select + formatted phone TextField
- Segmented control row — large icon+label toggle buttons replacing boring Select
- Tag input field — type + Enter creates Chip; removable; whitelist or freeform
- Dual-thumb range slider with histogram — Slider over histogram SVG showing distribution
- Color picker field — swatch preview → full HSL picker popover with hex/rgb tabs
- Icon picker field — searchable grid of icons in popover, selected appears as preview
- Emoji picker field — same pattern for emoji (reactions, category markers, mood selectors)
- Geolocation picker — embeddable map as form field; click to drop pin, lat/lng populate
- Star rating input — interactive with keyboard accessibility and ARIA labels
- Currency input — formats on blur, strips formatting on focus, locale-aware validation
- Percentage input with live preview — typing shows live proportion bar below field

**Multi-Step & Structural:**
- Step indicator with completion state — checkmarks on complete, spring animation on current, warning on skipped
- Accordion form sections — auto-expand next incomplete section after user collapses current
- Collapsible optional fields — "Show advanced options" button with smooth Collapse
- Inline validation summary panel — sticky panel listing all errors as clickable scroll-to links
- Undo/redo form history — Ctrl+Z/Y traversing state snapshots in circular buffer
- Dependency graph field — locked until upstream fields validate; tooltip explains requirements
- Signature pad field — canvas Box for mouse/stylus signature → base64 PNG
- Rich text field with toolbar — Tiptap editor styled with MUI Paper/IconButton
- File upload with preview grid — thumbnail grid (images) or file type icons with reorder
- Conditional field reveal animation — motion.div spring entry instead of hard visibility toggle

### Dashboard Widgets

**KPI & Metric:**
- Flip counter KPI card — digits "flip" with rotateX animation (departures board style)
- Trend comparison KPI — current + previous + delta with directional arrow and color tint
- Target progress card — bold number + subtitle + horizontal bar toward target
- Sparkline KPI card — full-width ghost area chart behind the stat number
- Multi-metric ticker — horizontal strip cycling 5-10 metrics with slide transition
- Real-time gauge widget — half-circle SVG gauge with animated needle (D3-free, theme colors)
- Scorecard with grade — letter grade (A-F) in large bold colored circle + explanation
- Comparison donut — two-value donut with center text showing change, animated on mount

**Temporal:**
- Activity heatmap calendar — GitHub-style 52-week contribution grid with hover tooltips
- Gantt mini-widget — compact horizontal bar chart (tasks with start/end, color by status)
- Timeline feed widget — vertical timeline with date markers, event icons, descriptions
- Upcoming events countdown — next 3-5 events with T-minus countdown timers
- Rolling 7-day bar chart — auto-scoped BarChart with today's bar highlighted
- SLA tracking grid — mini grid showing entity name, due date, colored urgency bar

**Status & Health:**
- Service health board — grid of service + status dot + uptime %; click for 30-day sparkline
- Capacity utilization matrix — 2D grid (team × week) with heatmap cell backgrounds
- Alert severity stack — stacked Paper with critical/high/medium/low colored bands
- Pipeline stage funnel — horizontal SVG funnel with counts; click filters main grid
- Quota usage bar stack — single full-width bar divided into colored quota categories
- Dependency status tree — RichTreeView showing service dependencies with colored status
- Data freshness indicator — "Last synced X min ago" with pulsing dot; amber/red thresholds

**Collaboration & Social:**
- Online presence widget — avatar row with green/gray dots + "last active X min ago" hover
- Activity feed widget — scrollable recent actions with avatars, infinite scroll
- Comment thread widget — threaded comments in Card with indent, new comments animate in
- Leaderboard widget — ranked list with medal icons, animated number changes
- Recent changes diff widget — last 5 field changes with old → new + timestamp + who
- Team capacity ring cluster — cluster of small radial gauges per team member

**Content & Navigation:**
- Quick search command palette — Cmd+K modal with fuzzy search across entities/commands/nav
- Draggable kanban column — drag-and-drop Paper cards in horizontal scroll with elevation changes
- File explorer tree widget — RichTreeView as file browser with context menu + inline rename
- Breadcrumb navigator — clickable breadcrumbs doubling as drill-down navigation
- Resizable split pane — draggable divider with persisted ratio to localStorage
- Pinned notes widget — drag-to-reorder, click-to-expand, pin/unpin toggle
- Shortcut grid widget — configurable 4×3 grid of labeled icon buttons for frequent actions

### Embedded & Overlay Widgets

- Contextual side panel — Drawer from right with full entity context (stats, activity, related)
- Floating action ring — SpeedDial with spring-animated domain action icons
- In-app notification center — IconButton badge → Popover feed, grouped by type, dismissable
- Persistent help tooltip — Tooltip that persists on click with description + "Learn more"
- Spotlight onboarding overlay — semi-transparent overlay with clip-path circle highlighting elements
- Inline status banner — thin top Alert sliding in during async operations
- Right-click context menu — onContextMenu opening styled Menu with row-specific actions
- Sticky comparison tray — bottom tray slides up showing 2-4 pinned items side-by-side
- Floating chat bubble — FAB opening embedded chat interface in floating Paper
- Global progress overlay — top-of-page LinearProgress (YouTube/GitHub style)
- Toast queue with actions — stacking snackbars with Undo/Retry/View buttons
- Popover mini-chart — hover any metric opens 120×80 sparkline/bar chart for quick context

### Theme & Global Experience Widgets

- Live theme switcher — floating Fab cycling named themes with CSS variable transition
- User-configurable layout grid — react-grid-layout + Paper for drag/resize/add/remove dashboards
- Density mode toggle — icon button toggling "information dense" vs "comfortable" via CSS vars
- Dark/light mode toggle with transition — clip-path radial wipe animation from click position
- Keyboard shortcut overlay — `?` opens full-screen modal with two-column shortcut grid
- Breadcrumb-as-navigation — persistent breadcrumb where each crumb is a dropdown of siblings
- Per-entity color labeling — user-assigned color as left-border accent across all views
- Widget loading skeleton system — purpose-built skeletons mirroring actual content shape
- Empty state illustrations — illustrated empty states with contextual CTAs (not "No data found")
- Confetti burst on milestone — canvas-confetti beneath celebratory Snackbar on key achievements

---

## 100+ Standalone Dashboard Widget Ideas (Net-New)

Self-contained `Paper`/`Card`-based units for drag-resize grid dashboards.

### Financial & Revenue Widgets

- Revenue waterfall card — starting balance → additions/subtractions → ending balance as horizontal segments
- Invoice aging buckets — four stacked bands (current, 1-30d, 31-60d, 60+d) proportionally sized, green→red
- Cost-per-unit trend — auto-scaled Y axis emphasizing micro-changes, current value floating at line end
- Burn rate runway meter — fuel gauge draining left-to-right; orange <6mo, red <3mo
- Gross margin drift dial — large % number with semicircular arc showing position in trailing 12mo range
- Revenue concentration risk card — treemap of top 10 clients with % of total; risk score badge
- Recurring vs one-time split donut — MRR vs one-time; center text = total; segments animate independently
- Quote-to-cash pipeline — horizontal funnel (Quote→Approved→Invoiced→Paid) with counts + dollar amounts
- Payment velocity widget — avg days invoice-to-paid as large number + 90-day sparkline + delta badge
- Multi-currency exchange alert — live rates for invoiced currencies; >1% moves flash amber
- Commission earned vs target arc — bold arc gauge filling as earned climbs toward monthly goal

### People, Team & Workforce Widgets

- Contractor utilization heatmap — rows=contractors, columns=weeks, cell color=utilization %
- Bench strength indicator — horizontal bar per skill category showing available (unassigned) count
- Headcount trajectory line — 12-month active member/contractor count with annotated key events
- Skills radar — RadarChart with 6-8 skill axes; compare two people as overlapping polygons
- Onboarding funnel — stages (invited→registered→profile→first assignment) with drop-off %
- Attrition risk heatmap — 2D grid (role × tenure) with ML-predicted risk intensity per cell
- Certification expiry timeline — horizontal strip with dots; within 30d=orange, overdue=red
- Workload balance dial cluster — four half-circle dials per team showing avg workload fill %
- Availability calendar mini-grid — 4-week grid, rows=contractors, cells=green/yellow/red
- New vs returning member mix — stacked monthly bars showing acquisition vs retention health
- Top performer spotlight — rotating card cycling top 3 with avatar + dominant metric every 8s

### Project & Work Tracking Widgets

- Project health scorecard — 4×4 grid of RAG-colored squares with project name + one-line status
- Blocked items counter — bold count + top 3 blockers with age + CTA to full blocked list
- Velocity trend — 6-week rolling bar chart with current week highlighted + average dashed line
- Work type distribution pie — strategic vs operational vs maintenance vs reactive donut
- Scope creep tracker — original vs current estimate side-by-side with percentage creep badge
- Time logged vs estimated scatter — inline SVG scatter; dots above diagonal = over-run
- Project milestone countdown — ordered T-minus list with RAG indicators; overdue shows negative
- Approval queue depth — single number + 14-day trend sparkline + jump-to-approvals button
- Rework rate card — % items reopened + 30-day sparkline + industry benchmark dashed reference
- Resource conflict heatmap — people × project slots; red cells = double-booked; conflict count badge

### Map & Geo Widgets

- Member/contractor location dot map — embedded Leaflet mini-map with entity dots + click popovers
- Regional coverage ring — choropleth SVG regions with fill intensity = coverage density
- Revenue-by-region globe — tilted 2D projection with bubble markers proportional to revenue
- Nearest-member finder — map centered on viewer + concentric rings at 25/50/100 miles + count badges
- Event location cluster map — clustered dots expanding on zoom for upcoming event locations
- Address completeness tracker — % of records with verified addresses + bulk geocode button

### Communication & Engagement Widgets

- Email open rate trend — last 10 campaigns line chart + industry benchmark reference line
- Response time SLA widget — 30-day avg time-to-first-response with green/amber/red SLA bars
- Engagement score breakdown — horizontal bars showing login/action/content/community contribution
- NPS trend widget — 12-month rolling NPS line with promoter/neutral/detractor stacked area behind
- Survey completion funnel — invited→opened→started→completed with drop-off % per stage
- Last-contact age distribution — member bars bucketed by days-since-contact; 90+ glows red

### Financial Chart Widgets (MUI X Chart Types)

- Sankey flow diagram — money/work flowing between categories; clicking highlights path
- Range bar chart per project — horizontal bars spanning start→end dates; lightweight Gantt
- Pyramid chart for funnel — classic marketing funnel with label+count per stage
- Funnel chart for conversion — vertical with conversion % between trapezoid stages
- Scatter with regression line — custom SVG best-fit line for cost-vs-output analysis
- Multi-series radar comparison — 3-4 overlapping polygons comparing entities across axes
- Stacked area chart with zoom/pan — drag to select date sub-range; axis snaps to selection

### Operational & System Widgets

- API quota consumed ring gauge — ring filling green→amber→red + reset countdown below
- Integration health grid — name + status dot + "last synced X min ago" + re-sync button
- Error rate spike detector — 24h line chart; spikes above threshold annotated with red dot + message
- Queue depth monitor — 30s-refresh bar chart by queue name; red when exceeding thresholds
- Scheduled job calendar — 7-day view with success/failure blocks at scheduled times
- Storage usage breakdown — stacked horizontal bar by category (attachments/exports/audit/cache)
- Database query latency widget — response time histogram + P95/P99 badges
- Feature flag status board — compact grid of flag names with toggleable on/off chips

### Time Intelligence Widgets

- Business hours coverage clock — 24h radial clock with staffed hours as colored arc
- Week-over-week comparison bars — grouped bars (current vs prior week) + delta labels
- Rolling average drift card — 7d/30d/90d averages stacked with tiny sparklines per row
- Time zone status strip — horizontal strip per team member showing current local time + status
- Deadline density calendar — 4-week mini calendar; cell intensity = deadline count per day
- Overtime hours heatmap — day-of-week × person grid showing overtime per cell

### Predictive & AI-Powered Widgets

- Anomaly spotlight card — AI-surfaced top 3 anomalous data points with "Investigate" buttons
- Churn prediction list — top 5 at-risk by churn probability + last activity + retention action
- Demand forecast widget — historical actuals + shaded forecast cone with uncertainty bounds
- Smart goal pacing — progress bar with ghost marker for expected pacing; amber if behind
- Sentiment trend line — rolling average of LLM-analyzed feedback sentiment over time
- What-if scenario card — 2-3 slider inputs with live-updating projected metric output

### Member & Association-Specific Widgets

- Membership tier breakdown — horizontal stacked bar by tier (bronze/silver/gold/platinum)
- Renewal wave calendar — 12-month heatmap showing when renewal pressure peaks
- Chapter/region tree — RichTreeView hierarchy with member counts + health indicators per node
- New member welcome queue — recently joined members needing profile/committee/welcome action
- Committee seat vacancy tracker — committees × seats grid; unfilled glow amber
- Event RSVP pulse — registered vs capacity radial fill + waitlist count + notify button
- Member birthday this week — list with "Send greeting" buttons generating pre-drafted emails
- Benefits usage heatmap — benefit × month grid showing utilization rate per cell
- Lapsed member re-engagement funnel — targeted→contacted→responded→renewed stages
- Member engagement score histogram — distribution bars showing community health shape
- Dues collected vs projected — collected/projected numbers + fill bar + trend vs prior year

### Interaction & Delight Widgets

- Animated world clock mosaic — 2×3 analog clock faces with real-time animated hands per timezone
- Live visitor/session counter — bold pulsing number + 60-second sparkline updating every 5s
- Ambient noise widget — soundwave animated bars reflecting real-time API call volume
- Drag-to-compare toggle — before/after slider revealing two data states (current vs prior)
- Data storytelling narrative card — LLM-generated one-paragraph summary of key weekly changes
- "Did you know?" insight rotator — cycling AI-generated insights every 60s with thumbs up/down
- Confetti milestone card — celebratory animation on threshold crossing with share button
- Random spotlight card — surfaces one random under-explored record daily as a relationship nudge
