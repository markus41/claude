---
name: tree-view
description: MUI X Tree View — SimpleTreeView, RichTreeView, lazy loading, custom icons, multiselect, drag-and-drop, and virtualization
triggers:
  - TreeView
  - tree view
  - RichTreeView
  - SimpleTreeView
  - hierarchical
  - tree data
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

# MUI X Tree View

## Package Tiers

| Package | Import | Features |
|---------|--------|---------|
| `@mui/x-tree-view` | `SimpleTreeView`, `TreeItem` | Expansion, selection, keyboard nav, icons (free, MIT) |
| `@mui/x-tree-view-pro` | `RichTreeViewPro` | Drag-and-drop reordering, virtualization |
| `@mui/x-tree-view` | `RichTreeView` | Data-driven tree from items array (free, MIT) |

Always import `TreeItem` from `@mui/x-tree-view/TreeItem` or `@mui/x-tree-view`.

---

## 1. SimpleTreeView — Basic Usage

`SimpleTreeView` uses declarative JSX children. Each `TreeItem` has a required `itemId` and `label`.

```tsx
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

function BasicTree() {
  return (
    <SimpleTreeView>
      <TreeItem itemId="documents" label="Documents">
        <TreeItem itemId="resume" label="Resume.pdf" />
        <TreeItem itemId="cover-letter" label="CoverLetter.docx" />
      </TreeItem>
      <TreeItem itemId="photos" label="Photos">
        <TreeItem itemId="vacation" label="Vacation">
          <TreeItem itemId="beach" label="beach.jpg" />
        </TreeItem>
      </TreeItem>
    </SimpleTreeView>
  );
}
```

### Controlled Expansion and Selection

```tsx
import { useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

function ControlledTree() {
  const [expandedItems, setExpandedItems] = useState<string[]>(['documents']);
  const [selectedItems, setSelectedItems] = useState<string | null>('resume');

  return (
    <SimpleTreeView
      expandedItems={expandedItems}
      onExpandedItemsChange={(_event, itemIds) => setExpandedItems(itemIds)}
      selectedItems={selectedItems}
      onSelectedItemsChange={(_event, itemId) => setSelectedItems(itemId)}
    >
      <TreeItem itemId="documents" label="Documents">
        <TreeItem itemId="resume" label="Resume.pdf" />
        <TreeItem itemId="notes" label="Notes.txt" />
      </TreeItem>
      <TreeItem itemId="downloads" label="Downloads">
        <TreeItem itemId="installer" label="installer.exe" />
      </TreeItem>
    </SimpleTreeView>
  );
}
```

---

## 2. RichTreeView — Data-Driven

`RichTreeView` renders from an `items` array. Each item implements `TreeViewBaseItem`.

```tsx
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';

const ITEMS: TreeViewBaseItem[] = [
  {
    id: 'src',
    label: 'src',
    children: [
      {
        id: 'components',
        label: 'components',
        children: [
          { id: 'app', label: 'App.tsx' },
          { id: 'header', label: 'Header.tsx' },
        ],
      },
      { id: 'index', label: 'index.ts' },
    ],
  },
  {
    id: 'config',
    label: 'config',
    children: [
      { id: 'tsconfig', label: 'tsconfig.json' },
      { id: 'package', label: 'package.json' },
    ],
  },
];

function FileExplorer() {
  return (
    <RichTreeView
      items={ITEMS}
      defaultExpandedItems={['src', 'components']}
      sx={{ maxHeight: 400, overflowY: 'auto' }}
    />
  );
}
```

### Custom Item Type with Extra Fields

```tsx
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';

interface FileItem {
  id: string;
  label: string;
  fileType?: 'folder' | 'file';
  size?: number;
  children?: FileItem[];
}

const items: TreeViewBaseItem<FileItem>[] = [
  {
    id: '1',
    label: 'Documents',
    fileType: 'folder',
    children: [
      { id: '2', label: 'Report.pdf', fileType: 'file', size: 2048 },
      { id: '3', label: 'Notes.md', fileType: 'file', size: 512 },
    ],
  },
];

function TypedTree() {
  return <RichTreeView<FileItem> items={items} />;
}
```

---

