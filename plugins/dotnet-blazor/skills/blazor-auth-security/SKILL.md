---
name: blazor-auth-security
description: Authentication and authorization in Blazor with ASP.NET Core Identity, Entra ID, JWT, and policy-based auth
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Bash
triggers:
  - blazor authentication
  - authorization
  - identity
  - entra id
  - azure ad
  - jwt
  - authorize attribute
  - auth state
---

# Blazor Authentication and Authorization

## ASP.NET Core Identity Setup

```csharp
// Program.cs
builder.Services.AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddIdentityCookies();

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"))
    .AddPolicy("PremiumUser", policy => policy.RequireClaim("subscription", "premium"));

builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.SignIn.RequireConfirmedEmail = true;
})
.AddRoles<IdentityRole>()
.AddEntityFrameworkStores<AppDbContext>()
.AddSignInManager()
.AddDefaultTokenProviders();
```

## Microsoft Entra ID (Azure AD)

```csharp
builder.Services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddControllersWithViews()
    .AddMicrosoftIdentityUI();
```

```json
// appsettings.json
{
  "AzureAd": {
    "Instance": "https://login.microsoftonline.com/",
    "TenantId": "your-tenant-id",
    "ClientId": "your-client-id",
    "CallbackPath": "/signin-oidc"
  }
}
```

## Blazor Authorization Components

```razor
@* Require authentication for a page *@
@page "/admin"
@attribute [Authorize(Roles = "Admin")]

@* Conditional rendering based on auth state *@
<AuthorizeView>
    <Authorized>
        <p>Welcome, @context.User.Identity?.Name!</p>
    </Authorized>
    <NotAuthorized>
        <p>Please <a href="/login">log in</a>.</p>
    </NotAuthorized>
</AuthorizeView>

@* Role-based content *@
<AuthorizeView Roles="Admin,Manager">
    <Authorized>
        <button @onclick="DeleteAll">Delete All</button>
    </Authorized>
</AuthorizeView>

@* Policy-based content *@
<AuthorizeView Policy="PremiumUser">
    <Authorized>
        <PremiumDashboard />
    </Authorized>
</AuthorizeView>
```

## Programmatic Auth Check

```csharp
@inject AuthenticationStateProvider AuthStateProvider

@code {
    private async Task CheckAuth()
    {
        var authState = await AuthStateProvider.GetAuthenticationStateAsync();
        var user = authState.User;

        if (user.Identity?.IsAuthenticated == true)
        {
            var name = user.Identity.Name;
            var isAdmin = user.IsInRole("Admin");
            var email = user.FindFirst(ClaimTypes.Email)?.Value;
        }
    }
}
```

## JWT Bearer for APIs

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });
```

## Security Best Practices

- Store secrets in User Secrets (dev) or Azure Key Vault (prod)
- Use HTTPS everywhere (`app.UseHsts()`)
- Enable antiforgery tokens for forms (`<AntiforgeryToken />`)
- Use `[Authorize]` on pages/endpoints, not just UI hiding
- Implement CORS properly for API projects
- Use Data Protection API for encrypting sensitive data
- Rate limit authentication endpoints
- Log authentication events for audit trails
