---
name: charts
description: MUI X Charts — BarChart, LineChart, PieChart, ScatterChart, composition API, custom axes, tooltips, and responsive patterns
triggers:
  - chart
  - BarChart
  - LineChart
  - PieChart
  - ScatterChart
  - MUI X Charts
  - data visualization
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
globs:
  - "*.tsx"
  - "*.ts"
  - "*.jsx"
---

# MUI X Charts

## Package

```bash
npm install @mui/x-charts
# Free, MIT license — all chart types included
```

All charts are available in the free Community tier.

---

## Basic Charts

### BarChart

```tsx
import { BarChart } from '@mui/x-charts/BarChart';

const data = [
  { month: 'Jan', revenue: 4000, expenses: 2400 },
  { month: 'Feb', revenue: 3000, expenses: 1398 },
  { month: 'Mar', revenue: 2000, expenses: 9800 },
  { month: 'Apr', revenue: 2780, expenses: 3908 },
];

<BarChart
  dataset={data}
  xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
  series={[
    { dataKey: 'revenue', label: 'Revenue', color: '#2563eb' },
    { dataKey: 'expenses', label: 'Expenses', color: '#dc2626' },
  ]}
  width={600}
  height={400}
/>
```

### Horizontal Bar Chart

```tsx
<BarChart
  dataset={data}
  yAxis={[{ scaleType: 'band', dataKey: 'month' }]}
  series={[{ dataKey: 'revenue', label: 'Revenue' }]}
  layout="horizontal"
  width={600}
  height={400}
/>
```

### LineChart

```tsx
import { LineChart } from '@mui/x-charts/LineChart';

<LineChart
  xAxis={[{
    scaleType: 'time',
    data: [new Date(2024, 0), new Date(2024, 1), new Date(2024, 2), new Date(2024, 3)],
    valueFormatter: (date: Date) => date.toLocaleDateString('en-US', { month: 'short' }),
  }]}
  series={[
    {
      data: [2400, 1398, 9800, 3908],
      label: 'Revenue',
      area: true,              // fill area under line
      curve: 'catmullRom',     // 'linear' | 'monotoneX' | 'catmullRom' | 'step'
      showMark: true,
    },
  ]}
  width={600}
  height={400}
/>
```

### PieChart

```tsx
import { PieChart } from '@mui/x-charts/PieChart';

<PieChart
  series={[{
    data: [
      { id: 0, value: 10, label: 'Series A', color: '#2563eb' },
      { id: 1, value: 15, label: 'Series B', color: '#7c3aed' },
      { id: 2, value: 20, label: 'Series C', color: '#16a34a' },
    ],
    innerRadius: 30,          // donut chart when > 0
    outerRadius: 100,
    paddingAngle: 2,
    cornerRadius: 5,
    startAngle: -90,
    endAngle: 270,
    cx: 150,
    cy: 150,
    highlightScope: { faded: 'global', highlighted: 'item' },
    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
  }]}
  width={400}
  height={300}
/>
```

### ScatterChart

```tsx
import { ScatterChart } from '@mui/x-charts/ScatterChart';

<ScatterChart
  series={[{
    label: 'Height vs Weight',
    data: [
      { x: 170, y: 70, id: 'p1' },
      { x: 175, y: 85, id: 'p2' },
      { x: 160, y: 60, id: 'p3' },
      { x: 180, y: 90, id: 'p4' },
    ],
  }]}
  xAxis={[{ label: 'Height (cm)' }]}
  yAxis={[{ label: 'Weight (kg)' }]}
  width={500}
  height={400}
/>
```

---

## Composition API

Build charts from primitives for maximum control. Mix chart types in one view.

