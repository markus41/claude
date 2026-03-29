---
name: Syncfusion Blazor Comprehensive Documentation
description: Complete setup, configuration, and component patterns for Syncfusion Blazor UI library v33.1.44
type: reference
---

# Syncfusion Blazor Components - Complete Documentation

**Version**: 33.1.44 (current)
**Platforms Supported**: Blazor Server, Blazor WebAssembly, Blazor Web App (.NET 8, 9, 10)
**License**: Enterprise with support portal at support.syncfusion.com

---

## Installation & Setup

### NuGet Packages by Component

**Core package** (required for all):
```bash
Install-Package Syncfusion.Blazor.Themes -Version 33.1.44
```

**By component type**:
- **Grid/DataGrid**: `Syncfusion.Blazor.Grid`
- **Charts**: `Syncfusion.Blazor.Charts`
- **Scheduler**: `Syncfusion.Blazor.Schedule`
- **General**: `Syncfusion.Blazor.Core` (usually auto-installed)

**Installation via Package Manager Console**:
```powershell
Install-Package Syncfusion.Blazor.Grid -Version 33.1.44
Install-Package Syncfusion.Blazor.Themes -Version 33.1.44
```

**Installation via .NET CLI**:
```bash
dotnet add package Syncfusion.Blazor.Grid --version 33.1.44
dotnet add package Syncfusion.Blazor.Themes --version 33.1.44
```

### Configuration Steps

#### 1. Register Namespaces (`~/Pages/_Imports.razor`)
```csharp
@using Syncfusion.Blazor
@using Syncfusion.Blazor.Grids       // For DataGrid
@using Syncfusion.Blazor.Charts      // For Charts
@using Syncfusion.Blazor.Schedule    // For Scheduler
```

#### 2. Register Service (`~/Program.cs`)
```csharp
using Syncfusion.Blazor;

var builder = WebApplicationBuilder.CreateBuilder(args);
builder.Services.AddRazorPages();
builder.Services.AddRazorComponents();

// Add Syncfusion services
builder.Services.AddSyncfusionBlazor();

var app = builder.Build();
app.MapRazorComponents<App>();
app.Run();
```

**For WebAssembly/Auto render modes**: Register in BOTH server and client project Program.cs files.

#### 3. Add Theme & Scripts (`~/App.razor` or `~/index.html`)

**Stylesheet link** (in `<head>`):
```html
<link href="_content/Syncfusion.Blazor.Themes/fluent2.css" rel="stylesheet" />
<!-- OR choose from available themes:
  - bootstrap5.css
  - tailwind.css
  - material.css
  - fluent2.css
  - fluent2-dark.css
  - bootstrap5-dark.css
-->
```

**JavaScript reference** (before closing `</body>`):
```html
<script src="_content/Syncfusion.Blazor.Core/scripts/syncfusion-blazor.min.js" type="text/javascript"></script>
```

---

## Component: DataGrid (Grid/SfGrid)

### Quick Setup Example

```razor
@page "/datagrid-demo"
@using Syncfusion.Blazor.Grids

<SfGrid DataSource="@Orders" AllowPaging="true" AllowSorting="true" AllowFiltering="true">
    <GridPageSettings PageSize="10"></GridPageSettings>
    <GridColumns>
        <GridColumn Field=@nameof(Order.OrderID) HeaderText="Order ID" TextAlign="TextAlign.Right" Width="120"></GridColumn>
        <GridColumn Field=@nameof(Order.CustomerName) HeaderText="Customer Name" Width="150"></GridColumn>
        <GridColumn Field=@nameof(Order.TotalAmount) HeaderText="Total Amount" Format="C2" TextAlign="TextAlign.Right" Width="120"></GridColumn>
        <GridColumn Field=@nameof(Order.OrderDate) HeaderText="Order Date" Format="d" Type="ColumnType.Date" Width="130"></GridColumn>
    </GridColumns>
</SfGrid>

@code {
    public List<Order> Orders { get; set; }

    protected override void OnInitialized()
    {
        Orders = new List<Order>
        {
            new Order { OrderID = 10248, CustomerName = "Vinet", TotalAmount = 32.38m, OrderDate = new DateTime(1996, 7, 4) },
            new Order { OrderID = 10249, CustomerName = "Moen", TotalAmount = 11.61m, OrderDate = new DateTime(1996, 7, 5) }
        };
    }

    public class Order
    {
        public int OrderID { get; set; }
        public string CustomerName { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime OrderDate { get; set; }
    }
}
```

