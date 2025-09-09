import React from 'react';
import { useAuth } from './useAuth';
import { useTheme } from './ui/Theme';

// ✅ FIXED: Enhanced ProtectedRoute for public apps with optional authentication
export default function ProtectedRoute({ children, requireAuth = false }) {
  const { user, loading } = useAuth();
  const { language } = useTheme();

  // ✅ FIXED: If requireAuth is false (public app), always render children
  if (!requireAuth) {
    return children;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-4" style={{ borderColor: '#7cb342', borderTopColor: 'transparent' }}></div>
          <p className="text-secondary">
            {language === 'ar' ? 'جاري التحقق من المصادقة...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="neumorphic p-8 rounded-2xl">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {language === 'ar' ? 'تسجيل الدخول مطلوب' : 'Authentication Required'}
            </h2>
            <p className="text-secondary mb-6">
              {language === 'ar' ? 
                'يرجى تسجيل الدخول للوصول إلى هذه الميزة.' :
                'Please sign in to access this feature.'}
            </p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('show-login-modal'))}
              className="neumorphic-button px-6 py-3 font-semibold text-white rounded-xl"
              style={{ backgroundColor: '#7cb342' }}
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}