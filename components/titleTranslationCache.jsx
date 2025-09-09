
// Clean translation cache - ONLY Arabic translations, no duplicates, no empty values
export const TitleTranslations = {
  // Core Economic Indicators
  "Inflation Rate": "معدل التضخم",
  "CPI": "مؤشر أسعار المستهلكين",
  "Consumer Confidence": "ثقة المستهلك",
  "GDP Growth Rate": "معدل نمو الناتج المحلي الإجمالي",
  "Gross Domestic Product": "الناتج المحلي الإجمالي",
  
  // Employment
  "Employment Change": "تغيير التوظيف",
  "Non Farm Payrolls": "كشوف المرتبات غير الزراعية",
  "Nonfarm Payrolls Private": "كشوف المرتبات الخاصة غير الزراعية",
  "Average Hourly Earnings": "متوسط الأرباح بالساعة",
  "Average Hourly Wages": "متوسط الأجور بالساعة",
  "Unemployment Rate": "معدل البطالة",
  "Initial Jobless Claims": "طلبات إعانة البطالة الأولية",
  "Continuing Jobless Claims": "طلبات إعانة البطالة المستمرة",
  "Jobless Claims 4-Week Average": "متوسط طلبات إعانة البطالة لأربعة أسابيع",
  "Participation Rate": "معدل المشاركة",
  "U-6 Unemployment Rate": "معدل البطالة الشامل U-6",
  "Average Weekly Hours": "متوسط الساعات الأسبوعية",
  "Manufacturing Payrolls": "كشوف المرتبات التصنيعية",
  "Government Payrolls": "كشوف المرتبات الحكومية",
  "Part Time Employment Chg": "تغيير التوظيف بدوام جزئي",
  "Full Time Employment Chg": "تغيير التوظيف بدوام كامل",
  
  // Manufacturing & Business
  "PMI": "مؤشر مدراء المشتريات",
  "Manufacturing PMI": "مؤشر مدراء المشتريات التصنيعي",
  "Services PMI": "مؤشر مدراء المشتريات للخدمات",
  "Ivey PMI s.a": "مؤشر آيفي للمشتريات موسميًا",
  "Industrial Production": "الإنتاج الصناعي",
  
  // Financial & Monetary
  "Interest Rate": "سعر الفائدة",
  "Fed Funds Rate": "معدل الأموال الفيدرالية",
  "Foreign Exchange Reserves": "احتياطيات النقد الأجنبي",
  "30-Year Mortgage Rate": "معدل الرهن العقاري لـ30 عاماً",
  "15-Year Mortgage Rate": "معدل الرهن العقاري لـ15 عاماً",
  "Fed Balance Sheet": "ميزانية الاحتياطي الفيدرالي",
  "Atlanta Fed GDPNow": "توقعات الناتج المحلي لأتلانتا فيد",
  "Fed Williams Speech": "خطاب ويليامز من الفيدرالي",
  "Fed Goolsbee Speech": "خطاب جولسبي من الفيدرالي",
  
  // Energy & Commodities  
  "EIA Crude Oil Stocks Change": "تغيير مخزونات النفط الخام",
  "EIA Distillate Stocks Change": "تغيير مخزونات المقطرات",
  "EIA Distillate Fuel Production Change": "تغيير إنتاج وقود المقطرات",
  "EIA Cushing Crude Oil Stocks Change": "تغيير مخزونات النفط في كوشينغ",
  "EIA Crude Oil Imports Change": "تغيير واردات النفط الخام",
  "Baker Hughes Oil Rig Count": "عدد منصات النفط بيكر هيوز",
  
  // Trade & International
  "Trade Balance": "الميزان التجاري",
  "Current Account": "الحساب الجاري",
  "Exports": "الصادرات",
  "Imports": "الواردات",
  
  // Other Economic Indicators
  "CB Leading Index": "مؤشر الأداء الاقتصادي المبكر",
  "Leading Economic Index": "مؤشر الأداء الاقتصادي الرائد",
  "Coincident Indicator": "المؤشر المتزامن",
  "Coincident Index": "المؤشر المتزامن",
  "Household Spending": "إنفاق الأسر",
  "Average Cash Earnings": "متوسط الأرباح النقدية",
  "Overtime Pay": "أجر الساعات الإضافية"
};

// Simple translation function that uses client-side cache only
export function translateEventTitle(enTitle) {
  const title = String(enTitle || '').trim();
  if (!title) return '';
  return TitleTranslations[title] || title;
}

// Get translation status for debugging
export function getTranslationStats() {
  const total = Object.keys(TitleTranslations).length;
  const valid = Object.values(TitleTranslations).filter(v => v && v.trim()).length;
  return { total, valid, invalid: total - valid };
}
