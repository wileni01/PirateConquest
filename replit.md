# Cutthroats: 3D Pirate Adventure

## Overview

Cutthroats is a 3D pirate adventure game inspired by the 90s classic, built with React Three Fiber and Express.js. The application features a full-stack architecture with a React frontend for the 3D game interface and an Express backend for data management. The game includes naval combat, trading mechanics, port interactions, and resource management in an immersive 3D ocean environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **3D Rendering**: React Three Fiber (@react-three/fiber) with Three.js
- **3D Components**: React Three Drei (@react-three/drei) for enhanced 3D utilities
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: Zustand for game state and audio management
- **Build Tool**: Vite with custom configuration for 3D assets

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Storage Layer**: In-memory storage implementation with interface for database integration

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type-safe data structures
- **Migration Strategy**: Drizzle Kit for schema migrations
- **Type Safety**: Zod schemas for runtime validation integrated with Drizzle

## Key Components

### Game Engine Components
- **Game Loop**: Frame-based update system using React Three Fiber's useFrame
- **Ship System**: Player and AI-controlled ships with physics and combat
- **Ocean Rendering**: Animated water surface with texture mapping
- **Combat System**: Cannonball physics and collision detection
- **Trading System**: Port-based economy with supply/demand mechanics

### UI System
- **Menu System**: Main menu, trading interfaces, and game HUD
- **3D Interface**: Integrated UI overlays within the 3D canvas
- **Audio Management**: Background music and sound effects with mute controls
- **Keyboard Controls**: WASD movement, space for combat, E for interactions

### State Management
- **Game State**: Zustand store managing player progress, ships, and world state
- **Audio State**: Separate audio management system for music and sound effects
- **Persistent Data**: Local storage integration for game saves

## Data Flow

### Game State Flow
1. **Initialization**: Game starts in menu state with initial world generation
2. **Game Loop**: Continuous updates for ship movement, AI behavior, and physics
3. **User Input**: Keyboard controls processed through React Three Fiber's KeyboardControls
4. **State Updates**: Zustand actions update game state reactively
5. **Rendering**: React Three Fiber renders 3D scene based on current state

### Trading System Flow
1. **Port Entry**: Player approaches port within interaction range
2. **Trading Interface**: Modal interface displays available supplies and prices
3. **Transaction Processing**: Gold and supplies updated through Zustand actions
4. **State Persistence**: Changes reflected in game state and UI

### Combat System Flow
1. **Input Detection**: Spacebar triggers cannonball firing
2. **Physics Simulation**: Cannonballs follow ballistic trajectories
3. **Collision Detection**: Real-time collision checking between projectiles and ships
4. **Damage Application**: Health reduction and potential ship destruction

## External Dependencies

### Core 3D Libraries
- **React Three Fiber**: Core 3D rendering framework
- **React Three Drei**: Additional 3D utilities and helpers
- **React Three Postprocessing**: Visual effects and post-processing

### UI and Styling
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library

### Database and Backend
- **Neon Database**: Serverless PostgreSQL provider
- **Drizzle ORM**: Type-safe database toolkit
- **Express.js**: Web application framework

### Development Tools
- **Vite**: Build tool with HMR and asset optimization
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast JavaScript bundling for production

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR for rapid development
- **Backend**: tsx for TypeScript execution in development
- **Database**: Neon Database with connection pooling

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Assets**: Support for 3D models (.gltf, .glb) and audio files (.mp3, .ogg, .wav)
- **Deployment**: Single Node.js process serving both frontend and API

### Database Management
- **Schema Updates**: `npm run db:push` for schema synchronization
- **Migrations**: Drizzle Kit manages database migrations in `migrations/` directory
- **Connection**: Environment variable `DATABASE_URL` for database connectivity

### Performance Considerations
- **3D Asset Optimization**: GLSL shader support and asset preloading
- **Bundle Splitting**: Vite automatically splits bundles for optimal loading
- **Tree Shaking**: Unused code elimination in production builds
- **Runtime Error Handling**: Development overlay for debugging