## 3. Lazy Loading — Async Data Source

Fetch children on demand when a node is expanded. Use the `experimentalFeatures` and `dataSource` props (available in recent MUI X versions).

### Manual Lazy Loading Pattern

```tsx
import { useState, useCallback } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import CircularProgress from '@mui/material/CircularProgress';

interface TreeNode {
  id: string;
  label: string;
  hasChildren: boolean;
}

async function fetchChildren(parentId: string): Promise<TreeNode[]> {
  const res = await fetch(`/api/tree/${parentId}/children`);
  return res.json();
}

function LazyTree() {
  const [nodes, setNodes] = useState<Map<string, TreeNode[]>>(
    new Map([['root', [{ id: '1', label: 'Projects', hasChildren: true }]]])
  );
  const [loading, setLoading] = useState<Set<string>>(new Set());

  const handleExpand = useCallback(
    async (_event: React.SyntheticEvent, itemIds: string[]) => {
      // Find newly expanded items that haven't been loaded
      for (const itemId of itemIds) {
        if (!nodes.has(itemId) && !loading.has(itemId)) {
          setLoading((prev) => new Set(prev).add(itemId));
          const children = await fetchChildren(itemId);
          setNodes((prev) => new Map(prev).set(itemId, children));
          setLoading((prev) => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        }
      }
    },
    [nodes, loading]
  );

  const renderNode = (node: TreeNode) => (
    <TreeItem
      key={node.id}
      itemId={node.id}
      label={
        loading.has(node.id) ? (
          <>{node.label} <CircularProgress size={14} /></>
        ) : (
          node.label
        )
      }
    >
      {node.hasChildren &&
        (nodes.get(node.id) ?? [{ id: `${node.id}-placeholder`, label: '' }] as TreeNode[])
          .map(renderNode)}
    </TreeItem>
  );

  return (
    <SimpleTreeView onExpandedItemsChange={handleExpand}>
      {(nodes.get('root') ?? []).map(renderNode)}
    </SimpleTreeView>
  );
}
```

### RichTreeView with Async Data Source (MUI X v7+)

```tsx
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';

const fetchData = async (parentId: string | null): Promise<TreeViewBaseItem[]> => {
  const res = await fetch(`/api/tree?parent=${parentId ?? 'root'}`);
  return res.json();
};

function AsyncRichTree() {
  return (
    <RichTreeView
      items={[]}
      experimentalFeatures={{ lazyLoading: true }}
      dataSource={{
        getChildrenCount: (item) => item.childrenCount ?? 0,
        getChildren: async (itemId) => fetchData(itemId),
      }}
    />
  );
}
```

---

## 4. Custom Icons

Override expand/collapse/end icons globally via `slots` or per-item via `TreeItem` props.

```tsx
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

function CustomIconTree() {
  return (
    <SimpleTreeView
      slots={{
        expandIcon: ChevronRightIcon,
        collapseIcon: ExpandMoreIcon,
        endIcon: InsertDriveFileIcon,
      }}
    >
      <TreeItem
        itemId="folder1"
        label="Source Code"
        slots={{
          icon: FolderIcon,
          expandIcon: FolderIcon,
          collapseIcon: FolderOpenIcon,
        }}
      >
        <TreeItem itemId="file1" label="index.ts" />
        <TreeItem itemId="file2" label="utils.ts" />
      </TreeItem>
      <TreeItem
        itemId="folder2"
        label="Tests"
        slots={{
          expandIcon: FolderIcon,
          collapseIcon: FolderOpenIcon,
        }}
      >
        <TreeItem itemId="file3" label="index.test.ts" />
      </TreeItem>
    </SimpleTreeView>
  );
}
```

### Per-Item Icons with RichTreeView

