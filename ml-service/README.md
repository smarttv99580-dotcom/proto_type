# Civic Complaint ML Service

Flask-based machine learning service for AI-powered image classification and complaint prioritization.

## Features

- **Image Classification**: Uses OpenAI's CLIP model to automatically categorize complaint images
- **Priority Calculation**: Intelligent priority assignment based on category, confidence, and keywords
- **Batch Processing**: Support for classifying multiple images at once
- **Real-time Analysis**: Fast inference for instant categorization

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables in `.env`:
```
PORT=5000
FLASK_ENV=development
```

4. Run the service:
```bash
python app.py
```

## API Endpoints

### Health Check
- `GET /health` - Check service status and model loading

### Classification
- `POST /api/classify` - Classify a single image
  - Request: Form-data with `image` file OR JSON with `imagePath`
  - Response: `{ category, confidence, priority }`

### Prioritization
- `POST /api/prioritize` - Calculate priorities for multiple complaints
  - Request: JSON with array of complaints
  - Response: Sorted array with priority scores

### Batch Classification
- `POST /api/batch-classify` - Classify multiple images
  - Request: JSON with array of image paths
  - Response: Array of classification results

## Model Details

The service uses OpenAI's CLIP (Contrastive Language-Image Pre-training) model:
- **Model**: `openai/clip-vit-base-patch32`
- **Categories**: Garbage Overflow, Broken Street Light, Pothole
- **Confidence Threshold**: 0-1 (higher is better)

## Priority Algorithm

Priority is calculated based on:
1. Base priority: 5
2. Category weight: +1 to +2
3. AI confidence: +0 to +2
4. Urgency keywords: +2
5. Max priority: 10

## Categories

### Garbage Overflow
Keywords: garbage, trash, waste, overflow, bin, dumpster, rubbish, litter

### Broken Street Light
Keywords: street light, lamp, light post, lighting, broken light, dark, pole

### Pothole
Keywords: pothole, road, street, crack, pavement, asphalt, hole, damage

## Testing

Example curl request:
```bash
curl -X POST http://localhost:5000/api/classify \
  -F "image=@/path/to/image.jpg"
```

## Notes

- First run will download the CLIP model (~600MB)
- Requires Python 3.8+
- GPU acceleration recommended but not required
- For production, use a WSGI server like Gunicorn
