from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

model = None
processor = None

CATEGORIES = {
    'garbage_overflow': ['garbage', 'trash', 'waste', 'overflow', 'bin', 'dumpster', 'rubbish', 'litter'],
    'broken_street_light': ['street light', 'lamp', 'light post', 'lighting', 'broken light', 'dark', 'pole', 'street lamp'],
    'pothole': ['pothole', 'road', 'street', 'crack', 'pavement', 'asphalt', 'hole', 'damage', 'road damage']
}

def load_model():
    global model, processor
    print("Loading CLIP model...")
    model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    print("Model loaded successfully!")

def classify_image(image_path):
    try:
        image = Image.open(image_path).convert('RGB')

        category_labels = list(CATEGORIES.keys())
        text_prompts = [
            f"a photo of {' or '.join(CATEGORIES[cat])}"
            for cat in category_labels
        ]

        inputs = processor(
            text=text_prompts,
            images=image,
            return_tensors="pt",
            padding=True
        )

        with torch.no_grad():
            outputs = model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1)

        confidence, predicted_idx = torch.max(probs, dim=1)
        predicted_category = category_labels[predicted_idx.item()]
        confidence_score = confidence.item()

        return predicted_category, confidence_score

    except Exception as e:
        print(f"Error classifying image: {e}")
        return None, 0.0

def calculate_priority(category, confidence, image_features=None):
    base_priority = 5

    priority_weights = {
        'garbage_overflow': 2,
        'broken_street_light': 1,
        'pothole': 1
    }

    category_priority = priority_weights.get(category, 0)

    confidence_boost = int(confidence * 2)

    priority = base_priority + category_priority + confidence_boost

    return min(priority, 10)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'civic-complaint-ml-service',
        'model_loaded': model is not None
    })

@app.route('/api/classify', methods=['POST'])
def classify():
    try:
        if 'image' not in request.files and 'imagePath' not in request.json:
            return jsonify({'error': 'No image provided'}), 400

        if 'image' in request.files:
            file = request.files['image']
            if file.filename == '':
                return jsonify({'error': 'No selected file'}), 400

            temp_path = f"/tmp/{file.filename}"
            file.save(temp_path)
            image_path = temp_path
        else:
            image_path = request.json['imagePath']

        category, confidence = classify_image(image_path)

        if category is None:
            return jsonify({'error': 'Classification failed'}), 500

        priority = calculate_priority(category, confidence)

        if 'image' in request.files:
            os.remove(temp_path)

        return jsonify({
            'category': category,
            'confidence': float(confidence),
            'priority': priority,
            'success': True
        })

    except Exception as e:
        print(f"Error in classify endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/prioritize', methods=['POST'])
def prioritize():
    try:
        data = request.json
        complaints = data.get('complaints', [])

        if not complaints:
            return jsonify({'error': 'No complaints provided'}), 400

        for complaint in complaints:
            category = complaint.get('category')
            description = complaint.get('description', '').lower()
            confidence = complaint.get('ai_confidence', 0.5)

            urgency_keywords = ['emergency', 'urgent', 'danger', 'hazard', 'safety']
            urgency_boost = 2 if any(keyword in description for keyword in urgency_keywords) else 0

            base_priority = calculate_priority(category, confidence)
            complaint['priority'] = min(base_priority + urgency_boost, 10)

        complaints.sort(key=lambda x: x['priority'], reverse=True)

        return jsonify({
            'success': True,
            'complaints': complaints
        })

    except Exception as e:
        print(f"Error in prioritize endpoint: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/batch-classify', methods=['POST'])
def batch_classify():
    try:
        data = request.json
        image_paths = data.get('images', [])

        if not image_paths:
            return jsonify({'error': 'No images provided'}), 400

        results = []
        for image_path in image_paths:
            category, confidence = classify_image(image_path)
            priority = calculate_priority(category, confidence)

            results.append({
                'image_path': image_path,
                'category': category,
                'confidence': float(confidence),
                'priority': priority
            })

        return jsonify({
            'success': True,
            'results': results
        })

    except Exception as e:
        print(f"Error in batch classify endpoint: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    load_model()
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
