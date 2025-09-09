
import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CreateAlertModal({ isOpen, onClose, onSave, language }) {
  const [alertData, setAlertData] = useState({
    event_name: "",
    impact_level: "medium",
    datetime: "",
    country: "",
    description: "",
    currency: "",
    is_active: true
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSave(alertData);
      setAlertData({
        event_name: "",
        impact_level: "medium",
        datetime: "",
        country: "",
        description: "",
        currency: "",
        is_active: true
      });
    } catch (error) {
      console.error("Error saving alert:", error);
    } finally {
      setSaving(false);
    }
  };

  const countries = [
    "United States", "United Kingdom", "Germany", "France", "Japan", 
    "China", "Canada", "Australia", "Switzerland", "Netherlands",
    "Saudi Arabia", "UAE", "Egypt", "Kuwait", "Qatar"
  ];

  const currencies = [
    "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY",
    "SAR", "AED", "EGP", "KWD", "QAR"
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="neumorphic-card max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-500" />
            {language === "ar" ? "إنشاء تنبيه جديد" : "Create New Alert"}
          </h2>
          <button
            onClick={onClose}
            className="neumorphic-button p-2 rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {language === "ar" ? "اسم الحدث" : "Event Name"}
            </label>
            <input
              type="text"
              value={alertData.event_name}
              onChange={(e) => setAlertData(prev => ({ ...prev, event_name: e.target.value }))}
              className="neumorphic-input w-full p-3 rounded-xl"
              required
              placeholder={language === "ar" ? "مثل: اجتماع البنك المركزي" : "e.g., Federal Reserve Meeting"}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {language === "ar" ? "الوصف" : "Description"}
            </label>
            <textarea
              value={alertData.description}
              onChange={(e) => setAlertData(prev => ({ ...prev, description: e.target.value }))}
              className="neumorphic-input w-full p-3 rounded-xl h-20 resize-none"
              placeholder={language === "ar" ? "وصف مختصر للحدث..." : "Brief description of the event..."}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {language === "ar" ? "مستوى التأثير" : "Impact Level"}
              </label>
              <select
                value={alertData.impact_level}
                onChange={(e) => setAlertData(prev => ({ ...prev, impact_level: e.target.value }))}
                className="neumorphic-input w-full p-3 rounded-xl"
              >
                <option value="low">{language === "ar" ? "منخفض" : "Low"}</option>
                <option value="medium">{language === "ar" ? "متوسط" : "Medium"}</option>
                <option value="high">{language === "ar" ? "عالي" : "High"}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {language === "ar" ? "العملة" : "Currency"}
              </label>
              <select
                value={alertData.currency}
                onChange={(e) => setAlertData(prev => ({ ...prev, currency: e.target.value }))}
                className="neumorphic-input w-full p-3 rounded-xl"
              >
                <option value="">{language === "ar" ? "اختر العملة" : "Select Currency"}</option>
                {currencies.map(currency => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {language === "ar" ? "الدولة" : "Country"}
            </label>
            <select
              value={alertData.country}
              onChange={(e) => setAlertData(prev => ({ ...prev, country: e.target.value }))}
              className="neumorphic-input w-full p-3 rounded-xl"
              required
            >
              <option value="">{language === "ar" ? "اختر الدولة" : "Select Country"}</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {language === "ar" ? "التاريخ والوقت" : "Date & Time"}
            </label>
            <input
              type="datetime-local"
              value={alertData.datetime}
              onChange={(e) => setAlertData(prev => ({ ...prev, datetime: e.target.value }))}
              className="neumorphic-input w-full p-3 rounded-xl"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-4">
            <input
              type="checkbox"
              id="is_active"
              checked={alertData.is_active}
              onChange={(e) => setAlertData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="neumorphic-input"
            />
            <label htmlFor="is_active" className="text-sm">
              {language === "ar" ? "تفعيل التنبيه فوراً" : "Activate alert immediately"}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="neumorphic-button px-6 py-2 rounded-xl font-medium"
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="neumorphic-button px-6 py-2 rounded-xl font-medium bg-green-500 text-white flex items-center gap-2"
            >
              {saving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {language === "ar" ? "إنشاء" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
