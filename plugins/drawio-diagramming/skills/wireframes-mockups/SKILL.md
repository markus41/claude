---
description: "UI/UX wireframe and mockup generation in draw.io at lo-fi, mid-fi, and hi-fi fidelity levels"
triggers:
  - wireframe
  - mockup
  - ui design
  - ux wireframe
  - mobile mockup
  - web mockup
  - lo-fi
  - mid-fi
  - hi-fi
  - prototype
  - app screen
globs:
  - "**/*.drawio"
  - "**/*.drawio.svg"
---

# Wireframes & Mockups

## Fidelity Levels

| Level | Purpose | Detail | When to Use |
|-------|---------|--------|-------------|
| Lo-fi | Concept exploration | Gray boxes, placeholder text, no color | Early ideation, stakeholder alignment |
| Mid-fi | Layout validation | Real labels, basic styling, grayscale | Design review, developer handoff prep |
| Hi-fi | Visual design | Brand colors, icons, realistic content | Client presentation, pixel-perfect handoff |

---

## draw.io UI Shape Libraries

Enable wireframe shapes in draw.io: **File > Open Library > wireframe** or search "mockup" in shapes panel.

### Built-in Mockup Libraries

| Library | Prefix | Contains |
|---------|--------|----------|
| Mockup Buttons | `mxgraph.mockup.buttons` | Buttons, toggles, radio, checkboxes |
| Mockup Containers | `mxgraph.mockup.containers` | Windows, dialogs, panels, cards |
| Mockup Forms | `mxgraph.mockup.forms` | Input fields, dropdowns, sliders, search bars |
| Mockup Graphics | `mxgraph.mockup.graphics` | Icons, avatars, image placeholders |
| Mockup Markup | `mxgraph.mockup.markup` | Headlines, paragraphs, lists, links |
| Mockup Navigation | `mxgraph.mockup.navigation` | Navbars, tabs, breadcrumbs, sidebars |
| Mockup Text | `mxgraph.mockup.text` | Labels, tooltips, badges |
| Android | `mxgraph.android` | Android-native UI components |
| iOS | `mxgraph.ios7` | iOS-native UI components |
| Bootstrap | `mxgraph.bootstrap` | Bootstrap grid, components |

---

## Common Component Styles

### Browser Window Frame

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Browser chrome -->
    <mxCell id="browser" value="My App - Chrome" style="shape=mxgraph.mockup.containers.browserWindow;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#666666;mainText=;fontSize=12;" vertex="1" parent="1">
      <mxGeometry x="40" y="40" width="800" height="560" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

### Mobile Phone Frame (iPhone)

```xml
<mxCell id="phone" value="" style="shape=mxgraph.ios7.phone;fillColor=#FFFFFF;strokeColor=#333333;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="240" height="480" as="geometry"/>
</mxCell>
```

### Android Phone Frame

```xml
<mxCell id="android" value="" style="shape=mxgraph.android.phone2;fillColor=#FFFFFF;strokeColor=#333333;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="240" height="480" as="geometry"/>
</mxCell>
```

### Tablet Frame (iPad)

```xml
<mxCell id="tablet" value="" style="shape=mxgraph.ios7.ipad;fillColor=#FFFFFF;strokeColor=#333333;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="480" height="640" as="geometry"/>
</mxCell>
```

---

## Lo-fi Wireframe Patterns

### Style Rules

- Fill: `fillColor=#F5F5F5;` (light gray) or `fillColor=none;`
- Stroke: `strokeColor=#999999;` (medium gray)
- Text: `fontColor=#666666;fontSize=12;fontFamily=Helvetica;`
- No shadows, no gradients, no brand colors
- Use `X` pattern for image placeholders: `shape=mxgraph.mockup.graphics.simpleIcon;`

