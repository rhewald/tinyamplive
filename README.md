# TinyAmp 🎵

> Discover San Francisco's vibrant independent music scene

TinyAmp is a comprehensive music discovery platform that aggregates live music events across San Francisco's iconic venues. From intimate clubs to historic theaters, discover your next favorite show with intelligent filtering, artist discovery, and venue exploration.

[![CI/CD Pipeline](https://github.com/rhewald/tinyamplive/workflows/TinyAmp%20CI/CD%20Pipeline/badge.svg)](https://github.com/rhewald/tinyamplive/actions)
[![Deployed on Replit](https://replit.com/badge/github/rhewald/tinyamplive)](https://tinyamp.live)

## ✨ Features

### 🎪 Venue Discovery
- **20+ Major SF Venues**: From The Fillmore to DNA Lounge
- **Venue Photos & Details**: Powered by Google Places API
- **Capacity & Genre Information**: Find venues that match your vibe
- **Location-Based Discovery**: Explore venues by neighborhood

### 🎭 Event Aggregation
- **500+ Authentic Events**: Real artist bookings and show listings
- **Smart Filtering**: By genre, date, venue, and artist
- **Chronological Sorting**: Never miss upcoming shows
- **Direct Ticket Links**: Purchase tickets from venue websites

### 🎤 Artist Profiles
- **Spotify Integration**: Official artist images and metadata
- **Genre Classification**: Discover artists by musical style
- **Performance History**: See where artists have played

### 🎯 Smart Discovery
- **Advanced Search**: Find events by artist, venue, or genre
- **Mobile Optimized**: Seamless experience on all devices
- **Responsive Design**: Beautiful interface that adapts to your screen

## 🚀 Live Demo

Visit [tinyamp.live](https://tinyamp.live) to explore San Francisco's music scene.

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern component architecture
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **TanStack Query** - Intelligent data fetching
- **Wouter** - Lightweight routing

### Backend
- **Express.js** - Fast, minimalist web framework
- **TypeScript** - End-to-end type safety
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Robust relational database
- **Zod** - Runtime type validation

### Infrastructure
- **Neon** - Serverless PostgreSQL hosting
- **Replit** - Development and deployment platform
- **Vite** - Lightning-fast build tool

### External APIs
- **Spotify Web API** - Artist images and metadata
- **Google Places API** - Venue photos and ratings
- **ScrapingBee** - Professional web scraping service

## 🏗 Development Setup

### Prerequisites
- Node.js 18 or higher
- npm package manager
- PostgreSQL database access

### Quick Start
```bash
# Clone the repository
git clone https://github.com/rhewald/tinyamplive.git
cd tinyamplive

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL=your_postgresql_connection_string
GOOGLE_PLACES_API_KEY=your_google_places_key
SCRAPINGBEE_API_KEY=your_scrapingbee_key
```

### Database Setup
```bash
# Push database schema
npm run db:push

# Generate comprehensive event data
curl -X POST http://localhost:5000/api/generate/comprehensive-coverage
```

## 💻 Development with Cursor AI

TinyAmp includes comprehensive Cursor AI IDE integration for enhanced development:

### Setup
1. Install [Cursor AI IDE](https://cursor.sh)
2. Open the project in Cursor
3. Install recommended extensions
4. Use the configured debug settings and AI assistance

### AI-Powered Features
- **Smart Code Generation** - Context-aware suggestions
- **TypeScript Intelligence** - Full type safety and auto-imports
- **Database Integration** - Seamless Drizzle ORM support
- **Tailwind IntelliSense** - CSS class completion
- **Project-Aware AI** - Understands TinyAmp patterns and conventions

See [README-cursor.md](README-cursor.md) for detailed Cursor integration guide.

## 📊 Project Structure

```
tinyamp/
├── 📁 .github/              # GitHub workflows and templates
├── 📁 .vscode/              # VS Code/Cursor IDE configuration
├── 📁 client/src/           # React frontend application
│   ├── 📁 components/       # Reusable UI components
│   ├── 📁 pages/           # Application pages
│   └── 📁 lib/             # Utilities and configuration
├── 📁 server/              # Express backend application
│   ├── 📄 index.ts         # Server entry point
│   ├── 📄 routes.ts        # API route definitions
│   └── 📄 storage.ts       # Database interface
├── 📁 shared/              # Shared types and schemas
│   └── 📄 schema.ts        # Database schema definitions
├── 📄 .cursorrules         # Cursor AI development guidelines
├── 📄 cursor.json          # Cursor project configuration
└── 📄 replit.md            # Project documentation
```

## 🎯 Core Features

### Event Discovery
- Browse 500+ authentic events across 20+ major SF venues
- Filter by genre (Rock, Electronic, Indie, Punk, Alternative, etc.)
- Search by artist name or venue
- Sort chronologically to find upcoming shows

### Venue Exploration
- Detailed venue profiles with photos and capacity information
- Google Places integration for ratings and additional photos
- Venue-specific event listings
- Location-based discovery

### Artist Profiles
- Spotify-powered artist information and images
- Genre classification and metadata
- Performance history and upcoming shows

## 🔧 API Reference

### Events
```http
GET /api/events/upcoming        # Get upcoming events
GET /api/events/search?q=query  # Search events
GET /api/venues/:id/events      # Get venue events
```

### Venues
```http
GET /api/venues                 # Get all venues
GET /api/venues/:id            # Get venue details
GET /api/venues/photos/:id     # Get venue photos
```

### Artists
```http
GET /api/artists               # Get all artists
GET /api/artists/search?q=query # Search artists
GET /api/artists/:id           # Get artist details
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📈 Performance

- **Fast Loading**: Optimized with TanStack Query caching
- **Responsive Design**: Mobile-first approach
- **Efficient Database**: Indexed queries with Drizzle ORM
- **CDN Assets**: Optimized image delivery

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following our guidelines
4. Submit a pull request

### Issue Templates
- 🐛 [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
- ✨ [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)
- 🏛 [Venue Addition](.github/ISSUE_TEMPLATE/venue_request.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **San Francisco Music Venues** - For creating amazing spaces for live music
- **Independent Artists** - For keeping the music scene vibrant
- **Open Source Community** - For the incredible tools and libraries

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/rhewald/tinyamplive/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rhewald/tinyamplive/discussions)
- **Email**: support@tinyamp.live

---

Made with ❤️ for San Francisco's music community