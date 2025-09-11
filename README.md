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
- **Deployment**: Multi-platform (Replit, Google Cloud, Local)

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
- **Node.js 18+** (LTS recommended)
- **PostgreSQL database** (local installation, cloud instance, or managed service)
- **Git** for version control
- **Google Cloud SDK** (for Google Cloud deployment)
- **Docker** (optional, for containerized deployment)

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

### Local Development

#### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd aether-mes

# Install dependencies
npm install
```

#### 2. Local PostgreSQL Setup

**Option A: Install PostgreSQL Locally**
```bash
# On macOS
brew install postgresql
brew services start postgresql

# On Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# On Windows
# Download and install from https://www.postgresql.org/download/windows/
```

**Option B: Using Docker**
```bash
# Run PostgreSQL in Docker
docker run --name aether-postgres \
  -e POSTGRES_DB=aether_mes \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15
```

#### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/aether_mes
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=aether_mes

# Application Configuration
NODE_ENV=development
PORT=5000

# Optional: Enable debug logging
DEBUG=true
```

#### 4. Database Schema Setup
```bash
# Initialize database schema
npm run db:push

# If you encounter issues, force push the schema
npm run db:push --force
```

#### 5. Start Development Server
```bash
# Start both frontend and backend
npm run dev

# The application will be available at:
# http://localhost:5000
```

## ☁️ Google Cloud Deployment

### Prerequisites for Google Cloud
1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Create a Google Cloud Project
3. Enable required APIs:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable sqladmin.googleapis.com
   ```

### 1. Setup Cloud SQL (PostgreSQL)
```bash
# Create Cloud SQL instance
gcloud sql instances create aether-mes-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=your-secure-password

# Create database
gcloud sql databases create aether_mes --instance=aether-mes-db

# Create user (optional)
gcloud sql users create aether_user \
  --instance=aether-mes-db \
  --password=user-password
```

### 2. Create Dockerfile
Create a `Dockerfile` in the root directory:
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Expose port
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Start the application
CMD ["npm", "start"]
```

### 3. Create .dockerignore
```
node_modules
.git
.gitignore
README.md
.env
.env.local
npm-debug.log*
.nyc_output
```

### 4. Setup IAM and Deploy to Cloud Run
```bash
# Create a service account for Cloud Run
gcloud iam service-accounts create aether-mes-sa \
  --display-name="Aether MES Service Account"

# Grant Cloud SQL client role to the service account
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:aether-mes-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Build and deploy with Cloud SQL connection
gcloud run deploy aether-mes \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --service-account aether-mes-sa@PROJECT_ID.iam.gserviceaccount.com \
  --add-cloudsql-instances PROJECT_ID:us-central1:aether-mes-db \
  --set-env-vars NODE_ENV=production \
  --set-env-vars DATABASE_URL="postgresql://postgres:your-password@/aether_mes?host=/cloudsql/PROJECT_ID:us-central1:aether-mes-db"
```

### 5. Environment Variables for Google Cloud
Set the following environment variables in Cloud Run:
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:password@/aether_mes?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
NODE_ENV=production
PORT=8080

# Set via gcloud command
gcloud run services update aether-mes \
  --set-env-vars DATABASE_URL="your-cloud-sql-connection-string" \
  --set-env-vars NODE_ENV=production \
  --region us-central1
```

### 6. Initialize Database Schema on Cloud
```bash
# Option A: Connect directly to Cloud SQL instance
gcloud sql connect aether-mes-db --user=postgres

# Option B: Use Cloud SQL Auth Proxy for local connection
# Download and install Cloud SQL Auth Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Start proxy connection
./cloud-sql-proxy PROJECT_ID:us-central1:aether-mes-db --port 5432

# In another terminal, set local connection and push schema
export DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/aether_mes"
npm run db:push

# Verify the application binds to the correct PORT in production
# Your server/index.ts should use: const port = process.env.PORT || 5000
```

### 7. Custom Domain (Optional)
```bash
# Map custom domain
gcloud run domain-mappings create \
  --service aether-mes \
  --domain your-domain.com \
  --region us-central1
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

### Docker & Cloud Deployment
- `docker build -t aether-mes .` - Build Docker image
- `docker run -p 8080:8080 aether-mes` - Run Docker container locally
- `gcloud run deploy` - Deploy to Google Cloud Run

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

#### Local Development (.env)
```bash
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/aether_mes
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=password
PGDATABASE=aether_mes

# Application Configuration
NODE_ENV=development
PORT=5000
DEBUG=true
```

