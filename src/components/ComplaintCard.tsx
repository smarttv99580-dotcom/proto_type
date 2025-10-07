import React from 'react';
import { Calendar, MapPin, TrendingUp, Image as ImageIcon } from 'lucide-react';

type Complaint = {
  id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  priority: number;
  image_url: string | null;
  created_at: string;
  category_id: string | null;
  ai_detected_category: string | null;
  ai_category_confidence: number | null;
};

type Category = {
  id: string;
  name: string;
  display_name: string;
};

type Props = {
  complaint: Complaint;
  categories: Category[];
  getStatusColor: (status: string) => string;
};

export const ComplaintCard: React.FC<Props> = ({ complaint, categories, getStatusColor }) => {
  const category = categories.find(c => c.id === complaint.category_id);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {complaint.image_url && (
        <img
          src={complaint.image_url}
          alt={complaint.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex-1">
            {complaint.title}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
            {complaint.status.replace('_', ' ')}
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {complaint.description}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
            {complaint.location}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
            {new Date(complaint.created_at).toLocaleDateString()}
          </div>
          {category && (
            <div className="flex items-center text-sm text-gray-600">
              <ImageIcon className="w-4 h-4 mr-2 text-gray-400" />
              {category.display_name}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 mr-1 text-orange-500" />
            <span className="text-gray-600">Priority:</span>
            <span className="ml-1 font-semibold text-gray-900">{complaint.priority}/10</span>
          </div>
          {complaint.ai_category_confidence && (
            <div className="text-xs text-gray-500">
              AI: {Math.round(complaint.ai_category_confidence * 100)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
