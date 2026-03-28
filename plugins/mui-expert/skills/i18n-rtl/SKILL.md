---
name: i18n-rtl
description: MUI internationalization, RTL support, locale customization, and bidirectional text
triggers:
  - RTL
  - right-to-left
  - internationalization
  - i18n
  - locale
  - Arabic
  - Hebrew
  - bidirectional
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

# MUI Internationalization & RTL Support

## 1. RTL Setup

Set the document direction and configure the MUI theme:

```tsx
// index.html — set dir on <html>
<html dir="rtl" lang="ar">

// theme.ts
import { createTheme } from '@mui/material/styles';

const rtlTheme = createTheme({
  direction: 'rtl',
});
```

Install the Emotion RTL plugin for automatic style flipping:

```bash
npm install stylis-plugin-rtl stylis
```

Wrap the app with the RTL-aware cache provider:

```tsx
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { ThemeProvider } from '@mui/material/styles';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

function App() {
  return (
    <CacheProvider value={cacheRtl}>
      <ThemeProvider theme={rtlTheme}>
        {/* All MUI components now render RTL */}
        <MyApplication />
      </ThemeProvider>
    </CacheProvider>
  );
}
```

## 2. Emotion RTL Cache

The RTL cache intercepts all Emotion-generated styles and flips directional properties (`margin-left` becomes `margin-right`, `padding-left` becomes `padding-right`, etc.).

```tsx
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';

// RTL cache — use for Arabic, Hebrew, Persian, Urdu
const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// LTR cache — use for English, French, German, etc.
const ltrCache = createCache({
  key: 'muiltr',
  stylisPlugins: [prefixer],
});
```

Key points:
- The `key` must be unique per cache instance (e.g. `'muirtl'` vs `'muiltr'`).
- `prefixer` adds vendor prefixes and should always be included.
- `rtlPlugin` must come after `prefixer` in the array.

## 3. Dynamic Direction Switching

Toggle between LTR and RTL at runtime using React state:

```tsx
import { useState, useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import { prefixer } from 'stylis';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import FormatTextdirectionLToRIcon from '@mui/icons-material/FormatTextdirectionLToR';
import FormatTextdirectionRToLIcon from '@mui/icons-material/FormatTextdirectionRToL';

const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

const ltrCache = createCache({
  key: 'muiltr',
  stylisPlugins: [prefixer],
});

function App() {
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  const theme = useMemo(
    () => createTheme({ direction }),
    [direction],
  );

  const toggleDirection = () => {
    const newDir = direction === 'ltr' ? 'rtl' : 'ltr';
    setDirection(newDir);
    document.dir = newDir; // sync <html> dir attribute
  };

  return (
    <CacheProvider value={direction === 'rtl' ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <IconButton onClick={toggleDirection}>
          {direction === 'ltr'
            ? <FormatTextdirectionRToLIcon />
            : <FormatTextdirectionLToRIcon />}
        </IconButton>
        <MyApplication />
      </ThemeProvider>
    </CacheProvider>
  );
}
```

Important: always sync `document.dir` with the theme direction so native browser layout matches MUI.

## 4. Component Localization

MUI ships built-in locale strings for 50+ languages. Pass a locale object as the second argument to `createTheme`:

```tsx
import { createTheme } from '@mui/material/styles';
import { deDE } from '@mui/material/locale';

// German locale — translates MUI component strings
// (e.g. TablePagination "Rows per page" -> "Zeilen pro Seite")
const theme = createTheme(
  {
    palette: {
      primary: { main: '#1976d2' },
    },
  },
  deDE, // locale object as second argument
);
```

Common locale imports:

```tsx
import { enUS } from '@mui/material/locale'; // English (default)
import { frFR } from '@mui/material/locale'; // French
import { esES } from '@mui/material/locale'; // Spanish
import { jaJP } from '@mui/material/locale'; // Japanese
import { zhCN } from '@mui/material/locale'; // Chinese (Simplified)
import { arSA } from '@mui/material/locale'; // Arabic (Saudi Arabia)
import { heIL } from '@mui/material/locale'; // Hebrew (Israel)
import { koKR } from '@mui/material/locale'; // Korean
import { ptBR } from '@mui/material/locale'; // Portuguese (Brazil)
import { trTR } from '@mui/material/locale'; // Turkish
```

