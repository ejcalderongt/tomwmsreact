# TomWMS - Warehouse Management System

## Overview

TomWMS is a comprehensive warehouse management system built with a modern full-stack architecture. The application provides inventory management, order processing, location tracking, and reporting capabilities for warehouse operations. It features a React-based frontend with a Node.js/Express backend, using PostgreSQL for data persistence.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query for server state management
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Styling**: Tailwind CSS with custom warehouse theme
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Style**: RESTful API with JSON responses

### Project Structure
- **Monorepo Layout**: Client and server code in separate directories
- **Shared Schema**: Common types and database schema in `/shared`
- **Client**: React application in `/client`
- **Server**: Express API in `/server`

## Key Components

### Authentication System
- Simple username/password authentication
- JWT-like session management with localStorage
- Role-based access control (admin/user roles)
- Protected routes with automatic redirect to login

### Inventory Management
- Product catalog with SKU tracking
- Category-based organization
- Stock level monitoring with min/max thresholds
- Location-based inventory tracking
- Real-time stock updates

### Order Processing
- **Incoming Orders**: Supplier deliveries and receiving
- **Outgoing Orders**: Customer shipments and picking
- Order status tracking (pending, processing, completed)
- Item-level tracking within orders

### Location Management
- Hierarchical location structure (warehouse > zone > rack > shelf)
- Location capacity tracking
- Multi-level inventory organization

### Dashboard & Analytics
- Real-time KPI monitoring
- Recent activity tracking
- Stock alerts and notifications
- Quick action shortcuts

## Data Flow

### Client-Side Data Flow
1. React Query manages all server state
2. Components fetch data through custom hooks
3. Mutations update server state and invalidate cache
4. Optimistic updates for better UX

### Server-Side Data Flow
1. Express routes handle API requests
2. Request validation using Zod schemas
3. Database operations through Drizzle ORM
4. Response formatting and error handling

### Database Schema
- **Users**: Authentication and user management
- **Products**: Product catalog and details
- **Categories**: Product categorization
- **Locations**: Warehouse location hierarchy
- **Inventory**: Stock levels by product and location
- **Orders**: Incoming and outgoing order management
- **Order Items**: Line items within orders
- **Inventory Movements**: Transaction history

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React-DOM)
- Radix UI components for accessible UI primitives
- TanStack Query for data fetching and caching
- Wouter for client-side routing
- Tailwind CSS for styling
- Date-fns for date manipulation
- Lucide React for icons

### Backend Dependencies
- Express.js for web server
- Drizzle ORM for database operations
- Neon Database SDK for PostgreSQL connection
- Zod for schema validation
- TypeScript for type safety

### Development Dependencies
- Vite for build tooling
- TypeScript compiler
- ESBuild for server bundling
- Tailwind CSS and PostCSS

## Deployment Strategy

### Development Environment
- Vite dev server for frontend with HMR
- tsx for TypeScript execution in development
- Concurrent development of client and server

### Production Build
- Vite builds optimized client bundle
- ESBuild creates server bundle
- Static assets served from Express in production

### Database Management
- Drizzle migrations for schema changes
- Environment-based database URLs
- Connection pooling through Neon

### Environment Configuration
- Development: Local development with Vite proxy
- Production: Express serves static files and API
- Database: PostgreSQL via Neon with connection string

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 07, 2025. Initial setup