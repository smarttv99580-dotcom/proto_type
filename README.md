# AI-Powered Civic Complaint Management System

A comprehensive web application for managing civic complaints (garbage overflow, broken street lights, potholes) with AI-powered image classification, automatic categorization, and intelligent priority assignment.

## Features

### Citizen Portal
- File complaints with photo evidence
- AI automatically categorizes complaints from images
- Real-time status tracking
- View complaint history
- Filter and search capabilities

### Admin Dashboard
- Monitor all complaints in real-time
- Interactive statistics dashboard
- AI-assisted categorization with confidence scores
- Priority-based complaint sorting
- Assign complaints to appropriate departments
- Update complaint status
- Advanced filtering and search

### AI-Powered Features
- **Automatic Image Classification**: Uses OpenAI CLIP model to identify complaint type
- **Smart Routing**: Auto-assigns complaints to correct departments
- **Intelligent Prioritization**: Calculates priority based on category, keywords, and AI confidence
- **Confidence Scoring**: Shows AI certainty for transparency

## Technology Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Lucide React for icons
- Supabase client for real-time data

### Backend API
- Node.js with Express
- Multer for file uploads
- Supabase for database
- RESTful API design

### ML Service
- Flask web framework
- PyTorch for deep learning
- OpenAI CLIP model for image classification
- Transformers library

### Database & Storage
- Supabase (PostgreSQL)
- Row Level Security (RLS)
- Supabase Storage for images

## Quick Start

### 1. Clone and Install Frontend
```bash
npm install
npm run dev
```

### 2. Setup Backend API
```bash
cd backend
npm install
npm start
```

### 3. Setup ML Service
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 4. Database Setup
Run the SQL migration in `DATABASE_MIGRATION.sql` in your Supabase SQL Editor.

### 5. Create Admin User
After signing up, run in Supabase SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Architecture

```
┌─────────────────┐
│  React Frontend │ (Port 5173)
│  Citizen/Admin  │
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Express │ (Port 3001)
    │  Backend │
    └────┬─────┘
         │
    ┌────▼────────┐
    │   Supabase  │
    │  Database   │
    └─────────────┘
         │
    ┌────▼────────┐
    │    Flask    │ (Port 5000)
    │ ML Service  │
    └─────────────┘
```

## Key Components

### Frontend Components
- `Login.tsx` - Unified login for citizens and admins
- `CitizenPortal.tsx` - Citizen complaint management
- `AdminPortal.tsx` - Admin dashboard
- `ComplaintForm.tsx` - Complaint submission with AI
- `ComplaintCard.tsx` - Citizen complaint display
- `AdminComplaintCard.tsx` - Admin complaint management

### Backend API Endpoints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints` - List complaints
- `PATCH /api/complaints/:id` - Update complaint
- `GET /api/categories` - Get categories
- `GET /api/departments` - Get departments
- `GET /api/stats` - Get statistics

### ML Service Endpoints
- `POST /api/classify` - Classify image
- `POST /api/prioritize` - Calculate priorities
- `POST /api/batch-classify` - Batch processing

## Database Schema

### Tables
- `profiles` - User accounts with role-based access
- `departments` - Civic departments (Sanitation, Public Works, Electrical)
- `complaint_categories` - Complaint types with AI keywords
- `complaints` - All complaint records
- `complaint_history` - Audit trail

### Security
- Row Level Security (RLS) enabled on all tables
- Citizens can only view/edit their own complaints
- Admins have full access
- JWT-based authentication

## AI Classification

### Supported Categories
1. **Garbage Overflow** - Overflowing bins, waste accumulation
2. **Broken Street Light** - Non-functional street lighting
3. **Pothole** - Road damage and pavement issues

### Priority Algorithm
- Base: 5/10
- Category weight: +1 to +2
- AI confidence: +0 to +2
- Urgency keywords: +2
- Maximum: 10/10

### Keywords Detection
- Urgency: emergency, urgent, danger, hazard, safety
- Size: large, deep, severe, massive
- Impact: blocked, overflow, dangerous

## Configuration

### Frontend Environment (.env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend Environment (backend/.env)
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
FLASK_ML_SERVICE_URL=http://localhost:5000
```

### ML Service Environment (ml-service/.env)
```env
PORT=5000
FLASK_ENV=development
```

## Storage Setup

Create a Supabase Storage bucket:
1. Go to Storage in Supabase Dashboard
2. Create bucket named `complaint-images`
3. Set appropriate access policies

## Development

### Frontend Development
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run linter
npm run typecheck    # Type checking
```

### Backend Development
```bash
npm start           # Start server
npm run dev         # Start with nodemon
```

### ML Service Development
```bash
python app.py       # Start Flask server
```

## Production Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to hosting (Vercel, Netlify, etc.)
```

### Backend
```bash
# Use PM2
pm2 start backend/server.js
```

### ML Service
```bash
# Use Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## Troubleshooting

### ML Service Issues
- First run downloads CLIP model (~600MB)
- Requires ~2GB disk space
- Python 3.8+ required

### Image Upload Errors
- Check Supabase Storage bucket exists
- Verify bucket is public or has policies
- Max file size: 5MB

### Authentication Issues
- Clear browser cache
- Check Supabase auth settings
- Verify RLS policies are enabled

## Documentation

- `SETUP.md` - Detailed setup instructions
- `backend/README.md` - Backend API documentation
- `ml-service/README.md` - ML service documentation
- `DATABASE_MIGRATION.sql` - Database schema

## License

MIT License

## Support

For issues and questions, check the documentation files or create an issue.