### Page Layout (Lo-fi)

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Header bar -->
    <mxCell id="header" value="Logo" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#E0E0E0;strokeColor=#999999;fontColor=#666666;fontSize=14;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="0" y="0" width="800" height="60" as="geometry"/>
    </mxCell>
    <!-- Navigation -->
    <mxCell id="nav1" value="Home" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#666666;fontSize=12;" vertex="1" parent="1">
      <mxGeometry x="120" y="18" width="60" height="24" as="geometry"/>
    </mxCell>
    <mxCell id="nav2" value="Products" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#666666;fontSize=12;" vertex="1" parent="1">
      <mxGeometry x="200" y="18" width="80" height="24" as="geometry"/>
    </mxCell>
    <mxCell id="nav3" value="About" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#666666;fontSize=12;" vertex="1" parent="1">
      <mxGeometry x="300" y="18" width="60" height="24" as="geometry"/>
    </mxCell>
    <!-- Hero section -->
    <mxCell id="hero" value="Hero Image Area" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#CCCCCC;strokeWidth=2;dashed=1;fontColor=#999999;fontSize=16;" vertex="1" parent="1">
      <mxGeometry x="0" y="60" width="800" height="300" as="geometry"/>
    </mxCell>
    <!-- Content cards -->
    <mxCell id="card1" value="&lt;b&gt;Card Title&lt;/b&gt;&lt;br&gt;Description text here" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#CCCCCC;align=left;verticalAlign=top;spacingLeft=12;spacingTop=8;" vertex="1" parent="1">
      <mxGeometry x="20" y="380" width="240" height="140" as="geometry"/>
    </mxCell>
    <mxCell id="card2" value="&lt;b&gt;Card Title&lt;/b&gt;&lt;br&gt;Description text here" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#CCCCCC;align=left;verticalAlign=top;spacingLeft=12;spacingTop=8;" vertex="1" parent="1">
      <mxGeometry x="280" y="380" width="240" height="140" as="geometry"/>
    </mxCell>
    <mxCell id="card3" value="&lt;b&gt;Card Title&lt;/b&gt;&lt;br&gt;Description text here" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#CCCCCC;align=left;verticalAlign=top;spacingLeft=12;spacingTop=8;" vertex="1" parent="1">
      <mxGeometry x="540" y="380" width="240" height="140" as="geometry"/>
    </mxCell>
    <!-- Footer -->
    <mxCell id="footer" value="Footer" style="rounded=0;whiteSpace=wrap;html=1;fillColor=#E0E0E0;strokeColor=#999999;fontColor=#666666;fontSize=12;" vertex="1" parent="1">
      <mxGeometry x="0" y="540" width="800" height="40" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

---

## Mid-fi Wireframe Patterns

### Style Rules

- Fill: White (`#FFFFFF`) with light gray accents (`#F5F5F5`)
- Stroke: `strokeColor=#CCCCCC;` or `#AAAAAA`
- Primary action: `fillColor=#333333;fontColor=#FFFFFF;` (dark button)
- Text: `fontColor=#333333;fontSize=13;fontFamily=Inter;`
- Subtle shadows: `shadow=0;` (still no shadows at mid-fi)
- Real labels and content, no "Lorem ipsum"