```tsx
import {
  ResponsiveChartContainer,
  BarPlot,
  LinePlot,
  ChartsXAxis,
  ChartsYAxis,
  ChartsTooltip,
  ChartsAxisHighlight,
  ChartsLegend,
  ChartsGrid,
  MarkPlot,
} from '@mui/x-charts';

// Mixed bar + line chart with dual Y-axis
<ResponsiveChartContainer
  series={[
    { type: 'bar', data: [10, 20, 15, 25], label: 'Revenue ($K)', yAxisId: 'leftAxis' },
    { type: 'line', data: [5, 15, 10, 20], label: 'Growth (%)', yAxisId: 'rightAxis' },
  ]}
  xAxis={[{
    id: 'x-axis',
    data: ['Q1', 'Q2', 'Q3', 'Q4'],
    scaleType: 'band',
  }]}
  yAxis={[
    { id: 'leftAxis', label: 'Revenue ($K)' },
    { id: 'rightAxis', label: 'Growth (%)', position: 'right' },
  ]}
  height={400}
>
  <ChartsGrid horizontal />
  <BarPlot />
  <LinePlot />
  <MarkPlot />
  <ChartsXAxis axisId="x-axis" />
  <ChartsYAxis axisId="leftAxis" />
  <ChartsYAxis axisId="rightAxis" position="right" />
  <ChartsTooltip trigger="axis" />
  <ChartsAxisHighlight x="band" />
  <ChartsLegend />
</ResponsiveChartContainer>
```

### Why Composition?
- Mix bar + line + scatter in one chart
- Dual Y-axis configurations
- Custom layout ordering (what renders on top)
- Add custom SVG elements between chart layers
- Full control over which sub-components are included

---

## Custom Axes

### Scale Types

```tsx
// Band axis (categorical) — most common for bar charts
xAxis={[{ scaleType: 'band', data: ['Jan', 'Feb', 'Mar'] }]}

// Linear axis (numeric) — scatter plots, continuous data
yAxis={[{ scaleType: 'linear', min: 0, max: 100 }]}

// Time axis — date values
xAxis={[{
  scaleType: 'time',
  data: [new Date('2024-01-01'), new Date('2024-02-01'), new Date('2024-03-01')],
  valueFormatter: (date: Date) => date.toLocaleDateString(),
}]}

// Log axis — logarithmic scale
yAxis={[{ scaleType: 'log', min: 1, max: 10000 }]}

// Point axis — evenly spaced regardless of value
xAxis={[{ scaleType: 'point', data: [1, 10, 100, 1000] }]}
```

### Tick Formatting

```tsx
yAxis={[{
  valueFormatter: (value: number) => `$${(value / 1000).toFixed(0)}K`,
  label: 'Revenue',
  tickMinStep: 1000,
  tickMaxStep: 5000,
}]}
```

### Dual Y-Axis

```tsx
yAxis={[
  { id: 'left', label: 'Revenue ($)', position: 'left' },
  { id: 'right', label: 'Percentage (%)', position: 'right', min: 0, max: 100 },
]}
series={[
  { data: [1000, 2000, 3000], yAxisId: 'left', type: 'bar' },
  { data: [20, 45, 80], yAxisId: 'right', type: 'line' },
]}
```

---

## Custom Tooltips

### Built-in Tooltip Modes

```tsx
// Show tooltip per data item (hover over specific bar/point)
<ChartsTooltip trigger="item" />

// Show tooltip for entire axis value (all series at that x position)
<ChartsTooltip trigger="axis" />

// Disable tooltip
<ChartsTooltip trigger="none" />
```

### Custom Tooltip Content

```tsx
import { ChartsTooltip, type ChartsItemContentProps } from '@mui/x-charts';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

function CustomItemTooltip(props: ChartsItemContentProps) {
  const { series, dataIndex, color } = props;
  if (dataIndex === undefined) return null;

  return (
    <Paper sx={{ p: 1.5, borderRadius: 1 }} elevation={4}>
      <Typography variant="caption" sx={{ color }}>
        {series.label}
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        ${series.data[dataIndex]?.toLocaleString()}
      </Typography>
    </Paper>
  );
}

<BarChart
  series={[...]}
  slots={{ itemContent: CustomItemTooltip }}
/>
```

---

## Legends

