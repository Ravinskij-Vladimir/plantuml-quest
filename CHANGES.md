# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-07-15

### Added
- Reset Progress button on home screen with confirmation modal (clears all localStorage data)
- Dedicated Achievements screen (#achievements) with 13 badges organized by category
- Full achievements registry (ACHIEVEMENTS export) with metadata for icons, names, descriptions
- New achievements: First Steps, Puzzle Solver, Diagram Master, Theory Lover, Practitioner, Project Master, No Hints Hero, Speed Runner, Half Way, Triple Star, All Types
- Achievement card styles with unlocked/locked states, category grouping
- Danger button variant (btn-danger) for destructive actions
- Home footer actions section

### Changed
- Expanded checkAchievements() to validate all 13 achievements (was 2)
- showAchievements() toast now uses ACHIEVEMENTS registry for names and icons
- Updated summary.md and changes.md documentation

## [1.0.0] - 2024-XX-XX

### Added
- Initial release of PlantUML Quest
- Three game modes: Puzzle (tiles, reorder, findbug), Code (write, fill, fix, refactor), Describe (guided, free)
- 10 levels covering Sequence, Use Case, Class, State, Activity, Component, Deployment, Object, Timing, Mindmap diagrams
- PlantUML server proxy with SVG rewriting
- Progress tracking with localStorage (stars, completed modes, achievements)
- Dark/light theme with system preference detection
- Full keyboard navigation and accessibility (ARIA, focus trap, live regions)
- FLIP animations for reorder mode
- PlantUML code validation (syntax + semantic comparison)
- Toast notifications and modal dialogs
- Responsive design (mobile breakpoint 768px)