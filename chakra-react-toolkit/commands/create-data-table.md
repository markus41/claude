---
name: create-data-table
description: Generate sortable, paginated data tables with Chakra UI Table components
argument-hint: "[table-name] [data-type]"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# Instructions for Claude

When this command is invoked, create a feature-rich data table component:

1. Parse table name and data type from arguments
2. Generate TypeScript interfaces for data rows and columns
3. Create table component with sorting functionality
4. Add pagination controls
5. Include filtering/search capabilities
6. Implement loading and empty states
7. Support row selection and actions

## Data Table Template

```typescript
import { useState, useMemo } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Box,
  Button,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Checkbox,
  IconButton,
  Flex,
  Skeleton,
  Badge,
} from '@chakra-ui/react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@chakra-ui/icons';

export interface {TableName}Row {
  id: string | number;
  // Add data fields here
  name: string;
  status: string;
  date: string;
}

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

export interface {TableName}Props {
  data: {TableName}Row[];
  columns: Column<{TableName}Row>[];
  isLoading?: boolean;
  pageSize?: number;
  searchable?: boolean;
  selectable?: boolean;
  onRowClick?: (row: {TableName}Row) => void;
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
}

type SortDirection = 'asc' | 'desc' | null;

export const {TableName} = ({
  data,
  columns,
  isLoading = false,
  pageSize = 10,
  searchable = true,
  selectable = false,
  onRowClick,
  onSelectionChange,
}: {TableName}Props) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof {TableName}Row | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());

  // Search filter
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  // Sorting
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: keyof {TableName}Row) => {
    if (sortKey === key) {
      setSortDirection((prev) =>
        prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
      );
      if (sortDirection === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedData.map((row) => row.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string | number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      onSelectionChange?.(Array.from(newSet));
      return newSet;
    });
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row) => selectedIds.has(row.id));

  return (
    <Box>
      {searchable && (
        <HStack mb={4} spacing={4}>
          <InputGroup maxW="md">
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </InputGroup>
          <Select maxW="150px" value={pageSize} isDisabled>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </Select>
        </HStack>
      )}

      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              {selectable && (
                <Th width="50px">
                  <Checkbox
                    isChecked={isAllSelected}
                    onChange={handleSelectAll}
                    isDisabled={isLoading}
                  />
                </Th>
              )}
              {columns.map((column) => (
                <Th
                  key={String(column.key)}
                  width={column.width}
                  cursor={column.sortable ? 'pointer' : 'default'}
                  onClick={() => column.sortable && handleSort(column.key)}
                  _hover={column.sortable ? { bg: 'gray.50' } : undefined}
                >
                  <Flex align="center" gap={2}>
                    {column.label}
                    {column.sortable && sortKey === column.key && (
                      <Box>
                        {sortDirection === 'asc' ? (
                          <ChevronUpIcon />
                        ) : (
                          <ChevronDownIcon />
                        )}
                      </Box>
                    )}
                  </Flex>
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              Array.from({ length: pageSize }).map((_, idx) => (
                <Tr key={idx}>
                  {selectable && (
                    <Td>
                      <Skeleton height="20px" width="20px" />
                    </Td>
                  )}
                  {columns.map((col) => (
                    <Td key={String(col.key)}>
                      <Skeleton height="20px" />
                    </Td>
                  ))}
                </Tr>
              ))
            ) : paginatedData.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length + (selectable ? 1 : 0)} textAlign="center">
                  <Text color="gray.500" py={8}>
                    No data found
                  </Text>
                </Td>
              </Tr>
            ) : (
              paginatedData.map((row) => (
                <Tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  cursor={onRowClick ? 'pointer' : 'default'}
                  _hover={onRowClick ? { bg: 'gray.50' } : undefined}
                >
                  {selectable && (
                    <Td onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        isChecked={selectedIds.has(row.id)}
                        onChange={() => handleSelectRow(row.id)}
                      />
                    </Td>
                  )}
                  {columns.map((column) => (
                    <Td key={String(column.key)}>
                      {column.render
                        ? column.render(row[column.key], row)
                        : String(row[column.key])}
                    </Td>
                  ))}
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>

      {totalPages > 1 && (
        <Flex justify="space-between" align="center" mt={4}>
          <Text fontSize="sm" color="gray.600">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
            {sortedData.length} results
          </Text>
          <HStack spacing={2}>
            <IconButton
              aria-label="Previous page"
              icon={<ChevronLeftIcon />}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              isDisabled={currentPage === 1 || isLoading}
              size="sm"
            />
            <Text fontSize="sm">
              Page {currentPage} of {totalPages}
            </Text>
            <IconButton
              aria-label="Next page"
              icon={<ChevronRightIcon />}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              isDisabled={currentPage === totalPages || isLoading}
              size="sm"
            />
          </HStack>
        </Flex>
      )}
    </Box>
  );
};
```

## Custom Cell Renderers

```typescript
// Example column definitions with custom renderers
const columns: Column<{TableName}Row>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value) => (
      <Badge colorScheme={value === 'active' ? 'green' : 'red'}>
        {value}
      </Badge>
    ),
  },
  {
    key: 'date',
    label: 'Date',
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString(),
  },
];
```

## Features Included

1. Column-based sorting (ascending/descending/none)
2. Global search/filter across all fields
3. Client-side pagination with page size options
4. Row selection with select all
5. Loading skeleton states
6. Empty state handling
7. Custom cell renderers
8. Clickable rows
9. Responsive table container
10. Selection change callbacks

## Best Practices

1. Use TableContainer for horizontal scroll on mobile
2. Provide loading skeletons matching data structure
3. Show helpful empty states
4. Make column headers clickable for sorting
5. Indicate sort direction with icons
6. Support custom renderers for complex data (badges, links, actions)
7. Implement search with debounce for large datasets
8. Use virtualization for very large datasets
9. Provide pagination controls for better UX
10. Export selection state to parent component
11. Use memoization for expensive operations
12. Add hover states for interactive rows
