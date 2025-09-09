
import React, { useState } from "react";
import { X, Clock, Building, Sparkles, TrendingUp, Copy, Share } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function NewsDetailModal({ article, isOpen, onClose, onGenerateAnalysis, language }) {
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);

  if (!isOpen) return null;

  const formatDate = (date) => {
    return format(new Date(date), "PPpp", {
      locale: language === "ar" ? ar : undefined
    });
  };

  const handleGenerateAnalysis = async () => {
    setGeneratingAnalysis(true);
    await onGenerateAnalysis(article);
    setGeneratingAnalysis(false);
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="neumorphic-card max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Building className="w-4 h-4" />
              <span>{article.source}</span>
            </div>
            
            {article.impact_level && (
              <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getImpactColor(article.impact_level)}`}>
                {impactText[article.impact_level]}
              </span>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="neumorphic-button p-2 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Title and Meta */}
          <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(article.timestamp)}</span>
            </div>
            {article.country && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                {article.country}
              </span>
            )}
          </div>

          {/* Summary */}
          {article.summary && (
            <div className="neumorphic-pressed p-4 rounded-2xl mb-6">
              <h3 className="font-semibold mb-2  text-green-600 dark:text-green-400">
                {language === "ar" ? "ملخص سريع" : "Quick Summary"}
              </h3>
              <p className="text-sm leading-relaxed">{article.summary}</p>
            </div>
          )}

          {/* Content */}
          <div className="prose dark:prose-invert max-w-none mb-8">
            <h3 className="font-semibold mb-3">
              {language === "ar" ? "تفاصيل الخبر" : "Article Details"}
            </h3>
            <p className="leading-relaxed whitespace-pre-line">{article.content}</p>
          </div>

          {/* AI Analysis Section */}
          <div className="neumorphic-raised p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                {language === "ar" ? "تحليل الذكاء الاصطناعي" : "AI Analysis"}
              </h3>
              
              {!article.ai_analysis && (
                <button
                  onClick={handleGenerateAnalysis}
                  disabled={generatingAnalysis}
                  className="neumorphic-button px-4 py-2 rounded-xl font-medium flex items-center gap-2"
                >
                  {generatingAnalysis ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <TrendingUp className="w-4 h-4" />
                  )}
                  {language === "ar" ? "إنشاء تحليل" : "Generate Analysis"}
                </button>
              )}
            </div>

            {generatingAnalysis ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="mr-3 text-sm">
                  {language === "ar" ? "جاري إنشاء التحليل..." : "Generating analysis..."}
                </span>
              </div>
            ) : article.ai_analysis ? (
              <div className="neumorphic-pressed p-4 rounded-2xl">
                <p className="leading-relaxed whitespace-pre-line">{article.ai_analysis}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>
                  {language === "ar" 
                    ? "انقر على 'إنشاء تحليل' للحصول على تحليل ذكي لهذا الخبر"
                    : "Click 'Generate Analysis' to get smart insights for this news"
                  }
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold mb-3">
                {language === "ar" ? "الكلمات المفتاحية" : "Tags"}
              </h4>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-xl"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button className="neumorphic-button px-4 py-2 rounded-xl font-medium flex items-center gap-2">
            <Copy className="w-4 h-4" />
            {language === "ar" ? "نسخ" : "Copy"}
          </button>
          <button className="neumorphic-button px-4 py-2 rounded-xl font-medium flex items-center gap-2">
            <Share className="w-4 h-4" />
            {language === "ar" ? "مشاركة" : "Share"}
          </button>
        </div>
      </div>
    </div>
  );
}
