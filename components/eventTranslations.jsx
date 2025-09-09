
// Comprehensive Economic Event Translations
import { MATCH, S, TEST } from './utils'; // ✅ ADD: Import safe helpers

export const EVENT_TRANSLATIONS = {
  // Inflation & Price Indicators
  'Inflation Rate': 'معدل التضخم',
  'Consumer Price Index': 'مؤشر أسعار المستهلك',
  'Core Consumer Price Index': 'مؤشر أسعار المستهلك الأساسي',
  'Producer Price Index': 'مؤشر أسعار المنتجين',
  'Core Producer Price Index': 'مؤشر أسعار المنتجين الأساسي',
  'Consumer Price Index Final': 'مؤشر أسعار المستهلك النهائي',
  'Consumer Price Index Preliminary': 'مؤشر أسعار المستهلك الأولي',
  'Producer Price Index Final': 'مؤشر أسعار المنتجين النهائي',
  'Wholesale Price Index': 'مؤشر أسعار الجملة',
  'Import Price Index': 'مؤشر أسعار الواردات',
  'Export Price Index': 'مؤشر أسعار الصادرات',
  // New direct acronyms/synonyms
  'CPI': 'مؤشر أسعار المستهلك',
  'HICP': 'المؤشر المنسق لأسعار المستهلك',
  'IPC-Fipe Inflation': 'تضخم IPC-Fipe',

  // Employment & Labor
  'Unemployment Rate': 'معدل البطالة',
  'Non-Farm Payrolls': 'الرواتب غير الزراعية',
  'Employment Change': 'التغير في التوظيف',
  'Unemployment Claims': 'طلبات البطالة',
  'Initial Jobless Claims': 'طلبات البطالة الأولية',
  'Continuing Jobless Claims': 'طلبات البطالة المستمرة',
  'Employment Cost Index': 'مؤشر تكلفة التوظيف',
  'Job Openings': 'الوظائف الشاغرة',
  'Labor Force Participation Rate': 'معدل المشاركة في القوى العاملة',
  'Average Hourly Earnings': 'متوسط الأرباح في الساعة',

  // GDP & Growth
  'GDP Growth Rate': 'معدل نمو الناتج المحلي الإجمالي',
  'GDP Annualized': 'الناتج المحلي الإجمالي السنوي',
  'GDP Quarterly': 'الناتج المحلي الإجمالي الفصلي',
  'GDP Preliminary': 'الناتج المحلي الإجمالي الأولي',
  'GDP Final': 'الناتج المحلي الإجمالي النهائي',
  'Real GDP': 'الناتج المحلي الإجمالي الحقيقي',
  'Nominal GDP': 'الناتج المحلي الإجمالي الاسمي',
  // New canonical form
  'Gross Domestic Product': 'الناتج المحلي الإجمالي',

  // Manufacturing & Production
  'Manufacturing PMI': 'مؤشر مديري المشتريات للتصنيع',
  'Services PMI': 'مؤشر مديري المشتريات للخدمات',
  'Composite PMI': 'مؤشر مديري المشتريات المركب',
  'Industrial Production': 'الإنتاج الصناعي',
  'Manufacturing Production': 'الإنتاج التصنيعي',
  'Factory Orders': 'طلبات المصانع',
  'Durable Goods Orders': 'طلبات السلع المعمرة',
  'Core Durable Goods Orders': 'طلبات السلع المعمرة الأساسية',
  'Capacity Utilization': 'معدل استخدام الطاقة الإنتاجية',

  // Retail & Consumer
  'Retail Sales': 'مبيعات التجزئة',
  'Core Retail Sales': 'مبيعات التجزئة الأساسية',
  'Consumer Confidence': 'ثقة المستهلك',
  'Consumer Sentiment': 'معنويات المستهلك',
  'Personal Income': 'الدخل الشخصي',
  'Personal Spending': 'الإنفاق الشخصي',
  'Consumer Credit': 'الائتمان الاستهلاكي',

  // Housing & Construction
  'Housing Starts': 'بدء الإنشاءات السكنية',
  'Building Permits': 'تصاريح البناء',
  'New Home Sales': 'مبيعات المنازل الجديدة',
  'Existing Home Sales': 'مبيعات المنازل الموجودة',
  'Home Price Index': 'مؤشر أسعار المنازل',
  'Housing Price Index': 'مؤشر أسعار الإسكان',
  'Construction Spending': 'الإنفاق على الإنشاءات',

  // Monetary Policy & Interest Rates
  'Interest Rate Decision': 'قرار أسعار الفائدة',
  'Fed Rate Decision': 'قرار الاحتياطي الفيدرالي',
  'Bank Rate Decision': 'قرار معدل البنك',
  'Repo Rate Decision': 'قرار معدل إعادة الشراء',
  'Discount Rate': 'معدل الخصم',
  'Prime Rate': 'السعر الأساسي',
  'FOMC Meeting': 'اجتماع لجنة السوق المفتوحة الفيدرالية',
  'FOMC Statement': 'بيان لجنة السوق المفتوحة الفيدرالية',
  'FOMC Minutes': 'محضر لجنة السوق المفتوحة الفيدرالية',

  // Trade & Balance
  'Trade Balance': 'الميزان التجاري',
  'Current Account': 'الحساب الجاري',
  'Capital Account': 'حساب رأس المال',
  'Balance of Payments': 'ميزان المدفوعات',
  'Exports': 'الصادرات',
  'Imports': 'الواردات',
  'Trade Deficit': 'العجز التجاري',
  'Trade Surplus': 'الفائض التجاري',

  // Energy & Commodities
  'Baker Hughes Oil Rig Count': 'عدد منصات النفط بيكر هيوز',
  'Oil Inventories': 'مخزونات النفط',
  'Crude Oil Inventories': 'مخزونات النفط الخام',
  'Natural Gas Storage': 'تخزين الغاز الطبيعي',
  'Energy Information Administration': 'إدارة معلومات الطاقة',

  // Government & Fiscal
  'Government Budget': 'ميزانية الحكومة',
  'Budget Balance': 'رصيد الميزانية',
  'Government Debt': 'الدين الحكومي',
  'Treasury Balance': 'رصيد الخزينة',
  'Treasury Cash Balance': 'رصيد الخزينة النقدي',
  'Government Spending': 'الإنفاق الحكومي',
  'Tax Revenue': 'الإيرادات الضريبية',

  // Business & Investment
  'Business Confidence': 'ثقة الأعمال',
  'Business Investment': 'الاستثمار التجاري',
  'Capital Expenditure': 'النفقات الرأسمالية',
  'Corporate Profits': 'أرباح الشركات',

  // Transportation & Automotive
  'Car Production': 'إنتاج السيارات',
  'Auto Sales': 'مبيعات السيارات',
  'New Car Registrations': 'تسجيلات السيارات الجديدة',
  'Vehicle Sales': 'مبيعات المركبات',
  'Transportation Index': 'مؤشر النقل',

  // Technology & Innovation
  'Technology Sector PMI': 'مؤشر مديري المشتريات للتكنولوجيا',
  'IT Services PMI': 'مؤشر مديري المشتريات لخدمات تقنية المعلومات',

  // Regional & Other
  'Regional Economic Activity': 'النشاط الاقتصادي الإقليمي',
  'Economic Sentiment': 'المعنويات الاقتصادية',
  'Leading Economic Index': 'المؤشر الاقتصادي الرائد',
  'Coincident Economic Index': 'المؤشر الاقتصادي المتزامن',
  'Lagging Economic Index': 'المؤشر الاقتصادي المتأخر',

  // Banking & Finance
  'Bank Lending Rate': 'معدل الإقراض المصرفي',
  'Loan Growth': 'نمو القروض',
  'Money Supply': 'المعروض النقدي',
  'Bank Reserves': 'احتياطيات البنوك',

  // International
  'Foreign Exchange Reserves': 'احتياطيات النقد الأجنبي',
  'Foreign Direct Investment': 'الاستثمار الأجنبي المباشر',
  'Tourism Revenue': 'إيرادات السياحة',
  'Remittances': 'التحويلات المالية',

  // Auctions (generic fallbacks)
  'Treasury Bill Auction': 'مزاد أذون الخزانة',
  'Bill Auction': 'مزاد الأذون',
  'Letras Auction': 'مزاد ليتراس',

  // Default fallbacks
  'Economic Indicator': 'المؤشر الاقتصادي',
  'Financial Data': 'البيانات المالية',
  'Market Index': 'مؤشر السوق',
  'Economic Report': 'التقرير الاقتصادي'
};