### Form Example (Mid-fi)

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Form container -->
    <mxCell id="form" value="Create Account" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#CCCCCC;verticalAlign=top;fontStyle=1;fontSize=16;fontColor=#333333;spacingTop=12;align=center;" vertex="1" parent="1">
      <mxGeometry x="200" y="40" width="400" height="420" as="geometry"/>
    </mxCell>
    <!-- Email field -->
    <mxCell id="emailLabel" value="Email address" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#666666;fontSize=12;align=left;" vertex="1" parent="1">
      <mxGeometry x="230" y="90" width="120" height="20" as="geometry"/>
    </mxCell>
    <mxCell id="emailInput" value="you@example.com" style="shape=mxgraph.mockup.forms.rrect;rSize=4;fillColor=#FFFFFF;strokeColor=#CCCCCC;fontColor=#AAAAAA;fontSize=13;align=left;spacingLeft=8;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="230" y="112" width="340" height="36" as="geometry"/>
    </mxCell>
    <!-- Password field -->
    <mxCell id="passLabel" value="Password" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#666666;fontSize=12;align=left;" vertex="1" parent="1">
      <mxGeometry x="230" y="164" width="120" height="20" as="geometry"/>
    </mxCell>
    <mxCell id="passInput" value="&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;&#x2022;" style="shape=mxgraph.mockup.forms.rrect;rSize=4;fillColor=#FFFFFF;strokeColor=#CCCCCC;fontColor=#AAAAAA;fontSize=13;align=left;spacingLeft=8;whiteSpace=wrap;html=1;" vertex="1" parent="1">
      <mxGeometry x="230" y="186" width="340" height="36" as="geometry"/>
    </mxCell>
    <!-- Checkbox -->
    <mxCell id="terms" value="I agree to Terms of Service" style="shape=mxgraph.mockup.forms.checkbox;fillColor=#FFFFFF;strokeColor=#CCCCCC;fontColor=#666666;fontSize=12;html=1;align=left;spacingLeft=6;" vertex="1" parent="1">
      <mxGeometry x="230" y="240" width="200" height="20" as="geometry"/>
    </mxCell>
    <!-- Submit button -->
    <mxCell id="submit" value="Create Account" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#333333;strokeColor=#222222;fontColor=#FFFFFF;fontSize=14;fontStyle=1;" vertex="1" parent="1">
      <mxGeometry x="230" y="280" width="340" height="40" as="geometry"/>
    </mxCell>
    <!-- Divider -->
    <mxCell id="divider" value="" style="line;strokeWidth=1;strokeColor=#EEEEEE;html=1;" vertex="1" parent="1">
      <mxGeometry x="230" y="340" width="340" height="1" as="geometry"/>
    </mxCell>
    <!-- Secondary action -->
    <mxCell id="signin" value="Already have an account? &lt;u&gt;Sign in&lt;/u&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#666666;fontSize=12;align=center;" vertex="1" parent="1">
      <mxGeometry x="300" y="360" width="200" height="24" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

---

## Hi-fi Mockup Patterns

### Style Rules

- Use brand colors (set via variables or direct hex)
- Shadows: `shadow=1;` on cards and modals
- Border radius: `rounded=1;arcSize=8;` for modern look
- Typography: `fontSize=14;fontFamily=Inter;` with weight hierarchy
- Icons: Use `mxgraph.mockup.graphics` or inline SVG
- Real content, real images (use image shapes with URLs)
- Consistent spacing grid (8px increments)

### Dashboard Example (Hi-fi)