### Key Properties

| Property | Type | Purpose |
|----------|------|---------|
| `DataSource` | `IEnumerable<T>` | Binds collection data to grid |
| `AllowPaging` | `bool` | Enables pagination |
| `AllowSorting` | `bool` | Enables column sorting |
| `AllowFiltering` | `bool` | Enables data filtering |
| `AllowGrouping` | `bool` | Enables record grouping |
| `AllowSelection` | `bool` | Enables row selection |
| `Height` | `string` | Grid height (e.g., "100%", "400px") |
| `AllowExcelExport` | `bool` | Export to Excel |
| `AllowPdfExport` | `bool` | Export to PDF |

### Column Configuration

```csharp
<GridColumn
    Field=@nameof(OrderData.OrderID)           // Data property name
    HeaderText="Order ID"                       // Column header label
    TextAlign="TextAlign.Right"                 // Right, Left, Center, Justify
    Format="C2"                                 // Currency with 2 decimals
    Width="120"                                 // Column width
    Type="ColumnType.Date"                      // Data type (Date, DateTime, Number, etc)
    Visible="true"                              // Show/hide column
    AllowSearching="true"                       // Include in search
    AllowGrouping="true"                        // Allow grouping by this column
    IsPrimaryKey="false"                        // Mark as unique identifier
    IsIdentity="false"                          // Auto-increment field
>
</GridColumn>
```

### Data Binding Patterns

**Local Data** (IEnumerable):
```csharp
public List<Order> Orders { get; set; }
protected override void OnInitialized()
{
    Orders = GetOrderData(); // Populate from DB, API, etc
}
```

**Remote Data** (API endpoint):
```razor
<SfGrid AllowPaging="true">
    <SfDataManager Url="https://api.example.com/orders" Adaptor="Adaptors.WebApiAdaptor"></SfDataManager>
</SfGrid>
```

**OData Service**:
```razor
<SfGrid AllowPaging="true">
    <SfDataManager Url="https://services.odata.org/V4/Northwind/Northwind.svc/Orders" Adaptor="Adaptors.ODataV4Adaptor"></SfDataManager>
</SfGrid>
```

### Event Handling

```razor
<SfGrid DataSource="@Orders"
        OnActionFailure="@OnGridActionFailure"
        OnRecordDoubleClick="@OnDoubleClick"
        OnBatchSave="@OnBatchSave">
    <GridSelectionSettings Type="SelectionType.Row"></GridSelectionSettings>
</SfGrid>

@code {
    private async Task OnGridActionFailure(FailureEventArgs args)
    {
        // Handle server-side exceptions
        Console.WriteLine($"Error: {args.Error}");
    }

    private void OnDoubleClick(RecordDoubleClickEventArgs<Order> args)
    {
        // Handle row double-click
        Console.WriteLine($"Clicked order: {args.Data.OrderID}");
    }

    private async Task OnBatchSave(BatchSaveChanges<Order> args)
    {
        // Handle bulk update/insert/delete
        foreach (var changedRecord in args.ChangedRecords)
        {
            // Update DB
        }
    }
}
```

### Pagination, Sorting, Filtering

```razor
<SfGrid DataSource="@Orders" AllowPaging="true" AllowSorting="true" AllowFiltering="true">
    <GridPageSettings PageSize="10"></GridPageSettings>
    <GridFilterSettings Type="FilterType.Excel"></GridFilterSettings>
    <GridSortSettings>
        <GridSortColumn Field="OrderDate" Direction="SortDirection.Descending"></GridSortColumn>
    </GridSortSettings>
    <GridColumns>
        <!-- Columns here -->
    </GridColumns>
</SfGrid>
```