```tsx
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeItem, TreeItemProps } from '@mui/x-tree-view/TreeItem';
import { useTreeItemModel } from '@mui/x-tree-view/hooks';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ImageIcon from '@mui/icons-material/Image';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';

interface FileNode {
  id: string;
  label: string;
  fileType: 'folder' | 'document' | 'image';
  children?: FileNode[];
}

const FILE_ICONS: Record<string, React.ElementType> = {
  folder: FolderIcon,
  document: DescriptionIcon,
  image: ImageIcon,
};

const CustomTreeItem = React.forwardRef<HTMLLIElement, TreeItemProps>(
  (props, ref) => {
    const item = useTreeItemModel<FileNode>(props.itemId);
    const IconComponent = FILE_ICONS[item?.fileType ?? 'document'];

    return (
      <TreeItem
        {...props}
        ref={ref}
        slots={{ icon: IconComponent }}
      />
    );
  }
);

const items: TreeViewBaseItem<FileNode>[] = [
  {
    id: '1',
    label: 'Assets',
    fileType: 'folder',
    children: [
      { id: '2', label: 'readme.md', fileType: 'document' },
      { id: '3', label: 'logo.png', fileType: 'image' },
    ],
  },
];

function PerItemIconTree() {
  return (
    <RichTreeView<FileNode>
      items={items}
      slots={{ item: CustomTreeItem }}
    />
  );
}
```

---

## 5. Multiselect with Checkboxes

Enable `multiSelect` and use `checkboxSelection` for a checkbox-based multi-selection model.

```tsx
import { useState } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

function MultiSelectTree() {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  return (
    <>
      <SimpleTreeView
        multiSelect
        checkboxSelection
        selectedItems={selectedItems}
        onSelectedItemsChange={(_event, itemIds) => setSelectedItems(itemIds)}
      >
        <TreeItem itemId="permissions" label="Permissions">
          <TreeItem itemId="read" label="Read" />
          <TreeItem itemId="write" label="Write" />
          <TreeItem itemId="delete" label="Delete" />
        </TreeItem>
        <TreeItem itemId="notifications" label="Notifications">
          <TreeItem itemId="email" label="Email" />
          <TreeItem itemId="sms" label="SMS" />
          <TreeItem itemId="push" label="Push" />
        </TreeItem>
      </SimpleTreeView>
      <p>Selected: {selectedItems.join(', ')}</p>
    </>
  );
}
```

### RichTreeView Multiselect

```tsx
import { useState } from 'react';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';

const FEATURES: TreeViewBaseItem[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    children: [
      { id: 'react', label: 'React' },
      { id: 'vue', label: 'Vue' },
      { id: 'angular', label: 'Angular' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    children: [
      { id: 'node', label: 'Node.js' },
      { id: 'python', label: 'Python' },
    ],
  },
];

function FeatureSelector() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <RichTreeView
      items={FEATURES}
      multiSelect
      checkboxSelection
      selectedItems={selected}
      onSelectedItemsChange={(_event, ids) => setSelected(ids)}
    />
  );
}
```

---

## 6. Item Customization — Custom TreeItem Content

Use `TreeItem2` (or `TreeItem` with `ContentComponent`) for full control over each item's rendered content.

### Custom Label with Metadata

```tsx
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem, TreeItemProps } from '@mui/x-tree-view/TreeItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';

interface CustomLabelProps {
  label: string;
  count?: number;
  onDelete?: () => void;
}

function CustomLabel({ label, count, onDelete }: CustomLabelProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
      <Typography variant="body2" sx={{ flexGrow: 1 }}>
        {label}
      </Typography>
      {count !== undefined && (
        <Chip label={count} size="small" color="primary" variant="outlined" />
      )}
      {onDelete && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation(); // Prevent tree expansion toggle
            onDelete();
          }}
          aria-label={`Delete ${label}`}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

function CustomContentTree() {
  return (
    <SimpleTreeView>
      <TreeItem
        itemId="inbox"
        label={<CustomLabel label="Inbox" count={12} />}
      >
        <TreeItem
          itemId="msg1"
          label={
            <CustomLabel
              label="Welcome message"
              onDelete={() => console.log('delete msg1')}
            />
          }
        />
      </TreeItem>
      <TreeItem
        itemId="sent"
        label={<CustomLabel label="Sent" count={3} />}
      />
    </SimpleTreeView>
  );
}
```

### Custom TreeItem with useTreeItem Hook