```xml
<mxGraphModel>
  <root>
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
    <!-- Sidebar -->
    <mxCell id="sidebar" value="" style="rounded=0;fillColor=#1A1A2E;strokeColor=none;" vertex="1" parent="1">
      <mxGeometry x="0" y="0" width="220" height="640" as="geometry"/>
    </mxCell>
    <mxCell id="logo" value="&lt;font color=&quot;#FFFFFF&quot; style=&quot;font-size:18px&quot;&gt;&lt;b&gt;Dashboard&lt;/b&gt;&lt;/font&gt;" style="text;html=1;fillColor=none;strokeColor=none;align=left;spacingLeft=16;" vertex="1" parent="1">
      <mxGeometry x="0" y="16" width="220" height="40" as="geometry"/>
    </mxCell>
    <mxCell id="navItem1" value="&lt;font color=&quot;#FFFFFF&quot;&gt;Overview&lt;/font&gt;" style="rounded=1;fillColor=#16213E;strokeColor=none;html=1;align=left;spacingLeft=40;fontColor=#FFFFFF;fontSize=13;" vertex="1" parent="1">
      <mxGeometry x="12" y="80" width="196" height="36" as="geometry"/>
    </mxCell>
    <mxCell id="navItem2" value="&lt;font color=&quot;#A0A0B0&quot;&gt;Analytics&lt;/font&gt;" style="rounded=1;fillColor=none;strokeColor=none;html=1;align=left;spacingLeft=40;fontSize=13;" vertex="1" parent="1">
      <mxGeometry x="12" y="120" width="196" height="36" as="geometry"/>
    </mxCell>
    <mxCell id="navItem3" value="&lt;font color=&quot;#A0A0B0&quot;&gt;Settings&lt;/font&gt;" style="rounded=1;fillColor=none;strokeColor=none;html=1;align=left;spacingLeft=40;fontSize=13;" vertex="1" parent="1">
      <mxGeometry x="12" y="160" width="196" height="36" as="geometry"/>
    </mxCell>
    <!-- Main content area -->
    <mxCell id="main" value="" style="rounded=0;fillColor=#F8F9FA;strokeColor=none;" vertex="1" parent="1">
      <mxGeometry x="220" y="0" width="780" height="640" as="geometry"/>
    </mxCell>
    <!-- Top bar -->
    <mxCell id="topbar" value="" style="rounded=0;fillColor=#FFFFFF;strokeColor=none;shadow=1;" vertex="1" parent="1">
      <mxGeometry x="220" y="0" width="780" height="56" as="geometry"/>
    </mxCell>
    <mxCell id="pageTitle" value="&lt;b&gt;Overview&lt;/b&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#1A1A2E;fontSize=18;align=left;spacingLeft=24;" vertex="1" parent="1">
      <mxGeometry x="220" y="12" width="200" height="32" as="geometry"/>
    </mxCell>
    <!-- Metric cards row -->
    <mxCell id="metric1" value="&lt;font color=&quot;#666&quot; style=&quot;font-size:12px&quot;&gt;Total Users&lt;/font&gt;&lt;br&gt;&lt;b style=&quot;font-size:28px;color:#1A1A2E&quot;&gt;12,847&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#22C55E&quot; style=&quot;font-size:12px&quot;&gt;+12.5%&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;shadow=1;align=left;verticalAlign=top;spacingTop=16;spacingLeft=20;" vertex="1" parent="1">
      <mxGeometry x="248" y="80" width="230" height="110" as="geometry"/>
    </mxCell>
    <mxCell id="metric2" value="&lt;font color=&quot;#666&quot; style=&quot;font-size:12px&quot;&gt;Revenue&lt;/font&gt;&lt;br&gt;&lt;b style=&quot;font-size:28px;color:#1A1A2E&quot;&gt;$48.2K&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#22C55E&quot; style=&quot;font-size:12px&quot;&gt;+8.1%&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;shadow=1;align=left;verticalAlign=top;spacingTop=16;spacingLeft=20;" vertex="1" parent="1">
      <mxGeometry x="498" y="80" width="230" height="110" as="geometry"/>
    </mxCell>
    <mxCell id="metric3" value="&lt;font color=&quot;#666&quot; style=&quot;font-size:12px&quot;&gt;Conversion&lt;/font&gt;&lt;br&gt;&lt;b style=&quot;font-size:28px;color:#1A1A2E&quot;&gt;3.24%&lt;/b&gt;&lt;br&gt;&lt;font color=&quot;#EF4444&quot; style=&quot;font-size:12px&quot;&gt;-0.8%&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;shadow=1;align=left;verticalAlign=top;spacingTop=16;spacingLeft=20;" vertex="1" parent="1">
      <mxGeometry x="748" y="80" width="230" height="110" as="geometry"/>
    </mxCell>
    <!-- Chart placeholder -->
    <mxCell id="chart" value="&lt;b&gt;Revenue Trend&lt;/b&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;shadow=1;verticalAlign=top;spacingTop=16;spacingLeft=20;align=left;fontSize=14;fontColor=#1A1A2E;" vertex="1" parent="1">
      <mxGeometry x="248" y="216" width="480" height="280" as="geometry"/>
    </mxCell>
    <!-- Table card -->
    <mxCell id="table" value="&lt;b&gt;Recent Activity&lt;/b&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;shadow=1;verticalAlign=top;spacingTop=16;spacingLeft=20;align=left;fontSize=14;fontColor=#1A1A2E;" vertex="1" parent="1">
      <mxGeometry x="248" y="520" width="730" height="100" as="geometry"/>
    </mxCell>
  </root>
</mxGraphModel>
```