---

## Component: Chart (SfChart)

### Quick Setup Example

```razor
@page "/chart-demo"
@using Syncfusion.Blazor.Charts

<SfChart Title="Monthly Sales">
    <ChartPrimaryXAxis Title="Month" ValueType="Syncfusion.Blazor.Charts.ValueType.Category"></ChartPrimaryXAxis>
    <ChartPrimaryYAxis Title="Sales (USD)"></ChartPrimaryYAxis>
    <ChartLegendSettings Visible="true"></ChartLegendSettings>
    <ChartTooltipSettings Enable="true"></ChartTooltipSettings>
    <ChartSeriesCollection>
        <ChartSeries DataSource="@Sales" Name="Sales Volume" XName="Month" YName="SalesValue" Type="ChartSeriesType.Column">
            <ChartMarker>
                <ChartDataLabel Visible="true"></ChartDataLabel>
            </ChartMarker>
        </ChartSeries>
    </ChartSeriesCollection>
</SfChart>

@code {
    public List<SalesInfo> Sales { get; set; }

    protected override void OnInitialized()
    {
        Sales = new List<SalesInfo>
        {
            new SalesInfo { Month = "Jan", SalesValue = 35 },
            new SalesInfo { Month = "Feb", SalesValue = 28 },
            new SalesInfo { Month = "Mar", SalesValue = 34 },
            new SalesInfo { Month = "Apr", SalesValue = 32 },
            new SalesInfo { Month = "May", SalesValue = 40 }
        };
    }

    public class SalesInfo
    {
        public string Month { get; set; }
        public double SalesValue { get; set; }
    }
}
```

### Chart Types

**Common Chart Series Types** (ChartSeriesType enum):
- `Column` — Vertical bar chart
- `Bar` — Horizontal bar chart
- `Line` — Line chart
- `Area` — Area chart with fill
- `StackingColumn` — Stacked vertical bars
- `StackingBar` — Stacked horizontal bars
- `Pie` — Pie/Donut chart
- `Scatter` — Scatter/bubble plot
- `Candle` — Candlestick (financial)
- `Spline` — Smooth curve line
- `StepLine` — Step-wise line

### Core Series Configuration

```csharp
<ChartSeries
    DataSource="@Data"                                  // IEnumerable data
    Name="Series Name"                                  // Legend label
    XName="XPropertyName"                               // X-axis data property
    YName="YPropertyName"                               // Y-axis data property
    Type="ChartSeriesType.Column"                       // Chart visualization type
    YAxis="SecondaryYAxis"                              // Use secondary Y axis
    Opacity="0.8"                                       // Series transparency
    EnableTooltip="true"                                // Show data point tooltips
    Fill="#3498db"                                      // Series color
>
    <ChartMarker Visible="true" Width="10" Height="10">
        <ChartDataLabel Visible="true" Name="@nameof(DataPoint.Value)"></ChartDataLabel>
    </ChartMarker>
</ChartSeries>
```

### Axis Configuration

```csharp
<ChartPrimaryXAxis
    Title="Month"
    ValueType="Syncfusion.Blazor.Charts.ValueType.Category"  // Category, DateTime, Logarithmic, Double
    LabelFormat="dd/MMM"                                      // Date format if DateTime type
    Interval="1"
    IntervalType="IntervalType.Months"
>
</ChartPrimaryXAxis>

<ChartPrimaryYAxis
    Title="Sales Value"
    ValueType="Syncfusion.Blazor.Charts.ValueType.Double"
    RangePadding="ChartRangePadding.Normal"                   // Normal, Additional, Round, None
    Minimum="0"
    Maximum="50"
>
</ChartPrimaryYAxis>
```

### Legend & Tooltip

```csharp
<ChartLegendSettings
    Visible="true"
    Position="LegendPosition.Bottom"  // Right, Left, Top, Bottom, Custom
    Alignment="Alignment.Center"
></ChartLegendSettings>

<ChartTooltipSettings
    Enable="true"
    Format="<b>${point.x}</b><br/>Sales: ${point.y}"  // Custom tooltip template
    Shared="false"
></ChartTooltipSettings>
```

