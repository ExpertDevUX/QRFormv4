# QR Event Manager

## Overview

QR Event Manager is a full-stack web application that enables users to create events, generate QR codes for registration, and manage attendee data. The application provides an intuitive interface for event organizers to collect registration information through QR code scanning and export data to Excel format. Built with a modern React frontend and Express backend, it offers real-time data management with PostgreSQL storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client uses a modern React setup with TypeScript and Vite for fast development and building. The UI is built with shadcn/ui components providing a consistent design system based on Radix UI primitives and styled with Tailwind CSS. The application follows a component-based architecture with clear separation between pages, UI components, and utility functions.

**State Management**: Uses TanStack Query (React Query) for server state management, providing caching, synchronization, and background updates. Local state is managed with React hooks.

**Routing**: Implements client-side routing with Wouter, a lightweight alternative to React Router.

**Form Handling**: Uses React Hook Form with Zod validation for type-safe form management and validation.

**Styling**: Tailwind CSS with a custom design system configuration, CSS variables for theming, and responsive design patterns.

### Backend Architecture
The server is built with Express.js and follows a RESTful API design pattern. The architecture separates concerns between routing, storage, and server setup.

**API Design**: RESTful endpoints for events, registrations, and statistics with proper HTTP status codes and error handling.

**Storage Layer**: Abstracted storage interface allowing for different implementations (currently in-memory storage for development, with Drizzle ORM configured for PostgreSQL).

**Middleware**: Request logging, JSON parsing, and error handling middleware for robust API functionality.

### Data Storage
The application uses Drizzle ORM with PostgreSQL for data persistence. The schema defines two main entities:

**Events Table**: Stores event information including name, description, dates, QR codes, and registration URLs.

**Registrations Table**: Stores attendee information linked to specific events with foreign key relationships.

**Schema Validation**: Uses Zod schemas for runtime type checking and validation, with shared types between frontend and backend.

### External Dependencies

**Database**: PostgreSQL with Neon Database as the serverless provider for cloud hosting.

**QR Code Generation**: QRCode library for generating QR codes as data URLs that can be downloaded or displayed.

**Excel Export**: SheetJS (xlsx) library for exporting registration data to Excel format with custom formatting and column widths.

**UI Components**: Extensive use of Radix UI primitives wrapped in custom shadcn/ui components for accessibility and consistency.

**Development Tools**: Vite for fast development builds, ESBuild for production bundling, and TypeScript for type safety across the entire stack.

**Validation**: Zod for schema validation shared between client and server, with React Hook Form resolvers for form validation.

**Date Handling**: date-fns library for date formatting and manipulation throughout the application.