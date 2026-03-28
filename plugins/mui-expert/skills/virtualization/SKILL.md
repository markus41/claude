---
name: virtualization
description: MUI list virtualization with react-window, react-virtuoso, virtualized Autocomplete, and large dataset rendering patterns
triggers:
  - virtualization
  - virtual list
  - react-window
  - react-virtuoso
  - large list
  - infinite scroll
  - windowing
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

# MUI Virtualization

## Why Virtualize

Rendering 1000+ DOM nodes causes:
- **Layout thrashing** — the browser recalculates layout for every node on scroll
- **Memory pressure** — each MUI ListItem creates 3-5 DOM elements (ripple, text, icon wrappers)
- **Initial paint delay** — 10,000 items can take 2-4 seconds to mount

The fix: render only the visible items plus a small overscan buffer. Libraries like
react-window and react-virtuoso handle the math; you supply the row renderer.

**Rule of thumb:** virtualize any list with more than 100 items, or any list where
item count is unbounded (API-driven).

---

## react-window with MUI

Install: `npm install react-window @types/react-window`

### FixedSizeList with MUI ListItem

Use when every row has the same pixel height.

```tsx
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}

interface VirtualUserListProps {
  users: User[];
  height?: number;
}

function renderRow(users: User[]) {
  return function Row({ index, style }: ListChildComponentProps) {
    const user = users[index];
    return (
      <ListItem
        style={style}        // react-window positions via inline style
        key={user.id}
        component="div"      // avoid nested <li> issues
        disablePadding
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <ListItemAvatar>
          <Avatar src={user.avatarUrl} alt={user.name} />
        </ListItemAvatar>
        <ListItemText primary={user.name} secondary={user.email} />
      </ListItem>
    );
  };
}

export function VirtualUserList({ users, height = 400 }: VirtualUserListProps) {
  return (
    <Box sx={{ width: '100%', height, bgcolor: 'background.paper' }}>
      <FixedSizeList
        height={height}
        width="100%"
        itemSize={72}           // must match actual row height
        itemCount={users.length}
        overscanCount={5}       // render 5 extra rows above/below viewport
      >
        {renderRow(users)}
      </FixedSizeList>
    </Box>
  );
}
```

### VariableSizeList with MUI ListItem

Use when rows have different heights (e.g., multi-line text, expandable content).

```tsx
import { VariableSizeList } from 'react-window';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { useRef, useCallback } from 'react';

interface Message {
  id: string;
  sender: string;
  body: string;
}

interface VirtualMessageListProps {
  messages: Message[];
  height?: number;
}

// Estimate height based on text length; refine with measureRef if needed
function getItemSize(messages: Message[]) {
  return (index: number): number => {
    const body = messages[index].body;
    if (body.length < 80) return 56;
    if (body.length < 200) return 80;
    return 120;
  };
}

export function VirtualMessageList({ messages, height = 500 }: VirtualMessageListProps) {
  const listRef = useRef<VariableSizeList>(null);

  // Call this after data changes to recalculate sizes
  const resetSizes = useCallback(() => {
    listRef.current?.resetAfterIndex(0, true);
  }, []);

  return (
    <VariableSizeList
      ref={listRef}
      height={height}
      width="100%"
      itemCount={messages.length}
      itemSize={getItemSize(messages)}
      overscanCount={3}
    >
      {({ index, style }) => {
        const msg = messages[index];
        return (
          <ListItem style={style} component="div" alignItems="flex-start">
            <ListItemText
              primary={msg.sender}
              secondary={msg.body}
              secondaryTypographyProps={{
                sx: {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                },
              }}
            />
          </ListItem>
        );
      }}
    </VariableSizeList>
  );
}
```

**Key gotcha:** When data changes, call `listRef.current.resetAfterIndex(0, true)` to
force VariableSizeList to recalculate cached sizes.

---

## react-virtuoso with MUI

Install: `npm install react-virtuoso`

Virtuoso handles variable-height items automatically (no `itemSize` function needed)
and supports grouped lists, headers, footers, and scroll-to-index out of the box.

