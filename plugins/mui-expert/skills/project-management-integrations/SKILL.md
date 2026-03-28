---
name: project-management-integrations
description: Gantt charts, Kanban boards, scheduling, and resource management libraries that integrate with MUI — SVAR, DHTMLX, Bryntum, Syncfusion, FullCalendar, dnd-kit, and architecture patterns
triggers:
  - Gantt chart
  - Kanban board
  - project management
  - scheduling
  - resource management
  - timeline
  - drag and drop
  - dnd-kit
  - SVAR Gantt
  - DHTMLX
  - Bryntum
  - Syncfusion
  - FullCalendar
  - task board
  - contractor scheduling
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

# Project Management Integrations for MUI Apps

Gantt charts, Kanban boards, scheduling, and resource management libraries
that compose with MUI's theme, layout, and component slots.

MUI X does not ship a native Gantt component (roadmap item, not yet available).
Use these libraries for the timeline and MUI for everything around it.

---

## Gantt Chart Libraries

### SVAR React Gantt — Best Free Option (MIT)

```bash
npm install wx-react-gantt
```

**Free MIT core:**
- Interactive drag-and-drop task editing on timeline
- Task dependencies (FS, SS, EE, SE)
- Hierarchical/summary tasks with collapsible groups
- Customizable task bars, tooltips, grid columns, time scale
- Multiple zoom levels, keyboard navigation, light/dark themes
- Full TypeScript, React 19 compatible, Vite/Next.js
- 10,000+ task performance

**SVAR PRO (~$524/dev perpetual) adds:**
- Working-day calendars per project/task/resource
- Baselines (original plan vs current)
- Auto-scheduling (tasks shift when dependencies change)
- Split tasks, undo/redo, rollups, slack visualization
- Export to PDF, PNG, Excel
- Import/export MS Project files

**MUI integration:**
```tsx
import { Gantt } from 'wx-react-gantt';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';

function ProjectGantt({ tasks, links }) {
  const [editTask, setEditTask] = useState(null);

  return (
    <Paper sx={{ height: 600, overflow: 'hidden' }}>
      {/* MUI toolbar above Gantt */}
      <Box sx={{ display: 'flex', gap: 1, p: 1, borderBottom: 1, borderColor: 'divider' }}>
        <Button size="small" onClick={handleZoomIn}>Zoom In</Button>
        <Button size="small" onClick={handleZoomOut}>Zoom Out</Button>
        <DateRangePicker slotProps={{ textField: { size: 'small' } }} />
      </Box>

      {/* Gantt handles timeline rendering */}
      <Gantt
        tasks={tasks}
        links={links}
        onTaskDblClick={(task) => setEditTask(task)}
      />

      {/* MUI Dialog for task editing */}
      <Dialog open={!!editTask} onClose={() => setEditTask(null)} maxWidth="sm" fullWidth>
        <TaskEditForm task={editTask} onSave={handleSave} />
      </Dialog>
    </Paper>
  );
}
```

### DHTMLX React Gantt — Enterprise (Paid)

```bash
npm install @dhx/react-gantt
```

- Renders 30,000+ tasks smoothly
- Auto-scheduling, critical path calculation
- Resource management with histogram (PRO)
- Working time calendars at project/task/resource levels
- Undo/redo with Valtio or Redux
- **Official MUI examples** in docs using MUI Button, Divider, ButtonGroup, icons
- Standard: free (limited); PRO: ~$699/dev; Team: ~$1,299

### Bryntum Gantt — MS Project Feature Parity (Paid)

- MS Project-equivalent scheduling engine (ChronoGraph)
- Critical path with early/late dates, free slack, total slack
- Baselines: any number of snapshots
- Progress line visualization
- Resource assignment column with multi-select picker
- CSS variables align to MUI theme tokens
- ~$680-940/dev perpetual
- **SaaS/OEM requires separate license** — contact before committing

### Syncfusion React Gantt — Free for Small Teams

- **Free Community License** for <$1M revenue, ≤5 devs, ≤10 employees
- Critical path with `enableCriticalPath` prop
- Resource view, filtering, split tasks, undo/redo
- Part of 1,900+ component suite
- Export PDF/CSV/Excel

### FullCalendar Premium — Resource Scheduling ($480/dev/yr)

- Free MIT: day/week/month calendar, drag-and-drop
- Premium: Resource Timeline (horizontal, Gantt-like), Vertical Resource view
- Best for contractor availability/booking views, not dependency Gantt

