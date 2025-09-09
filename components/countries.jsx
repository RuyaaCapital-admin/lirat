// components/countries.js
export const COUNTRY_ALLOWLIST = [
  // Core majors
  'US','GB','CA','JP','CN','CH','NZ','AU',
  // Euro area aggregate + Turkey
  'EU','TR',
  // Major European economies only
  'DE','FR','IT','ES','NL','BE','AT','IE','PT',
  'SE','NO','DK','FI'
  // If later needed, we can add 'PL' quickly—keep excluded for now.
];

export const COUNTRY_SYNONYMS = {
  USA:'US', US:'US', USD:'US',
  UK:'GB','UNITED KINGDOM':'GB', ENGLAND:'GB', GBP:'GB',
  CANADA:'CA', CAD:'CA',
  JAPAN:'JP', JPY:'JP',
  CHINA:'CN', CHN:'CN', CNY:'CN',
  SWITZERLAND:'CH', CHF:'CH',
  'NEW ZEALAND':'NZ', NZ:'NZ', NZD:'NZ',
  AUSTRALIA:'AU', AUS:'AU', AUD:'AU',
  EURO:'EU', EUR:'EU', EUROZONE:'EU','EURO AREA':'EU',
  TURKEY:'TR', TÜRKIYE:'TR', TRY:'TR',

  FRANCE:'FR', FRA:'FR', FR:'FR',
  GERMANY:'DE', DE:'DE', DEU:'DE', DEUTSCHLAND:'DE',
  ITALY:'IT', IT:'IT', ITA:'IT',
  SPAIN:'ES', ES:'ES', ESP:'ES',
  NETHERLANDS:'NL', HOLLAND:'NL', NL:'NL',
  BELGIUM:'BE', BEL:'BE', BE:'BE',
  AUSTRIA:'AT', AUT:'AT', AT:'AT',
  PORTUGAL:'PT', PRT:'PT', PT:'PT',
  IRELAND:'IE', IRL:'IE', IE:'IE',
  SWEDEN:'SE', SWE:'SE', SE:'SE',
  NORWAY:'NO', NOR:'NO', NO:'NO',
  DENMARK:'DK', DNK:'DK', DK:'DK',
  FINLAND:'FI', FIN:'FI', FI:'FI'
};

export function resolveCountries(input) {
  const raw = Array.isArray(input) ? input : [];
  const mapped = raw
    .map(v => (v||'').toString().trim().toUpperCase())
    .map(v => COUNTRY_SYNONYMS[v] || v)
    .filter(v => COUNTRY_ALLOWLIST.includes(v));
  return [...new Set(mapped.length ? mapped : COUNTRY_ALLOWLIST)];
}