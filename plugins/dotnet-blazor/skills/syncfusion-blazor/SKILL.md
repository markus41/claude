---
name: syncfusion-blazor
description: Syncfusion Blazor component library with DataGrid, Charts, Scheduler, PDF, and 80+ components
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
triggers:
  - syncfusion
  - sfgrid
  - blazor grid
  - syncfusion chart
  - blazor scheduler
  - syncfusion component
  - essential ui kit
---

# Syncfusion Blazor Components

## Setup

```bash
dotnet add package Syncfusion.Blazor.Themes
dotnet add package Syncfusion.Blazor.Core
# Add specific component packages as needed:
dotnet add package Syncfusion.Blazor.Grid
dotnet add package Syncfusion.Blazor.Charts
dotnet add package Syncfusion.Blazor.Schedule
dotnet add package Syncfusion.Blazor.RichTextEditor
dotnet add package Syncfusion.Blazor.PdfViewer
dotnet add package Syncfusion.Blazor.Inputs
dotnet add package Syncfusion.Blazor.Navigations
```

```csharp
// Program.cs
Syncfusion.Licensing.SyncfusionLicenseProvider.RegisterLicense(
    builder.Configuration["Syncfusion:LicenseKey"]);
builder.Services.AddSyncfusionBlazor();
```

```razor
@* _Imports.razor *@
@using Syncfusion.Blazor
@using Syncfusion.Blazor.Grids
@using Syncfusion.Blazor.Charts
```

```html
<!-- Theme in App.razor -->
<link href="_content/Syncfusion.Blazor.Themes/bootstrap5.css" rel="stylesheet" />
```

## DataGrid (SfGrid)

```razor
<SfGrid DataSource="@_orders" AllowPaging="true" AllowSorting="true"
        AllowFiltering="true" AllowGrouping="true"
        Toolbar="@(new List<string> { "Add", "Edit", "Delete", "Search", "ExcelExport" })">
    <GridEditSettings AllowAdding="true" AllowEditing="true" AllowDeleting="true"
                      Mode="EditMode.Dialog" />
    <GridPageSettings PageSize="25" PageSizes="true" />
    <GridFilterSettings Type="FilterType.Excel" />
    <GridSelectionSettings Type="SelectionType.Multiple" />
    <GridEvents OnActionComplete="ActionComplete" TValue="OrderDto"
                OnToolbarClick="ToolbarClick" />
    <GridColumns>
        <GridColumn Field="@nameof(OrderDto.Id)" HeaderText="Order #" Width="100"
                    IsPrimaryKey="true" />
        <GridColumn Field="@nameof(OrderDto.CustomerName)" HeaderText="Customer" Width="200" />
        <GridColumn Field="@nameof(OrderDto.OrderDate)" HeaderText="Date" Width="140"
                    Format="d" Type="ColumnType.Date" />
        <GridColumn Field="@nameof(OrderDto.Total)" HeaderText="Total" Width="120"
                    Format="C2" TextAlign="TextAlign.Right" />
        <GridColumn Field="@nameof(OrderDto.Status)" HeaderText="Status" Width="130">
            <Template>
                @{
                    var order = (context as OrderDto)!;
                    <SfChip>
                        <ChipItems>
                            <ChipItem Text="@order.Status"
                                      CssClass="@GetStatusClass(order.Status)" />
                        </ChipItems>
                    </SfChip>
                }
            </Template>
        </GridColumn>
    </GridColumns>
</SfGrid>
```

### Server-Side Data Operations
```razor
<SfGrid TValue="OrderDto" AllowPaging="true" AllowSorting="true" AllowFiltering="true">
    <SfDataManager Url="/api/orders" Adaptor="Adaptors.WebApiAdaptor" />
</SfGrid>
```

## Charts

```razor
<SfChart Title="Monthly Revenue">
    <ChartPrimaryXAxis ValueType="Syncfusion.Blazor.Charts.ValueType.Category" />
    <ChartPrimaryYAxis LabelFormat="C0" />
    <ChartSeriesCollection>
        <ChartSeries DataSource="@_revenueData" XName="Month" YName="Revenue"
                     Type="ChartSeriesType.Column" Fill="#4e73df" />
        <ChartSeries DataSource="@_revenueData" XName="Month" YName="Target"
                     Type="ChartSeriesType.Line" Fill="#e74a3b" Width="2" />
    </ChartSeriesCollection>
    <ChartTooltipSettings Enable="true" />
    <ChartLegendSettings Visible="true" />
</SfChart>
```

## Scheduler

```razor
<SfSchedule TValue="AppointmentDto" Height="650px" SelectedDate="@DateTime.Today">
    <ScheduleViews>
        <ScheduleView Option="View.Day" />
        <ScheduleView Option="View.Week" />
        <ScheduleView Option="View.Month" />
        <ScheduleView Option="View.Agenda" />
    </ScheduleViews>
    <ScheduleEventSettings DataSource="@_appointments" />
    <ScheduleEvents OnActionComplete="OnScheduleAction" TValue="AppointmentDto" />
</SfSchedule>
```

## Essential UI Kit Blocks

Pre-built layout blocks: https://blazor.syncfusion.com/essential-ui-kit/blocks

Categories: Grid layouts, login pages, dashboards, pricing tables, profile cards, e-commerce, CRM

```razor
@* Example: Use grid block for responsive layout *@
<SfGrid DataSource="@_data">
    @* Configured per Essential UI Kit block pattern *@
</SfGrid>
```

## Theming

Built-in themes: `bootstrap5`, `material3`, `fluent2`, `tailwind`, `fabric`, `highcontrast`

Custom theme: Use ThemeStudio at https://blazor.syncfusion.com/themestudio/

## License Key Management

```csharp
// NEVER hardcode! Use one of:
// 1. User Secrets (development)
dotnet user-secrets set "Syncfusion:LicenseKey" "your-key"

// 2. Environment variable
Environment.GetEnvironmentVariable("SYNCFUSION_LICENSE_KEY");

// 3. Azure Key Vault (production)
builder.Configuration.AddAzureKeyVault(vaultUri, credential);
```
