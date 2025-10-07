# Civic Complaint Backend API

Node.js/Express backend for the civic complaint management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
FLASK_ML_SERVICE_URL=http://localhost:5000
```

3. Run the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Complaints
- `POST /api/complaints` - Create a new complaint (with image upload)
- `GET /api/complaints` - Get all complaints (filtered by user/status/category)
- `PATCH /api/complaints/:id` - Update complaint status/department

### Categories & Departments
- `GET /api/categories` - Get all complaint categories
- `GET /api/departments` - Get all departments

### Statistics
- `GET /api/stats` - Get complaint statistics

## Features

- Image upload handling with Multer
- Integration with Supabase for data storage
- Integration with Flask ML service for AI classification
- Automatic priority calculation
- Complaint history tracking
