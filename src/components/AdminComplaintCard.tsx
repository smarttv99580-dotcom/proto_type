import React, { useState } from 'react';
import { Calendar, MapPin, TrendingUp, Building2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

type Complaint = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location: string;
  status: string;
  priority: number;
  image_url: string | null;
  created_at: string;
  category_id: string | null;
  department_id: string | null;
  ai_detected_category: string | null;
  ai_category_confidence: number | null;
};

type Category = {
  id: string;
  name: string;
  display_name: string;
};

type Department = {
  id: string;
  name: string;
  description: string | null;
};

type Props = {
  complaint: Complaint;
  categories: Category[];
  departments: Department[];
  onUpdateStatus: (complaintId: string, status: string) => void;
  onUpdateDepartment: (complaintId: string, departmentId: string) => void;
};

export const AdminComplaintCard: React.FC<Props> = ({
  complaint,
  categories,
  departments,
  onUpdateStatus,
  onUpdateDepartment,
}) => {
  const [expanded, setExpanded] = useState(false);
  const category = categories.find(c => c.id === complaint.category_id);
  const department = departments.find(d => d.id === complaint.department_id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600';
    if (priority >= 6) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-200">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {complaint.image_url && (
            <img
              src={complaint.image_url}
              alt={complaint.title}
              className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {complaint.title}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(complaint.status)}`}>
                    {complaint.status.replace('_', ' ')}
                  </span>
                  {category && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                      {category.display_name}
                    </span>
                  )}
                  <span className={`flex items-center gap-1 px-3 py-1 bg-gray-50 rounded-full text-xs font-bold ${getPriorityColor(complaint.priority)}`}>
                    <TrendingUp className="w-3 h-3" />
                    Priority {complaint.priority}/10
                  </span>
                </div>
              </div>

              <button
                onClick={() => setExpanded(!expanded)}
                className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {complaint.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                {complaint.location}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                {new Date(complaint.created_at).toLocaleString()}
              </div>
              {department && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="w-4 h-4 mr-2 text-gray-400" />
                  {department.name}
                </div>
              )}
              {complaint.ai_category_confidence && (
                <div className="flex items-center text-sm text-gray-600">
                  <Sparkles className="w-4 h-4 mr-2 text-blue-500" />
                  AI Confidence: {Math.round(complaint.ai_category_confidence * 100)}%
                </div>
              )}
            </div>

            {expanded && (
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select
                    value={complaint.status}
                    onChange={(e) => onUpdateStatus(complaint.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Department
                  </label>
                  <select
                    value={complaint.department_id || ''}
                    onChange={(e) => onUpdateDepartment(complaint.id, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Analysis
                  </h4>
                  {complaint.ai_detected_category && (
                    <p className="text-sm text-blue-800">
                      Detected Category: <strong>{complaint.ai_detected_category}</strong>
                    </p>
                  )}
                  {complaint.ai_category_confidence && (
                    <p className="text-sm text-blue-800 mt-1">
                      Confidence Score: <strong>{Math.round(complaint.ai_category_confidence * 100)}%</strong>
                    </p>
                  )}
                  <p className="text-sm text-blue-700 mt-2">
                    Priority Score: <strong>{complaint.priority}/10</strong> (Auto-calculated based on keywords and category)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
