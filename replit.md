# OPD Management System

## Overview

This is a full-stack OPD (Outpatient Department) management system designed for hospitals and clinics, optimized for tablet use. The application provides a comprehensive solution for managing hospital registration, OPD departments, doctors, and patients through a modern web interface. The system is now fully integrated with the user's MongoDB database and displays real-time data from the database.

## Recent Changes (January 2025)
- ✓ **Migration to Replit**: Successfully migrated project from Replit Agent to standard Replit environment
- ✓ **Security Hardening**: Ensured proper client-server separation and security best practices
- ✓ **Bug Fixes**: Fixed undefined array mapping issue in hospital registration page
- ✓ **Database Migration**: Successfully converted entire system from PostgreSQL to MongoDB
- ✓ **Database Integration**: Connected to user's specific MongoDB URI (mongodb+srv://airavatatechnologiesprojects:JayShreeRam@27@atopd.436ykvh.mongodb.net)  
- ✓ **ObjectId Handling**: Fixed all frontend-backend serialization issues for MongoDB ObjectIds
- ✓ **Real Data Display**: Updated dashboard to show actual counts from database instead of dummy data
- ✓ **API Functionality**: All REST endpoints working correctly with MongoDB storage
- ✓ **Type Safety**: Fixed all ID reference issues across frontend components (_id vs id)
- ✓ **Logic Fix**: Updated hospital registration to use specific OPD departments (General, ENT, Cardio, Gyno, Custom) instead of number input
- ✓ **Doctor Registration Logic**: Fixed doctor registration to properly list actual OPD departments from selected hospitals
- ✓ **Complete Workflow**: Full hierarchical registration system working (Hospital → OPD → Doctor → Patient)

## Current Status
The system is fully operational with MongoDB integration and proper workflow logic:
- Multiple test hospitals registered with specific OPD departments
- OPD departments properly linked to hospitals via hospitalId 
- Doctor registration working with actual OPD selection from hospitals
- Complete hierarchical data flow: Hospital → OPD → Doctor → Patient
- All forms validate and display real data from the MongoDB database

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: React Query (TanStack Query) for server state
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **Database**: MongoDB with native MongoDB driver
- **Data Layer**: Custom storage abstraction with type-safe operations
- **Validation**: Zod schemas shared between client and server
- **Document Handling**: Proper ObjectId serialization between frontend/backend

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend API
├── shared/          # Shared TypeScript schemas and types
├── migrations/      # Database migration files
└── attached_assets/ # Project documentation and requirements
```

## Key Components

### Database Schema (MongoDB)
- **hospitals**: Core hospital registration with licensing and contact info
- **opds**: Department management linked to hospitals via hospitalId
- **doctors**: Medical staff registration under specific OPDs via opdId  
- **patients**: Patient records with medical history and doctor assignments
- **users**: Authentication and authorization system
- All collections use MongoDB ObjectIds with proper string serialization for frontend

### API Endpoints
- `POST /api/hospitals/register` - Hospital registration
- `GET /api/hospitals` - List all hospitals
- `POST /api/hospitals/:id/opds` - OPD registration under hospital
- `POST /api/opds/:id/doctors` - Doctor registration under OPD
- `POST /api/doctors/:id/patients` - Patient registration with doctor

### Frontend Pages
- **Dashboard**: Overview with statistics and quick access
- **Hospital Registration**: Form for registering new hospitals
- **OPD Management**: Department creation and management
- **Doctor Registration**: Medical staff onboarding
- **Patient Registration**: Patient intake and record creation

## Data Flow

1. **Hospital Registration**: Creates the top-level organization entity
2. **OPD Setup**: Departments are created under specific hospitals
3. **Doctor Assignment**: Medical staff are registered to specific OPDs
4. **Patient Management**: Patients are assigned to doctors for care

The system enforces a hierarchical relationship: Hospital → OPD → Doctor → Patient

## External Dependencies

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket Support**: For real-time database connections

### UI & Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Drizzle Kit**: Database migration and schema management
- **TSX**: TypeScript execution for development
- **ESBuild**: Fast JavaScript bundling for production

### Form & Validation
- **React Hook Form**: Performant form management
- **Zod**: Runtime type validation and schema definition

## Deployment Strategy

### Development
- Uses Vite dev server with HMR for fast development
- TSX for running TypeScript server code directly
- Integrated error handling and logging

### Production Build
- Client: Vite builds optimized static assets
- Server: ESBuild bundles Node.js application
- Database: Drizzle migrations for schema management

### Environment Configuration
- Requires `DATABASE_URL` environment variable for PostgreSQL connection
- Supports both development and production NODE_ENV settings
- Replit-specific integrations for cloud deployment

The application is designed to be tablet-friendly with a responsive design that works well on both desktop and mobile devices, making it suitable for use in clinical environments.