```tsx
// Position legend at the top
<BarChart
  series={[...]}
  slotProps={{
    legend: {
      direction: 'row',        // 'row' | 'column'
      position: {
        vertical: 'top',       // 'top' | 'middle' | 'bottom'
        horizontal: 'middle',  // 'left' | 'middle' | 'right'
      },
      padding: { top: 20 },
      itemMarkWidth: 10,
      itemMarkHeight: 10,
      markGap: 5,
      itemGap: 15,
    },
  }}
/>

// Hide legend
<BarChart
  series={[...]}
  slotProps={{ legend: { hidden: true } }}
/>
```

---

## Click Handlers & Interactivity

```tsx
<BarChart
  series={[{ data: [10, 20, 30], label: 'Revenue' }]}
  xAxis={[{ scaleType: 'band', data: ['Jan', 'Feb', 'Mar'] }]}
  onItemClick={(event, d) => {
    // d.type: 'bar' | 'line' | 'scatter' | 'pie'
    // d.seriesId: string
    // d.dataIndex: number
    console.log(`Clicked: series=${d.seriesId}, index=${d.dataIndex}`);
    router.push(`/details/${data[d.dataIndex].id}`);
  }}
  onAxisClick={(event, d) => {
    // d.axisValue: the x-axis value at click position
    // d.dataIndex: index into the data array
    console.log(`Axis clicked: ${d.axisValue}`);
  }}
/>
```

### Highlight & Dim

```tsx
<BarChart
  series={[
    {
      data: [10, 20, 30],
      highlightScope: { highlighted: 'item', faded: 'global' },
    },
  ]}
/>
```

---

## Responsive Charts

Charts auto-fill parent width when using `ResponsiveChartContainer` or when width/height are omitted on basic charts with a sized parent.

```tsx
// Parent must have explicit dimensions
<Box sx={{ width: '100%', height: 400 }}>
  <BarChart
    series={[...]}
    xAxis={[...]}
    // width and height omitted — fills parent
  />
</Box>

// Or use ResponsiveChartContainer for composition
<Box sx={{ width: '100%', height: 400 }}>
  <ResponsiveChartContainer series={[...]} xAxis={[...]}>
    <BarPlot />
    <ChartsXAxis />
    <ChartsYAxis />
  </ResponsiveChartContainer>
</Box>
```

### Margin Configuration

```tsx
<BarChart
  margin={{ top: 20, right: 30, bottom: 40, left: 60 }}
  // Increase left margin for wide y-axis labels
  // Increase bottom for rotated x-axis labels
/>
```

---

## Stacked Series

```tsx
<BarChart
  series={[
    { data: [10, 15, 20], stack: 'total', label: 'Product A' },
    { data: [5, 10, 15], stack: 'total', label: 'Product B' },
    { data: [3, 7, 12], stack: 'total', label: 'Product C' },
  ]}
  xAxis={[{ scaleType: 'band', data: ['Q1', 'Q2', 'Q3'] }]}
/>

// Stacked area chart
<LineChart
  series={[
    { data: [10, 15, 20], area: true, stack: 'total', label: 'Desktop' },
    { data: [5, 10, 15], area: true, stack: 'total', label: 'Mobile' },
    { data: [3, 7, 12], area: true, stack: 'total', label: 'Tablet' },
  ]}
/>
```

Multiple stack groups:
```tsx
series={[
  { data: [10, 15], stack: 'group1', stackOrder: 'ascending' },
  { data: [5, 10], stack: 'group1' },
  { data: [3, 7], stack: 'group2' },   // separate stack
]}
```

---

## Animation

```tsx
// Disable animation
<BarChart
  skipAnimation={true}
  series={[...]}
/>

// Animations are enabled by default with sensible durations
// Custom duration/easing not directly exposed as props — use CSS transitions
// for additional animation effects on the container
```

---

## Color Palette

### Custom Colors per Series

```tsx
<BarChart
  series={[
    { data: [10, 20, 30], label: 'A', color: '#2563eb' },
    { data: [5, 15, 25], label: 'B', color: '#7c3aed' },
  ]}
/>
```

