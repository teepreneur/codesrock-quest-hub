# CodesRock Quest Hub - Frontend

React + TypeScript frontend application for the CodesRock Quest Hub teacher portal.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Shadcn/UI** - Component library
- **React Router** - Routing
- **TanStack Query** - Data fetching and caching

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Environment Variables

Create a `.env` file with:

```env
VITE_API_URL=http://localhost:5001
```

### Development

```bash
# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
codesrock-frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── config/         # Configuration files
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility libraries
│   ├── utils/          # Utility functions
│   └── App.tsx         # Main app component
├── public/             # Static assets
└── index.html          # HTML entry point
```

## Features

- Teacher authentication and authorization
- Gamified dashboard with progress tracking
- Course management
- Resource library
- Video tutorials
- Achievement system
- Leaderboard

## API Integration

The frontend communicates with the backend API through a centralized service layer in `src/services/`. All API calls include automatic token management and error handling.

## Contributing

See the main project README for contribution guidelines.
