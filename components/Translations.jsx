
const toEnDigits = (num) => {
  // This function is assumed to convert Western digits (0-9) to Eastern Arabic digits (٠-٩)
  // as it's used only in the Arabic translation context for numbers in toast messages.
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num).split('').map(digit => {
    const parsedDigit = parseInt(digit, 10);
    return isNaN(parsedDigit) ? digit : arabicNumerals[parsedDigit];
  }).join('');
};

export const translations = {
  en: {
    // Header
    appName: 'Liirat',

    // Navigation
    home: 'Home',
    economicCalendar: 'Economic Calendar', // From outline, replaces original 'calendar' for navigation
    alerts: 'Alerts',
    account: 'My Account', // From outline, new value for 'account' in navigation context
    contact: 'Contact Us', // From outline, new value for 'contact' in navigation context
    signIn: 'Sign In',
    signOut: 'Sign Out',
    // Existing navigation keys not overwritten by outline's navigation section:
    watchlist: 'My Watchlist',
    about: 'About',
    notifications: 'Notifications',
    noNotifications: 'No new notifications',
    settings: 'Settings',
    notificationHistory: 'Notification History',
    notificationSettings: 'Notification Settings',
    menu: 'Menu',
    toggleLang: 'عر',
    timezone: 'Timezone',
    selectTimezone: 'Select your timezone',

    // Hero Section
    heroTitle: 'Advanced Economic Calendar', // Overwritten by outline
    heroDescription: 'Follow important economic events and financial indicators with smart analysis in Arabic', // Overwritten by outline
    heroSubDescription: 'Accurate insights, faster decisions — all in one place.', // Kept from original

    // Economic Calendar (Main section content)
    economicCalendarTitle: 'Economic Calendar', // New from outline, specific title for the section
    calendarDescription: 'Follow key economic events and financial indicators in real-time with AI analysis.', // Kept from original
    searchPlaceholder: 'Search events or currencies...', // Kept from original
    updateNow: 'Update Now', // Kept from original
    updating: 'Updating...', // Kept from original
    loadingEvents: 'Loading events...', // Overwritten by outline
    analyze: 'Analyze', // Kept from original
    analyzing: 'Analyzing...', // Kept from original
    actual: 'Actual', // Kept from original
    forecast: 'Forecast', // Kept from original
    previous: 'Previous', // Kept from original
    all: 'All', // Kept from original
    selectDate: 'Select a date', // Kept from original
    showMore: 'Show More', // Kept from original
    showLess: 'Show Less', // Kept from original
    importance: 'Importance', // Kept from original
    country: 'Country', // Kept from original
    category: 'Category', // Kept from original
    sortBy: 'Sort by', // Kept from original
    sortByTime: 'Sort by Time', // Kept from original
    sortByCurrency: 'Sort by Currency', // Kept from original
    week: 'Week', // Kept from original
    analysisDate: 'Analysis Date', // Kept from original
    noEventsFound: 'No Events Found', // New from outline

    // New additions from outline (part of EODHD specification/runtime fix)
    columns: {
      economicEvent: "Economic Event",
      country: "Country",
      datetime: "Date & Time",
      impact: "Impact",
      actual: "Actual",
      forecast: "Forecast",
      previous: "Previous",
      comparison: "Comparison",
      period: "Period",
      actions: "Actions",
      currency: "Currency"
    },
    actions: {
      filters: "Filters",
      apply: "Apply",
      reset: "Reset",
      aiAnalysis: "AI Analysis",
      result: "Result",
      loadMore: "Load More",
      bulkResults: "Fetch 20 Results",
      refresh: "Refresh"
    },
    toasts: {
      fetching: "Fetching",
      ok: "Result fetched",
      noData: "No official result",
      failed: "Failed to fetch result",
      bulkStart: (d, t) => `Fetching ${d}/${t}...`,
      bulkDone: (d, t) => `Completed (${d}/${t})`,
      noneReady: "No events ready",
      highImpactNow: (count) => `High-impact events within the next hour: ${count}`
    },

    // Categories (No changes in outline, keeping original)
    inflation: 'Inflation',
    employment: 'Employment',
    growth: 'Growth',
    monetary: 'Monetary',
    trade: 'Trade',
    other: 'Other',

    // Countries (No changes in outline, keeping original)
    US: 'United States',
    EUR: 'Eurozone',
    GB: 'United Kingdom',
    JP: 'Japan',
    CA: 'Canada',
    AU: 'Australia',
    CH: 'Switzerland',
    DE: 'Germany',
    FR: 'France',

    // Alerts System (Main section content)
    alertsTitle: 'Smart Alert System', // Keeping original for specific context, outline's 'alertsTitle' is general
    alertsDescription: 'Set up price alerts for your favorite assets', // Kept from original
    addAlert: 'Add Alert', // Kept from original
    setAlert: 'Set Alert', // Kept from original
    changeAlert: 'Change Alert', // Kept from original
    currencyPair: 'Currency Pair or Asset', // Kept from original
    currentPrice: 'Current Price', // Kept from original
    targetPrice: 'Target Price', // Kept from original
    alertType: 'Alert Type', // Kept from original
    notificationChannel: 'Notification Channel', // Kept from original
    minutesBefore: 'Minutes Before', // Kept from original
    crosses_above: 'Crosses Above', // Kept from original
    crosses_below: 'Crosses Below', // Kept from original
    alertSet: 'Alert set successfully', // Kept from original
    alertSaved: 'Alert saved successfully!', // Kept from original
    searchPairs: 'Search pairs or assets...', // Kept from original
    priceWillAlert: 'You will be alerted when price reaches', // Kept from original
    on_release: 'On Release', // Kept from original
    before_release: 'Before Release', // Kept from original
    minutes_before: 'minutes before', // Kept from original
    confirmDelete: 'Are you sure you want to delete this alert?', // Kept from original
    deleteAlert: 'Delete Alert', // Kept from original
    activeAlerts: 'Active Alerts', // Kept from original
    noAlerts: 'No active alerts', // Kept from original
    // From outline's Alerts section:
    noAlertsFound: 'No Alerts Found', // New from outline
    createNewAlert: 'Create New Alert', // New from outline

    // Notification Channels (No changes in outline, keeping original)
    email: 'Email',
    push: 'Push Notification',
    whatsapp: 'WhatsApp',

    // Watchlist (No changes in outline, keeping original)
    watchlistTitle: 'My Watchlist',
    watchlistDescription: 'Your favorite events and financial assets.',
    noWatchlistItems: 'Your watchlist is empty',
    addFromCalendar: 'Add events from the economic calendar or assets from alerts',
    events: 'Events',
    assets: 'Assets',
    groupBy: 'Group by',
    confirmRemove: 'Remove this item from your watchlist?',
    remove: 'Remove',

    // Notification Settings (No changes in outline, keeping original)
    notifSettingsTitle: 'Notification Settings',
    notifSettingsDescription: 'Customize your notification preferences.',
    emailNotifications: 'Email Notifications',
    pushNotifications: 'Push Notifications',
    whatsappNotifications: 'WhatsApp Notifications',
    highImportanceOnly: 'High Importance Events Only',
    preferredCurrencies: 'Preferred Currencies',
    alertTypes: 'Alert Types',
    priceAlerts: 'Price Alerts',
    economicEvents: 'Economic Events',
    saveSettings: 'Save Settings',
    settingsSaved: 'Settings saved successfully!',

    // Notification History (No changes in outline, keeping original)
    notifHistoryTitle: 'Notification History',
    notifHistoryDescription: 'All your past notifications',
    noNotifHistory: 'No notifications found',
    clearAll: 'Clear All',
    markAsRead: 'Mark as Read',
    markAllRead: 'Mark All as Read',

    // Contact Form (Merged from original 'Contact Page' and outline's 'Contact Form', 'Contact Subjects', 'Contact Success', 'Form Validation')
    contactTitle: 'Contact Us', // Overwritten by outline
    contactSubtitle: 'We are here to help. Contact us for any inquiries or suggestions', // Overwritten by outline
    contactName: 'Full Name', // Overwritten by outline
    contactNamePlaceholder: 'Enter your full name', // Overwritten by outline
    contactEmail: 'Email Address', // Overwritten by outline
    contactEmailPlaceholder: 'your@email.com', // Overwritten by outline
    contactPhone: 'Phone Number', // Overwritten by outline
    contactPhonePlaceholder: 'Phone number (optional)', // Overwritten by outline
    contactSubject: 'Subject', // Overwritten by outline
    contactSubjectPlaceholder: 'Choose message topic', // Overwritten by outline
    contactMessage: 'Your Message', // Key renamed from 'Message' to 'Your Message' as per outline
    contactMessagePlaceholder: 'Write your message here...', // Overwritten by outline
    sendButton: 'Send Message', // Overwritten by outline
    sending: 'Sending...', // Overwritten by outline
    // Contact Subjects (from outline)
    subjects: [ // Overwritten by outline
      'General Inquiry',
      'Technical Support',
      'Feature Request',
      'Report Issue',
      'Business Inquiry',
      'Partnership'
    ],
    // Contact Success (from outline)
    successTitle: 'Thank you for contacting us!', // Overwritten by outline
    successMessage: 'Your message has been sent successfully. We will reply to you as soon as possible.', // Overwritten by outline
    sendAnother: 'Send Another Message', // Overwritten by outline
    // Form Validation (from outline)
    fieldRequired: 'This field is required', // Overwritten by outline
    invalidEmail: 'Invalid email address', // Overwritten by outline
    errorMessage: 'An error occurred while sending. Please try again.', // Overwritten by outline
    // Original contact page keys not explicitly in outline but part of previous contact page:
    ourEmail: 'sales@liirat.com',
    ourPhone: '+96171638452',
    invalidNumber: 'Invalid number',

    // About Page (Keeping original, outline has a new 'Why Liirat' section)
    aboutTitle: 'About Liirat News',
    missionTitle: 'Our Mission',
    missionText: 'To empower traders and investors by transforming complex financial news into clear, actionable insights. We believe that with the right tools, anyone can make smarter, more confident decisions in the financial markets.',
    sourcesTitle: 'Our Data & Sources',
    sourcesText: 'We aggregate data in real-time from trusted, official sources including central banks, government statistical agencies, and major financial institutions. Our commitment is to provide timely and accurate information you can rely on.',
    aiTechTitle: 'Our AI Technology',
    aiTechText: 'Our proprietary AI engine analyzes economic events as they happen. It goes beyond the numbers to provide context, potential market impact, and a clear explanation, all in simple language. This allows you to understand the \'why\' behind market movements instantly.',
    aiSummary: 'AI Watchlist Summary',
    analysisError: 'An error occurred while generating the AI analysis. Please try again.',

    // Why Liirat (Features) - Overwritten by outline
    whyLiiratTitle: 'Why Liirat?',
    whyLiiratSubtitle: 'Advanced platform for tracking economic events and financial indicators', // New from outline
    whyLiiratDescription: 'We provide you with a comprehensive economic calendar with smart analysis and personalized alerts, all in Arabic with an elegant and user-friendly design.', // Overwritten by outline
    whyLiiratFeatures: [ // Overwritten by outline
      {
        title: 'Real-time Updates',
        description: 'Get the latest economic data moment by moment from globally trusted sources'
      },
      {
        title: 'Smart Analysis',
        description: 'Advanced AI-powered analysis helps you understand the impact of economic events on markets'
      },
      {
        title: 'Secure & Reliable',
        description: 'We protect your data with the highest security standards and provide reliable service 24/7'
      },
      {
        title: 'Arabic Support',
        description: 'Arabic interface and analysis with specialized Arabic technical support'
      }
    ],

    // Buttons & Actions (New section from outline)
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    viewCalendar: 'View Calendar',
    createAlert: 'Create Alert',
    signUp: 'Sign Up',

    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save', // Overwritten by outline (generic save)
    edit: 'Edit',
    delete: 'Delete', // Overwritten by outline (generic delete)
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    reset: 'Reset',
    apply: 'Apply',
    // Existing common keys not overwritten:
    yes: 'Yes',
    no: 'No',
    view: 'View',
    required: 'Required',
    optional: 'Optional',
    clear: 'Clear',

    // Account (Main section content)
    accountTitle: 'Account Settings', // New from outline
    profile: 'Profile', // New from outline
    preferences: 'Preferences', // New from outline
    notifications: 'Notifications', // Overwritten by outline (same value)
    // Existing Account Center keys not overwritten by outline's Account section:
    overview: 'Overview',
    verified: 'Verified',
    symbol: 'Symbol',
    condition: 'Condition',
    targetValue: 'Target Value',
    above: 'Above',
    below: 'Below',
    percentChange: 'Percent Change',
    creating: 'Creating...',
    create: 'Create',
    noAlertsYet: 'No alerts yet',
    noFavoritesYet: 'No favorites yet',
    economicEvent: 'Economic Event',
    article: 'Article',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    logout: 'Logout',
    weAreHereToHelp: 'We\'re here to help',
    contactUsForSupport: 'Contact us for technical support',
    sendEmail: 'Send Email',
    contactForm: 'Contact Form',

    // Status (New section from outline)
    active: 'Active',
    inactive: 'Inactive',
    enabled: 'Enabled',
    disabled: 'Disabled',

    // Time (New section from outline)
    today: 'Today', // Overwritten by outline
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week', // Overwritten by outline
    lastWeek: 'Last Week',
    nextWeek: 'Next Week', // Overwritten by outline
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    nextMonth: 'Next Month',

    // Currency (New section from outline)
    currency: 'Currency', // Overwritten by outline
    amount: 'Amount',
    price: 'Price',
    change: 'Change',

    // Impact levels (New section from outline)
    high: 'High', // Overwritten by outline
    medium: 'Medium', // Overwritten by outline
    low: 'Low' // Overwritten by outline
  },
  ar: {
    // Header
    appName: 'ليرات',

    // Navigation
    home: 'الرئيسية',
    economicCalendar: 'التقويم الاقتصادي', // From outline, replaces original 'calendar' for navigation
    alerts: 'التنبيهات',
    account: 'حسابي', // From outline, new value for 'account' in navigation context
    contact: 'اتصل بنا', // From outline, new value for 'contact' in navigation context
    signIn: 'تسجيل الدخول',
    signOut: 'تسجيل الخروج',
    // Existing navigation keys not overwritten by outline's navigation section:
    watchlist: 'قائمتي المفضلة',
    about: 'حول',
    notifications: 'الإشعارات',
    noNotifications: 'لا توجد إشعارات جديدة',
    settings: 'الإعدادات',
    notificationHistory: 'سجل الإشعارات',
    notificationSettings: 'إعدادات الإشعارات',
    menu: 'القائمة',
    toggleLang: 'EN',
    timezone: 'المنطقة الزمنية',
    selectTimezone: 'اختر منطقتك الزمنية',

    // Hero Section
    heroTitle: 'تقويم اقتصادي متقدم', // Overwritten by outline
    heroDescription: 'تابع الأحداث الاقتصادية الهامة والمؤشرات المالية مع تحليل ذكي باللغة العربية', // Overwritten by outline
    heroSubDescription: 'تحليلات دقيقة، قرارات أسرع، في واجهة واحدة', // Kept from original

    // Economic Calendar (Main section content)
    economicCalendarTitle: 'التقويم الاقتصادي', // New from outline, specific title for the section
    calendarDescription: 'تابع أهم الأحداث الاقتصادية والمؤشرات المالية في الوقت الفعلي مع تحليلات الذكاء الاصطناعي', // Kept from original
    searchPlaceholder: 'ابحث في الأحداث أو العملات...', // Kept from original
    updateNow: 'تحديث الآن', // Kept from original
    updating: 'جاري التحديث...', // Kept from original
    loadingEvents: 'جارٍ تحميل الأحداث...', // Overwritten by outline
    analyze: 'تحليل', // Kept from original
    analyzing: 'جاري التحليل...', // Kept from original
    actual: 'الفعلي', // Kept from original
    forecast: 'المتوقع', // Kept from original
    previous: 'السابق', // Kept from original
    all: 'الكل', // Kept from original
    selectDate: 'اختر تاريخ', // Kept from original
    showMore: 'عرض المزيد', // Kept from original
    showLess: 'عرض أقل', // Kept from original
    importance: 'الأهمية', // Kept from original
    country: 'البلد', // Kept from original
    category: 'الفئة', // Kept from original
    sortBy: 'ترتيب حسب', // Kept from original
    sortByTime: 'ترتيب حسب الوقت', // Kept from original
    sortByCurrency: 'ترتيب حسب العملة', // Kept from original
    week: 'الأسبوع', // Kept from original
    analysisDate: 'تاريخ التحليل', // Kept from original
    noEventsFound: 'لا توجد أحداث', // New from outline

    // New additions from outline (part of EODHD specification/runtime fix)
    columns: {
      economicEvent: "الحدث الاقتصادي",
      country: "الدولة",
      datetime: "التاريخ والوقت",
      impact: "التأثير",
      actual: "الفعلي",
      forecast: "التوقع",
      previous: "السابق",
      comparison: "المقارنة",
      period: "الفترة",
      actions: "الإجراءات",
      currency: "العملة"
    },
    actions: {
      filters: "فلاتر",
      apply: "تطبيق",
      reset: "إعادة تعيين",
      aiAnalysis: "تحليل ذكي",
      result: "النتيجة",
      loadMore: "تحميل المزيد",
      bulkResults: "جلب 20 نتيجة",
      refresh: "تحديث"
    },
    toasts: {
      fetching: "جاري التحصيل",
      ok: "تم جلب النتيجة",
      noData: "لا توجد نتيجة رسمية",
      failed: "تعذر جلب النتيجة",
      bulkStart: (d, t) => `جلب ${toEnDigits(d)}/${toEnDigits(t)}...`,
      bulkDone: (d, t) => `اكتمل الجلب (${toEnDigits(d)}/${toEnDigits(t)})`,
      noneReady: "لا توجد أحداث جاهزة للجلب.",
      highImpactNow: (count) => `أحداث عالية التأثير خلال الساعة القادمة: ${toEnDigits(count)}`
    },

    // Categories (No changes in outline, keeping original)
    inflation: 'التضخم',
    employment: 'التوظيف',
    growth: 'النمو',
    monetary: 'النقدية',
    trade: 'التجارة',
    other: 'أخرى',

    // Countries (No changes in outline, keeping original)
    US: 'الولايات المتحدة',
    EUR: 'منطقة اليورو',
    GB: 'المملكة المتحدة',
    JP: 'اليابان',
    CA: 'كندا',
    AU: 'أستراليا',
    CH: 'سويسرا',
    DE: 'ألمانيا',
    FR: 'فرنسا',

    // Alerts System (Main section content)
    alertsTitle: 'نظام التنبيهات الذكي', // Keeping original for specific context, outline's 'alertsTitle' is general
    alertsDescription: 'قم بإعداد تنبيهات الأسعار للأصول المفضلة لديك', // Kept from original
    addAlert: 'إضافة تنبيه', // Kept from original
    setAlert: 'تعيين تنبيه', // Kept from original
    changeAlert: 'تغيير التنبيه', // Kept from original
    currencyPair: 'زوج العملة أو الأصل', // Kept from original
    currentPrice: 'السعر الحالي', // Kept from original
    targetPrice: 'السعر المستهدف', // Kept from original
    alertType: 'نوع التنبيه', // Kept from original
    notificationChannel: 'قناة الإشعار', // Kept from original
    minutesBefore: 'دقائق قبل', // Kept from original
    crosses_above: 'يخترق للأعلى', // Kept from original
    crosses_below: 'يخترق للأسفل', // Kept from original
    alertSet: 'تم إعداد التنبيه بنجاح', // Kept from original
    alertSaved: 'تم حفظ التنبيه بنجاح!', // Kept from original
    searchPairs: 'ابحث عن الأزواج أو الأصول...', // Kept from original
    priceWillAlert: 'سيتم تنبيهك عند وصول السعر إلى', // Kept from original
    on_release: 'عند الصدور', // Kept from original
    before_release: 'قبل الصدور', // Kept from original
    minutes_before: 'دقيقة قبل', // Kept from original
    confirmDelete: 'هل أنت متأكد من حذف هذا التنبيه؟', // Kept from original
    deleteAlert: 'حذف التنبيه', // Kept from original
    activeAlerts: 'التنبيهات النشطة', // Kept from original
    noAlerts: 'لا توجد تنبيهات نشطة', // Kept from original
    // From outline's Alerts section:
    noAlertsFound: 'لا توجد تنبيهات', // New from outline
    createNewAlert: 'إنشاء تنبيه جديد', // New from outline

    // Notification Channels (No changes in outline, keeping original)
    email: 'بريد إلكتروني',
    push: 'إشعار فوري',
    whatsapp: 'واتساب',

    // Watchlist (No changes in outline, keeping original)
    watchlistTitle: 'قائمتي المفضلة',
    watchlistDescription: 'الأحداث والأصول المالية التي تتابعها',
    noWatchlistItems: 'قائمتك المفضلة فارغة',
    addFromCalendar: 'أضف أحداثاً من التقويم الاقتصادي أو أصولاً من التنبيهات',
    events: 'الأحداث',
    assets: 'الأصول',
    groupBy: 'تجميع حسب',
    confirmRemove: 'إزالة هذا العنصر من قائمتك المفضلة؟',
    remove: 'إزالة',

    // Notification Settings (No changes in outline, keeping original)
    notifSettingsTitle: 'إعدادات الإشعارات',
    notifSettingsDescription: 'تخصيص تفضيلات الإشعارات الخاصة بك',
    emailNotifications: 'إشعارات البريد الإلكتروني',
    pushNotifications: 'الإشعارات الفورية',
    whatsappNotifications: 'إشعارات الواتساب',
    highImportanceOnly: 'الأحداث عالية الأهمية فقط',
    preferredCurrencies: 'العملات المفضلة',
    alertTypes: 'أنواع التنبيهات',
    priceAlerts: 'تنبيهات الأسعار',
    economicEvents: 'الأحداث الاقتصادية',
    saveSettings: 'حفظ الإعدادات',
    settingsSaved: 'تم حفظ الإعدادات بنجاح!',

    // Notification History (No changes in outline, keeping original)
    notifHistoryTitle: 'سجل الإشعارات',
    notifHistoryDescription: 'جميع الإشعارات السابقة',
    noNotifHistory: 'لا توجد إشعارات',
    clearAll: 'مسح الكل',
    markAsRead: 'تحديد كمقروء',
    markAllRead: 'تحديد الكل كمقروء',

    // Contact Form (Merged from original 'Contact Page' and outline's 'Contact Form', 'Contact Subjects', 'Contact Success', 'Form Validation')
    contactTitle: 'تواصل معنا', // Overwritten by outline
    contactSubtitle: 'نحن هنا للمساعدة. تواصل معنا لأي استفسارات أو اقتراحات', // Overwritten by outline
    contactName: 'الاسم الكامل', // Overwritten by outline
    contactNamePlaceholder: 'ادخل اسمك الكامل', // Overwritten by outline
    contactEmail: 'البريد الإلكتروني', // Overwritten by outline
    contactEmailPlaceholder: 'your@email.com', // Overwritten by outline
    contactPhone: 'رقم الهاتف', // Overwritten by outline
    contactPhonePlaceholder: 'رقم الهاتف (اختياري)', // Overwritten by outline
    contactSubject: 'الموضوع', // Overwritten by outline
    contactSubjectPlaceholder: 'اختر موضوع الرسالة', // Overwritten by outline
    contactMessage: 'رسالتك', // Key renamed from 'الرسالة' to 'رسالتك' as per outline
    contactMessagePlaceholder: 'اكتب رسالتك هنا...', // Overwritten by outline
    sendButton: 'إرسال الرسالة', // Overwritten by outline
    sending: 'جارٍ الإرسال...', // Overwritten by outline
    // Contact Subjects (from outline)
    subjects: [ // Overwritten by outline
      'استفسار عام',
      'دعم تقني',
      'طلب ميزة جديدة',
      'تقرير مشكلة',
      'استفسار تجاري',
      'شراكة'
    ],
    // Contact Success (from outline)
    successTitle: 'شكرًا لتواصلك معنا!', // Overwritten by outline
    successMessage: 'تم إرسال رسالتك بنجاح. سنقوم بالرد عليك في أقرب وقت ممكن.', // Overwritten by outline
    sendAnother: 'إرسال رسالة أخرى', // Overwritten by outline
    // Form Validation (from outline)
    fieldRequired: 'هذا الحقل مطلوب', // Overwritten by outline
    invalidEmail: 'البريد الإلكتروني غير صحيح', // Overwritten by outline
    errorMessage: 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.', // Overwritten by outline
    // Original contact page keys not explicitly in outline but part of previous contact page:
    ourEmail: 'sales@liirat.com',
    ourPhone: '+96171638452',
    invalidNumber: 'رقم غير صحيح',

    // About Page (Keeping original, outline has a new 'Why Liirat' section)
    aboutTitle: 'حول ليرات نيوز',
    missionTitle: 'مهمتنا',
    missionText: 'تمكين المتداولين والمستثمرين من خلال تحويل الأخبار المالية المعقدة إلى رؤى واضحة وقابلة للتنفيذ. نحن نؤمن أنه باستخدام الأدوات المناسبة، يمكن لأي شخص اتخاذ قرارات أكثر ذكاءً وثقة في الأسواق المالية.',
    sourcesTitle: 'بياناتنا ومصادرنا',
    sourcesText: 'نقوم بتجميع البيانات في الوقت الفعلي من مصادر رسمية وموثوقة بما في ذلك البنوك المركزية والوكالات الإحصائية الحكومية والمؤسسات المالية الكبرى. التزامنا هو توفير معلومات دقيقة وفي الوقت المناسب يمكنك الاعتماد عليها.',
    aiTechTitle: 'تقنية الذكاء الاصطناعي لدينا',
    aiTechText: 'يقوم محرك الذكاء الاصطناعي الخاص بنا بتحليل الأحداث الاقتصادية فور حدوثها. إنه يتجاوز الأرقام لتوفير السياق والتأثير المحتمل على السوق وشرح واضح، كل ذلك بلغة بسيطة. وهذا يسمح لك بفهم \'لماذا\' وراء تحركات السوق على الفور.',
    aiSummary: 'ملخص الذكاء الاصطناعي للمفضلة',
    analysisError: 'حدث خطأ أثناء إنشاء تحليل الذكاء الاصطناعي. الرجاء معاودة المحاولة.',

    // Why Liirat (Features) - Overwritten by outline
    whyLiiratTitle: 'لماذا ليرات؟',
    whyLiiratSubtitle: 'منصة متطورة لمتابعة الأحداث الاقتصادية والمؤشرات المالية', // New from outline
    whyLiiratDescription: 'نوفر لك تقويمًا اقتصاديًا شاملًا مع تحليل ذكي وتنبيهات مخصصة، كل ذلك باللغة العربية وبتصميم أنيق وسهل الاستخدام.', // Overwritten by outline
    whyLiiratFeatures: [ // Overwritten by outline
      {
        title: 'تحديث فوري',
        description: 'احصل على البيانات الاقتصادية الحديثة لحظة بلحظة من مصادر موثوقة عالميًا'
      },
      {
        title: 'تحليل ذكي',
        description: 'تحليل متطور بالذكاء الاصطناعي يساعدك على فهم تأثير الأحداث الاقتصادية على الأسواق'
      },
      {
        title: 'آمن وموثوق',
        description: 'نحمي بياناتك بأعلى معايير الأمان ونوفر خدمة موثوقة على مدار الساعة'
      },
      {
        title: 'دعم عربي',
        description: 'واجهة وتحليلات باللغة العربية مع دعم فني متخصص باللغة العربية'
      }
    ],

    // Buttons & Actions (New section from outline)
    getStarted: 'ابدأ الآن',
    learnMore: 'اعرف المزيد',
    viewCalendar: 'عرض التقويم',
    createAlert: 'إنشاء تنبيه',
    signUp: 'إنشاء حساب',

    // Common
    loading: 'جارٍ التحميل...',
    error: 'خطأ',
    success: 'نجح',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    save: 'حفظ', // Overwritten by outline (generic save)
    edit: 'تعديل',
    delete: 'حذف', // Overwritten by outline (generic delete)
    close: 'إغلاق',
    back: 'رجوع',
    next: 'التالي',
    previous: 'السابق',
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    reset: 'إعادة تعيين',
    apply: 'تطبيق',
    // Existing common keys not overwritten:
    yes: 'نعم',
    no: 'لا',
    view: 'عرض',
    required: 'مطلوب',
    optional: 'اختياري',
    clear: 'مسح',

    // Account (Main section content)
    accountTitle: 'إعدادات الحساب', // New from outline
    profile: 'الملف الشخصي', // New from outline
    preferences: 'التفضيلات', // New from outline
    notifications: 'الإشعارات', // Overwritten by outline (same value)
    // Existing Account Center keys not overwritten by outline's Account section:
    overview: 'نظرة عامة',
    verified: 'حساب مفعل',
    symbol: 'الرمز',
    condition: 'الشرط',
    targetValue: 'القيمة المستهدفة',
    above: 'أعلى من',
    below: 'أقل من',
    percentChange: 'تغيير نسبي',
    creating: 'جاري الإنشاء...',
    create: 'إنشاء',
    noAlertsYet: 'لا توجد تنبيهات',
    noFavoritesYet: 'لا توجد مفضلة',
    economicEvent: 'حدث اقتصادي',
    article: 'مقال',
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    logout: 'تسجيل الخروج',
    weAreHereToHelp: 'نحن هنا لمساعدتك',
    contactUsForSupport: 'تواصل معنا للحصول على الدعم الفني',
    sendEmail: 'إرسال بريد إلكتروني',
    contactForm: 'نموذج الاتصال',

    // Status (New section from outline)
    active: 'نشط',
    inactive: 'غير نشط',
    enabled: 'مُفعل',
    disabled: 'معطل',

    // Time (New section from outline)
    today: 'اليوم', // Overwritten by outline
    yesterday: 'أمس',
    tomorrow: 'غدًا',
    thisWeek: 'هذا الأسبوع', // Overwritten by outline
    lastWeek: 'الأسبوع الماضي',
    nextWeek: 'الأسبوع القادم', // Overwritten by outline
    thisMonth: 'هذا الشهر',
    lastMonth: 'الشهر الماضي',
    nextMonth: 'الشهر القادم',

    // Currency (New section from outline)
    currency: 'العملة', // Overwritten by outline
    amount: 'المبلغ',
    price: 'السعر',
    change: 'التغيير',

    // Impact levels (New section from outline)
    high: 'عالي', // Overwritten by outline
    medium: 'متوسط', // Overwritten by outline
    low: 'منخفض' // Overwritten by outline
  }
};

// Timezone data
export const timezones = [
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (HKT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (AST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' }
];
