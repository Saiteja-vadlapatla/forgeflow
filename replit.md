# Aether MES - Manufacturing Execution System

## Overview

Aether MES is a comprehensive Manufacturing Execution System specifically designed for mechanical manufacturing operations including CNC Lathes, Milling, Conventional Turning, Grinding, Wire Cut, Drilling, and Tapping. The system provides real-time production monitoring, detailed work order management, advanced quality control, and manufacturing analytics. Built with modern web technologies, it features detailed data entry forms, comprehensive quality inspection workflows, and real-time machine operation controls tailored for precision manufacturing environments.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for fast development and hot reloading
- **UI Framework**: shadcn/ui components built on Radix UI primitives for professional, accessible interface components
- **Styling**: Tailwind CSS with custom design tokens for consistent theming across the application
- **State Management**: TanStack Query for server state management and caching
- **Real-time Communication**: WebSocket connection for live data updates from manufacturing equipment
- **Routing**: Wouter for lightweight client-side routing
- **Charts**: Recharts for data visualization including OEE trends and production analytics

### Backend Architecture
- **Runtime**: Node.js with Express server for RESTful API endpoints
- **Language**: TypeScript for type safety across the full stack
- **Real-time**: WebSocket server for broadcasting live manufacturing data to connected clients
- **Data Validation**: Zod schemas for runtime type checking and validation
- **API Design**: RESTful endpoints following standard HTTP conventions with JSON responses

### Database Layer
- **ORM**: Drizzle ORM for type-safe database operations and migrations
- **Database**: PostgreSQL for relational data storage (configured but not yet implemented)
- **Schema Design**: Comprehensive manufacturing data models including users, machines, work orders, quality records, inventory items, downtime events, production logs, and alerts
- **Migration System**: Drizzle Kit for database schema migrations and version control

### Manufacturing Operations
- **Machine Operations Center**: Real-time control and monitoring of CNC, conventional, and specialty machines with detailed specifications
- **Work Order Management**: Comprehensive work order creation with material specifications, tooling requirements, and setup instructions
- **Quality Control System**: Detailed inspection forms with dimensional measurements, quality parameters, and corrective action workflows
- **Manufacturing Data Entry**: Specialized forms for mechanical manufacturing with material grades, tolerances, and machining parameters

### Real-time Data Processing
- **WebSocket Implementation**: Custom WebSocket server handling multiple client connections for live dashboard updates
- **Data Broadcasting**: Automatic broadcasting of real-time manufacturing metrics including machine status, OEE data, and production rates
- **Connection Management**: Robust client connection handling with automatic reconnection capabilities

### Development Environment
- **Build System**: Vite for fast development builds and hot module replacement
- **Development Tools**: Replit integration with custom development server setup
- **Type Checking**: Comprehensive TypeScript configuration covering client, server, and shared code

## External Dependencies

### Core Technology Stack
- **@neondatabase/serverless**: Serverless PostgreSQL database driver for cloud deployment
- **drizzle-orm**: Type-safe ORM for database operations and schema management
- **express**: Web application framework for REST API endpoints
- **ws**: WebSocket library for real-time communication

