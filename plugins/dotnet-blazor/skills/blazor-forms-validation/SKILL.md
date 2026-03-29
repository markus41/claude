---
name: blazor-forms-validation
description: Blazor forms, EditForm, input components, DataAnnotations, FluentValidation, and custom validation
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
triggers:
  - blazor form
  - EditForm
  - validation
  - DataAnnotations
  - FluentValidation
  - input component
---

# Blazor Forms and Validation

## EditForm Setup

```razor
@rendermode InteractiveServer

<EditForm Model="@_model" OnValidSubmit="HandleSubmit" FormName="create-item">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <div class="mb-3">
        <label class="form-label">Name</label>
        <InputText @bind-Value="_model.Name" class="form-control" />
        <ValidationMessage For="@(() => _model.Name)" />
    </div>

    <div class="mb-3">
        <label class="form-label">Email</label>
        <InputText @bind-Value="_model.Email" class="form-control" type="email" />
        <ValidationMessage For="@(() => _model.Email)" />
    </div>

    <div class="mb-3">
        <label class="form-label">Category</label>
        <InputSelect @bind-Value="_model.CategoryId" class="form-select">
            <option value="">Select...</option>
            @foreach (var cat in _categories)
            {
                <option value="@cat.Id">@cat.Name</option>
            }
        </InputSelect>
    </div>

    <div class="mb-3">
        <label class="form-label">Accept Terms</label>
        <InputCheckbox @bind-Value="_model.AcceptTerms" />
    </div>

    <button type="submit" class="btn btn-primary" disabled="@_submitting">
        @(_submitting ? "Saving..." : "Submit")
    </button>
</EditForm>
```

## Model with DataAnnotations

```csharp
public sealed class CreateItemModel
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(200, MinimumLength = 2)]
    public string Name { get; set; } = "";

    [Required, EmailAddress]
    public string Email { get; set; } = "";

    [Range(1, int.MaxValue, ErrorMessage = "Select a category")]
    public int CategoryId { get; set; }

    [Range(typeof(bool), "true", "true", ErrorMessage = "Must accept terms")]
    public bool AcceptTerms { get; set; }
}
```

## FluentValidation Integration

```csharp
// Install: Blazored.FluentValidation
public sealed class CreateItemValidator : AbstractValidator<CreateItemModel>
{
    public CreateItemValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200);

        RuleFor(x => x.Email)
            .NotEmpty().EmailAddress();

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Select a category");
    }
}
```

```razor
@using Blazored.FluentValidation

<EditForm Model="@_model" OnValidSubmit="HandleSubmit">
    <FluentValidationValidator />
    @* ... inputs ... *@
</EditForm>
```

## SSR Form Handling (.NET 10)

For static SSR pages, use `[SupplyParameterFromForm]`:

```razor
@page "/items/create"

<EditForm Model="@Model" OnValidSubmit="HandleSubmit" FormName="create-item" method="post">
    <AntiforgeryToken />
    <DataAnnotationsValidator />
    @* inputs *@
</EditForm>

@code {
    [SupplyParameterFromForm]
    private CreateItemModel Model { get; set; } = new();

    private async Task HandleSubmit()
    {
        await ItemService.CreateAsync(Model);
        Navigation.NavigateTo("/items");
    }
}
```

## Input Components

| Component | Binds to | HTML |
|-----------|---------|------|
| `InputText` | `string` | `<input type="text">` |
| `InputTextArea` | `string` | `<textarea>` |
| `InputNumber<T>` | `int`, `decimal`, etc. | `<input type="number">` |
| `InputDate<T>` | `DateTime`, `DateOnly` | `<input type="date">` |
| `InputCheckbox` | `bool` | `<input type="checkbox">` |
| `InputSelect<T>` | enum, `int`, `string` | `<select>` |
| `InputRadio<T>` | enum, `string` | `<input type="radio">` |
| `InputFile` | `IBrowserFile` | `<input type="file">` |

## File Upload

```razor
<InputFile OnChange="HandleFileSelected" accept=".pdf,.docx" multiple />

@code {
    private async Task HandleFileSelected(InputFileChangeEventArgs e)
    {
        foreach (var file in e.GetMultipleFiles(maxAllowedFiles: 5))
        {
            if (file.Size > 10 * 1024 * 1024) continue; // 10MB limit

            using var stream = file.OpenReadStream(maxAllowedSize: 10 * 1024 * 1024);
            // Process stream...
        }
    }
}
```
