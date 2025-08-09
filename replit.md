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