---

## Feature Comparison Matrix

| Feature | SVAR Free | SVAR PRO | DHTMLX PRO | Bryntum | Syncfusion Community |
|---------|:---------:|:--------:|:----------:|:-------:|:--------------------:|
| **Cost** | Free MIT | ~$524/dev | ~$699/dev | ~$680/dev | Free (<$1M) |
| **React native** | ✓ | ✓ | ✓ | Wrapper | Wrapper |
| **Drag/drop** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Dependencies** | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Critical path** | — | — | ✓ | ✓ | ✓ |
| **Baselines** | — | ✓ | ✓ | ✓ | ✓ |
| **Auto-scheduling** | — | ✓ | ✓ | ✓ | ✓ |
| **Resource mgmt** | — | — | ✓ | ✓ | ✓ |
| **Working calendars** | — | ✓ | ✓ | ✓ | ✓ |
| **MS Project import** | — | ✓ | — | — | — |
| **Export PDF/Excel** | — | ✓ | ✓ | ✓ | ✓ |
| **Undo/redo** | — | ✓ | ✓ | ✓ | ✓ |
| **MUI theming** | ✓ | ✓ | ✓ documented | ✓ | CSS vars |
| **SaaS/OEM allowed** | ✓ MIT | ✓ | ✓ | Need OEM | Needs paid |
| **Max tasks** | 10K+ | 10K+ | 30K+ | 30K+ | Large |

---

## Kanban Board Libraries

### dnd-kit — Modern Standard (MIT Free)

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

The successor to `react-beautiful-dnd`. Community standard for React DnD.