---

## Mobile Screen Templates

### iOS Navigation Bar

```xml
<mxCell id="iosNav" value="" style="rounded=0;fillColor=#F8F8F8;strokeColor=#C8C8CC;" vertex="1" parent="1">
  <mxGeometry x="0" y="0" width="375" height="44" as="geometry"/>
</mxCell>
<mxCell id="iosTitle" value="&lt;b&gt;Screen Title&lt;/b&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#000000;fontSize=17;fontFamily=SF Pro Display;align=center;" vertex="1" parent="1">
  <mxGeometry x="100" y="10" width="175" height="24" as="geometry"/>
</mxCell>
<mxCell id="iosBack" value="&lt;font color=&quot;#007AFF&quot;&gt;&amp;lt; Back&lt;/font&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontSize=17;align=left;spacingLeft=8;" vertex="1" parent="1">
  <mxGeometry x="0" y="10" width="80" height="24" as="geometry"/>
</mxCell>
```

### iOS Tab Bar

```xml
<mxCell id="tabBar" value="" style="rounded=0;fillColor=#F8F8F8;strokeColor=#C8C8CC;" vertex="1" parent="1">
  <mxGeometry x="0" y="768" width="375" height="49" as="geometry"/>
</mxCell>
<mxCell id="tab1" value="&lt;font style=&quot;font-size:10px&quot;&gt;Home&lt;/font&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#007AFF;align=center;" vertex="1" parent="1">
  <mxGeometry x="10" y="778" width="65" height="30" as="geometry"/>
</mxCell>
<mxCell id="tab2" value="&lt;font style=&quot;font-size:10px&quot;&gt;Search&lt;/font&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#8E8E93;align=center;" vertex="1" parent="1">
  <mxGeometry x="85" y="778" width="65" height="30" as="geometry"/>
</mxCell>
<mxCell id="tab3" value="&lt;font style=&quot;font-size:10px&quot;&gt;Profile&lt;/font&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#8E8E93;align=center;" vertex="1" parent="1">
  <mxGeometry x="160" y="778" width="65" height="30" as="geometry"/>
</mxCell>
```

### Android Material Bottom Navigation

```xml
<mxCell id="androidNav" value="" style="rounded=0;fillColor=#FFFFFF;strokeColor=#E0E0E0;shadow=1;" vertex="1" parent="1">
  <mxGeometry x="0" y="752" width="360" height="56" as="geometry"/>
</mxCell>
<mxCell id="anTab1" value="&lt;font color=&quot;#6200EE&quot; style=&quot;font-size:10px&quot;&gt;&lt;b&gt;Home&lt;/b&gt;&lt;/font&gt;" style="text;html=1;fillColor=none;strokeColor=none;align=center;" vertex="1" parent="1">
  <mxGeometry x="20" y="764" width="60" height="32" as="geometry"/>
</mxCell>
<mxCell id="anTab2" value="&lt;font color=&quot;#666&quot; style=&quot;font-size:10px&quot;&gt;Search&lt;/font&gt;" style="text;html=1;fillColor=none;strokeColor=none;align=center;" vertex="1" parent="1">
  <mxGeometry x="100" y="764" width="60" height="32" as="geometry"/>
</mxCell>
```

---

## Responsive Breakpoints

When designing for multiple screen sizes, create separate pages in the `.drawio` file:

| Breakpoint | Width | Name | Use |
|------------|-------|------|-----|
| Mobile | 375px | `mobile` | iPhone SE / standard phones |
| Tablet | 768px | `tablet` | iPad / tablets |
| Desktop | 1280px | `desktop` | Standard laptop/desktop |
| Wide | 1440px | `wide` | Large monitors |

### Multi-page XML Structure

