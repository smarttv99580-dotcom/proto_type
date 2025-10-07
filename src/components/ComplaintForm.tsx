import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Upload, X, MapPin, AlertCircle, Sparkles } from 'lucide-react';

type Category = {
  id: string;
  name: string;
  display_name: string;
};

type Props = {
  categories: Category[];
  onSubmit: () => void;
  onCancel: () => void;
};

export const ComplaintForm: React.FC<Props> = ({ categories, onSubmit, onCancel }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setAiProcessing(true);
    const aiCategory = await classifyImage(file);
    if (aiCategory && !categoryId) {
      setCategoryId(aiCategory);
    }
    setAiProcessing(false);
  };

  const classifyImage = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const backendUrl = localStorage.getItem('ai_backend_url') || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/classify`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('AI classification failed');
        return null;
      }

      const data = await response.json();
      const category = categories.find(c => c.name === data.category);
      return category?.id || null;
    } catch (error) {
      console.error('Error classifying image:', error);
      return null;
    }
  };

  const calculatePriority = (categoryName: string, description: string): number => {
    let priority = 5;

    const urgentKeywords = ['emergency', 'urgent', 'danger', 'hazard', 'safety', 'blocked', 'overflow'];
    const descLower = description.toLowerCase();

    if (urgentKeywords.some(keyword => descLower.includes(keyword))) {
      priority += 2;
    }

    if (categoryName === 'broken_street_light') {
      priority += 1;
    } else if (categoryName === 'garbage_overflow') {
      priority += 2;
    } else if (categoryName === 'pothole') {
      if (descLower.includes('large') || descLower.includes('deep')) {
        priority += 2;
      } else {
        priority += 1;
      }
    }

    return Math.min(priority, 10);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('complaint-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('complaint-images')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      const selectedCategory = categories.find(c => c.id === categoryId);
      const priority = calculatePriority(selectedCategory?.name || '', description);

      const selectedCategoryObj = categories.find(c => c.id === categoryId);
      const departmentId = selectedCategoryObj ? await getDepartmentId(categoryId) : null;

      const { error: insertError } = await supabase
        .from('complaints')
        .insert({
          user_id: user.id,
          title,
          description,
          location,
          category_id: categoryId || null,
          department_id: departmentId,
          image_url: imageUrl,
          priority,
          status: 'pending',
        });

      if (insertError) throw insertError;

      onSubmit();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getDepartmentId = async (categoryId: string): Promise<string | null> => {
    const { data } = await supabase
      .from('complaint_categories')
      .select('department_id')
      .eq('id', categoryId)
      .maybeSingle();

    return data?.department_id || null;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">File a Complaint</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Image
              </label>
              <div className="relative">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {aiProcessing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                          <span className="text-sm font-medium">AI Processing...</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload image</span>
                    <span className="text-xs text-gray-500 mt-1">Max 5MB</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                AI will automatically categorize your complaint from the image
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Provide detailed information about the issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Street address or landmark"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