// ✅ FIX: Safe pattern matching in translations
export const translateTitle = (titleEn, language = 'ar') => {
  if (language !== 'ar') return titleEn;
  
  const title = S(titleEn).toLowerCase().trim();
  if (!title) return titleEn;
  
  // ✅ SAFE: Use TEST instead of direct regex test
  if (TEST(title, /gdp|gross domestic product/)) return 'الناتج المحلي الإجمالي';
  if (TEST(title, /inflation|cpi|consumer price/)) return 'التضخم';
  if (TEST(title, /unemployment|jobless/)) return 'البطالة';
  if (TEST(title, /interest rate|fed rate/)) return 'سعر الفائدة';
  if (TEST(title, /trade balance|trade deficit/)) return 'الميزان التجاري';
  if (TEST(title, /retail sales/)) return 'مبيعات التجزئة';
  if (TEST(title, /manufacturing|pmi/)) return 'التصنيع';
  if (TEST(title, /employment|jobs|nonfarm/)) return 'التوظيف';
  
  // ✅ SAFE: Use MATCH for pattern extraction
  const percentMatch = MATCH(title, /(\w+)\s*%/);
  if (percentMatch) {
    return `نسبة ${percentMatch[1]}`;
  }
  
  return titleEn;
};

// Helper: Arabic unit for duration
function arabicUnit(unit, n) {
  const num = Number(n);
  const u = unit.toLowerCase();
  if (u.startsWith('week')) return num === 1 ? 'أسبوع' : 'أسابيع';
  if (u.startsWith('month')) return num === 1 ? 'شهر' : 'أشهر';
  if (u.startsWith('year')) return num === 1 ? 'سنة' : 'سنوات';
  return unit;
}