### Frontend Libraries
- **@radix-ui/***: Comprehensive set of accessible UI primitives for building professional interfaces
- **@tanstack/react-query**: Powerful data synchronization library for server state management
- **recharts**: Declarative charting library for manufacturing analytics and data visualization
- **wouter**: Lightweight routing library for single-page application navigation
- **tailwindcss**: Utility-first CSS framework for rapid UI development

### Development Tools
- **@vitejs/plugin-react**: React integration for Vite build system
- **@replit/vite-plugin-runtime-error-modal**: Development error handling for Replit environment
- **tsx**: TypeScript execution engine for development server
- **esbuild**: Fast JavaScript bundler for production builds

### UI Component System
- **shadcn/ui**: Pre-built component library providing enterprise-grade UI components
- **class-variance-authority**: Utility for creating variant-based component APIs
- **tailwind-merge**: Utility for merging Tailwind CSS classes intelligently

### Form and Validation
- **react-hook-form**: Performant forms library with minimal re-renders
- **@hookform/resolvers**: Validation resolver for integration with schema validation libraries
- **zod**: TypeScript-first schema validation library for runtime type checking

### Date and Time
- **date-fns**: Modern JavaScript date utility library for formatting and manipulation

### Session Management
- **connect-pg-simple**: PostgreSQL session store for Express sessions (configured for future authentication implementation)

## Recent Updates (January 2024)

### Manufacturing Modules Enhancement
- **Work Order Management Page**: Complete work order lifecycle management with detailed part information, material specifications, tooling requirements, and setup instructions
- **Machine Operations Center**: Real-time machine control interface with status management, capability tracking, and maintenance monitoring
- **Quality Control Center**: Comprehensive quality inspection system with dimensional measurements, quality parameters, and defect tracking
- **Enhanced Data Models**: Extended schemas for machines, work orders, and quality records with manufacturing-specific fields
- **Manufacturing Templates**: Pre-configured operation templates for turning, milling, and grinding operations

### User Interface Improvements  
- **Navigation Enhancement**: Dynamic navigation with active state management and proper routing
- **Form Validation**: Advanced form validation with Zod schemas and error handling
- **Real-time Updates**: WebSocket integration for live data updates across all modules
- **Responsive Design**: Mobile-friendly layouts with comprehensive data entry capabilities

### Data Entry Focus
- **Detailed Forms**: Comprehensive forms for work orders with material grades, tolerances, and machining parameters
- **Quality Inspection**: Advanced measurement entry with tolerance checking and automatic pass/fail determination
- **Machine Specifications**: Detailed machine capability tracking with spindle speeds, feed rates, and work envelopes
- **Manufacturing Standards**: Integration of common tolerances, material properties, and operation templates

## Recent Updates (October 2024)

### Inventory Management System Redesign
- **Table-Based UI Transformation**: Migrated all five inventory categories from card grids to professional data tables
  - Searchable, sortable, and paginated tables for Raw Materials, Tools, Consumables, Fasteners, and General Items
  - Row-level action buttons (View, Edit, Delete) for efficient inventory management
  - Customizable column visibility and data density controls
  
- **Edit Functionality Implementation** ✅
  - Full edit dialogs for all five inventory types (Raw Materials, Tools, Consumables, Fasteners, General Items)
  - Edit state management and handlers integrated in InventoryTable component
  - Raw Materials and Tools use separate dedicated Edit components (RawMaterialEdit, ToolEdit)
  - Consumables, Fasteners, and General Items use combined Add/Edit forms with isEditing flag
  - Form validation and cache invalidation working correctly

- **Stock Adjustment System** ✅
  - Created reusable StockAdjustment component for all inventory types
  - Three operations supported:
    - **Add**: Increase stock quantity
    - **Remove**: Decrease stock quantity  
    - **Set**: Set exact stock level (allows zero for scrapping/depleting inventory)
  - Includes reason selection (Purchase, Production, Adjustment, Return, Scrap, Transfer, Audit)
  - Optional notes field for documentation
  - Proper validation: allows zero only for 'set' operation, requires positive numbers for add/remove
  - Successfully integrated across all 5 inventory types:
    - All detail modals (RawMaterialDetails, ToolDetails, ConsumableDetails, FastenerDetails, GeneralItemDetails)
    - All edit modals/forms (RawMaterialEdit, ToolEdit, ConsumableForm, FastenerForm, GeneralItemForm)
  - Query cache invalidation ensures table refreshes after stock updates

### Completed Tasks (October 21, 2024)

#### Phase 1: Table UI and Initial Stock Adjustment
1. ✅ Redesigned all five inventory categories with modern data table UI
2. ✅ Implemented searchable, sortable, paginated tables with row-level actions
3. ✅ Created edit dialogs for Consumables, Fasteners, and General Items
4. ✅ Wired up edit handlers in InventoryTable component  
5. ✅ Built reusable StockAdjustment component with Add/Remove/Set operations
6. ✅ Integrated stock adjustment UI in RawMaterialDetails modal
7. ✅ Fixed critical validation bug to allow zero stock levels when using 'set' operation
8. ✅ Architect review confirmed proper implementation of edit dialogs and stock adjustment

#### Phase 2: Complete Stock Adjustment Integration (Completed October 21, 2024)
9. ✅ Integrated StockAdjustment component into all 5 detail modals:
   - ✅ RawMaterialDetails
   - ✅ ToolDetails
   - ✅ ConsumableDetails
   - ✅ FastenerDetails
   - ✅ GeneralItemDetails
10. ✅ Integrated StockAdjustment component into all 5 edit modals/forms:
    - ✅ RawMaterialEdit (conditional rendering when editing)
    - ✅ ToolEdit (conditional rendering when editing)
    - ✅ ConsumableForm (conditional rendering when isEditing flag is true)
    - ✅ FastenerForm (conditional rendering when isEditing flag is true)
    - ✅ GeneralItemForm (conditional rendering when isEditing flag is true)
11. ✅ Created proper ToolEdit component from scratch with correct schema and API wiring
12. ✅ Added missing insertToolSchema to shared/schema.ts for Tools table
13. ✅ Fixed critical GeneralItemForm bugs preventing form submission:
    - ✅ Fixed SKU type assertion on create (added type cast)
    - ✅ Corrected itemType from "general" to "general-items" in StockAdjustment
    - ✅ Fixed null-safe select values for subCategory and condition fields
    - ✅ Removed invalid form prop from ScrollableDialogFooter
    - ✅ Added dynamic submit button text based on isEditing state
14. ✅ Comprehensive architect review passed with zero critical findings
15. ✅ All LSP errors resolved across all inventory components

### All Inventory Tasks Complete ✅
All planned inventory management features have been successfully implemented:
- ✅ All 5 inventory types have full CRUD operations (Create, Read, Update, Delete)
- ✅ Stock adjustment functionality available in all detail modals (10 adjustments total: 5 detail + 5 edit)
- ✅ Proper component patterns maintained (combined vs separate Add/Edit forms)
- ✅ Type safety ensured with Zod schemas and TypeScript
- ✅ Query cache invalidation working correctly for all mutations
- ✅ All forms validated and tested by architect review

### Architecture Notes
- **Component Patterns**: 
  - **Combined Add/Edit Forms**: Consumables, Fasteners, and General Items use a single form component with `isEditing` flag
    - StockAdjustment is conditionally rendered only when `isEditing === true`
    - SKU is auto-generated on creation, not editable
    - Form submit button text dynamically updates based on mode
  - **Separate Add/Edit Components**: Raw Materials and Tools use dedicated Add and Edit components
    - Edit components (RawMaterialEdit, ToolEdit) include StockAdjustment at the top
    - Add components do not include StockAdjustment
  - **StockAdjustment Component**: Standalone reusable component embedded in:
    - All 5 detail modals (top of modal, always visible when viewing item)
    - All 5 edit modals/forms (top of form, only visible when editing)
    - Takes props: itemId, itemType, currentStock, itemName
    - Supports 3 operations: add, remove, set (with proper validation)
- **Data Flow**: 
  - All mutations use TanStack Query with proper cache invalidation
  - Cache keys follow hierarchical pattern: `['/api/inventory/{type}', id]`
  - Stock adjustments invalidate both list and detail caches
  - Form submissions trigger toast notifications for success/error states
- **Validation**: 
  - Zod schemas ensure data integrity at both client and server
  - Special handling for stock adjustment operations (allow zero only for 'set')
  - Insert schemas properly defined for all inventory types including Tools (insertToolSchema)
  - Type-safe form data with null/undefined handling for optional fields
- **API Endpoints**:
  - Standard REST pattern for all 5 inventory types
  - itemType slugs: "materials", "tools", "consumables", "fasteners", "general-items"
  - Stock adjustment endpoint: POST `/api/inventory/{type}/:id/adjust-stock`