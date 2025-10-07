# Civic Complaint Management System - Complete Setup Guide

This is a comprehensive AI-powered civic complaint management system with separate portals for citizens and administrators.

## System Architecture

The system consists of three main components:

1. **Frontend** (React + Vite + TypeScript)
2. **Backend API** (Node.js + Express)
3. **ML Service** (Flask + CLIP AI Model)

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Supabase account (database already configured)

## Quick Start

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Start the development server (runs automatically)
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 2. Backend API Setup

```bash
cd backend

# Install dependencies
npm install

# Start the server
npm start

# Or for development with auto-reload
npm run dev
```

The backend API will be available at `http://localhost:3001`

### 3. ML Service Setup

```bash
cd ml-service

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask service
python app.py
```

The ML service will be available at `http://localhost:5000`

Note: First run will download the CLIP model (~600MB)

## Database Setup

The database is already configured with Supabase. You need to run the migration to create tables:

### Manual Database Setup (if needed)

Execute the following SQL in your Supabase SQL Editor:

The migration file contains:
- User profiles table with role-based access
- Departments and complaint categories
- Complaints table with AI classification fields
- Complaint history for audit trail
- Row Level Security (RLS) policies
- Default data for departments and categories

## Default Users

After setup, you need to create users:

### Creating an Admin User

1. Sign up through the app (creates a citizen by default)
2. In Supabase SQL Editor, run:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Creating a Citizen User

Just sign up through the app - citizens are created by default.

## Features

### Citizen Portal
- File complaints with image upload
- AI automatically categorizes complaints from images
- Track complaint status in real-time
- View complaint history
- Filter by status

### Admin Portal
- View all complaints with advanced filtering
- Real-time statistics dashboard
- Automatic categorization by AI
- Priority-based sorting
- Assign complaints to departments
- Update complaint status
- View AI confidence scores

### AI Features
- **Image Classification**: CLIP model categorizes complaint images
- **Auto-Assignment**: Complaints automatically routed to correct department
- **Priority Calculation**: Intelligent priority based on category, keywords, and AI confidence
- **Confidence Scoring**: Shows how confident the AI is in its classification

## API Endpoints

### Backend API (Port 3001)

- `GET /health` - Health check
- `POST /api/complaints` - Create complaint
- `GET /api/complaints` - Get complaints (filtered)
- `PATCH /api/complaints/:id` - Update complaint
- `GET /api/categories` - Get all categories
- `GET /api/departments` - Get all departments
- `GET /api/stats` - Get statistics

### ML Service (Port 5000)

- `GET /health` - Health check
- `POST /api/classify` - Classify single image
- `POST /api/prioritize` - Calculate priorities
- `POST /api/batch-classify` - Batch classification

## Environment Variables

### Frontend (.env)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (backend/.env)
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
FLASK_ML_SERVICE_URL=http://localhost:5000
```

### ML Service (ml-service/.env)
```
PORT=5000
FLASK_ENV=development
```

## Storage Configuration

For image uploads to work, you need to create a storage bucket in Supabase:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `complaint-images`
3. Make it public or configure appropriate policies

## Troubleshooting

### Frontend not connecting to backend
- Ensure all three services are running
- Check that ports 3001 and 5000 are not in use
- Verify environment variables are set correctly

### ML Service failing
- Ensure Python 3.8+ is installed
- Check that virtual environment is activated
- Wait for CLIP model to download on first run
- Verify sufficient disk space (~2GB)

### Database errors
- Verify Supabase credentials in .env files
- Check that migration was run successfully
- Ensure RLS policies are enabled

### Image upload failing
- Create `complaint-images` bucket in Supabase Storage
- Configure bucket permissions
- Check file size (max 5MB)

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, Multer
- **ML Service**: Flask, PyTorch, Transformers, CLIP
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Authentication**: Supabase Auth

## Priority Algorithm

Priority (1-10) is calculated based on:
- Base priority: 5
- Category weights: Garbage (+2), Street Light (+1), Pothole (+1)
- Urgency keywords (+2): emergency, urgent, danger, hazard, safety
- AI confidence boost: up to +2
- Size descriptors (+1-2): large, deep, severe

## Production Deployment

### Frontend
```bash
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend
```bash
# Use PM2 or similar process manager
pm2 start backend/server.js
```

### ML Service
```bash
# Use Gunicorn for production
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Support

For issues or questions:
1. Check the logs in each service
2. Verify all environment variables
3. Ensure database migration completed
4. Check Supabase dashboard for errors