// Pattern translator for auctions like "MAS 12-Week Bill Auction", "6-Month Letras Auction"
function translateAuction(englishTitle) {
  const t = String(englishTitle || '').trim();
  // Extract prefix acronym (e.g., "MAS")
  const prefixMatch = t.match(/^([A-Z]{2,})\s+/);
  const prefix = prefixMatch ? prefixMatch[1] : null;

  // Duration like "12-Week" or "6-Month" or "12 Month"
  const dur = t.match(/(\d+)\s*[- ]?\s*(Week|Weeks|Month|Months|Year|Years)/i);
  // Auction type
  const isBill = /Bill Auction/i.test(t);
  const isLetras = /Letras Auction/i.test(t);
  const isAuction = /Auction/i.test(t);

  if (!isAuction) return null;

  const n = dur ? dur[1] : null;
  const unit = dur ? dur[2] : null;

  const unitAr = n && unit ? arabicUnit(unit, n) : '';
  const durationAr = n && unitAr ? `لمدة ${n} ${unitAr}` : ''; // use Latin digits consistently

  if (isBill) {
    // "Treasury bills" phrasing in Arabic
    return `${prefix ? `${prefix} ` : ''}مزاد أذون ${durationAr || ''}`.trim();
  }
  if (isLetras) {
    return `${prefix ? `${prefix} ` : ''}مزاد ليتراس ${durationAr || ''}`.trim();
  }
  // Generic auction
  return `${prefix ? `${prefix} ` : ''}مزاد ${durationAr || ''}`.trim();
}

// Normalize and split composite titles like "CPI,HICP" or "CPI / HICP"
function splitComposite(title) {
  return String(title || '')
    .split(/[,/|]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

// Get Arabic translation with intelligent fallback and patterns
export const getEventTranslation = (englishTitle, language = 'en') => {
  if (language !== 'ar') return englishTitle;

  const title = String(englishTitle || '').trim();
  if (!title) return englishTitle;

  // Try composite titles first (e.g., "CPI,HICP")
  const parts = splitComposite(title);
  if (parts.length > 1) {
    const translatedParts = parts.map(p => getEventTranslation(p, 'ar'));
    return translatedParts.join('، ');
  }

  // Direct translation lookup
  if (EVENT_TRANSLATIONS[title]) {
    return EVENT_TRANSLATIONS[title];
  }

  // Auction pattern (e.g., "12-Week Bill Auction")
  const auction = translateAuction(title);
  if (auction) return auction;

  // Common acronyms inside longer strings (e.g., "Eurozone CPI")
  // These should apply if the full title isn't directly translated, but contains a known acronym.
  if (/\bCPI\b/.test(title)) {
    return title.replace(/\bCPI\b/g, 'مؤشر أسعار المستهلك');
  }
  if (/\bHICP\b/.test(title)) {
    return title.replace(/\bHICP\b/g, 'المؤشر المنسق لأسعار المستهلك');
  }

  // Partial match for compound titles (preserve best-fit from existing translations)
  // This is a fallback if none of the above specific patterns or direct matches work.
  for (const [key, value] of Object.entries(EVENT_TRANSLATIONS)) {
    if (title.includes(key) || key.includes(title)) {
      return value;
    }
  }

  // Return original if no translation found
  return englishTitle;
};

// Get all available event types for filtering
export const getAllEventTypes = () => {
  return Object.keys(EVENT_TRANSLATIONS);
};
