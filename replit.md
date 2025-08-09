# Aether MES - Manufacturing Execution System

## Overview

Aether MES is an enterprise-grade Manufacturing Execution System designed for real-time production monitoring and control. The system provides comprehensive dashboards for tracking machine status, work orders, quality metrics, and overall equipment effectiveness (OEE) in manufacturing environments. Built with modern web technologies, it features a responsive React frontend with real-time data visualization and a robust backend API for handling manufacturing data operations.

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