```tsx
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

// Sortable card using MUI Card
function KanbanCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        p: 1.5, mb: 1, cursor: 'grab',
        '&:hover': { borderColor: 'primary.main', boxShadow: 2 },
        border: '1px solid', borderColor: 'divider', borderRadius: 2,
      }}
    >
      <Typography variant="body2" fontWeight={600}>{task.title}</Typography>
      <Stack direction="row" spacing={1} sx={{ mt: 1 }} alignItems="center">
        <Chip label={task.priority} size="small" color={priorityColor(task.priority)} />
        <Avatar src={task.assignee.avatar} sx={{ width: 24, height: 24 }} />
      </Stack>
    </Card>
  );
}

// Kanban column
function KanbanColumn({ column, tasks }: { column: Column; tasks: Task[] }) {
  return (
    <Paper
      sx={{
        width: 280, minHeight: 400, p: 1, borderRadius: 2,
        bgcolor: 'action.hover',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1, px: 1 }}>
        <Typography variant="subtitle2">{column.title}</Typography>
        <Chip label={tasks.length} size="small" />
      </Stack>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map((task) => (
          <KanbanCard key={task.id} task={task} />
        ))}
      </SortableContext>
    </Paper>
  );
}

// Board with drag between columns
function KanbanBoard({ columns, tasks }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={({ active }) => setActiveId(active.id as string)}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', p: 2 }}>
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            tasks={tasks.filter((t) => t.columnId === col.id)}
          />
        ))}
      </Stack>

      {/* Ghost clone while dragging */}
      <DragOverlay>
        {activeId && (
          <Card sx={{ p: 1.5, boxShadow: 8, borderRadius: 2, opacity: 0.9 }}>
            <Typography variant="body2">{findTask(activeId)?.title}</Typography>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

**Pattern:** Intercept `onDragEnd` to call ASP.NET Core PATCH endpoint for column/order change. Use `DragOverlay` with MUI elevation for smooth animated ghost.

### react-mui-scheduler — MUI-Native Calendar (MIT Free)

```bash
npm install react-mui-scheduler
```

- Month/week/day/timeline views built on `@mui/material`
- Event grouping by resource
- Search bar, date picker, view switcher in toolbar
- Localization: 8 languages
- Best for appointment/availability calendars (contractor scheduling, event booking)

### Pragmatic Drag and Drop (Atlassian) — MIT Free

```bash
npm install @atlaskit/pragmatic-drag-and-drop
```

- Powers Jira and Trello's drag-and-drop
- Lower-level API than dnd-kit, purpose-built for production kanban at scale
- MIT open-source since 2024

---

## Recommended Stack by Use Case

| Use Case | Library | License |
|----------|---------|---------|
| Contractor project timeline (internal) | SVAR Gantt Free | MIT |
| Full MS Project-equivalent Gantt in SaaS | Bryntum OEM or DHTMLX PRO | Paid |
| Free Gantt for early SaaS <$1M revenue | Syncfusion Community | Free |
| Resource booking / availability calendar | FullCalendar Premium + MUI | $480/yr |
| Kanban task board (Jira-style) | dnd-kit + MUI Cards | MIT |
| Contractor appointment scheduler | react-mui-scheduler | MIT |
| Flexible timeline (bookings, media) | gantt-schedule-timeline-calendar | Freemium |

---

## Architecture: Gantt + MUI DataGrid Sidebar

The most powerful project management UI combines a Gantt timeline with a companion DataGrid.

```
┌─────────────────────────────────────────────────────────┐
│  MUI AppBar Toolbar                                     │
│  [Zoom In] [Zoom Out] [View: Gantt|Kanban|Calendar]     │
│  [DateRangePicker]                              [Export] │
├───────────────────────┬─────────────────────────────────┤
│  MUI X DataGrid       │  Gantt Timeline (SVAR/DHTMLX)   │
│  ┌─────────────────┐  │  ┌─────────────────────────────┐│
│  │ Task | Status    │  │  │ ▓▓▓▓▓▓░░░  Project Alpha   ││
│  │ Alpha| ● Active  │◄─┼──│ ▓▓▓▓░░░░░  Task 1          ││
│  │ Beta | ○ Draft   │  │  │   ▓▓▓▓▓░░  Task 2  ──────►││
│  │ Gamma| ● Active  │  │  │       ▓▓▓  Task 3          ││
│  └─────────────────┘  │  └─────────────────────────────┘│
├───────────────────────┴─────────────────────────────────┤
│  MUI Drawer (right) — Task Detail Form                  │
│  [RHF Form] [Resource Autocomplete] [Time Entry Grid]   │
└─────────────────────────────────────────────────────────┘
```

**Implementation:**

1. **Left panel:** MUI X DataGrid with status chips, assignee avatars, priority bars
2. **Right panel:** Gantt timeline synchronized to DataGrid selection
3. **Sync:** Click DataGrid row → scroll Gantt to task; click Gantt bar → select DataGrid row
4. **Detail drawer:** MUI Drawer with RHF form, resource Autocomplete, sub-DataGrid of time entries
5. **Toolbar:** MUI GridToolbarContainer with zoom controls, view switches, DateRangePicker

```tsx
function ProjectManagementView({ tasks, links }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const ganttRef = useRef<GanttAPI>(null);
  const gridApiRef = useGridApiRef();

  // Sync: DataGrid row click → Gantt scroll
  const handleGridRowClick = useCallback((params: GridRowParams) => {
    setSelectedTaskId(params.id as string);
    ganttRef.current?.scrollToTask(params.id);
  }, []);

  // Sync: Gantt bar click → DataGrid selection
  const handleGanttTaskClick = useCallback((task: Task) => {
    setSelectedTaskId(task.id);
    gridApiRef.current?.selectRow(task.id);
    gridApiRef.current?.scrollToIndexes({ rowIndex: findRowIndex(task.id) });
  }, []);

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Left: DataGrid */}
      <Box sx={{ width: 400, borderRight: 1, borderColor: 'divider' }}>
        <DataGrid
          apiRef={gridApiRef}
          rows={tasks}
          columns={taskColumns}
          onRowClick={handleGridRowClick}
          rowSelectionModel={selectedTaskId ? [selectedTaskId] : []}
        />
      </Box>

      {/* Right: Gantt */}
      <Box sx={{ flex: 1 }}>
        <Gantt
          ref={ganttRef}
          tasks={tasks}
          links={links}
          onTaskClick={handleGanttTaskClick}
          onTaskDblClick={(task) => { setSelectedTaskId(task.id); setDrawerOpen(true); }}
        />
      </Box>

      {/* Detail Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 480 } }}
      >
        {selectedTaskId && (
          <TaskDetailForm
            taskId={selectedTaskId}
            onSave={() => { refetchTasks(); setDrawerOpen(false); }}
          />
        )}
      </Drawer>
    </Box>
  );
}
```

The Gantt library handles only timeline rendering and dependency logic.
MUI handles all surrounding UI — dialogs, forms, notifications, navigation, theming, and data tables.
Result: unified, branded experience matching your design system.
