# TinyAmp Local Development Setup

## Step 1: Clone Your Project

In your terminal/command prompt:

```bash
# Clone the repository to your local machine
git clone https://github.com/[your-username]/tinyamp.git
cd tinyamp
```

## Step 2: Set Up Environment

1. **Install Node.js 18+** from [nodejs.org](https://nodejs.org)

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env` file in your project root with these exact values:
```
DATABASE_URL=postgresql://neondb_owner:m6Qps8vhOk2W@ep-long-tooth-a5y4e3fb.us-east-2.aws.neon.tech/neondb?sslmode=require
GOOGLE_PLACES_API_KEY=AIzaSyB9BlL7kuDRa5NiBfh0Hvt1xi9uYaiRbaE
VITE_GOOGLE_PLACES_API_KEY=AIzaSyB9BlL7kuDRa5NiBfh0Hvt1xi9uYaiRbaE
SPOTIFY_CLIENT_ID=2a3104352bb4486eb715253fea6ea3ee
SPOTIFY_CLIENT_SECRET=d9d3fcd6f44d403cbd0afc822d1079a7
SCRAPINGBEE_API_KEY=RQXDMPPGVK1WA9Q5UHFWBKPAU8LD1K5HZWTYV6JL5ATA5K3QSZLW3D7Z4PQXWKKL7FWEMCHVYAACYCSQ
```

**Important**: 
- No extra spaces or quotes around values
- File must be named exactly `.env` (with the dot)
- Place it in your project root folder (same level as package.json)

## Step 3: Open in Cursor IDE

1. **Download Cursor IDE** from [cursor.sh](https://cursor.sh)
2. **Open the project:**
   - Launch Cursor IDE
   - File → Open Folder
   - Select your `tinyamp` project folder
3. **Install recommended extensions** (Cursor will prompt you)

## Step 4: Development Commands

In Cursor's integrated terminal:

```bash
# Start development server
npm run dev

# Database operations
npm run db:push    # Push schema changes
npm run db:studio  # Open database studio

# Production build
npm run build
```

## Step 5: Using Cursor AI Features

- **Chat**: Cmd/Ctrl + L to open AI chat
- **Code Generation**: Cmd/Ctrl + K for inline suggestions
- **Debug**: F5 to start debugging
- **Command Palette**: Cmd/Ctrl + Shift + P for tasks

## Project Structure Understanding

Cursor AI understands your project through:
- `.cursorrules` - Project-specific AI guidelines
- `.vscode/` - IDE configuration and tasks
- `replit.md` - Architecture documentation
- TypeScript types and database schema

## Syncing Changes

```bash
# Push your local changes to Replit
git add .
git commit -m "Your change description"
git push origin main

# Pull changes from Replit
git pull origin main
```

Your TinyAmp project is ready for local development with full AI assistance!