```tsx
import React from 'react';
import { unstable_useTreeItem as useTreeItem } from '@mui/x-tree-view/useTreeItem';
import {
  TreeItemContent,
  TreeItemRoot,
  TreeItemGroupTransition,
  TreeItemIconContainer,
  TreeItemLabel,
} from '@mui/x-tree-view/TreeItem';
import { TreeItemProvider } from '@mui/x-tree-view/TreeItemProvider';
import type { TreeItemProps } from '@mui/x-tree-view/TreeItem';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';

interface UserTreeItemProps extends TreeItemProps {
  avatar?: string;
  subtitle?: string;
}

const UserTreeItem = React.forwardRef<HTMLLIElement, UserTreeItemProps>(
  ({ avatar, subtitle, ...props }, ref) => {
    const {
      getRootProps,
      getContentProps,
      getLabelProps,
      getIconContainerProps,
      getGroupTransitionProps,
      status,
    } = useTreeItem({ id: props.itemId, children: props.children, label: props.label, rootRef: ref });

    return (
      <TreeItemProvider itemId={props.itemId}>
        <TreeItemRoot {...getRootProps()}>
          <TreeItemContent {...getContentProps()}>
            <TreeItemIconContainer {...getIconContainerProps()} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {avatar && <Avatar src={avatar} sx={{ width: 24, height: 24 }} />}
              <Box>
                <TreeItemLabel {...getLabelProps()} />
                {subtitle && (
                  <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {subtitle}
                  </Box>
                )}
              </Box>
            </Box>
          </TreeItemContent>
          {props.children && <TreeItemGroupTransition {...getGroupTransitionProps()} />}
        </TreeItemRoot>
      </TreeItemProvider>
    );
  }
);

function UserTree() {
  return (
    <SimpleTreeView>
      <UserTreeItem
        itemId="team"
        label="Engineering Team"
        subtitle="8 members"
      >
        <UserTreeItem
          itemId="user1"
          label="Alice Chen"
          avatar="/avatars/alice.jpg"
          subtitle="Tech Lead"
        />
        <UserTreeItem
          itemId="user2"
          label="Bob Smith"
          avatar="/avatars/bob.jpg"
          subtitle="Senior Engineer"
        />
      </UserTreeItem>
    </SimpleTreeView>
  );
}
```

---

## 7. Drag and Drop (Premium)

Drag-and-drop reordering requires `RichTreeViewPro` from `@mui/x-tree-view-pro` (Premium license).

```tsx
import { RichTreeViewPro } from '@mui/x-tree-view-pro/RichTreeViewPro';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';
import type { TreeViewItemReorderPosition } from '@mui/x-tree-view/models';

const ITEMS: TreeViewBaseItem[] = [
  {
    id: 'chapter1',
    label: 'Chapter 1: Introduction',
    children: [
      { id: 'section1-1', label: '1.1 Overview' },
      { id: 'section1-2', label: '1.2 Getting Started' },
    ],
  },
  {
    id: 'chapter2',
    label: 'Chapter 2: Core Concepts',
    children: [
      { id: 'section2-1', label: '2.1 Architecture' },
      { id: 'section2-2', label: '2.2 Data Flow' },
    ],
  },
  { id: 'chapter3', label: 'Chapter 3: Advanced Topics' },
];

function DragDropTree() {
  const handleItemPositionChange = (params: {
    itemId: string;
    oldPosition: TreeViewItemReorderPosition;
    newPosition: TreeViewItemReorderPosition;
  }) => {
    console.log(
      `Moved "${params.itemId}" from ${params.oldPosition.parentId ?? 'root'} ` +
      `(index ${params.oldPosition.index}) to ${params.newPosition.parentId ?? 'root'} ` +
      `(index ${params.newPosition.index})`
    );
    // Persist the new order to your backend
  };

  return (
    <RichTreeViewPro
      items={ITEMS}
      itemsReordering
      defaultExpandedItems={['chapter1', 'chapter2']}
      onItemPositionChange={handleItemPositionChange}
      sx={{ maxHeight: 400, overflowY: 'auto' }}
    />
  );
}
```

### Restricting Drop Targets

