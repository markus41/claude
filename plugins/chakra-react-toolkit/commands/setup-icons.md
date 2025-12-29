---
description: Configure icon library (Chakra Icons, React Icons, Lucide, Heroicons)
arguments:
  - name: library
    description: Icon library to setup (chakra|react-icons|lucide|heroicons|all)
    required: false
  - name: tree-shaking
    description: Enable tree-shaking optimization (true|false)
    required: false
---

# Setup Icon Library

Configure and optimize icon libraries for your Chakra UI project.

## Configuration
- **Library**: ${ARGUMENTS.library || 'all'}
- **Tree-shaking**: ${ARGUMENTS['tree-shaking'] || 'true'}

## Instructions

### 1. Chakra Icons Setup

```bash
# Already included with @chakra-ui/react
# No additional installation needed
```

```typescript
import {
  AddIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  DeleteIcon,
  SearchIcon,
  SettingsIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowForwardIcon,
  ArrowBackIcon,
  ExternalLinkIcon,
  InfoIcon,
  WarningIcon,
  QuestionIcon,
  StarIcon,
  EmailIcon,
  PhoneIcon,
  CalendarIcon,
  TimeIcon,
  AttachmentIcon,
  LinkIcon,
  ViewIcon,
  ViewOffIcon,
  LockIcon,
  UnlockIcon,
  CopyIcon,
  DownloadIcon,
  RepeatIcon,
  SpinnerIcon
} from '@chakra-ui/icons';

// Usage
<IconButton aria-label="Add item" icon={<AddIcon />} />
```

### 2. React Icons Setup

```bash
npm install react-icons
# or
pnpm add react-icons
```

```typescript
// Import from specific icon packs for tree-shaking
import { FaUser, FaHeart, FaCog } from 'react-icons/fa';  // Font Awesome
import { MdHome, MdSettings } from 'react-icons/md';       // Material Design
import { BiSearch, BiMenu } from 'react-icons/bi';         // BoxIcons
import { AiOutlineUser } from 'react-icons/ai';            // Ant Design
import { IoClose, IoMenu } from 'react-icons/io5';         // Ionicons 5
import { BsGithub, BsTwitter } from 'react-icons/bs';      // Bootstrap

// Create Chakra-compatible Icon component
import { Icon } from '@chakra-ui/react';

<Icon as={FaUser} w={6} h={6} color="blue.500" />
```

### 3. Lucide Icons Setup

```bash
npm install lucide-react
# or
pnpm add lucide-react
```

```typescript
import {
  Home,
  User,
  Settings,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  Star,
  Heart,
  Share,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Mail,
  Phone,
  Calendar,
  Clock,
  MapPin,
  Globe,
  Link,
  ExternalLink
} from 'lucide-react';

// Create Chakra-compatible wrapper
import { Icon, IconProps } from '@chakra-ui/react';
import { LucideIcon } from 'lucide-react';

interface LucideIconProps extends IconProps {
  icon: LucideIcon;
}

const LucideChakraIcon = ({ icon: LucideIconComponent, ...props }: LucideIconProps) => (
  <Icon as={LucideIconComponent} {...props} />
);

// Usage
<LucideChakraIcon icon={Home} w={6} h={6} color="blue.500" />
```

### 4. Heroicons Setup

```bash
npm install @heroicons/react
# or
pnpm add @heroicons/react
```

```typescript
// Outline icons (24x24)
import {
  HomeIcon,
  UserIcon,
  CogIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Solid icons (24x24)
import {
  HomeIcon as HomeIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid';

// Mini icons (20x20)
import {
  HomeIcon as HomeIconMini
} from '@heroicons/react/20/solid';

// Create Chakra-compatible wrapper
import { Icon } from '@chakra-ui/react';

<Icon as={HomeIcon} w={6} h={6} color="blue.500" />
```

### 5. Icon Utility Component

Create a unified icon component that supports all libraries:

```typescript
// src/components/AppIcon.tsx
import { Icon, IconProps } from '@chakra-ui/react';
import { ComponentType } from 'react';

export type IconLibrary = 'chakra' | 'lucide' | 'heroicons' | 'react-icons';

export interface AppIconProps extends IconProps {
  icon: ComponentType<any>;
  library?: IconLibrary;
}

export const AppIcon = ({ icon, library = 'lucide', ...props }: AppIconProps) => {
  return <Icon as={icon} {...props} />;
};

// Usage
import { Home } from 'lucide-react';
<AppIcon icon={Home} w={5} h={5} color="gray.600" />
```

### 6. Icon Button Patterns

```typescript
import { IconButton, IconButtonProps } from '@chakra-ui/react';

interface ActionIconButtonProps extends Omit<IconButtonProps, 'icon'> {
  icon: ComponentType<any>;
}

export const ActionIconButton = ({ icon: IconComponent, ...props }: ActionIconButtonProps) => (
  <IconButton
    icon={<Icon as={IconComponent} />}
    variant="ghost"
    size="sm"
    {...props}
  />
);

// Usage
<ActionIconButton
  icon={Settings}
  aria-label="Open settings"
  onClick={handleSettings}
/>
```

### 7. Tree-Shaking Best Practices

```typescript
// ✅ GOOD - Import specific icons
import { Home, User, Settings } from 'lucide-react';

// ❌ BAD - Import entire library
import * as Icons from 'lucide-react';

// ✅ GOOD - Create icon barrel file for commonly used icons
// src/components/icons/index.ts
export { Home, User, Settings, Search, Menu, X } from 'lucide-react';
export { AddIcon, CloseIcon, CheckIcon } from '@chakra-ui/icons';
```

### 8. Icon Registry Pattern

```typescript
// src/utils/iconRegistry.ts
import { Home, User, Settings, Search, Bell, Mail } from 'lucide-react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons';

export const iconRegistry = {
  home: Home,
  user: User,
  settings: Settings,
  search: Search,
  notifications: Bell,
  mail: Mail,
  add: AddIcon,
  close: CloseIcon,
} as const;

export type IconName = keyof typeof iconRegistry;

// Dynamic icon component
interface DynamicIconProps extends IconProps {
  name: IconName;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  const IconComponent = iconRegistry[name];
  return <Icon as={IconComponent} {...props} />;
};

// Usage
<DynamicIcon name="home" w={5} h={5} />
```

## Output Files

```
src/
├── components/
│   ├── icons/
│   │   ├── index.ts          # Icon barrel exports
│   │   ├── AppIcon.tsx       # Unified icon component
│   │   └── IconRegistry.ts   # Icon name mapping
│   └── ui/
│       └── IconButton.tsx    # Icon button variants
└── types/
    └── icons.d.ts            # Icon type definitions
```

## Accessibility Notes

1. Always provide `aria-label` for icon-only buttons
2. Use semantic color names for icon colors
3. Ensure sufficient contrast for icons
4. Provide text alternatives where needed
