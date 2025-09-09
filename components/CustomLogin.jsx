
// components/CustomLogin.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useTheme } from './ui/Theme';
import { User } from '@/api/entities';
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { signupWithPassword } from '@/api/functions';

export default function CustomLogin({ isOpen, onClose }) {
  // NOTE: We don't call authenticateUser directly. The Base44 SDK `User.loginWithPassword` will do that.
  // The useAuth hook might be used for other context, but login/register logic is handled directly here.
  const { language } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
  const [confirmPassword, setConfirmPassword] = useState(''); // New state for confirm password

  // Handle OAuth success/error from URL params
  useEffect(() => {
    if (!isOpen) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const oauthSuccess = urlParams.get('oauth_success');
    const oauthError = urlParams.get('oauth_error');
    
    if (oauthSuccess) {
      onClose();
      // Dispatch custom event for auth changes
      window.dispatchEvent(new Event('auth-changed'));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isOpen, onClose]);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (formData.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError(''); // Clear error

    try {
      const { data, error: funcError } = await signupWithPassword({ 
        email: formData.email, 
        password: formData.password, 
        name: formData.fullName 
      });

      if (funcError || !data?.success) {
        throw new Error(funcError?.error || data?.error || "Signup failed");
      }

      // After successful signup, prompt user to login
      setIsLogin(true);
      setError("Signup successful! Please log in.");

    } catch (err) {
      setError(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(''); // Clear error
    try {
      // The SDK call will handle the authentication against the backend
      // and manage the session automatically.
      await User.loginWithPassword(formData.email, formData.password);
      onClose(); // Close modal on successful login
      window.dispatchEvent(new Event('auth-changed'));
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Use Base44 built-in Google auth (no custom endpoints)
  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      await User.login(); // Base44 native Google flow
      // On successful Google login, the OAuth redirect should handle closing the modal via useEffect
    } catch (e) {
      setError('Google authentication failed. Please try again.');
      setLoading(false); // Only set loading to false if an error occurs *before* redirect
    }
  };

  const toggleMode = () => {
    if (loading) return;
    setIsLogin((v) => !v);
    setError('');
    setFormData({ email: '', password: '', fullName: '' });
    setConfirmPassword(''); // Clear confirm password when toggling mode
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="neumorphic rounded-3xl p-8 w-full max-w-md relative" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 neumorphic-button rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          disabled={loading}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6cabc23a0_liiratofficialnobg.png"
            alt="Liirat"
            className="h-16 w-auto mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-primary mb-2">
            {language === 'ar' ? 'أهلاً بك في ليرات' : 'Welcome to Liirat'}
          </h2>
          <p className="text-secondary">
            {isLogin
              ? (language === 'ar' ? 'سجل دخولك للمتابعة' : 'Sign in to continue')
              : (language === 'ar' ? 'أنشئ حسابك الآن' : 'Create your account')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 neumorphic-inset rounded-xl text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          className="w-full neumorphic-button p-4 rounded-xl font-medium mb-4 flex items-center justify-center gap-3 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 
            (language === 'ar' ? 'جاري التحميل...' : 'Loading...') :
            (language === 'ar' ? 'تسجيل الدخول بجوجل' : 'Continue with Google')
          }
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200/50 dark:border-gray-700/50"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 text-secondary bg-light-bg dark:bg-dark-bg">
              {language === 'ar' ? 'أو' : 'or'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-6" noValidate>
          {/* Full Name (Registration only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
              </label>
              <div className="relative">
                <UserIcon className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" style={{ left: language === 'ar' ? 'auto' : '16px', right: language === 'ar' ? '16px' : 'auto' }} />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder={language === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                  className="neumorphic-pressed w-full py-4 rounded-xl outline-none text-primary bg-transparent"
                  style={{ paddingLeft: language === 'ar' ? '16px' : '50px', paddingRight: language === 'ar' ? '50px' : '16px' }}
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" style={{ left: language === 'ar' ? 'auto' : '16px', right: language === 'ar' ? '16px' : 'auto' }} />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder={language === 'ar' ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                className="neumorphic-pressed w-full py-4 rounded-xl outline-none text-primary bg-transparent"
                style={{ paddingLeft: language === 'ar' ? '16px' : '50px', paddingRight: language === 'ar' ? '50px' : '16px' }}
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              {language === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" style={{ left: language === 'ar' ? 'auto' : '16px', right: language === 'ar' ? '16px' : 'auto' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                placeholder={language === 'ar' ? 'أدخل كلمة المرور' : 'Enter your password'}
                className="neumorphic-pressed w-full py-4 rounded-xl outline-none text-primary bg-transparent"
                style={{ 
                  paddingLeft: language === 'ar' ? '50px' : '50px', 
                  paddingRight: language === 'ar' ? '50px' : '50px' 
                }}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                style={{ right: language === 'ar' ? 'auto' : '16px', left: language === 'ar' ? '16px' : 'auto' }}
                disabled={loading}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Registration only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" style={{ left: language === 'ar' ? 'auto' : '16px', right: language === 'ar' ? '16px' : 'auto' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={language === 'ar' ? 'أكد كلمة المرور' : 'Confirm your password'}
                  className="neumorphic-pressed w-full py-4 rounded-xl outline-none text-primary bg-transparent"
                  style={{
                    paddingLeft: language === 'ar' ? '50px' : '50px',
                    paddingRight: language === 'ar' ? '50px' : '50px'
                  }}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  style={{ right: language === 'ar' ? 'auto' : '16px', left: language === 'ar' ? '16px' : 'auto' }}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full neumorphic-button py-4 px-6 font-semibold rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{ backgroundColor: '#7cb342' }}
          >
            {loading ? 
              (language === 'ar' ? 'جاري المعالجة...' : 'Processing...') :
              isLogin ? 
                (language === 'ar' ? 'تسجيل الدخول' : 'Sign In') : 
                (language === 'ar' ? 'إنشاء حساب' : 'Create Account')
            }
          </button>

          {/* Toggle Mode */}
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-secondary hover:text-primary transition-colors"
              disabled={loading}
            >
              {isLogin ? 
                (language === 'ar' ? 'ليس لديك حساب؟ إنشاء حساب جديد' : "Don't have an account? Sign Up") :
                (language === 'ar' ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Sign In')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
