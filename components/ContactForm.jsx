
import React, { useState } from "react";
import { ContactMessage } from "@/api/entities";
import { sendContactMessage } from "@/api/functions";
import { Send, User, Mail, MessageSquare, CheckCircle, AlertCircle, Phone } from "lucide-react";
import { useTheme } from "./ui/Theme";
import { toEnDigits } from "./enDigits";
import { TEST } from "./utils";

export default function ContactForm() {
  const { language, t } = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const isRTL = language === 'ar';

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = t.fieldRequired;
    }
    if (!formData.email.trim()) {
      errors.email = t.fieldRequired;
    } else if (!TEST(formData.email, /\S+@\S+\.\S+/)) {
      errors.email = t.invalidEmail;
    }
    if (!formData.subject) {
      errors.subject = t.fieldRequired;
    }
    if (!formData.message.trim()) {
      errors.message = t.fieldRequired;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for the current field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);
    setError("");

    try {
      // Use the backend function
      const { data } = await sendContactMessage(formData);
      
      if (data.success) {
        setSubmitted(true);
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
          phone: ""
        });
        setFormErrors({});
      } else {
        setError(t.errorMessage);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setError("");
    setFormErrors({});
  };

  if (submitted) {
    return (
      <div className="px-4 py-16 bg-light-bg dark:bg-dark-bg min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-2xl mx-auto">
          <div className="neumorphic p-12 text-center rounded-3xl">
            <div className="w-20 h-20 neumorphic-raised rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            
            <h2 className="text-3xl font-bold text-primary mb-4">
              {t.successTitle}
            </h2>
            
            <p className="text-lg text-secondary mb-8 leading-relaxed">
              {t.successMessage}
            </p>
            
            <button
              onClick={resetForm}
              className="neumorphic-button px-8 py-4 flex items-center gap-3 mx-auto text-lg font-semibold hover:scale-105 transition-transform rounded-xl text-white"
              style={{ backgroundColor: '#7cb342' }}
            >
              <Send className="w-5 h-5" />
              {t.sendAnother}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-16 bg-light-bg dark:bg-dark-bg" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 service-title">{t.contactTitle}</h1>
          <p className="text-xl text-secondary">{t.contactSubtitle}</p>
        </div>

        {/* Contact Info Header with English digits */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="neumorphic-raised p-6 rounded-2xl flex items-center gap-4">
            <Mail className="w-8 h-8 flex-shrink-0" style={{ color: '#7cb342' }} />
            <div>
              <h4 className="font-bold text-lg text-primary">{t.contactEmail}</h4>
              <a href="mailto:sales@liirat.com" className="text-secondary hover:text-blue-500 transition-colors break-all">
                sales@liirat.com
              </a>
            </div>
          </div>
          <div className="neumorphic-raised p-6 rounded-2xl flex items-center gap-4">
            <Phone className="w-8 h-8 flex-shrink-0" style={{ color: '#7cb342' }} />
            <div>
              <h4 className="font-bold text-lg text-primary">{t.contactPhone}</h4>
              <a 
                href="tel:+96171638452" 
                className="text-secondary hover:text-blue-500 transition-colors"
                lang="en" 
                dir="ltr" 
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {toEnDigits('+96171638452')}
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="neumorphic p-8 rounded-3xl">
            {error && (
              <div className="mb-6 p-4 neumorphic-inset rounded-xl flex items-center gap-3 text-red-600 bg-red-50 dark:bg-red-900/20">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t.contactName} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" style={{ left: isRTL ? 'auto' : '16px', right: isRTL ? '16px' : 'auto' }} />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t.contactNamePlaceholder}
                    className={`neumorphic-pressed w-full py-4 rounded-xl outline-none text-primary bg-transparent transition-all ${formErrors.name ? 'ring-2 ring-red-500' : ''}`}
                    style={{ paddingLeft: isRTL ? '16px' : '50px', paddingRight: isRTL ? '50px' : '16px' }}
                    required
                  />
                  {formErrors.name && <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>}
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t.contactEmail} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" style={{ left: isRTL ? 'auto' : '16px', right: isRTL ? '16px' : 'auto' }} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t.contactEmailPlaceholder}
                    className={`neumorphic-pressed w-full py-4 rounded-xl outline-none text-primary bg-transparent transition-all ${formErrors.email ? 'ring-2 ring-red-500' : ''}`}
                    style={{ paddingLeft: isRTL ? '16px' : '50px', paddingRight: isRTL ? '50px' : '16px' }}
                    required
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t.contactPhone}
                </label>
                <div className="relative">
                  <Phone className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" style={{ left: isRTL ? 'auto' : '16px', right: isRTL ? '16px' : 'auto' }} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder={t.contactPhonePlaceholder}
                    className="neumorphic-pressed w-full py-4 rounded-xl outline-none text-primary bg-transparent"
                    style={{ paddingLeft: isRTL ? '16px' : '50px', paddingRight: isRTL ? '50px' : '16px' }}
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t.contactSubject} <span className="text-red-500">*</span>
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={`neumorphic-pressed w-full py-4 px-4 rounded-xl outline-none text-primary bg-transparent transition-all ${formErrors.subject ? 'ring-2 ring-red-500' : ''}`}
                  required
                >
                  <option value="">{t.contactSubjectPlaceholder}</option>
                  {t.subjects.map((subject, index) => (
                    <option key={index} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
                {formErrors.subject && <p className="text-red-500 text-sm mt-1">{formErrors.subject}</p>}
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  {t.contactMessage} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute top-4 text-gray-400 w-5 h-5" style={{ left: isRTL ? 'auto' : '16px', right: isRTL ? '16px' : 'auto' }} />
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder={t.contactMessagePlaceholder}
                    rows={6}
                    className={`neumorphic-pressed w-full resize-none py-4 rounded-xl outline-none text-primary bg-transparent transition-all ${formErrors.message ? 'ring-2 ring-red-500' : ''}`}
                    style={{ paddingLeft: isRTL ? '16px' : '50px', paddingRight: isRTL ? '50px' : '16px', paddingTop: '16px' }}
                    required
                  />
                  {formErrors.message && <p className="text-red-500 text-sm mt-1">{formErrors.message}</p>}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="neumorphic-button w-full py-4 px-8 flex items-center justify-center gap-3 text-lg font-semibold rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                style={{ backgroundColor: '#7cb342' }}
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    {t.sending}
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    {t.sendButton}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Additional Contact Info */}
          <div className="space-y-6">
            <div className="neumorphic-raised p-6 rounded-2xl">
              <h4 className="font-bold text-lg text-primary mb-3">{language === 'ar' ? 'ساعات العمل' : 'Business Hours'}</h4>
              <div className="space-y-2 text-secondary">
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'الأحد - الخميس' : 'Sunday - Thursday'}</span>
                  <span 
                    lang="en" 
                    dir="ltr" 
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {toEnDigits('9:00 AM - 6:00 PM')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'الجمعة - السبت' : 'Friday - Saturday'}</span>
                  <span>{language === 'ar' ? 'مغلق' : 'Closed'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
