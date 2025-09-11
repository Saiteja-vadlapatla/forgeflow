# Aether MES - Manufacturing Execution System

A comprehensive Manufacturing Execution System specifically designed for mechanical manufacturing operations including CNC Lathes, Milling, Conventional Turning, Grinding, Wire Cut, Drilling, and Tapping.

## 🏗️ System Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: shadcn/ui + Radix UI + Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Real-time**: WebSocket connections
- **Deployment**: Replit Cloud Platform

### Project Structure
```
aether-mes/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── dashboard/  # Dashboard components
│   │   │   ├── inventory/  # Inventory management components
│   │   │   ├── layout/     # Layout and navigation components
│   │   │   ├── planning/   # Production planning components
│   │   │   ├── quality/    # Quality control components
│   │   │   ├── ui/         # shadcn/ui base components
│   │   │   └── work-orders/ # Work order management components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and configurations
│   │   ├── pages/          # Page components
│   │   ├── App.tsx         # Main application component
│   │   ├── main.tsx        # Application entry point
│   │   └── index.css       # Global styles and Tailwind configuration
│   └── index.html          # HTML template
├── server/                 # Backend Express application
│   ├── db.ts               # Database connection and configuration
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # API route definitions
│   ├── scheduling.ts       # Production scheduling algorithms
│   ├── storage.ts          # Data storage layer and in-memory storage
│   └── vite.ts             # Vite development server integration
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Drizzle database schemas and Zod validation
├── attached_assets/        # Static assets (images, files)
├── components.json         # shadcn/ui configuration
├── drizzle.config.ts       # Drizzle ORM configuration
├── package.json            # Project dependencies and scripts
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (automatically provided in Replit)
- PostgreSQL database (automatically provisioned in Replit)

### Installation in Replit

1. **Fork or Import this Repository**
   - Click "Fork" on this Replit, or
   - Import from GitHub: `https://github.com/your-repo/aether-mes`

2. **Dependencies Installation**
   ```bash
   npm install
   ```
   Dependencies are automatically installed when you open the Replit.

3. **Database Setup**
   The PostgreSQL database is automatically provisioned with the following environment variables:
   - `DATABASE_URL`
   - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

4. **Database Schema Setup**
   ```bash
   npm run db:push
   ```
   This pushes the schema to your database and creates all necessary tables.

5. **Start the Application**
   ```bash
   npm run dev
   ```
   Or simply click the "Run" button in Replit.

The application will be available at `https://your-repl-name.your-username.repl.co`

## 🔧 Development Setup

### Local Development (Outside Replit)

If you want to run this locally outside of Replit:

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd aether-mes
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   - Install PostgreSQL locally
   - Create a database for the project
   - Set up environment variables:
   ```bash
   # Create .env file
   DATABASE_URL=postgresql://username:password@localhost:5432/aether_mes
   PGHOST=localhost
   PGPORT=5432
   PGUSER=your_username
   PGPASSWORD=your_password
   PGDATABASE=aether_mes
   ```

