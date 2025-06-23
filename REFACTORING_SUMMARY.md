# Rehearsal Scheduler App - Refactored File Structure

## Overview
This React Native app has been successfully refactored from a single large file into a well-organized multi-file structure for better maintainability and code organization.

## File Structure

```
app/
├── index.js                        # Main entry point (simplified)
├── App.js                          # Main App component
├── components/                     # Reusable UI components
│   ├── ActionButton.js             # Button component
│   ├── Card.js                     # Card display component
│   ├── RehearsalsDisplay.js        # Rehearsals listing component
│   ├── SceneEditModal.js           # Scene editing modal
│   └── TimeslotEditModal.js        # Timeslot editing modal
├── screens/                        # Full-screen components
│   ├── ScenesScreen.js             # Scenes management screen
│   └── TimeslotsScreen.js          # Timeslots management screen
├── styles/                         # Styling
│   └── common.js                   # Common/shared styles
├── types/                          # Type definitions and constants
│   └── index.js                    # Storage keys, default data, global arrays
├── utils/                          # Utility functions
│   ├── actorUtils.js               # Actor-related utility functions
│   └── generalUtils.js             # General utility functions
└── services/                       # Services (storage, etc.)
    └── storage.js                  # AsyncStorage helper functions
```

## Key Refactoring Changes

### 1. **Component Separation**
- **ActionButton**: Extracted reusable button component
- **Card**: Extracted reusable card display component  
- **RehearsalsDisplay**: Separated rehearsal listing functionality
- **SceneEditModal**: Separated scene editing modal
- **TimeslotEditModal**: Separated timeslot editing modal

### 2. **Screen Separation**
- **ScenesScreen**: Full scenes management functionality
- **TimeslotsScreen**: Full timeslots management functionality
- **App**: Main navigation and actors screen

### 3. **Utility Functions**
- **actorUtils.js**: All actor-related functionality using functional programming approach
  - `createActor`, `addAvailableTimeslot`, `removeAvailableTimeslot`
  - `addScene`, `removeScene`, `isAvailable`
  - `getAvailableTimeslots`, `getScenes`, `getActorsAvailableForTimeslot`
  - `getActorsInScene`, `getTimeslotById`, `getSceneById`

### 4. **Type Definitions & Constants**
- **types/index.js**: Centralized storage keys, default data, and global arrays
  - `STORAGE_KEYS`, `DEFAULT_TIMESLOTS`, `DEFAULT_SCENES`, `DEFAULT_ACTORS`
  - `GLOBAL_TIMESLOTS`, `GLOBAL_SCENES` (mutable arrays for runtime changes)

### 5. **Styling**
- **common.js**: Shared styles used across components
  - Modal styles, button styles, card styles, navigation styles

### 6. **Storage Management**
- Direct AsyncStorage usage (no wrapper service) as requested
- Persistent storage for actors, rehearsals, timeslots, and scenes
- Automatic loading and saving with useEffect hooks

## Benefits of Refactoring

1. **Better Maintainability**: Code is organized into logical modules
2. **Reusability**: Components can be easily reused across the app
3. **Separation of Concerns**: Each file has a specific purpose
4. **Easier Testing**: Individual components can be tested in isolation
5. **Improved Readability**: Smaller, focused files are easier to understand
6. **Scalability**: Easy to add new features without touching existing code

## Functional Programming Approach

The app maintains a functional programming approach for actor management:
- Actors are plain objects
- All operations return new objects (immutable)
- Pure functions for all actor manipulations
- No classes or complex inheritance

## Direct AsyncStorage Usage

As requested, the app uses AsyncStorage directly without any wrapper service:
- `AsyncStorage.getItem()` for loading data
- `AsyncStorage.setItem()` for saving data
- Automatic serialization/deserialization of JSON data
- Error handling for storage operations

## Navigation Structure

The app uses a simple tab-based navigation:
- **Actors**: View and manage actors
- **Scenes**: Manage scenes and scene assignments
- **Timeslots**: Manage available time slots
- **Rehearsals**: View and manage scheduled rehearsals

All features from the original single-file app have been preserved while improving the code organization significantly.