```xml
<mxfile>
  <diagram id="mobile" name="Mobile (375px)">
    <mxGraphModel dx="375" dy="812" grid="1" gridSize="8">
      <root><mxCell id="0"/><mxCell id="1" parent="0"/></root>
    </mxGraphModel>
  </diagram>
  <diagram id="tablet" name="Tablet (768px)">
    <mxGraphModel dx="768" dy="1024" grid="1" gridSize="8">
      <root><mxCell id="0"/><mxCell id="1" parent="0"/></root>
    </mxGraphModel>
  </diagram>
  <diagram id="desktop" name="Desktop (1280px)">
    <mxGraphModel dx="1280" dy="800" grid="1" gridSize="8">
      <root><mxCell id="0"/><mxCell id="1" parent="0"/></root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

---

## Common UI Components

### Data Table

```xml
<!-- Table header row -->
<mxCell id="thRow" value="" style="rounded=0;fillColor=#F9FAFB;strokeColor=#E5E7EB;" vertex="1" parent="1">
  <mxGeometry x="0" y="0" width="700" height="40" as="geometry"/>
</mxCell>
<mxCell id="th1" value="&lt;b&gt;Name&lt;/b&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#6B7280;fontSize=12;align=left;spacingLeft=16;" vertex="1" parent="1">
  <mxGeometry x="0" y="8" width="200" height="24" as="geometry"/>
</mxCell>
<mxCell id="th2" value="&lt;b&gt;Status&lt;/b&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#6B7280;fontSize=12;align=left;spacingLeft=16;" vertex="1" parent="1">
  <mxGeometry x="200" y="8" width="150" height="24" as="geometry"/>
</mxCell>
<mxCell id="th3" value="&lt;b&gt;Date&lt;/b&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#6B7280;fontSize=12;align=left;spacingLeft=16;" vertex="1" parent="1">
  <mxGeometry x="350" y="8" width="150" height="24" as="geometry"/>
</mxCell>
<!-- Data row -->
<mxCell id="row1" value="" style="rounded=0;fillColor=#FFFFFF;strokeColor=#E5E7EB;" vertex="1" parent="1">
  <mxGeometry x="0" y="40" width="700" height="44" as="geometry"/>
</mxCell>
<mxCell id="r1c1" value="John Smith" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#111827;fontSize=13;align=left;spacingLeft=16;" vertex="1" parent="1">
  <mxGeometry x="0" y="50" width="200" height="24" as="geometry"/>
</mxCell>
<!-- Status badge -->
<mxCell id="r1c2" value="Active" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DCFCE7;strokeColor=none;fontColor=#166534;fontSize=11;arcSize=50;" vertex="1" parent="1">
  <mxGeometry x="216" y="52" width="60" height="22" as="geometry"/>
</mxCell>
```

### Modal / Dialog

```xml
<!-- Overlay backdrop -->
<mxCell id="overlay" value="" style="rounded=0;fillColor=#000000;opacity=50;strokeColor=none;" vertex="1" parent="1">
  <mxGeometry x="0" y="0" width="1000" height="640" as="geometry"/>
</mxCell>
<!-- Modal -->
<mxCell id="modal" value="" style="rounded=1;fillColor=#FFFFFF;strokeColor=#E5E7EB;shadow=1;arcSize=4;" vertex="1" parent="1">
  <mxGeometry x="300" y="160" width="400" height="280" as="geometry"/>
</mxCell>
<mxCell id="modalTitle" value="&lt;b&gt;Confirm Action&lt;/b&gt;" style="text;html=1;fillColor=none;strokeColor=none;fontColor=#111827;fontSize=16;align=left;spacingLeft=24;" vertex="1" parent="1">
  <mxGeometry x="300" y="176" width="340" height="28" as="geometry"/>
</mxCell>
<mxCell id="modalBody" value="Are you sure you want to proceed? This action cannot be undone." style="text;html=1;fillColor=none;strokeColor=none;fontColor=#6B7280;fontSize=13;align=left;spacingLeft=24;whiteSpace=wrap;" vertex="1" parent="1">
  <mxGeometry x="300" y="216" width="360" height="60" as="geometry"/>