### Event Handling

```csharp
<SfChart OnPointRender="@OnPointRender" OnLegendItemRender="@OnLegendItemRender">
    <!-- Chart series -->
</SfChart>

@code {
    private void OnPointRender(ChartPointRenderEventArgs args)
    {
        // Customize individual data points
        if (args.Value > 40)
            args.Fill = "#FF6B6B"; // Red for high values
    }

    private void OnLegendItemRender(ChartLegendRenderEventArgs args)
    {
        // Customize legend items
        args.Text = args.Text.ToUpper();
    }
}
```

---

## Component: Scheduler (SfSchedule)

### Quick Setup Example

```razor
@page "/scheduler-demo"
@using Syncfusion.Blazor.Schedule

<SfSchedule TValue="AppointmentData"
            Height="650px"
            @bind-SelectedDate="@CurrentDate"
            StartHour="09:00"
            EndHour="18:00">
    <ScheduleEventSettings DataSource="@Appointments"></ScheduleEventSettings>
    <ScheduleViews>
        <ScheduleView Option="View.Day"></ScheduleView>
        <ScheduleView Option="View.Week"></ScheduleView>
        <ScheduleView Option="View.WorkWeek"></ScheduleView>
        <ScheduleView Option="View.Month"></ScheduleView>
        <ScheduleView Option="View.Agenda"></ScheduleView>
    </ScheduleViews>
</SfSchedule>

@code {
    DateTime CurrentDate = new DateTime(2025, 2, 14);
    List<AppointmentData> Appointments = new List<AppointmentData>();

    protected override void OnInitialized()
    {
        Appointments = new List<AppointmentData>
        {
            new AppointmentData
            {
                Id = 1,
                Subject = "Team Standup",
                StartTime = new DateTime(2025, 2, 14, 10, 0, 0),
                EndTime = new DateTime(2025, 2, 14, 10, 30, 0),
                IsAllDay = false
            },
            new AppointmentData
            {
                Id = 2,
                Subject = "Project Deadline",
                StartTime = new DateTime(2025, 2, 15, 9, 0, 0),
                EndTime = new DateTime(2025, 2, 15, 17, 0, 0),
                IsAllDay = true
            }
        };
    }

    public class AppointmentData
    {
        public int Id { get; set; }
        public string Subject { get; set; }
        public string Description { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsAllDay { get; set; }
        public string RecurrenceRule { get; set; }  // "FREQ=DAILY;COUNT=5" for recurring events
        public string Location { get; set; }
        public string CategoryColor { get; set; }
    }
}
```

### View Options

Available views for scheduling:
- `Day` — Single day with hourly slots
- `Week` — Week view (7 days)
- `WorkWeek` — Work week only (Mon-Fri)
- `Month` — Monthly calendar grid
- `Agenda` — List view of upcoming events
- `TimelineDay` — Horizontal timeline (single day)
- `TimelineWeek` — Horizontal timeline (week)
- `TimelineMonth` — Horizontal timeline (month)
- `Year` — Yearly overview

### Recurrence Configuration

```csharp
// Daily for 5 occurrences
RecurrenceRule = "FREQ=DAILY;COUNT=5"

// Weekly on Mon, Wed, Fri
RecurrenceRule = "FREQ=WEEKLY;BYDAY=MO,WE,FR"

// Monthly on 15th
RecurrenceRule = "FREQ=MONTHLY;BYMONTHDAY=15"

// Yearly on same date
RecurrenceRule = "FREQ=YEARLY"

// Custom: Every 2 weeks until June 30, 2025
RecurrenceRule = "FREQ=WEEKLY;INTERVAL=2;UNTIL=20250630"
```

### Event Handling