```tsx
import { RichTreeViewPro } from '@mui/x-tree-view-pro/RichTreeViewPro';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';

interface CategoryItem {
  id: string;
  label: string;
  isCategory?: boolean;
  children?: CategoryItem[];
}

const items: TreeViewBaseItem<CategoryItem>[] = [
  {
    id: 'cat1',
    label: 'Fruits',
    isCategory: true,
    children: [
      { id: 'apple', label: 'Apple' },
      { id: 'banana', label: 'Banana' },
    ],
  },
  {
    id: 'cat2',
    label: 'Vegetables',
    isCategory: true,
    children: [
      { id: 'carrot', label: 'Carrot' },
    ],
  },
];

function RestrictedDnDTree() {
  return (
    <RichTreeViewPro<CategoryItem>
      items={items}
      itemsReordering
      isItemReorderable={(item) => !item.isCategory} // Only leaf items can be dragged
      canMoveItemToNewPosition={({ newPosition }) => {
        // Only allow dropping into category containers
        return newPosition.parentId !== null;
      }}
    />
  );
}
```

---

## 8. Virtualization (Premium)

Built-in virtualization for large trees via `RichTreeViewPro`. Renders only visible items for performance.

```tsx
import { RichTreeViewPro } from '@mui/x-tree-view-pro/RichTreeViewPro';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';

// Generate a large tree for demo
function generateLargeTree(depth: number, breadth: number, prefix = ''): TreeViewBaseItem[] {
  if (depth === 0) return [];
  return Array.from({ length: breadth }, (_, i) => ({
    id: `${prefix}${i}`,
    label: `Item ${prefix}${i}`,
    children: generateLargeTree(depth - 1, breadth, `${prefix}${i}-`),
  }));
}

const LARGE_ITEMS = generateLargeTree(4, 20); // 20^4 = 160,000 potential nodes

function VirtualizedTree() {
  return (
    <RichTreeViewPro
      items={LARGE_ITEMS}
      experimentalFeatures={{ virtualization: true }}
      slotProps={{
        virtualScroller: {
          overscanCount: 10, // Extra items rendered above/below viewport
        },
      }}
      sx={{ height: 500, overflowY: 'auto' }}
    />
  );
}
```

---

## 9. API Ref — Programmatic Control

Use `useTreeViewApiRef()` for imperative actions: expand, collapse, select, focus.

```tsx
import { useRef } from 'react';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { useTreeViewApiRef } from '@mui/x-tree-view/hooks';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

const ITEMS: TreeViewBaseItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    children: [
      {
        id: 'profile',
        label: 'Profile',
        children: [
          { id: 'avatar', label: 'Avatar' },
          { id: 'bio', label: 'Bio' },
        ],
      },
      { id: 'security', label: 'Security' },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    children: [
      { id: 'analytics', label: 'Analytics' },
      { id: 'reports', label: 'Reports' },
    ],
  },
];

function ApiRefTree() {
  const apiRef = useTreeViewApiRef();

  const expandAll = () => {
    // Expand all items by ID
    const allIds = ['settings', 'profile', 'dashboard'];
    allIds.forEach((id) => {
      apiRef.current?.setItemExpansion(null, id, true);
    });
  };

  const collapseAll = () => {
    const allIds = ['settings', 'profile', 'dashboard'];
    allIds.forEach((id) => {
      apiRef.current?.setItemExpansion(null, id, false);
    });
  };

  const focusItem = (itemId: string) => {
    apiRef.current?.focusItem(null, itemId);
  };

  const selectItem = (itemId: string) => {
    apiRef.current?.selectItem({ event: {} as React.SyntheticEvent, itemId });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="outlined" onClick={collapseAll}>
          Collapse All
        </Button>
        <Button variant="outlined" onClick={() => focusItem('security')}>
          Focus Security
        </Button>
        <Button variant="outlined" onClick={() => selectItem('analytics')}>
          Select Analytics
        </Button>
      </Stack>
      <RichTreeView items={ITEMS} apiRef={apiRef} />
    </Stack>
  );
}
```

