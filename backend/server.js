import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'civic-complaint-backend' });
});

app.post('/api/complaints', upload.single('image'), async (req, res) => {
  try {
    const { userId, title, description, location, categoryId } = req.body;

    if (!userId || !title || !description || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let imageUrl = null;
    let aiCategory = null;
    let aiConfidence = null;

    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const fileBuffer = fs.readFileSync(req.file.path);

      const { error: uploadError } = await supabase.storage
        .from('complaint-images')
        .upload(fileName, fileBuffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
      } else {
        const { data: urlData } = supabase.storage
          .from('complaint-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      try {
        const mlResponse = await axios.post(
          `${process.env.FLASK_ML_SERVICE_URL}/api/classify`,
          { imagePath: req.file.path },
          { timeout: 10000 }
        );

        aiCategory = mlResponse.data.category;
        aiConfidence = mlResponse.data.confidence;
      } catch (mlError) {
        console.error('ML service error:', mlError.message);
      }

      fs.unlinkSync(req.file.path);
    }

    const priority = calculatePriority(categoryId, description);

    const { data: categoryData } = await supabase
      .from('complaint_categories')
      .select('department_id')
      .eq('id', categoryId || aiCategory)
      .single();

    const { data, error } = await supabase
      .from('complaints')
      .insert({
        user_id: userId,
        title,
        description,
        location,
        category_id: categoryId || aiCategory,
        department_id: categoryData?.department_id,
        image_url: imageUrl,
        priority,
        ai_detected_category: aiCategory,
        ai_category_confidence: aiConfidence,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.from('complaint_history').insert({
      complaint_id: data.id,
      action: 'created',
      new_value: 'pending',
      actor_id: userId,
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/complaints', async (req, res) => {
  try {
    const { userId, role, status, category } = req.query;

    let query = supabase.from('complaints').select('*');

    if (role !== 'admin' && userId) {
      query = query.eq('user_id', userId);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    query = query.order('priority', { ascending: false });
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/complaints/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, departmentId, actorId } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (departmentId) updates.department_id = departmentId;
    if (status === 'resolved') updates.resolved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('complaint_history').insert({
      complaint_id: id,
      action: status ? 'status_changed' : 'assigned',
      new_value: status || departmentId,
      actor_id: actorId,
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating complaint:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const { data: complaints } = await supabase
      .from('complaints')
      .select('status, priority');

    const stats = {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'pending').length,
      assigned: complaints.filter(c => c.status === 'assigned').length,
      in_progress: complaints.filter(c => c.status === 'in_progress').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      high_priority: complaints.filter(c => c.priority >= 7).length,
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('complaint_categories')
      .select('*');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/departments', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*');

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: error.message });
  }
});

function calculatePriority(categoryId, description) {
  let priority = 5;

  const urgentKeywords = ['emergency', 'urgent', 'danger', 'hazard', 'safety', 'blocked', 'overflow', 'large', 'deep'];
  const descLower = description.toLowerCase();

  if (urgentKeywords.some(keyword => descLower.includes(keyword))) {
    priority += 2;
  }

  return Math.min(priority, 10);
}

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