### Basic Virtuoso with MUI List Components

```tsx
import { Virtuoso } from 'react-virtuoso';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import FolderIcon from '@mui/icons-material/Folder';
import { forwardRef, type ReactElement } from 'react';

interface FileItem {
  id: string;
  name: string;
  size: string;
  onClick: () => void;
}

// Virtuoso needs the list container and item wrappers as custom components
const MuiListComponent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <List component="div" ref={ref} {...props} />,
);
MuiListComponent.displayName = 'MuiListComponent';

const MuiItemComponent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />,
);
MuiItemComponent.displayName = 'MuiItemComponent';

interface VirtualFileListProps {
  files: FileItem[];
  height?: number;
}

export function VirtualFileList({ files, height = 600 }: VirtualFileListProps): ReactElement {
  return (
    <Virtuoso
      style={{ height }}
      totalCount={files.length}
      components={{
        List: MuiListComponent,
        Item: MuiItemComponent,
      }}
      itemContent={(index) => {
        const file = files[index];
        return (
          <ListItemButton onClick={file.onClick}>
            <ListItemIcon>
              <FolderIcon />
            </ListItemIcon>
            <ListItemText primary={file.name} secondary={file.size} />
          </ListItemButton>
        );
      }}
    />
  );
}
```

### Grouped Virtuoso with MUI Subheaders

```tsx
import { GroupedVirtuoso } from 'react-virtuoso';
import ListSubheader from '@mui/material/ListSubheader';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

interface GroupedData {
  groups: string[];
  groupCounts: number[];
  items: Array<{ label: string; value: string }>;
}

export function GroupedVirtualList({ groups, groupCounts, items }: GroupedData) {
  return (
    <GroupedVirtuoso
      style={{ height: 500 }}
      groupCounts={groupCounts}
      groupContent={(index) => (
        <ListSubheader sx={{ bgcolor: 'background.paper', fontWeight: 700 }}>
          {groups[index]}
        </ListSubheader>
      )}
      itemContent={(index) => (
        <ListItem>
          <ListItemText primary={items[index].label} secondary={items[index].value} />
        </ListItem>
      )}
    />
  );
}
```

---

## Virtualized Autocomplete

MUI's official pattern for Autocomplete with thousands of options. The key is
overriding the `ListboxComponent` prop with a virtualized list.

### Using react-window

```tsx
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Popper from '@mui/material/Popper';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import {
  forwardRef,
  useRef,
  createContext,
  useContext,
  type HTMLAttributes,
  type ReactElement,
} from 'react';

// Context to pass props from Autocomplete to the virtualized list
const OuterElementContext = createContext<HTMLAttributes<HTMLElement>>({});

const OuterElementType = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const outerProps = useContext(OuterElementContext);
    return <div ref={ref} {...props} {...outerProps} />;
  },
);
OuterElementType.displayName = 'OuterElementType';

function renderRow({ data, index, style }: ListChildComponentProps) {
  const [props, option] = data[index];
  return (
    <Typography
      component="li"
      {...props}
      style={{ ...style, top: (style.top as number) }}
      noWrap
    >
      {option}
    </Typography>
  );
}

// The ListboxComponent override — this is the core pattern
const ListboxComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLElement>>(
  function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const itemData = children as [HTMLAttributes<HTMLElement>, string][];
    const itemCount = itemData.length;
    const itemSize = 48;

    const getHeight = () => Math.min(8 * itemSize, itemCount * itemSize);

    return (
      <div ref={ref}>
        <OuterElementContext.Provider value={other}>
          <FixedSizeList
            itemData={itemData}
            height={getHeight()}
            width="100%"
            outerElementType={OuterElementType}
            itemSize={itemSize}
            overscanCount={5}
            itemCount={itemCount}
          >
            {renderRow}
          </FixedSizeList>
        </OuterElementContext.Provider>
      </div>
    );
  },
);

// Custom Popper that disables the Flip modifier for stable positioning
const StyledPopper = (props: React.ComponentProps<typeof Popper>) => (
  <Popper
    {...props}
    style={{ width: 'fit-content' }}
    placement="bottom-start"
  />
);

interface VirtualizedAutocompleteProps {
  options: string[];
  label?: string;
}

export function VirtualizedAutocomplete({
  options,
  label = 'Search',
}: VirtualizedAutocompleteProps): ReactElement {
  return (
    <Autocomplete
      disableListWrap
      PopperComponent={StyledPopper}
      ListboxComponent={ListboxComponent}
      options={options}
      renderInput={(params) => <TextField {...params} label={label} />}
      renderOption={(props, option, state) => [props, option, state.index] as React.ReactNode}
    />
  );
}
```