### Categorical Palette

```tsx
import { blueberryTwilightPalette, mangoFusionPalette, cheerfulFiestaPalette } from '@mui/x-charts/colorPalettes';

<BarChart
  colors={mangoFusionPalette}
  series={[...]}
/>
```

### Theme-Aware Colors

```tsx
import { useTheme } from '@mui/material/styles';

function ThemedChart({ data }) {
  const theme = useTheme();

  return (
    <BarChart
      series={[
        { data: data.values, color: theme.palette.primary.main },
      ]}
      sx={{
        '& .MuiChartsAxis-tickLabel': {
          fill: theme.palette.text.secondary,
        },
        '& .MuiChartsAxis-line': {
          stroke: theme.palette.divider,
        },
      }}
    />
  );
}
```

---

## SparkLineChart

Inline mini charts for dashboards and tables.

```tsx
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';

// Line sparkline
<SparkLineChart
  data={[1, 4, 2, 5, 7, 2, 4, 6]}
  height={40}
  width={150}
  curve="natural"
  area
  colors={['#2563eb']}
/>

// Bar sparkline
<SparkLineChart
  data={[3, 1, 4, 1, 5, 9, 2, 6]}
  height={40}
  width={150}
  plotType="bar"
  colors={['#16a34a']}
/>

// In a DataGrid cell
const columns: GridColDef[] = [
  { field: 'name', headerName: 'Product' },
  {
    field: 'trend',
    headerName: 'Last 7 Days',
    width: 150,
    renderCell: (params) => (
      <SparkLineChart
        data={params.value}
        height={30}
        width={120}
        area
        colors={[params.value[params.value.length - 1] > params.value[0] ? '#16a34a' : '#dc2626']}
      />
    ),
  },
];
```

---

## Gauge Charts

```tsx
import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';

// Simple gauge
<Gauge
  value={75}
  startAngle={-110}
  endAngle={110}
  width={200}
  height={200}
  text={({ value }) => `${value}%`}
  sx={{
    [`& .${gaugeClasses.valueArc}`]: {
      fill: '#2563eb',
    },
    [`& .${gaugeClasses.valueText}`]: {
      fontSize: 24,
      fontWeight: 'bold',
    },
  }}
/>
```

---

## Dataset Approach

Pass a dataset array and reference fields by `dataKey`:

```tsx
const dataset = [
  { month: 'Jan', revenue: 4000, profit: 2400 },
  { month: 'Feb', revenue: 3000, profit: 1398 },
  { month: 'Mar', revenue: 2000, profit: 800 },
];

<BarChart
  dataset={dataset}
  xAxis={[{ scaleType: 'band', dataKey: 'month' }]}
  series={[
    { dataKey: 'revenue', label: 'Revenue' },
    { dataKey: 'profit', label: 'Profit' },
  ]}
/>
```

This is the preferred pattern when data comes from an API — avoids manual array extraction.

---

## Styling with sx

```tsx
<BarChart
  series={[...]}
  sx={{
    // Axis labels
    '& .MuiChartsAxis-tickLabel': {
      fontSize: '0.75rem',
      fill: 'text.secondary',
    },
    // Axis lines
    '& .MuiChartsAxis-line': {
      stroke: 'divider',
    },
    // Grid lines
    '& .MuiChartsGrid-line': {
      strokeDasharray: '4 4',
      stroke: 'divider',
    },
    // Legend text
    '& .MuiChartsLegend-series text': {
      fontSize: '0.8rem !important',
    },
  }}
/>
```

---

## Performance Tips

- Use `dataset` + `dataKey` instead of extracting arrays manually
- For large datasets (1000+ points), consider downsampling before rendering
- `skipAnimation` for frequently updating charts (real-time data)
- Lazy-load chart components with `React.lazy`:
  ```tsx
  const BarChart = lazy(() => import('@mui/x-charts/BarChart').then(m => ({ default: m.BarChart })));
  ```
- Charts auto-resize on window resize — avoid unnecessary re-renders of the parent
