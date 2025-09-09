import React from "react";
import { Bell, Clock, Globe, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function AlertCard({ alert, onToggle, language }) {
  const formatDate = (date) => {
    return format(new Date(date), "PPpp", {
      locale: language === "ar" ? ar : undefined
    });
  };

  const getImpactColor = (level) => {
    switch (level) {
      case "high": return "text-red-500 bg-red-100 dark:bg-red-900/20";
      case "medium": return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20";
      case "low": return "text-green-500 bg-green-100 dark:bg-green-900/20";
      default: return "text-gray-500 bg-gray-100 dark:bg-gray-700";
    }
  };

  const impactText = {
    high: language === "ar" ? "تأثير عالي" : "High Impact",
    medium: language === "ar" ? "تأثير متوسط" : "Medium Impact", 
    low: language === "ar" ? "تأثير منخفض" : "Low Impact"
  };

  const isUpcoming = new Date(alert.datetime) > new Date();

  return (
    <div className={`neumorphic-card p-6 ${isUpcoming ? 'border-l-4 border-blue-500' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className={`w-5 h-5 ${alert.is_active ? 'text-blue-500' : 'text-gray-400'}`} />
          <h3 className="font-bold text-lg line-clamp-1">
            {alert.event_name}
          </h3>
        </div>
        
        <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getImpactColor(alert.impact_level)}`}>
          {impactText[alert.impact_level]}
        </span>
      </div>

      {/* Description */}
      {alert.description && (
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
          {alert.description}
        </p>
      )}

      {/* Meta Info */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDate(alert.datetime)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            <span>{alert.country}</span>
          </div>
          
          {alert.currency && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">
              {alert.currency}
            </span>
          )}
        </div>
      </div>

      {/* Status and Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {isUpcoming ? (
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xs font-medium">
                {language === "ar" ? "قادم" : "Upcoming"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-500">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">
                {language === "ar" ? "منتهي" : "Past"}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={() => onToggle(alert.id, alert.is_active)}
          className={`neumorphic-button px-3 py-1 rounded-xl text-xs font-medium transition-all ${
            alert.is_active 
              ? 'text-red-600 dark:text-red-400' 
              : 'text-green-600 dark:text-green-400'
          }`}
        >
          {alert.is_active 
            ? (language === "ar" ? "إيقاف" : "Disable")
            : (language === "ar" ? "تفعيل" : "Enable")
          }
        </button>
      </div>
    </div>
  );
}