#### Google Cloud Run
```bash
# Database Configuration (Cloud SQL)
DATABASE_URL=postgresql://postgres:password@/aether_mes?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
NODE_ENV=production
PORT=8080

# Optional: Additional cloud configurations
GOOGLE_CLOUD_PROJECT=your-project-id
```

#### Replit Environment
```bash
# Database Configuration (automatically provided)
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

## 🚀 Deployment Options

### 1. Replit Deployment (Easiest)
Perfect for quick prototyping and development:
1. Click the "Deploy" button in your Replit
2. Choose your deployment settings
3. Application will be deployed with:
   - Automatic TLS/SSL certificates
   - Custom domain support
   - Built-in CDN
   - Health checks and monitoring

### 2. Google Cloud Run (Production Recommended)
Scalable serverless deployment with managed database:
- **Automatic scaling** from 0 to thousands of instances
- **Pay per use** - only charged when serving requests
- **Integrated with Cloud SQL** for managed PostgreSQL
- **Global CDN** and SSL certificates included
- See detailed instructions in the [Google Cloud Deployment](#☁️-google-cloud-deployment) section above

### 3. Other Cloud Platforms

#### AWS (using Elastic Beanstalk or ECS)
```bash
# Build the application
npm run build

# Create deployment package
zip -r aether-mes.zip . -x "node_modules/*"

# Deploy to Elastic Beanstalk (configure RDS PostgreSQL separately)
```

#### Heroku
```bash
# Create Heroku app
heroku create aether-mes

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Deploy
git push heroku main

# Run database migrations
heroku run npm run db:push
```

#### DigitalOcean App Platform
```bash
# Build and deploy
doctl apps create --spec app-spec.yaml

# app-spec.yaml example:
name: aether-mes
services:
- name: api
  source_dir: /
  github:
    repo: your-username/aether-mes
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: DATABASE_URL
    value: your-database-url
  - key: NODE_ENV
    value: production
```

### 4. Self-Hosted/VPS Deployment
For on-premises or custom server deployment:

```bash
# On your server
git clone <repository-url>
cd aether-mes
npm install
npm run build

# Install PM2 for process management
npm install -g pm2

# Start with PM2
pm2 start npm --name "aether-mes" -- start
pm2 startup
pm2 save

# Configure Nginx as reverse proxy (optional)
sudo nginx -t
sudo systemctl reload nginx
```

**Nginx Configuration Example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

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

#### 1. Database Connection Issues
```bash
# Local Development
echo $DATABASE_URL
npm run db:push --force

# Google Cloud
gcloud sql instances describe aether-mes-db
gcloud sql connect aether-mes-db --user=postgres

# Check Cloud SQL connection string format
# Should be: postgresql://user:pass@/dbname?host=/cloudsql/project:region:instance
```

#### 2. Build and Deployment Errors
```bash
# Clear dependencies and rebuild
rm -rf node_modules package-lock.json dist/
npm install
npm run build

# Google Cloud specific
gcloud builds list --limit=5
gcloud run services list
```

#### 3. Environment Variable Issues
```bash
# Local - check .env file
cat .env

# Google Cloud - check Cloud Run env vars
gcloud run services describe aether-mes --region=us-central1

# Replit - check secrets panel
# Use the Secrets tab in Replit interface
```

#### 4. WebSocket Connection Issues
- **Local**: Check if port 5000 is available
- **Google Cloud**: Ensure WebSocket support is enabled (Cloud Run supports it by default)
- **Replit**: Verify REPLIT_DOMAINS environment variable

#### 5. TypeScript Errors
```bash
# Run type checking
npm run check

# Clear caches
rm -rf .tsbuildinfo
rm -rf node_modules/.cache
```

#### 6. Google Cloud Specific Issues
```bash
# Check service logs
gcloud run services logs read aether-mes --region=us-central1

# Check Cloud SQL connection
gcloud sql operations list --instance=aether-mes-db

# Test local connection to Cloud SQL
./cloud_sql_proxy -instances=PROJECT_ID:REGION:INSTANCE_NAME=tcp:5432
```

#### 7. Port Configuration Issues
- **Local**: Default port 5000
- **Google Cloud Run**: Must use PORT environment variable (usually 8080)
- **Replit**: Automatically handled

### Debug Mode
```bash
# Local Development
NODE_ENV=development
DEBUG=true

# Google Cloud (check logs)
gcloud run services logs read aether-mes --region=us-central1

# Replit (check console)
# Use browser developer tools console
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