```csharp
<SfSchedule TValue="AppointmentData"
            OnEventClick="@OnEventClick"
            OnActionComplete="@OnActionComplete"
            OnActionFailure="@OnActionFailure">
    <ScheduleEventSettings DataSource="@Appointments"></ScheduleEventSettings>
</SfSchedule>

@code {
    private void OnEventClick(EventClickEventArgs<AppointmentData> args)
    {
        // Handle appointment click
        Console.WriteLine($"Clicked: {args.Data.Subject}");
    }

    private async Task OnActionComplete(ActionEventArgs<AppointmentData> args)
    {
        // Called after create, update, delete, or drag
        if (args.ActionType == ActionType.EventCreate)
        {
            // Save new appointment
        }
        else if (args.ActionType == ActionType.EventChange)
        {
            // Update existing appointment
        }
    }

    private void OnActionFailure(ActionFailedEventArgs args)
    {
        // Handle errors
        Console.WriteLine($"Error: {args.Error}");
    }
}
```

---

## Theming

### Available Themes

Syncfusion provides multiple built-in themes (CSS files in `_content/Syncfusion.Blazor.Themes/`):
- `bootstrap5.css` — Bootstrap 5 design
- `bootstrap5-dark.css` — Dark variant
- `tailwind.css` — Tailwind CSS aesthetic
- `material.css` — Material Design
- `fluent2.css` — Microsoft Fluent 2 design
- `fluent2-dark.css` — Dark Fluent variant

### Custom Theming via CSS Variables

```html
<style>
    :root {
        /* Primary brand color */
        --e-primary: #007bff;

        /* Background colors */
        --e-background: #ffffff;
        --e-surface: #f8f9fa;

        /* Text colors */
        --e-text-primary: #212529;
        --e-text-secondary: #6c757d;

        /* Border color */
        --e-border: #dee2e6;

        /* Accent colors */
        --e-success: #28a745;
        --e-danger: #dc3545;
        --e-warning: #ffc107;
        --e-info: #17a2b8;
    }
</style>
```

### Dark Mode

```html
<link href="_content/Syncfusion.Blazor.Themes/fluent2-dark.css" rel="stylesheet" />
```

Or toggle dynamically:
```csharp
<button @onclick="ToggleDarkMode">Toggle Dark Mode</button>

@code {
    private bool IsDarkMode = false;

    private void ToggleDarkMode()
    {
        IsDarkMode = !IsDarkMode;
        var theme = IsDarkMode ? "fluent2-dark" : "fluent2";
        // Dynamically update stylesheet link
    }
}
```

---

## API Reference Overview

### Core Namespace: `Syncfusion.Blazor`

**Base Component Classes**:
- `SfBaseComponent` — Base class for all Syncfusion components
- `SfDataBoundComponent` — For data-binding-enabled components (Grid, Chart, Scheduler, etc.)

**Data Management**:
- `DataManager` — Manages local and remote data
- `DataAdaptor` — Adaptor types: ODataV4Adaptor, WebApiAdaptor, GraphQLAdaptor, etc.
- `DataOperations` — Handles filtering, sorting, grouping, paging
- `DynamicObjectOperation` — Works with dynamic objects

**Service & Configuration**:
- `SyncfusionBlazorService` — Main service registration
- `GlobalOptions` — Global configuration settings
- `LicenseContext` / `LicenseContextProvider` — License management

**Localization**:
- `ISyncfusionStringLocalizer` — Interface for localization
- `SyncfusionStringLocalizer` — Default implementation

**Responsive Layout**:
- `SfMediaQuery` — Tracks viewport changes for responsive behavior

**Common Enums**:
- `TextAlign` — Alignment (Left, Right, Center, Justify)
- `ValueType` — Data types (Category, DateTime, Double, Logarithmic)
- `ActionType` — Grid/Schedule actions (EventCreate, EventChange, EventDelete)
- `FilterType` — Filter UI (Excel, Menu, Checkbox)
- `SelectionType` — Selection mode (Single, Multiple, Checkbox)
- `SortDirection` — Sort order (Ascending, Descending)

---

## Performance Considerations

### Virtual Scrolling (DataGrid)

