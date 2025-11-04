# Media Accordion WordPress Plugin - AI Coding Instructions

## Project Overview
WordPress Gutenberg block plugin that creates interactive media accordions with autoplay, responsive design, and KeenSlider integration for mobile. Features a parent-child block architecture with `srg/media-accordion` containing multiple `srg/media-accordion-item` blocks.

## Architecture & Key Patterns

### Block Structure
- **Parent Block**: `srg/media-accordion` - Container with autoplay controls and layout options
- **Child Block**: `srg/media-accordion-item` - Individual items with media, title, and duration
- **Namespace**: All blocks use `srg/` prefix, stored in `src/` directory structure

### Build System & WordPress Integration
- Uses `@wordpress/scripts` with `--blocks-manifest` flag for efficient block registration
- Main registration in `media-accordion.php` leverages WordPress 6.8's `wp_register_block_types_from_metadata_collection()` 
- Fallback to 6.7's `wp_register_block_metadata_collection()` and manual registration for older versions
- Build outputs to `build/` directory with auto-generated `blocks-manifest.php`

### Frontend JavaScript Architecture
- **Entry Point**: `src/media-accordion/view.js` initializes accordions on DOM load
- **Main Class**: `MediaAccordion` in `media-accordion.js` handles all interaction logic
- **Modular Design**: Separate files for constants, utils, visibility management, and KeenSlider plugin
- **State Management**: Class properties track animation state, timing, and user interactions

### Responsive Design Pattern
- **Landscape/Desktop**: Traditional accordion with click navigation and autoplay
- **Portrait/Mobile**: Switches to KeenSlider carousel automatically
- **Detection**: Uses `window.matchMedia('(min-aspect-ratio: 1/1)')` for orientation detection
- **Dynamic**: Initializes/destroys slider on orientation change with debounced resize handling

### Performance Optimizations
- **Visibility Management**: Global `AccordionVisibilityManager` uses single IntersectionObserver for all instances
- **Lazy Initialization**: KeenSlider only initialized when needed and visible
- **Animation Control**: Pauses/resumes based on visibility to save resources
- **Template System**: Uses `<template>` tags for media content to avoid DOM manipulation overhead

## Development Workflows

### Build Commands
```bash
npm run start          # Development with watch mode
npm run build          # Production build
npm run plugin-zip     # Create installable .zip
```

### Code Style
- Follows WordPress Coding Standards (see `.editorconfig`)
- Tabs for indentation, spaces for YAML files
- JSDoc comments for all major functions and classes
- CSS custom properties for theming (e.g., `--animation-duration`)

### File Naming Conventions
- Block JSON: `block.json` in each block directory
- JavaScript: kebab-case filenames (`media-accordion.js`)
- CSS: SCSS files mirror JS structure (`style.scss`, `editor.scss`)
- Constants: Exported from dedicated `constants.js` file

## Key Integration Points

### WordPress Block Editor
- Supports WordPress 6.8+ block metadata collection features
- Uses `InnerBlocks` pattern for parent-child relationship
- Custom attributes: `autoplay`, `layout`, `duration`, `mediaId`, etc.

### External Dependencies
- **KeenSlider 6.8.6**: Mobile carousel functionality with custom navigation plugin
- **WordPress Scripts 30.19.0**: Build toolchain and linting

### Animation & Timing System
- CSS-driven animations with JavaScript orchestration
- Duration from CSS custom properties (`--animation-duration`)
- State machine: not-started → in-progress → completed
- Pause/resume with time tracking for seamless user experience

## Critical Developer Notes

### State Management Gotchas
- `wasUserPaused` vs `isPaused` distinction crucial for visibility-based auto-resume
- Animation must be started manually after visibility detection
- Slider initialization requires element visibility check

### Media Handling
- Supports images and videos with autoplay control
- Video playback synced with accordion pause state
- Template-based content switching for performance

### Event System
- Uses event delegation on accordion container
- Separate handling for hover (layout-2) vs click interactions
- Debounced resize/orientation handlers prevent performance issues

When working on this codebase, prioritize understanding the visibility management system and responsive design patterns, as these drive most of the complexity.