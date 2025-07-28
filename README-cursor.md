# TinyAmp - Cursor AI IDE Integration

## Quick Start with Cursor

### 1. Install Recommended Extensions
Cursor will automatically suggest installing the recommended extensions from `.vscode/extensions.json`:
- Tailwind CSS IntelliSense
- TypeScript (Next)
- Prettier
- ESLint
- Auto Rename Tag
- Path Intellisense

### 2. Development Commands
Use Cursor's command palette (Cmd/Ctrl+Shift+P) to run these tasks:
- **Start Development Server**: `Tasks: Run Task` → `Start Development Server`
- **Build Production**: `Tasks: Run Task` → `Build Production`
- **Database Push**: `Tasks: Run Task` → `Database Push`
- **Database Studio**: `Tasks: Run Task` → `Database Studio`
- **Generate Events**: `Tasks: Run Task` → `Generate Comprehensive Events`

### 3. Debugging Setup
- **Backend Debugging**: Use F5 or Run and Debug panel → "Debug TinyAmp Backend"
- **Frontend Debugging**: Use F5 or Run and Debug panel → "Debug TinyAmp Frontend"

### 4. File Navigation
- Use Cursor's file explorer with nesting enabled for better organization
- Search excludes `node_modules` and `dist` but includes `attached_assets`
- Quick file search with Cmd/Ctrl+P

### 5. Code Intelligence Features

#### TypeScript Support
- Auto-imports configured for package.json dependencies
- Relative import preferences
- Automatic import organization on save

#### Tailwind CSS
- IntelliSense for Tailwind classes
- Support for `cva()` and `cn()` class variants
- CSS file association for better syntax highlighting

#### Database Schema
- Full TypeScript integration with Drizzle ORM
- Auto-completion for database queries
- Type-safe schema definitions

### 6. AI-Powered Development

#### Using Cursor's AI Features
1. **Code Generation**: Highlight code and use Cmd/Ctrl+K for AI suggestions
2. **Code Explanation**: Select code and ask Cursor to explain complex logic
3. **Refactoring**: Use AI to improve code structure and patterns
4. **Bug Fixing**: Cursor can help identify and fix issues in your code

#### Context-Aware Assistance
Cursor understands the TinyAmp project structure through:
- `.cursorrules` file with project-specific guidelines
- `cursor.json` configuration with architecture details
- Proper TypeScript types and database schema

### 7. Project Structure Navigation

```
TinyAmp/
├── .cursorrules              # Cursor AI rules and guidelines
├── .vscode/                  # VS Code/Cursor IDE configuration
│   ├── settings.json         # Editor settings and preferences
│   ├── extensions.json       # Recommended extensions
│   ├── launch.json          # Debug configurations
│   └── tasks.json           # Build and development tasks
├── cursor.json              # Cursor project configuration
├── client/src/              # React frontend application
├── server/                  # Express backend application
├── shared/                  # Shared types and database schema
└── attached_assets/         # Static assets and scrapers
```

### 8. Development Workflow

#### Starting a New Feature
1. Open Cursor and navigate to the TinyAmp project
2. Use the AI chat to describe your feature requirements
3. Cursor will suggest appropriate files to modify based on the architecture
4. Use code generation to scaffold components and API routes
5. Test using the debug configurations

#### Working with Database
1. Modify schema in `shared/schema.ts`
2. Run "Database Push" task to apply changes
3. Use "Database Studio" task to view data
4. Update storage interface in `server/storage.ts`

#### Frontend Development
1. Create components in `client/src/components/`
2. Use Tailwind IntelliSense for styling
3. Implement proper TypeScript types from shared schema
4. Test with "Debug TinyAmp Frontend" configuration

#### Backend Development
1. Add API routes in `server/routes.ts`
2. Use storage interface for database operations
3. Test with "Debug TinyAmp Backend" configuration
4. Validate requests with Zod schemas

### 9. Performance Tips

#### File Watching
- Cursor excludes `node_modules` and `dist` from watching for better performance
- File nesting patterns help organize related files

#### IntelliSense
- TypeScript auto-imports are optimized for the project structure
- Tailwind CSS suggestions include custom class variants

#### Debugging
- Source maps are properly configured for TypeScript debugging
- Console output is integrated for easier development

### 10. AI Assistance Best Practices

#### When to Use Cursor AI
- **Code Generation**: Creating new components, API routes, or database schemas
- **Refactoring**: Improving existing code structure and patterns
- **Problem Solving**: Debugging complex issues or implementing new features
- **Documentation**: Generating comments and documentation

#### How to Get Better Results
- Provide context about the specific feature you're working on
- Reference existing patterns in the codebase
- Be specific about TypeScript types and database requirements
- Ask for explanations of complex code sections

### 11. Troubleshooting

#### Common Issues
- **TypeScript Errors**: Check that paths in `tsconfig.json` are correct
- **Import Issues**: Use relative imports as configured in settings
- **Database Errors**: Run `npm run db:push` to sync schema changes
- **Build Errors**: Check that all dependencies are installed

#### Getting Help
- Use Cursor's AI chat for specific error messages
- Reference the project's `.cursorrules` for architectural guidance
- Check the `cursor.json` configuration for project context

This integration makes TinyAmp development more efficient with AI-powered code generation, intelligent suggestions, and streamlined debugging workflows.