For RTL languages, combine direction with locale:

```tsx
import { arSA } from '@mui/material/locale';

const arabicTheme = createTheme(
  {
    direction: 'rtl',
    typography: {
      fontFamily: '"Noto Sans Arabic", "Roboto", sans-serif',
    },
  },
  arSA,
);
```

## 5. MUI X Localization

MUI X components (DataGrid, DatePicker, TreeView) have their own locale strings, imported separately:

```tsx
import { createTheme } from '@mui/material/styles';
import { deDE as coreDeDE } from '@mui/material/locale';
import { deDE as dataGridDeDE } from '@mui/x-data-grid/locales';
import { deDE as datePickerDeDE } from '@mui/x-date-pickers/locales';

// Combine core + DataGrid + DatePicker locales
const theme = createTheme(
  {
    palette: { primary: { main: '#1976d2' } },
  },
  dataGridDeDE,    // DataGrid locale
  datePickerDeDE,  // DatePicker locale
  coreDeDE,        // Core MUI locale (last to allow overrides)
);
```

DataGrid locale strings cover:

- Column menu labels (`columnMenuLabel`, `columnMenuSortAsc`, `columnMenuFilter`)
- Toolbar labels (`toolbarColumns`, `toolbarFilters`, `toolbarExport`)
- Pagination (`MuiTablePagination` labels)
- Filter panel labels (`filterPanelOperator`, `filterPanelColumns`, `filterPanelInputLabel`)
- No rows overlay (`noRowsLabel`, `noResultsOverlayLabel`)

DatePicker locale strings cover:

- Field placeholders and labels
- Calendar navigation (`previousMonth`, `nextMonth`)
- Toolbar labels (`datePickerToolbarTitle`, `timePickerToolbarTitle`)
- Action bar labels (`okButtonLabel`, `cancelButtonLabel`, `clearButtonLabel`)

## 6. Custom Locale

Override individual translation strings by deep-merging with a built-in locale:

```tsx
import { createTheme } from '@mui/material/styles';
import { enUS } from '@mui/material/locale';
import { enUS as dataGridEnUS } from '@mui/x-data-grid/locales';
import deepmerge from 'deepmerge';

// Custom locale: override specific DataGrid strings
const customDataGridLocale = deepmerge(dataGridEnUS, {
  components: {
    MuiDataGrid: {
      defaultProps: {
        localeText: {
          noRowsLabel: 'No records found',
          footerRowSelected: (count: number) =>
            count === 1
              ? '1 record selected'
              : `${count.toLocaleString()} records selected`,
          toolbarExport: 'Download',
          toolbarExportCSV: 'Download as CSV',
          toolbarExportPrint: 'Print view',
        },
      },
    },
  },
});

// Custom locale: override core MUI strings
const customCoreLocale = deepmerge(enUS, {
  components: {
    MuiTablePagination: {
      defaultProps: {
        labelRowsPerPage: 'Items per page:',
        labelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) =>
          `Showing ${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`,
      },
    },
    MuiAlert: {
      defaultProps: {
        closeText: 'Dismiss',
      },
    },
  },
});

const theme = createTheme(
  { palette: { primary: { main: '#1976d2' } } },
  customDataGridLocale,
  customCoreLocale,
);
```

Per-component override (without theme-level locale):

```tsx
import { DataGrid } from '@mui/x-data-grid';

<DataGrid
  rows={rows}
  columns={columns}
  localeText={{
    noRowsLabel: 'Nothing here yet',
    toolbarFilters: 'Search filters',
    columnMenuSortAsc: 'Sort A to Z',
    columnMenuSortDesc: 'Sort Z to A',
  }}
/>
```

## 7. Portal Components & RTL

Portal-based components (Dialog, Popper, Menu, Popover, Snackbar, Tooltip) render outside the main React tree into `document.body`. They inherit the document direction from `document.dir`, but they need the Emotion cache and theme context to style correctly.

This works automatically when:
1. `document.dir` is set to `'rtl'`
2. The `CacheProvider` with `rtlCache` wraps the app root

```tsx
// Dialogs automatically flip their layout in RTL
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

function RTLDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{"title"}</DialogTitle>
      <DialogContent>
        {/* Content flows right-to-left automatically */}
        <p>{"content"}</p>
      </DialogContent>
      <DialogActions>
        {/* Buttons position correctly: primary action on left in RTL */}
        <Button onClick={onClose}>{"cancel"}</Button>
        <Button onClick={onClose} variant="contained">{"confirm"}</Button>
      </DialogActions>
    </Dialog>
  );
}
```

If using multiple directions in the same page (e.g., an LTR widget inside an RTL page), wrap the LTR section:

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';

function LTRSection({ children }: { children: React.ReactNode }) {
  const ltrTheme = createTheme({ direction: 'ltr' });

  return (
    <div dir="ltr">
      <CacheProvider value={ltrCache}>
        <ThemeProvider theme={ltrTheme}>
          {children}
        </ThemeProvider>
      </CacheProvider>
    </div>
  );
}
```

## 8. Bidirectional Layout Tips

### Icons that need flipping

Some icons have directional meaning and should be mirrored in RTL:

```tsx
import { useTheme } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';

function DirectionalIcon() {
  const theme = useTheme();
  const isRtl = theme.direction === 'rtl';

  // Option 1: Swap icons based on direction
  const NextIcon = isRtl ? ArrowBackIcon : ArrowForwardIcon;
  const PrevIcon = isRtl ? ArrowForwardIcon : ArrowBackIcon;

  // Option 2: CSS flip for icons that should mirror
  return (
    <SendIcon
      sx={{
        transform: isRtl ? 'scaleX(-1)' : 'none',
      }}
    />
  );
}
```

Icons that should NOT flip: icons without directional meaning (close, add, delete, search, settings).

Icons that SHOULD flip: arrows, navigation chevrons, send, reply, undo/redo, text indent, list bullets, external link.

### Spacing in RTL

Use logical properties in the `sx` prop instead of physical ones:

```tsx
// BAD: physical properties — break in RTL
<Box sx={{ marginLeft: 2, paddingRight: 1 }} />

// GOOD: logical properties — work in both LTR and RTL
<Box sx={{ marginInlineStart: 2, paddingInlineEnd: 1 }} />

// ALSO GOOD: MUI shorthand with theme-aware flipping
// ml/mr are auto-flipped by the RTL plugin
<Box sx={{ ml: 2, pr: 1 }} />
```

The `stylis-plugin-rtl` automatically converts `margin-left` to `margin-right` (and vice versa), so MUI shorthand (`ml`, `mr`, `pl`, `pr`) works correctly. However, if you use inline styles (`style={{ marginLeft: 16 }}`), those are NOT flipped — always prefer `sx`.

### Logical CSS properties reference

| Physical (avoid) | Logical (prefer) |
|---|---|
| `left` / `right` | `inset-inline-start` / `inset-inline-end` |
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `padding-left` / `padding-right` | `padding-inline-start` / `padding-inline-end` |
| `border-left` / `border-right` | `border-inline-start` / `border-inline-end` |
| `text-align: left` | `text-align: start` |
| `float: left` | `float: inline-start` |

### Opt out of RTL flipping

For elements that should remain LTR even in an RTL context (e.g., code blocks, phone numbers, LTR brand names):

```tsx
// Use the noflip directive in sx
<Box
  sx={{
    /* @noflip */
    textAlign: 'left',
    direction: 'ltr',
  }}
/>

// Or wrap in a dir="ltr" container
<span dir="ltr" style={{ unicodeBidi: 'embed' }}>
  +1 (555) 123-4567
</span>
```

### TextField and input alignment

Text inputs automatically inherit direction. For mixed-direction inputs (e.g., a search field that might contain Arabic or English):

```tsx
import TextField from '@mui/material/TextField';

<TextField
  label="Search"
  inputProps={{
    dir: 'auto', // browser auto-detects direction from content
  }}
/>
```

### RTL testing checklist

1. Verify `document.dir="rtl"` is set
2. Check `createTheme({ direction: 'rtl' })` is configured
3. Confirm `CacheProvider` with `rtlCache` wraps the app
4. Test all Dialogs, Menus, and Drawers open/close correctly
5. Verify navigation icons (arrows, chevrons) point correctly
6. Check form layouts and label alignment
7. Verify DataGrid column order and sort icons
8. Test text truncation with ellipsis in RTL
9. Check absolute/fixed positioned elements
10. Verify scrollbar position (should be on the left in RTL)