### API Reference Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setItemExpansion` | `(event, itemId, isExpanded) => void` | Expand or collapse a specific item |
| `focusItem` | `(event, itemId) => void` | Set focus to a specific item |
| `selectItem` | `({ event, itemId, keepExistingSelection?, shouldBeSelected? }) => void` | Select/deselect an item |
| `getItem` | `(itemId) => TreeViewBaseItem` | Get the item model by ID |
| `getItemDOMElement` | `(itemId) => HTMLElement \| null` | Get the DOM element for an item |
| `getItemTree` | `() => TreeViewBaseItem[]` | Get the full item tree |
| `getItemOrderedChildrenIds` | `(itemId) => string[]` | Get ordered children IDs |

---

## 10. Disabled Items

Disable individual items. By default, disabled items are not focusable and not selectable.

```tsx
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';

function DisabledItemsTree() {
  return (
    <SimpleTreeView
      // Allow disabled items to receive focus (for accessibility)
      disabledItemsFocusable
    >
      <TreeItem itemId="available" label="Available Features">
        <TreeItem itemId="basic" label="Basic Plan" />
        <TreeItem itemId="pro" label="Pro Plan" />
      </TreeItem>
      <TreeItem itemId="locked" label="Locked Features" disabled>
        <TreeItem itemId="enterprise" label="Enterprise Plan" />
        <TreeItem itemId="custom" label="Custom Integrations" />
      </TreeItem>
    </SimpleTreeView>
  );
}
```

### Disabled with RichTreeView

```tsx
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';

const ITEMS: TreeViewBaseItem[] = [
  {
    id: 'active',
    label: 'Active Modules',
    children: [
      { id: 'auth', label: 'Authentication' },
      { id: 'billing', label: 'Billing' },
    ],
  },
  {
    id: 'deprecated',
    label: 'Deprecated Modules',
    children: [
      { id: 'legacy-auth', label: 'Legacy Auth (v1)' },
    ],
  },
];

function DisabledRichTree() {
  return (
    <RichTreeView
      items={ITEMS}
      isItemDisabled={(item) => item.id === 'deprecated' || item.id === 'legacy-auth'}
      disabledItemsFocusable={false} // default
    />
  );
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disabledItemsFocusable` | `boolean` | `false` | If `true`, disabled items can receive keyboard focus |
| `disabled` (TreeItem) | `boolean` | `false` | Disables the item and all its descendants |
| `isItemDisabled` (RichTreeView) | `(item) => boolean` | — | Callback to determine if an item is disabled |

---

## 11. TypeScript Patterns

### TreeViewBaseItem Interface

```tsx
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';

// Base interface — every item must have id, label, optional children
// interface TreeViewBaseItem<R extends Record<string, unknown> = Record<string, unknown>> {
//   id: string;
//   label: string;
//   children?: TreeViewBaseItem<R>[];
// } & R

// Extend with custom properties
interface ProjectItem {
  id: string;
  label: string;
  status: 'active' | 'archived' | 'draft';
  owner: string;
  children?: ProjectItem[];
}

// Use as generic parameter
const items: TreeViewBaseItem<ProjectItem>[] = [
  {
    id: 'proj1',
    label: 'Website Redesign',
    status: 'active',
    owner: 'alice',
    children: [
      { id: 'task1', label: 'Wireframes', status: 'active', owner: 'bob' },
      { id: 'task2', label: 'Visual Design', status: 'draft', owner: 'carol' },
    ],
  },
];
```

### Typed Event Handlers

```tsx
import type { TreeViewBaseItem } from '@mui/x-tree-view/models';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';

interface NavItem {
  id: string;
  label: string;
  path: string;
  children?: NavItem[];
}

function TypedHandlers() {
  const handleSelect = (
    _event: React.SyntheticEvent,
    itemId: string | null
  ) => {
    if (itemId) {
      console.log('Selected:', itemId);
    }
  };

  const handleExpansion = (
    _event: React.SyntheticEvent,
    itemIds: string[]
  ) => {
    console.log('Expanded items:', itemIds);
  };

  const handleItemClick = (
    _event: React.MouseEvent,
    itemId: string
  ) => {
    console.log('Clicked:', itemId);
  };

  const items: TreeViewBaseItem<NavItem>[] = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      children: [
        { id: 'about', label: 'About', path: '/about' },
        { id: 'contact', label: 'Contact', path: '/contact' },
      ],
    },
  ];

  return (
    <RichTreeView<NavItem>
      items={items}
      onSelectedItemsChange={handleSelect}
      onExpandedItemsChange={handleExpansion}
      onItemClick={handleItemClick}
    />
  );
}
```