For large datasets, use virtual scrolling to render only visible rows:

```razor
<SfGrid DataSource="@largeDataSet" EnableVirtualization="true" Height="400px">
    <GridPageSettings PageSize="50"></GridPageSettings>
</SfGrid>
```

### Lazy Loading

```csharp
<SfDataManager Url="api/orders" Adaptor="Adaptors.WebApiAdaptor">
    <DataManagerEventHandler OnActionComplete="@OnComplete"></DataManagerEventHandler>
</SfDataManager>
```

### Key Best Practices

1. **Virtual scrolling** for DataGrids with 1000+ rows
2. **Lazy load** remote data with pagination
3. **Debounce** search inputs before API calls
4. **Use `@key` directive** when rendering component lists
5. **OnInitializedAsync** for async data loading
6. **Dispose patterns** for cleanup in `Dispose()` method

---

## Complete Integration Example

Minimal working Blazor Web App with Syncfusion:

**Program.cs**:
```csharp
using Syncfusion.Blazor;

var builder = WebApplicationBuilder.CreateBuilder(args);
builder.Services.AddRazorComponents();
builder.Services.AddSyncfusionBlazor();
var app = builder.Build();
app.MapRazorComponents<App>();
app.Run();
```

**_Imports.razor**:
```csharp
@using System.Net.Http
@using Microsoft.AspNetCore.Components
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Syncfusion.Blazor
@using Syncfusion.Blazor.Grids
@using Syncfusion.Blazor.Charts
@using Syncfusion.Blazor.Schedule
```

**App.razor**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Syncfusion Blazor</title>
    <base href="/" />
    <link href="css/app.css" rel="stylesheet" />
    <link href="_content/Syncfusion.Blazor.Themes/fluent2.css" rel="stylesheet" />
</head>
<body>
    <Routes />
    <script src="_framework/blazor.web.js"></script>
    <script src="_content/Syncfusion.Blazor.Core/scripts/syncfusion-blazor.min.js"></script>
</body>
</html>
```

**Index.razor** (demo page):
```razor
@page "/"
@using Syncfusion.Blazor.Grids

<h1>Dashboard</h1>

<SfGrid DataSource="@Orders" AllowPaging="true">
    <GridColumns>
        <GridColumn Field=@nameof(Order.OrderID) HeaderText="Order ID"></GridColumn>
        <GridColumn Field=@nameof(Order.CustomerName) HeaderText="Customer"></GridColumn>
        <GridColumn Field=@nameof(Order.Amount) HeaderText="Amount" Format="C2"></GridColumn>
    </GridColumns>
</SfGrid>

@code {
    List<Order> Orders = new();

    protected override void OnInitialized()
    {
        Orders = new List<Order>
        {
            new Order { OrderID = 1, CustomerName = "Acme Corp", Amount = 1000m },
            new Order { OrderID = 2, CustomerName = "Tech Inc", Amount = 2500m }
        };
    }

    class Order {
        public int OrderID { get; set; }
        public string CustomerName { get; set; }
        public decimal Amount { get; set; }
    }
}
```

---

## Support & Resources

- **Official Docs**: https://blazor.syncfusion.com/documentation
- **API Reference**: https://help.syncfusion.com/cr/blazor/
- **Sample Browser**: Live examples at syncfusion.com
- **Support Portal**: support.syncfusion.com (create tickets)
- **Community**: Stack Overflow tag `syncfusion-blazor`
- **License**: Enterprise tier with annual support included

---

## Key Takeaways

1. **Installation**: One NuGet package per component + Themes package
2. **Configuration**: 3 steps (namespaces, service registration, theme/script includes)
3. **DataGrid**: Bind IEnumerable, configure columns, enable features via boolean properties
4. **Charts**: DataSource → Series (XName/YName) → Type selection
5. **Scheduler**: TValue generic type, appointment data model, view selection
6. **Theming**: Built-in themes or CSS variable customization
7. **Events**: ActionFailure common across components for error handling
8. **Performance**: Virtual scrolling for large datasets, lazy load remote data
