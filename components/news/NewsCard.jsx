import React from "react";
import { Clock, Building, TrendingUp, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function NewsCard({ article, onClick, onGenerateAnalysis, language }) {
  const isRTL = language === "ar";
  
  const formatDate = (date) => {
    return format(new Date(date), "PPp", {
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

  return (
    <div 
      className="neumorphic-card p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02]"
      onClick={() => onClick(article)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Building className="w-4 h-4" />
          <span>{article.source}</span>
        </div>
        
        {article.impact_level && (
          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getImpactColor(article.impact_level)}`}>
            {impactText[article.impact_level]}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-lg md:text-xl font-bold mb-3 line-clamp-2 leading-tight">
        {article.title}
      </h3>

      {/* Summary */}
      {article.summary && (
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
          {article.summary}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{formatDate(article.timestamp)}</span>
        </div>

        <div className="flex items-center gap-2">
          {article.ai_analysis ? (
            <span className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
              <Sparkles className="w-3 h-3" />
              {language === "ar" ? "محلل" : "Analyzed"}
            </span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onGenerateAnalysis(article);
              }}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              <TrendingUp className="w-3 h-3" />
              {language === "ar" ? "تحليل" : "Analyze"}
            </button>
          )}
        </div>
      </div>

      {/* Tags */}
      {article.tags && article.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {article.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}