### Utility Types

```tsx
// Item ID type alias
type TreeItemId = string;

// Selection model types
type SingleSelectValue = string | null;
type MultiSelectValue = string[];

// Expansion model
type ExpandedItems = string[];

// Slot prop overrides
import type { TreeItemSlots, TreeItemSlotProps } from '@mui/x-tree-view/TreeItem';
```

---

## 12. Tier Availability Summary

| Feature | Community (free) | Pro | Premium |
|---------|:---:|:---:|:---:|
| `SimpleTreeView` | Yes | Yes | Yes |
| `RichTreeView` | Yes | Yes | Yes |
| Expansion/Selection | Yes | Yes | Yes |
| Checkbox selection | Yes | Yes | Yes |
| Custom icons | Yes | Yes | Yes |
| Disabled items | Yes | Yes | Yes |
| `useTreeViewApiRef` | Yes | Yes | Yes |
| Keyboard navigation | Yes | Yes | Yes |
| `RichTreeViewPro` | -- | Yes | Yes |
| Drag-and-drop reorder | -- | -- | Yes |
| Virtualization | -- | -- | Yes |
| Lazy loading (data source) | Yes | Yes | Yes |

### Installation

```bash
# Community (free)
npm install @mui/x-tree-view

# Pro (commercial license)
npm install @mui/x-tree-view-pro

# Always needed as peer dependencies
npm install @mui/material @emotion/react @emotion/styled
```

### License Key Setup (Pro/Premium)

```tsx
import { LicenseInfo } from '@mui/x-license';

LicenseInfo.setLicenseKey('YOUR_LICENSE_KEY');
```

---

## Quick Reference — Common Props

### SimpleTreeView

| Prop | Type | Description |
|------|------|-------------|
| `expandedItems` | `string[]` | Controlled expanded item IDs |
| `defaultExpandedItems` | `string[]` | Uncontrolled default expanded |
| `selectedItems` | `string \| string[] \| null` | Controlled selection |
| `defaultSelectedItems` | `string \| string[] \| null` | Uncontrolled default selection |
| `multiSelect` | `boolean` | Enable multi-selection |
| `checkboxSelection` | `boolean` | Show checkboxes for selection |
| `disabledItemsFocusable` | `boolean` | Allow focus on disabled items |
| `onExpandedItemsChange` | `(event, itemIds) => void` | Expansion change handler |
| `onSelectedItemsChange` | `(event, itemIds) => void` | Selection change handler |
| `onItemClick` | `(event, itemId) => void` | Item click handler |
| `onItemFocus` | `(event, itemId, value) => void` | Item focus handler |
| `onItemExpansionToggle` | `(event, itemId, isExpanded) => void` | Per-item expansion toggle |
| `slots` | `object` | Custom slot components |
| `slotProps` | `object` | Props for slot components |
| `apiRef` | `React.MutableRefObject` | Imperative API reference |

### RichTreeView (extends SimpleTreeView)

| Prop | Type | Description |
|------|------|-------------|
| `items` | `TreeViewBaseItem[]` | Data-driven item array (required) |
| `getItemId` | `(item) => string` | Custom ID accessor (default: `item.id`) |
| `getItemLabel` | `(item) => string` | Custom label accessor (default: `item.label`) |
| `isItemDisabled` | `(item) => boolean` | Per-item disabled callback |
| `experimentalFeatures` | `{ lazyLoading?, virtualization? }` | Enable experimental features |
| `dataSource` | `{ getChildren, getChildrenCount }` | Async data source for lazy loading |

### TreeItem

| Prop | Type | Description |
|------|------|-------------|
| `itemId` | `string` | Unique identifier (required) |
| `label` | `ReactNode` | Content displayed for the item |
| `disabled` | `boolean` | Disable this item and descendants |
| `slots` | `{ icon?, expandIcon?, collapseIcon?, endIcon?, groupTransition? }` | Custom slot components |
| `slotProps` | `object` | Props for slot components |
