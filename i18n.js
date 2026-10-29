'use strict';
const LANGUAGES = {
  en: { locale: 'en-US', dir: 'ltr' }, es: { locale: 'es', dir: 'ltr' },
  fr: { locale: 'fr', dir: 'ltr' }, ko: { locale: 'ko', dir: 'ltr' },
  fa: { locale: 'fa', dir: 'rtl' }, he: { locale: 'he', dir: 'rtl' },
  ja: { locale: 'ja', dir: 'ltr' },
  zh: { locale: 'zh-Hans', dir: 'ltr' }
};
let language = 'en';
try { const saved = localStorage.getItem('aoi-language'); if (LANGUAGES[saved]) language = saved; } catch { /* Storage may be unavailable in private browsing. */ }

// Messages keep their source key and values so old dispatches translate too.
function msg(parts, ...values) {
  return { key: parts.reduce((s, part, i) => s + (i ? `{${i - 1}}` : '') + part, ''), values };
}
function dateMessage(year, month) { return { date: { year, month } }; }
function t(message) {
  if (message == null) return '';
  if (typeof message === 'number') return new Intl.NumberFormat(LANGUAGES[language].locale).format(message);
  if (message.date) return new Intl.DateTimeFormat(LANGUAGES[language].locale, {
    month: 'long', year: 'numeric', calendar: 'gregory', timeZone: 'UTC'
  }).format(new Date(Date.UTC(message.date.year, message.date.month, 1)));
  const key = typeof message === 'string' ? message : message.key;
  const template = language === 'en' ? key : (TRANSLATIONS[language][key] ?? key);
  return template.replace(/\{(\d+)\}/g, (_, index) => t(message.values?.[Number(index)]));
}
function tr(parts, ...values) { return t(msg(parts, ...values)); }
function applyLanguage(next) {
  if (!LANGUAGES[next]) return;
  language = next;
  document.documentElement.lang = LANGUAGES[next].locale;
  document.documentElement.dir = LANGUAGES[next].dir;
  try { localStorage.setItem('aoi-language', next); } catch { /* Preference is optional. */ }
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('.language-select').forEach(el => { el.value = next; });
  document.title = t('Articles of Impeachment') + ' — ' + t('A Political Simulation');
  document.querySelector('meta[name="description"]').content = t('Build the case, count the votes, and beat the calendar in a fictional political strategy game.');
  document.dispatchEvent(new Event('languagechange'));
}
document.querySelectorAll('.language-select').forEach(el => el.addEventListener('change', () => applyLanguage(el.value)));
applyLanguage(language);