### Using useAutocomplete (headless)

For full control, use the headless hook from `@mui/base`:

```tsx
import { useAutocomplete } from '@mui/base/useAutocomplete';
import { Virtuoso } from 'react-virtuoso';
import Box from '@mui/material/Box';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';

interface Option {
  id: string;
  label: string;
}

export function HeadlessVirtualAutocomplete({ options }: { options: Option[] }) {
  const {
    getRootProps,
    getInputProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    focused,
  } = useAutocomplete({
    options,
    getOptionLabel: (opt) => opt.label,
    isOptionEqualToValue: (opt, val) => opt.id === val.id,
  });

  return (
    <Box {...getRootProps()}>
      <InputBase
        {...getInputProps()}
        sx={{ border: 1, borderColor: 'divider', borderRadius: 1, px: 1, py: 0.5 }}
        placeholder="Search..."
        fullWidth
      />
      {groupedOptions.length > 0 && (
        <Paper {...getListboxProps()} elevation={4} sx={{ mt: 0.5 }}>
          <Virtuoso
            style={{ height: Math.min(300, groupedOptions.length * 48) }}
            totalCount={groupedOptions.length}
            itemContent={(index) => {
              const option = groupedOptions[index] as Option;
              const optionProps = getOptionProps({ option, index });
              return (
                <Box
                  component="li"
                  {...optionProps}
                  sx={{
                    px: 2,
                    py: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  {option.label}
                </Box>
              );
            }}
          />
        </Paper>
      )}
    </Box>
  );
}
```

---

## DataGrid Virtualization

MUI DataGrid virtualizes rows and columns by default. No extra library needed.

### Tuning Buffer Sizes

```tsx
import { DataGrid, type GridColDef } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { field: 'name', headerName: 'Name', width: 200 },
  { field: 'email', headerName: 'Email', width: 250, flex: 1 },
  { field: 'status', headerName: 'Status', width: 120 },
];

interface LargeDataGridProps {
  rows: Array<{ id: number; name: string; email: string; status: string }>;
}

export function LargeDataGrid({ rows }: LargeDataGridProps) {
  return (
    <DataGrid
      rows={rows}
      columns={columns}
      // Virtualization tuning
      rowBufferPx={150}           // pixels of rows to render outside viewport (default 150)
      columnBufferPx={150}        // pixels of columns to render outside viewport
      // Performance
      disableColumnFilter={false}
      disableColumnMenu={false}
      getRowId={(row) => row.id}
      // Pagination alternative: use if dataset is truly massive (100k+)
      // paginationModel={{ pageSize: 100, page: 0 }}
      // pageSizeOptions={[50, 100, 250]}
      sx={{ height: 600 }}
    />
  );
}
```

### Server-Side Virtualization with DataGridPro

For datasets too large to load entirely into the client:

```tsx
import { DataGridPro, type GridColDef } from '@mui/x-data-grid-pro';
import { useCallback, useRef, useState } from 'react';

interface ServerRow {
  id: number;
  [key: string]: unknown;
}

export function ServerVirtualGrid({ columns }: { columns: GridColDef[] }) {
  const [rows, setRows] = useState<ServerRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const loadedPages = useRef(new Set<number>());

  const handleFetchRows = useCallback(async (params: { firstRowToRender: number; lastRowToRender: number }) => {
    const pageSize = 100;
    const page = Math.floor(params.firstRowToRender / pageSize);

    if (loadedPages.current.has(page)) return;
    loadedPages.current.add(page);

    setLoading(true);
    const response = await fetch(`/api/data?page=${page}&size=${pageSize}`);
    const data = await response.json();

    setRows((prev) => {
      const next = [...prev];
      data.items.forEach((item: ServerRow, i: number) => {
        next[page * pageSize + i] = item;
      });
      return next;
    });
    setRowCount(data.totalCount);
    setLoading(false);
  }, []);

  return (
    <DataGridPro
      rows={rows}
      columns={columns}
      rowCount={rowCount}
      loading={loading}
      rowsLoadingMode="server"
      onFetchRows={handleFetchRows}
      scrollEndThreshold={200}    // px before end to trigger fetch
      getRowId={(row) => row.id}
      sx={{ height: 700 }}
    />
  );
}
```

---

## Infinite Scrolling

### react-virtuoso with API Pagination

```tsx
import { Virtuoso } from 'react-virtuoso';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { useState, useCallback, forwardRef } from 'react';

interface Post {
  id: number;
  title: string;
  excerpt: string;
}

const MuiList = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <List component="div" ref={ref} {...props} />,
);
MuiList.displayName = 'MuiList';

export function InfinitePostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const cursor = posts.length;
    const response = await fetch(`/api/posts?offset=${cursor}&limit=50`);
    const data: { items: Post[]; hasMore: boolean } = await response.json();

    setPosts((prev) => [...prev, ...data.items]);
    setHasMore(data.hasMore);
    setLoading(false);
  }, [posts.length, loading, hasMore]);

  return (
    <Virtuoso
      style={{ height: '80vh' }}
      data={posts}
      endReached={loadMore}
      overscan={200}
      components={{
        List: MuiList,
        Footer: () =>
          loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : null,
      }}
      itemContent={(index, post) => (
        <ListItem divider>
          <ListItemText primary={post.title} secondary={post.excerpt} />
        </ListItem>
      )}
    />
  );
}
```

### IntersectionObserver Pattern (No Library)

For simpler cases where you just need "load more when sentinel enters viewport":

```tsx
import { useEffect, useRef, useCallback, useState } from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

function useInfiniteScroll(onLoadMore: () => Promise<void>, hasMore: boolean) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const handleIntersect = useCallback(
    async (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
        loadingRef.current = true;
        await onLoadMore();
        loadingRef.current = false;
      }
    },
    [onLoadMore, hasMore],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, {
      rootMargin: '200px',  // trigger 200px before sentinel is visible
    });
    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [handleIntersect]);

  return sentinelRef;
}

interface Item {
  id: string;
  title: string;
}

export function InfiniteScrollList() {
  const [items, setItems] = useState<Item[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    const res = await fetch(`/api/items?offset=${items.length}&limit=30`);
    const data = await res.json();
    setItems((prev) => [...prev, ...data.items]);
    setHasMore(data.hasMore);
  }, [items.length]);

  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  return (
    <Box sx={{ height: '80vh', overflow: 'auto' }}>
      <List>
        {items.map((item) => (
          <ListItem key={item.id} divider>
            <ListItemText primary={item.title} />
          </ListItem>
        ))}
      </List>
      <div ref={sentinelRef} style={{ height: 1 }} />
      {!hasMore && (
        <Box sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
          No more items
        </Box>
      )}
    </Box>
  );
}
```

---

## Table Virtualization

### react-window with MUI Table

