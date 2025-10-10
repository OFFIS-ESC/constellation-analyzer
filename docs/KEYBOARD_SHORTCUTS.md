# Keyboard Shortcuts System

## Overview

Constellation Analyzer now features a centralized keyboard shortcut management system that prevents conflicts, provides priority-based handling, and offers built-in documentation through a help modal.

## Architecture

### Core Components

1. **useKeyboardShortcutManager** (`src/hooks/useKeyboardShortcutManager.ts`)
   - Core hook that manages shortcut registration and event handling
   - Provides conflict detection
   - Supports priority-based execution
   - Platform-aware (Mac vs Windows/Linux)

2. **KeyboardShortcutContext** (`src/contexts/KeyboardShortcutContext.tsx`)
   - React context provider making the shortcut manager available throughout the app
   - Ensures single global event listener for all shortcuts

3. **useGlobalShortcuts** (`src/hooks/useGlobalShortcuts.ts`)
   - Centralized registration of all application-wide shortcuts
   - Single source of truth for what shortcuts exist

4. **KeyboardShortcutsHelp** (`src/components/Common/KeyboardShortcutsHelp.tsx`)
   - Modal component displaying all available shortcuts
   - Automatically generated from registered shortcuts
   - Grouped by category

## Available Shortcuts

### Document Management
- **Ctrl+N** - New Document
- **Ctrl+O** - Open Document Manager
- **Ctrl+S** - Export Document
- **Ctrl+W** - Close Current Document

### Graph Editing
- **Ctrl+Z** - Undo
- **Ctrl+Y** or **Ctrl+Shift+Z** - Redo
- **Delete** or **Backspace** - Delete selected nodes/edges (handled by React Flow)

### Selection
- **Ctrl+A** - Select All (placeholder for future implementation)
- **Escape** - Deselect All (handled by React Flow)

### View
- **F** - Fit View to Content

### Navigation
- **Ctrl+Tab** - Next Document
- **Ctrl+Shift+Tab** - Previous Document
- **?** - Show Keyboard Shortcuts Help

## Implementation Details

### Shortcut Definition

Shortcuts are defined using the `KeyboardShortcut` interface:

```typescript
interface KeyboardShortcut {
  id: string;              // Unique identifier
  description: string;     // Shown in help UI
  key: string;            // Key to press
  ctrl?: boolean;         // Requires Ctrl/Cmd modifier
  shift?: boolean;        // Requires Shift modifier
  alt?: boolean;          // Requires Alt/Option modifier
  handler: () => void;    // Function to execute
  priority?: number;      // Higher = executed first (default: 0)
  category: ShortcutCategory;  // For grouping in help
  enabled?: boolean;      // Can be disabled (default: true)
}
```

### Platform Detection

The system automatically detects the platform:
- **Mac**: Uses `Cmd` key (metaKey)
- **Windows/Linux**: Uses `Ctrl` key (ctrlKey)

Display strings adapt accordingly:
- Mac: "Cmd+N"
- Windows/Linux: "Ctrl+N"

### Conflict Detection

When registering a shortcut, the system checks for conflicts:
- Same key combination
- Same modifiers
- Different ID

Conflicts are logged to console as warnings but don't prevent registration.

### Priority Handling

If multiple shortcuts match the same key combination:
1. Sort by priority (higher number = higher priority)
2. Execute only the highest priority handler
3. Default priority is 0

Example: Ctrl+Shift+Z has lower priority than Ctrl+Y for redo, so Ctrl+Y is preferred.

## Adding New Shortcuts

### Global Shortcuts

Add to `src/hooks/useGlobalShortcuts.ts`:

```typescript
const shortcutDefinitions: KeyboardShortcut[] = [
  // ... existing shortcuts
  {
    id: 'my-new-shortcut',
    description: 'Do Something',
    key: 'k',
    ctrl: true,
    handler: () => doSomething(),
    category: 'Graph Editing',
  },
];
```

### Component-Specific Shortcuts

Use the context in any component:

```typescript
import { useKeyboardShortcuts } from '../contexts/KeyboardShortcutContext';

function MyComponent() {
  const { shortcuts } = useKeyboardShortcuts();

  useEffect(() => {
    shortcuts.register({
      id: 'component-specific',
      description: 'Component Action',
      key: 'x',
      ctrl: true,
      handler: () => handleAction(),
      category: 'Graph Editing',
    });

    return () => shortcuts.unregister('component-specific');
  }, [shortcuts]);
}
```

### Adding Menu Items

When adding a new shortcut that should appear in the menu, update `MenuBar.tsx`:

```tsx
<button
  onClick={() => {
    myAction();
    closeMenu();
  }}
  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
>
  <span>My Action</span>
  <span className="text-xs text-gray-400">Ctrl+K</span>
</button>
```

## Design Decisions

### Why Not Use `?` as a Regular Character

The `?` key doesn't require Shift in the shortcut definition because:
- It's simpler for users to press just `?`
- Consistent with industry standards (VS Code, GitHub, etc.)
- The key value is already `?` when Shift is pressed

### Why Centralized vs Distributed

**Advantages of centralized system:**
- Single source of truth for all shortcuts
- Conflict detection
- Automatic help documentation
- Easier to maintain and audit
- Priority-based resolution

**Disadvantages:**
- Slightly more complex initial setup
- All shortcuts must be registered centrally or cleanup properly

### Why Context vs Global Singleton

Using React Context provides:
- Better integration with React lifecycle
- Automatic cleanup
- Testability
- Type safety

## Migration from Old System

The old `useKeyboardShortcuts` hook has been replaced with `useGlobalShortcuts`. The migration involved:

1. **Before**: Event listeners scattered across components
2. **After**: Centralized registration with automatic documentation

The old hook has been preserved for reference but should not be used for new shortcuts.

## Future Enhancements

### Possible Additions

1. **User-Configurable Shortcuts**
   - Allow users to customize key bindings
   - Store in localStorage
   - UI for rebinding

2. **Shortcut Contexts**
   - Different shortcuts active in different app modes
   - Disable/enable groups of shortcuts

3. **Chord Shortcuts**
   - Multi-key sequences (e.g., "Ctrl+K, Ctrl+S")
   - Inspired by VS Code

4. **Shortcut Recording**
   - Let users record custom shortcuts
   - Visual feedback during recording

5. **Platform-Specific Overrides**
   - Different shortcuts for Mac vs Windows
   - Better ergonomics per platform

### Excluded from Current Implementation

**Node Type Creation Shortcuts** (e.g., P for Person, O for Organization)
- **Reason**: User-configurable node types make fixed shortcuts inappropriate
- **Alternative**: Context menu (right-click) or toolbar remain the recommended methods
- Users can have custom types like "Department", "Resource", etc., so hardcoded letters wouldn't make sense

## Testing

To test the keyboard shortcut system:

1. **Build the application**: `npm run build`
2. **Start the dev server**: `npm run dev`
3. **Test shortcuts**:
   - Press `?` to see all available shortcuts
   - Try Ctrl+N for new document
   - Try Ctrl+Z/Ctrl+Y for undo/redo
   - Try F to fit view
4. **Check conflict detection**:
   - Look at browser console during startup
   - Verify no conflict warnings appear

## Troubleshooting

### Shortcut Not Working

1. Check browser console for conflict warnings
2. Verify shortcut is registered in `useGlobalShortcuts`
3. Check if handler is properly passed (not undefined)
4. Verify `enabled` is not set to false
5. Check if another shortcut has higher priority

### Shortcut Not Appearing in Help

1. Verify `enabled` is not set to false
2. Check the category is correct
3. Ensure shortcut is registered before help modal opens

### Conflicts

If you see conflict warnings:
1. Change one of the conflicting shortcuts
2. Or use priority to determine which should win
3. Or disable one of the shortcuts conditionally

## References

- UX Analysis: `UX_ANALYSIS.md` (lines 58-104)
- Implementation docs: Inline comments in source files
- React Flow keyboard handling: https://reactflow.dev/learn/advanced-use/accessibility
