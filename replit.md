# TinyAmp - Independent Music Discovery Platform

## Overview

TinyAmp is a full-stack web application for discovering independent music events in San Francisco. It connects music lovers with the vibrant local music scene by aggregating events from various venues, providing artist information, and enabling event discovery through a modern, responsive interface.

## User Preferences

Preferred communication style: Simple, everyday language.
Development Tools: Cursor AI IDE integration and GitHub repository management for collaborative development workflow.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI components with shadcn/ui styling
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Session Storage**: PostgreSQL sessions with connect-pg-simple
- **Web Scraping**: Playwright and Cheerio for venue data extraction

### Data Storage Solutions
- **Primary Database**: PostgreSQL hosted on Neon
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema**: Relational design with users, venues, artists, and events tables
- **Migrations**: Drizzle Kit for schema migrations

## Key Components

### Database Schema
- **Users**: Authentication and preferences
- **Venues**: SF music venues with metadata (capacity, location, genres)
- **Artists**: Musician profiles with social links and Spotify integration
- **Events**: Concert/show listings with relationships to venues and artists

### Data Aggregation System
- **Web Scrapers**: Automated scraping of SF venue websites (The Independent, Fillmore, etc.)
- **Python Integration**: Playwright-based scrapers for JavaScript-heavy sites
- **Spotify API**: Artist enrichment with images, follower counts, and metadata
- **Data Quality**: Monitoring and validation systems for scraped data

### API Routes
- **Events API**: CRUD operations, search, filtering by genre/venue/date
- **Venues API**: Venue listings with Google Places integration
- **Artists API**: Artist profiles with Spotify data enrichment
- **Admin API**: Data quality monitoring and scraping management

### Frontend Pages
- **Home**: Featured events and artist spotlights
- **Events**: Event listings with advanced filtering
- **Artists**: Artist discovery and profiles
- **Venues**: Venue information and upcoming shows
- **Admin**: Data quality dashboard and scraping monitoring

## Data Flow

1. **Data Collection**: Scrapers collect event data from venue websites
2. **Data Processing**: Events are normalized, artists are created/linked, Spotify data is enriched
3. **Data Storage**: Processed data is stored in PostgreSQL with referential integrity
4. **API Layer**: Express.js serves data through RESTful endpoints
5. **Frontend Display**: React components consume API data and render user interface
6. **User Interaction**: Search, filtering, and event discovery through responsive UI

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon PostgreSQL connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **cheerio**: HTML parsing for web scraping
- **@radix-ui/***: Accessible UI component primitives

### API Integrations
- **Spotify Web API**: Artist data enrichment (requires client credentials)
- **Google Places API**: Venue ratings and location data (optional)
- **Playwright**: Headless browser for complex web scraping

### Development Tools
- **Vite**: Frontend build tool with HMR
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first styling framework
- **ESBuild**: Backend bundling for production

## Deployment Strategy

### Development Setup
- **Package Manager**: npm with lockfile for dependency consistency
- **Build Process**: Parallel frontend (Vite) and backend (ESBuild) builds
- **Database**: Neon PostgreSQL with connection pooling
- **Environment Variables**: DATABASE_URL, Spotify credentials

### Production Build
- **Frontend**: Static assets built to `dist/public`
- **Backend**: Node.js bundle in `dist/index.js`
- **Database Migrations**: Drizzle Kit push/migrate commands
- **Asset Serving**: Express serves static files in production

### Key Architectural Decisions

1. **Serverless PostgreSQL**: Chosen Neon for automatic scaling and connection pooling without managing database infrastructure
2. **Drizzle ORM**: Selected for type safety, PostgreSQL-specific features, and excellent TypeScript integration over Prisma
3. **Web Scraping Strategy**: Combined Playwright (for JavaScript-heavy sites) with Cheerio (for simple HTML parsing) to handle various venue website types
4. **Spotify Integration**: Implemented artist enrichment to provide professional images and metadata, enhancing user experience
5. **Component Architecture**: Used Radix UI primitives with custom styling for accessibility and consistency
6. **State Management**: TanStack Query handles server state, eliminating need for complex client-side state management
7. **Monorepo Structure**: Shared schema and types between frontend/backend in `/shared` directory for type safety

The application prioritizes data quality through monitoring systems and provides a scalable foundation for expanding to additional cities and music scenes.

## Cursor AI IDE Integration

### Recent Integration (January 2025)
- Comprehensive Cursor AI IDE support added for enhanced development workflow
- AI-powered code generation and intelligent suggestions configured
- Project-specific rules and guidelines established in `.cursorrules`
- VS Code compatible settings optimized for TypeScript and Tailwind development
- Debug configurations for both frontend and backend development
- Development tasks integrated for common operations (build, database, deployment)

### Key Integration Features
- **Smart Code Generation**: Context-aware suggestions based on TinyAmp architecture
- **TypeScript Intelligence**: Full type safety with auto-imports and error checking  
- **Database Integration**: Seamless Drizzle ORM support with type-safe queries
- **Tailwind Support**: IntelliSense for CSS classes and component variants
- **Debug Workflow**: Integrated debugging for React frontend and Express backend
- **AI-Assisted Development**: Project-aware AI that understands TinyAmp patterns and conventions

### Configuration Files Added
- `.cursorrules`: Project-specific AI guidelines and development patterns
- `.vscode/settings.json`: Editor configuration optimized for the stack
- `.vscode/extensions.json`: Recommended extensions for optimal development
- `.vscode/launch.json`: Debug configurations for frontend and backend
- `.vscode/tasks.json`: Common development tasks (build, database operations)
- `cursor.json`: Project metadata and architecture documentation
- `README-cursor.md`: Comprehensive guide for Cursor IDE development workflow

## GitHub Integration

### Repository Management (January 2025)
- Complete GitHub repository setup with professional project structure
- Automated CI/CD pipeline with GitHub Actions for testing, linting, and deployment
- Comprehensive issue templates for bug reports, feature requests, and venue additions
- Pull request templates with detailed checklists and guidelines
- Contributing guidelines with development workflow and code standards
- Professional README with project overview, setup instructions, and API documentation

### GitHub Features Implemented
- **CI/CD Pipeline**: Automated testing, building, and deployment workflows
- **Issue Management**: Structured templates for bugs, features, and venue requests
- **Code Quality**: ESLint, Prettier, and security audit automation
- **Documentation**: Comprehensive guides for contributors and users
- **Branch Protection**: Main and develop branch protection with required reviews
- **Project Management**: GitHub Issues and Projects integration for task tracking

### Integration Benefits
- **Collaborative Development**: Multiple developers can contribute with proper workflows
- **Quality Assurance**: Automated testing and code quality checks
- **Issue Tracking**: Structured bug reporting and feature request management
- **Documentation**: Professional project presentation and contributor onboarding
- **Deployment Automation**: Seamless integration between GitHub and Replit deployment

The GitHub integration complements the existing Cursor AI and Replit setup, providing a complete professional development environment for scaling TinyAmp development with multiple contributors while maintaining code quality and project organization.

### Repository Connection (January 2025)
- Successfully connected to GitHub repository: https://github.com/rhewald/tinyamplive.git
- Established Git workflow between Replit development environment and GitHub
- Enabled seamless code synchronization and collaborative development
- GitHub Actions CI/CD pipeline active and ready for automated testing and deployment