```tsx
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { forwardRef, type ReactElement } from 'react';

interface DataRow {
  id: number;
  name: string;
  department: string;
  salary: number;
}

interface VirtualTableProps {
  rows: DataRow[];
  height?: number;
}

// The inner element must be a <tbody> for valid HTML
const InnerElement = forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ children, ...rest }, ref) => (
    <TableBody component="div" ref={ref} {...rest}>
      {children}
    </TableBody>
  ),
);
InnerElement.displayName = 'InnerElement';

function Row({ index, style, data }: ListChildComponentProps<DataRow[]>) {
  const row = data[index];
  return (
    <TableRow component="div" style={style} hover sx={{ display: 'flex' }}>
      <TableCell component="div" sx={{ flex: '0 0 80px' }}>{row.id}</TableCell>
      <TableCell component="div" sx={{ flex: '1 1 200px' }}>{row.name}</TableCell>
      <TableCell component="div" sx={{ flex: '1 1 150px' }}>{row.department}</TableCell>
      <TableCell component="div" sx={{ flex: '0 0 120px' }} align="right">
        ${row.salary.toLocaleString()}
      </TableCell>
    </TableRow>
  );
}

export function VirtualTable({ rows, height = 500 }: VirtualTableProps): ReactElement {
  return (
    <TableContainer component={Paper}>
      <Table component="div" sx={{ minWidth: 550 }}>
        <TableHead component="div">
          <TableRow component="div" sx={{ display: 'flex' }}>
            <TableCell component="div" sx={{ flex: '0 0 80px' }}>ID</TableCell>
            <TableCell component="div" sx={{ flex: '1 1 200px' }}>Name</TableCell>
            <TableCell component="div" sx={{ flex: '1 1 150px' }}>Department</TableCell>
            <TableCell component="div" sx={{ flex: '0 0 120px' }} align="right">Salary</TableCell>
          </TableRow>
        </TableHead>
        <FixedSizeList
          height={height}
          width="100%"
          itemSize={52}
          itemCount={rows.length}
          itemData={rows}
          innerElementType={InnerElement}
          overscanCount={5}
        >
          {Row}
        </FixedSizeList>
      </Table>
    </TableContainer>
  );
}
```

---

## Performance Tips

### 1. Memoize Row Renderers

Row renderers re-execute on every scroll tick. Memoize expensive computation:

```tsx
import { memo } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

interface RowProps {
  item: { id: string; name: string; description: string };
  style: React.CSSProperties;
}

export const MemoizedRow = memo(function MemoizedRow({ item, style }: RowProps) {
  return (
    <ListItem style={style} component="div">
      <ListItemText primary={item.name} secondary={item.description} />
    </ListItem>
  );
});
```

### 2. Stable Row Heights

Avoid content that changes height after render (images loading, text wrapping
differently). Unstable heights cause:
- Scroll jumping in VariableSizeList
- Incorrect item positioning
- Need for repeated `resetAfterIndex` calls

```tsx
// GOOD — fixed height, text clamped
<ListItemText
  primary={name}
  secondary={description}
  secondaryTypographyProps={{
    noWrap: true,           // single line, no height surprises
  }}
/>

// GOOD — explicit min/max height
<ListItem style={style} sx={{ minHeight: 72, maxHeight: 72 }}>
```

### 3. Overscan Counts

| Scenario | Recommended Overscan |
|----------|---------------------|
| Fast scrolling, simple rows | 3-5 |
| Slow scrolling, complex rows | 5-10 |
| Keyboard navigation | 1-2 (lower = faster focus) |
| Accessibility (screen readers) | 10+ (more content in DOM) |

### 4. Avoid Re-Creating itemData on Every Render

```tsx
// BAD — new array reference every render, all rows re-render
<FixedSizeList itemData={items.map(transform)} ... />

// GOOD — stable reference
const itemData = useMemo(() => items.map(transform), [items]);
<FixedSizeList itemData={itemData} ... />
```

### 5. Use layout="horizontal" for Horizontal Lists

```tsx
<FixedSizeList
  layout="horizontal"
  height={200}
  width={800}
  itemSize={300}
  itemCount={items.length}
>
  {renderCard}
</FixedSizeList>
```

### 6. Keyboard Accessibility in Virtual Lists

Virtual lists can break keyboard navigation because off-screen items are not in the
DOM. Use `scrollToIndex` on arrow key events:

```tsx
const listRef = useRef<FixedSizeList>(null);
const [focusedIndex, setFocusedIndex] = useState(0);

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
    listRef.current?.scrollToItem(focusedIndex + 1, 'smart');
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    setFocusedIndex((prev) => Math.max(prev - 1, 0));
    listRef.current?.scrollToItem(focusedIndex - 1, 'smart');
  }
};
```