</mxCell>
<!-- Buttons -->
<mxCell id="cancelBtn" value="Cancel" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D1D5DB;fontColor=#374151;fontSize=13;" vertex="1" parent="1">
  <mxGeometry x="480" y="380" width="90" height="36" as="geometry"/>
</mxCell>
<mxCell id="confirmBtn" value="Confirm" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#EF4444;strokeColor=#DC2626;fontColor=#FFFFFF;fontSize=13;fontStyle=1;" vertex="1" parent="1">
  <mxGeometry x="580" y="380" width="90" height="36" as="geometry"/>
</mxCell>
```

### Toast / Notification

```xml
<mxCell id="toast" value="&lt;b&gt;Success!&lt;/b&gt; Your changes have been saved." style="rounded=1;whiteSpace=wrap;html=1;fillColor=#DCFCE7;strokeColor=#BBF7D0;fontColor=#166534;fontSize=13;shadow=1;align=left;spacingLeft=40;arcSize=6;" vertex="1" parent="1">
  <mxGeometry x="540" y="20" width="360" height="48" as="geometry"/>
</mxCell>
```

---

## Wireframe Annotation

Use annotation shapes to communicate design decisions:

```xml
<!-- Annotation callout -->
<mxCell id="annotation" value="&lt;font color=&quot;#DC2626&quot;&gt;&lt;b&gt;Note:&lt;/b&gt; This section collapses on mobile&lt;/font&gt;" style="shape=callout;whiteSpace=wrap;html=1;fillColor=#FEF2F2;strokeColor=#FCA5A5;fontSize=11;perimeter=calloutPerimeter;position2=0.5;base=20;size=12;" vertex="1" parent="1">
  <mxGeometry x="500" y="200" width="200" height="60" as="geometry"/>
</mxCell>
```

### Annotation Color Code

| Color | Hex | Meaning |
|-------|-----|---------|
| Red | `#DC2626` | Critical / must-fix |
| Orange | `#EA580C` | Question / needs decision |
| Blue | `#2563EB` | Developer note / implementation detail |
| Green | `#16A34A` | Approved / signed-off |
| Purple | `#9333EA` | Accessibility note |

---

## Screen Flow Diagrams

Connect wireframe screens to show user navigation:

```xml
<!-- Screen 1 thumbnail -->
<mxCell id="screen1" value="&lt;b&gt;Login&lt;/b&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D1D5DB;shadow=1;verticalAlign=bottom;spacingBottom=8;fontSize=12;" vertex="1" parent="1">
  <mxGeometry x="40" y="40" width="160" height="240" as="geometry"/>
</mxCell>
<!-- Screen 2 thumbnail -->
<mxCell id="screen2" value="&lt;b&gt;Dashboard&lt;/b&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D1D5DB;shadow=1;verticalAlign=bottom;spacingBottom=8;fontSize=12;" vertex="1" parent="1">
  <mxGeometry x="320" y="40" width="160" height="240" as="geometry"/>
</mxCell>
<!-- Flow arrow -->
<mxCell id="flow1" value="Login success" style="edgeStyle=orthogonalEdgeStyle;rounded=1;strokeColor=#6B7280;fontColor=#6B7280;fontSize=11;" edge="1" source="screen1" target="screen2" parent="1">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

---

## Best Practices

1. **Start lo-fi** — Validate layout before investing in visual polish
2. **Use 8px grid** — Set draw.io grid to 8px (`gridSize=8`) for consistent spacing
3. **Real content** — Use real text and realistic data, not "Lorem ipsum"
4. **Consistent sizing** — Buttons: 36-44px height; inputs: 36-40px; touch targets: 44px minimum
5. **Responsive thinking** — Design mobile-first, then expand to larger breakpoints
6. **Annotate decisions** — Use callouts to document why, not just what
7. **Version screens** — Use draw.io pages for iterations (v1, v2, v3)
8. **Export for review** — Use `.drawio.svg` for GitHub PRs, PNG for Slack/email
