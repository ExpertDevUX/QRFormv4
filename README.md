# QR Event Manager

A full-stack web application that enables users to create events, generate QR codes for registration, and manage attendee data with an advanced form builder and custom QR code generation.

## Features

### ✨ Core Features
- **Event Creation**: Create and manage events with custom details
- **QR Code Generation**: Generate custom QR codes with backgrounds and positioning
- **Form Builder**: Dynamic registration forms with drag & drop interface
- **Registration Management**: Collect and manage attendee information
- **Excel Export**: Export registration data to Excel format
- **User Authentication**: Secure login and registration system
- **User Management**: Admin features for managing users and permissions

### 🎨 Advanced QR Customization
- Custom background images for QR codes
- Adjustable QR code size and positioning
- Text overlays and custom styling
- Multiple download formats

### 📝 Dynamic Form Builder
- Drag & drop form creation
- Multiple field types (text, email, phone, textarea, select, checkbox, radio, file)
- Field validation and requirements
- Responsive form layouts
- Custom field configurations

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** components built on Radix UI
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Wouter** for client-side routing
- **Framer Motion** for animations

### Backend
- **Express.js** with TypeScript
- **Passport.js** for authentication
- **Express Session** for session management
- **Drizzle ORM** for database operations
- **PostgreSQL** for data persistence
- **QRCode** library for QR generation
- **SheetJS (xlsx)** for Excel export

### Development Tools
- **TypeScript** for type safety
- **ESBuild** for production bundling
- **Drizzle Kit** for database migrations
- **PostCSS** and **Autoprefixer**

## Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd qr-event-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/database_name
   SESSION_SECRET=your-strong-session-secret-here
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5000`

### Production Build

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/        # shadcn/ui components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and configurations
│   │   ├── pages/         # Application pages/routes
│   │   └── App.tsx        # Main application component
│   └── index.html         # HTML template
├── server/                # Backend Express application
│   ├── auth.ts           # Authentication setup and routes
│   ├── db.ts             # Database connection
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer
│   └── vite.ts           # Vite development setup
├── shared/               # Shared types and schemas
│   └── schema.ts         # Database schema and validation
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tailwind.config.ts    # Tailwind CSS configuration
└── drizzle.config.ts     # Database configuration
```

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Registrations
- `GET /api/registrations` - Get all registrations
- `POST /api/registrations` - Create new registration
- `GET /api/registrations/:eventId` - Get registrations for event

### Export
- `POST /api/export` - Export registration data to Excel

## Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - User accounts and authentication
- **events** - Event information and settings
- **registrations** - Registration entries for events
- **qr_settings** - QR code customization settings
- **form_schemas** - Dynamic form configurations
- **password_reset_tokens** - Password reset functionality

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

### Code Style

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting (recommended)
- Consistent naming conventions

### Component Structure

Components follow the shadcn/ui pattern:
- Styled with Tailwind CSS
- Built on Radix UI primitives
- Fully accessible
- Customizable with CSS variables

## Security Features

- Password hashing with scrypt
- Session-based authentication
- CSRF protection with SameSite cookies
- SQL injection prevention with parameterized queries
- Input validation with Zod schemas
- Secure password policies

## Deployment

The application is configured for deployment on Replit with:
- Automatic SSL certificate handling
- Environment variable management
- Database provisioning
- Port configuration for hosting

For other platforms, ensure:
- PostgreSQL database is available
- Environment variables are set
- Build process completes successfully
- Port 5000 is accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the GitHub issues page
- Review the documentation
- Contact the development team

---

Built with ❤️ using modern web technologies