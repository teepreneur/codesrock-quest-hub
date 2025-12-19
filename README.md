# CodesRock Quest Hub

A gamified teacher portal for professional development and training management. This platform helps teachers track their progress, earn XP and badges, watch educational videos, and engage with learning resources in an interactive, game-like environment.

## Live Demo

- **Teacher Portal**: [Coming Soon]
- **Admin Panel**: [Coming Soon]

## Features

### Teacher Portal
- **Dashboard** - Overview of progress, XP, level, and recent activities
- **Video Library** - Watch courses, track progress, earn XP on completion
- **Resources** - Download PDFs, worksheets, and learning materials
- **Achievements** - Earn badges for milestones and activities
- **Certificates** - View and download earned certificates
- **Calendar** - Track upcoming training sessions and events

### Admin Panel (Super Admin)
- **User Management** - Create, edit, and manage teacher accounts
- **Content Management** - Add/edit courses, videos, and resources
- **Analytics** - View platform usage statistics
- **School Management** - Manage schools and their teachers

### Gamification System
- **XP Points** - Earn XP by watching videos and completing activities
- **Levels** - Progress through 8 levels from "Code Cadet" to "CodesRock Champion"
- **Badges** - Unlock achievements for various milestones
- **Leaderboard** - Compete with other teachers
- **Streaks** - Maintain daily learning streaks

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS + Shadcn/UI
- React Router v6
- Sonner (toast notifications)

### Backend
- Node.js + Express
- TypeScript
- Supabase (PostgreSQL database + Auth)
- JWT Authentication
- Row-Level Security (RLS)

### Database
- Supabase (PostgreSQL)
- Tables: profiles, courses, resources, video_progress, user_progress, badges, activities

## Project Structure

```
codesrock-quest-hub/
├── codesrock-frontend/     # React + TypeScript frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API service layer
│   │   └── config/         # Configuration files
│   └── package.json
│
├── codesrock-backend/      # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth & validation middleware
│   │   └── config/         # Supabase configuration
│   └── package.json
│
└── README.md
```

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Supabase account (free tier available)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/teepreneur/codesrock-quest-hub.git
cd codesrock-quest-hub
```

### 2. Setup Backend

```bash
cd codesrock-backend
npm install

# Create .env file
cp .env.example .env

# Update .env with your Supabase credentials:
# SUPABASE_URL=your_supabase_url
# SUPABASE_SERVICE_KEY=your_service_role_key
# JWT_SECRET=your_jwt_secret

# Start backend server (runs on port 5001)
npm run dev
```

### 3. Setup Frontend

```bash
cd ../codesrock-frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5001" > .env

# Start frontend dev server (runs on port 8080)
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health

## Login Options

### Teacher Portal
- Login with school credentials (School Code + Username + Password)
- Or login with email/password

### Admin Portal
- Access at `/admin/login`
- Requires admin role credentials

## API Endpoints

### Authentication
- `POST /api/auth/login` - Email login
- `POST /api/auth/login-school` - School credentials login
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses/progress` - Update video progress

### Gamification
- `GET /api/progress/:userId` - Get user progress
- `GET /api/leaderboard` - Get leaderboard
- `GET /api/badges` - Get all badges

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `GET /api/admin/content/courses` - List courses
- `POST /api/admin/content/courses` - Create course

## Development

### Backend Commands
```bash
cd codesrock-backend
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm run start        # Start production server
```

### Frontend Commands
```bash
cd codesrock-frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Deployment

### Backend (Render/Railway)
1. Connect your GitHub repository
2. Set environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY, JWT_SECRET)
3. Deploy

### Frontend (GitHub Pages/Vercel/Netlify)
1. Build: `npm run build`
2. Deploy the `dist` folder
3. Set VITE_API_URL to your deployed backend URL

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Proprietary - CodesRock

## Support

For issues and questions, please create an issue in the repository or contact the development team.

---

Built with love for educators everywhere.