4. **Initialize Database Schema**
   ```bash
   npm run db:push
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

### Development
- `npm run dev` - Start the development server (both frontend and backend)
- `npm run check` - Run TypeScript type checking
- `npm run db:push` - Push database schema changes to PostgreSQL

### Production
- `npm run build` - Build the application for production
- `npm run start` - Start the production server

### Database Management
- `npm run db:push` - Apply schema changes to database
- `npm run db:push --force` - Force apply schema changes (use with caution)

## 🗄️ Database Schema

The system uses Drizzle ORM with PostgreSQL and includes the following core entities:

### Core Manufacturing Tables
- **Users** - System users and operators
- **Machines** - Manufacturing equipment (CNC, Mills, Grinders, etc.)
- **Work Orders** - Production orders with part specifications
- **Quality Records** - Quality control and inspection data
- **Inventory Items** - Raw materials and finished goods
- **Downtime Events** - Machine downtime tracking
- **Production Logs** - Real-time production data
- **Alerts** - System notifications and warnings

### Production Planning Tables
- **Production Plans** - Strategic production planning
- **Operations** - Individual manufacturing operations
- **Schedule Slots** - Scheduled production time slots
- **Machine Capabilities** - Machine operation capabilities
- **Setup Matrix** - Changeover times between operations
- **Calendars** - Working time definitions
- **Capacity Buckets** - Resource capacity tracking
- **Shift Entries** - Shift-based production data

## 🏭 Key Features

### 1. Production Planning & Scheduling
- **Multi-step Wizard**: Plan Details → Work Orders → Scheduling → Preview
- **Timeline Management**: Daily, Weekly, Monthly planning horizons
- **Advanced Scheduling**: EDD, SPT, Critical Ratio, FIFO, Priority algorithms
- **Capacity Planning**: Real-time capacity validation and conflict detection
- **Resource Optimization**: Automatic machine allocation with efficiency tracking

### 2. Machine Operations Center
- **Real-time Monitoring**: Live machine status and performance tracking
- **Capability Management**: Machine specifications and operation families
- **Maintenance Scheduling**: Planned maintenance and downtime tracking
- **Efficiency Metrics**: OEE calculations and performance analytics

### 3. Work Order Management
- **Comprehensive Forms**: Material specifications, tooling requirements, setup instructions
- **Operation Routing**: Multi-step operation sequences with dependencies
- **Progress Tracking**: Real-time work order status and completion monitoring
- **Quality Integration**: Embedded quality checkpoints and inspections

### 4. Quality Control System
- **Inspection Workflows**: Detailed measurement forms with tolerance checking
- **Quality Parameters**: Dimensional measurements and quality metrics
- **Defect Tracking**: Non-conformance reporting and corrective actions
- **Statistical Analysis**: Quality trends and control charts

### 5. Real-time Dashboard
- **Live Metrics**: Production rates, machine utilization, quality metrics
- **Visual Analytics**: Charts and graphs for key performance indicators
- **Alert Management**: Real-time notifications for critical events
- **Mobile Responsive**: Accessible on tablets and mobile devices for shop floor use

## 🔌 API Endpoints

### Core Manufacturing APIs
- `GET /api/machines` - Machine information and status
- `GET /api/work-orders` - Work order management
- `GET /api/quality-records` - Quality control data
- `GET /api/inventory` - Inventory management
- `GET /api/production-logs` - Production tracking data

### Production Planning APIs
- `GET /api/production-plans` - Production plans
- `POST /api/production-plans` - Create new production plan
- `GET /api/scheduling/preview` - Preview schedule generation
- `POST /api/scheduling/optimize` - Optimize production schedule
- `GET /api/capacity-planning` - Capacity utilization data

### Real-time WebSocket
- WebSocket connection for live data updates
- Real-time machine status broadcasts
- Live production metrics streaming

## 🎨 UI/UX Features

### Design System
- **shadcn/ui Components**: Professional, accessible UI components
- **Responsive Design**: Mobile-first approach with tablet optimization
- **Dark/Light Theme**: Theme switching capability
- **Consistent Typography**: Professional typography with clear hierarchy

### User Experience
- **Intuitive Navigation**: Clear menu structure with breadcrumbs
- **Progressive Disclosure**: Step-by-step workflows for complex operations
- **Real-time Feedback**: Loading states, progress indicators, and notifications
- **Accessibility**: WCAG compliant with keyboard navigation support

## 🔧 Configuration

### Environment Variables
```bash
# Database Configuration (automatically provided in Replit)
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=...
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# Application Configuration
NODE_ENV=development
```

### Vite Configuration
The application uses a custom Vite configuration with:
- Path aliases for clean imports (`@/`, `@shared/`, `@assets/`)
- React plugin with fast refresh
- TypeScript support
- Replit-specific plugins for development

### Tailwind Configuration
- Custom design tokens for manufacturing themes
- Extended color palette for status indicators
- Responsive breakpoints optimized for industrial displays
- Component-specific styling utilities

## 🚀 Deployment

### Replit Deployment (Recommended)
1. Click the "Deploy" button in your Replit
2. Choose your deployment settings
3. Application will be deployed with:
   - Automatic TLS/SSL certificates
   - Custom domain support
   - Built-in CDN
   - Health checks and monitoring

### Manual Deployment
1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` directory to your hosting provider
3. Set up environment variables on your hosting platform
4. Configure PostgreSQL database connection

## 🧪 Testing

### Running Tests
While comprehensive testing is in development, you can:
- Use the built-in TypeScript checking: `npm run check`
- Test API endpoints using the browser developer tools
- Verify database operations through the UI

### Manual Testing Checklist
- [ ] Dashboard loads with real-time metrics
- [ ] Work order creation and management
- [ ] Machine operations center functionality
- [ ] Production planning wizard workflow
- [ ] Quality control forms and validation
- [ ] Responsive design on different screen sizes

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check if DATABASE_URL is set
   echo $DATABASE_URL
   
   # Reinitialize database schema
   npm run db:push --force
   ```

2. **Build Errors**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **WebSocket Connection Issues**
   - Check browser console for WebSocket errors
   - Verify REPLIT_DOMAINS environment variable
   - Restart the Replit if connections fail

4. **TypeScript Errors**
   ```bash
   # Run type checking
   npm run check
   
   # Clear TypeScript cache
   rm -rf .tsbuildinfo
   ```

### Debug Mode
Enable debug logging by setting:
```bash
NODE_ENV=development
```

## 📚 Additional Resources

### Documentation
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [React Query Documentation](https://tanstack.com/query)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

### Manufacturing Standards
- **ISA-95 Compliance**: Industry standard for manufacturing operations
- **Industry 4.0 Ready**: Designed for modern manufacturing integration
- **OEE Standards**: Overall Equipment Effectiveness calculations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines
- Follow TypeScript best practices
- Use the existing component patterns
- Ensure responsive design compatibility
- Add proper data-testid attributes for testing
- Document complex business logic

## 📞 Support

For support and questions:
- Check the troubleshooting section above
- Review the codebase documentation in `replit.md`
- Open an issue in the repository

---

**Aether MES** - Comprehensive Manufacturing Execution System for Modern Production Environments