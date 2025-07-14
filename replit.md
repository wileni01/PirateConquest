# Cutthroats: 3D Pirate Adventure

## Overview

Cutthroats is a 3D pirate adventure game inspired by the 90s classic "Cutthroats: Terror on the High Seas", built with React Three Fiber and Express.js. The application features a full-stack architecture with a React frontend for the 3D game interface and an Express backend for data management. The game includes naval combat, ship boarding mechanics, trading systems, port interactions, weather effects, treasure hunting, and comprehensive resource management in an immersive 3D Caribbean environment.

## Recent Changes (January 2025)

### Enhanced Pirate Game Features
- **Ship Boarding System**: Players can now board and capture enemy ships using the E key when close to enemy vessels
- **Treasure Mechanics**: Added treasure burying system (B key) and buried treasure markers throughout the world
- **Fleet Management**: Captured ships are added to player's fleet and displayed in trading menus
- **Reputation & Infamy System**: Dual reputation system tracking both fame and infamy for pirate actions
- **Weather System**: Dynamic weather changes (clear, storm, fog) affecting ocean appearance and gameplay
- **Time of Day**: Day/night cycle with dawn, day, dusk, and night phases affecting ocean colors
- **Enhanced Trading**: Improved port trading with governor information, faction attitudes, and fleet status
- **Enhanced UI**: Added morale tracking, weather display, and comprehensive pirate statistics
- **Historical Authenticity**: Added 10 authentic Caribbean ports with historically accurate governors and factions

### Map System Overhaul (January 2025)
- **Realistic Geographic Projection**: Implemented authentic lat/lon coordinate system for all Caribbean locations
- **Land Mass Visualization**: Added proper coastlines for Florida, Cuba, Jamaica, Hispaniola, Puerto Rico, Venezuela, Yucatan Peninsula, Central America, Trinidad, and mainland Mexico
- **Expanded Location Database**: 40+ historically accurate pirate locations with real coordinates
- **Enhanced Visual Design**: Navigation grid lines, faction-colored ports, and comprehensive map legend
- **Responsive Layout**: Fixed screen overflow issues with percentage-based positioning and SVG viewBox
- **Interactive Features**: Clickable locations with detailed information panels showing coordinates, faction, and port details
- **Improved Readability**: Scaled up port icons and text for better visibility (large: 10x10, medium: 8x8, small: 6x6 pixels)

### Dynamic Encounter System (January 2025)
- **Faction-Based Encounters**: Different encounter types based on faction territories (Spanish treasure fleets, pirate raiders, merchant convoys, navy patrols)
- **Historical Accuracy**: Encounters weighted by historical trade routes and faction presence (Spanish treasure routes, pirate havens, trade hubs)
- **Strategic Gameplay**: Encounter probabilities influenced by player reputation, route value, seasonal patterns, and faction relationships
- **Dynamic UI**: Interactive encounter interface with fight/flee options and detailed enemy force information
- **Seasonal Variations**: Hurricane season affects encounter rates and treasure fleet movements (June-November)
- **Route-Based Logic**: Valuable routes (treasure ports to Spanish territories) have higher chances of treasure fleet encounters
- **Reputation Impact**: Player's reputation and infamy affect both encounter frequency and escape success rates

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
- **Ship System**: Player and AI-controlled ships with physics, combat, and boarding mechanics
- **Ocean Rendering**: Dynamic animated water surface with weather and time-based color changes
- **Combat System**: Cannonball physics, collision detection, and ship boarding combat
- **Trading System**: Port-based economy with supply/demand mechanics and governor interactions
- **Weather System**: Dynamic weather effects influencing ocean appearance and wave behavior
- **Treasure System**: Treasure burying mechanics with persistent world markers
- **Fleet Management**: Captured ship management and display systems

### UI System
- **Menu System**: Main menu, enhanced trading interfaces, and comprehensive game HUD
- **3D Interface**: Integrated UI overlays within the 3D canvas with weather and time display
- **Audio Management**: Background music and sound effects with mute controls
- **Keyboard Controls**: WASD movement, space for combat, E for interactions/boarding, B for treasure burying
- **Status Display**: Ship health, crew morale, reputation, infamy, and fleet management

### State Management
- **Game State**: Zustand store managing player progress, ships, fleet, treasure, and world state
- **Audio State**: Separate audio management system for music and sound effects
- **Persistent Data**: Local storage integration for game saves
- **Weather State**: Dynamic weather and time management system
- **Fleet State**: Captured ship management and crew morale tracking
- **Encounter State**: Dynamic encounter generation with faction-based logic and probability calculations

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

### Encounter System Flow
1. **Route Analysis**: System evaluates current sailing route for encounter probability
2. **Faction Logic**: Encounters generated based on faction territories and historical accuracy
3. **Probability Calculation**: Factors in route value, player reputation, season, and faction presence
4. **Encounter Resolution**: Player chooses fight or flee, with reputation affecting escape success
5. **Combat Transition**: Fighting transitions to combat mode with generated enemy ships

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