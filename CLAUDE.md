# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Constellation Analyzer is a React-based visual editor for creating and analyzing Constellation Analyses. A Constellation Analysis examines actors (nodes) and their relationships (edges) to each other, resulting in an interactive graph visualization.

## Core Concepts

### Actors (Nodes)
- Represent entities in the analysis
- Support multiple configurable node types
- Each node type can have distinct visual properties and behaviors

### Relations (Edges)
- Connect actors to show relationships
- Support multiple definable edge types
- Edge types can represent different relationship categories

### Graph Editor
- Interactive visual canvas for creating and editing constellation graphs
- Drag-and-drop interface for node manipulation
- Visual edge creation between nodes
- Real-time graph updates

## Project Status

This is a new project. The codebase structure needs to be established including:
- React application scaffolding
- Graph visualization library integration
- State management setup
- Component architecture
- Data model definitions

## Architecture Decisions Needed

When implementing this project, consider:

1. **Graph Visualization Library**: Choose between React Flow, vis.js, Cytoscape.js, or similar
2. **State Management**: Redux, Zustand, Jotai, or React Context
3. **Build Tool**: Vite, Create React App, or Next.js
4. **Styling**: CSS Modules, Styled Components, Tailwind CSS, or plain CSS
5. **TypeScript**: Strongly recommended for type-safe node/edge definitions
6. **Data Persistence**: Local storage, backend API, or file export/import

## Development Workflow

Since this is a new project, the initial setup should include:
- Initialize React application with chosen build tool
- Install graph visualization dependencies
- Set up project structure (components, hooks, utils, types)
- Configure linting and formatting tools
- Establish data models for nodes, edges, and graph state
- build: npm run build; lint: npm run lint