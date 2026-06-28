// i18n — English & Sinhala translations
// App name "ExaminerAI" is never translated

export const translations = {
  en: {
    // Demo banner
    demoBanner: '⚠️ DEMO MODE — Do not upload real case files or personal data. For concept demonstration only.',

    // Header
    headerSubtitle: 'MOTOR TRAFFIC KNOWLEDGE SYSTEM',
    uploadBtn: 'Upload',

    // Processing
    processing: 'Processing',

    // Document list
    knowledgeBase: 'KNOWLEDGE BASE',

    // Document categories
    categories: [
      'Acts & Regulations',
      'Court Documents',
      'Gazettes',
      'Accident Investigation Reports',
      'Weight 130 Certificates',
      'Technical Guides',
      'Vehicle Photos',
      'Valuation Reports',
      'Court Orders',
      'Lecture Notes',
      'Other',
    ],

    // Knowledge selector
    allSources: 'All Knowledge Sources',
    sourcesSelected: (n) => `${n} source${n !== 1 ? 's' : ''} selected`,
    knowledgeBaseLabel: 'KNOWLEDGE BASE',
    selectAll: 'Select All',

    // File uploader
    uploadTitle: 'Upload Documents',
    uploadSubtitle: 'PDF, Word, Excel, Images, Handwritten docs',
    categoryLabel: 'DOCUMENT CATEGORY',
    dropzone: 'Tap to browse or drag files',
    dropzoneActive: 'Drop files here',
    dropzoneTypes: 'PDF · Word · Excel · JPG · PNG',
    cancel: 'Cancel',
    uploadFiles: (n) => n > 0 ? `Upload ${n} file${n > 1 ? 's' : ''}` : 'Upload',

    // Chat
    welcomeMessage: `Welcome to **ExaminerAI** 👮

I am your personal knowledge assistant for Motor Traffic Department documents.

**How to use:**
1. Upload your documents using the 📎 button below
2. Select which knowledge sources to search using the filter
3. Ask any question in natural language

I will only answer from your uploaded documents — no internet access, no outside data.

**Example questions:**
• What is the weight limit for a 3-axle vehicle?
• Show regulations related to steering failure accidents
• What are the inspection requirements for Weight 130 certificates?`,

    inputPlaceholderEmpty: 'Upload documents first, then ask a question...',
    inputPlaceholder: 'Ask a question from your documents...',

    // Errors
    errGeneric: (msg) => `An error occurred: ${msg}`,
    errApiKey: '⚠️ Gemini API key not configured. Please add your VITE_GEMINI_API_KEY to the .env file and restart the dev server.',
    errInvalidKey: '⚠️ Invalid API key. Please check your VITE_GEMINI_API_KEY in the .env file.',
    errRateLimit: '⏳ Free tier limit reached (15 requests/min). Please wait 60 seconds and try again. This is a demo limitation only.',
    errRequest: (msg) => '⚠️ Request error: ' + msg,

    // Toast messages
    toastAdded: (n) => `✅ ${n} document${n > 1 ? 's' : ''} added to knowledge base`,
    toastFailed: (name) => `⚠️ Could not process: ${name}`,
    toastRemoved: 'Document removed',

    // Misc
    visionBadge: 'Vision',
    remove: 'Remove document',
  },

  sin: {
    // Demo banner
    demoBanner: '⚠️ නිදර්ශන ප්‍රකාරය — සැබෑ නඩු ගොනු හෝ පුද්ගලික දත්ත Upload නොකරන්න. සංකල්ප නිරූපණය සඳහා පමණි.',

    // Header
    headerSubtitle: 'මෝටර් රථ දැනුම් පද්ධතිය',
    uploadBtn: 'Upload කරන්න',

    // Processing
    processing: 'සකසමින්',

    // Document list
    knowledgeBase: 'දැනුම් පදනම',

    // Document categories
    categories: [
      'පනත් සහ රෙගුලාසි',
      'අධිකරණ ලේඛන',
      'ගැසට් පත්‍ර',
      'අනතුරු විමර්ශන වාර්තා',
      'බර 130 සහතික',
      'තාක්ෂණික මාර්ගෝපදේශ',
      'වාහන ඡායාරූප',
      'වටිනාකම් වාර්තා',
      'අධිකරණ නියෝග',
      'දේශන සටහන්',
      'වෙනත්',
    ],

    // Knowledge selector
    allSources: 'සියලු දැනුම් මූලාශ්‍ර',
    sourcesSelected: (n) => `මූලාශ්‍ර ${n}ක් තෝරාගෙන ඇත`,
    knowledgeBaseLabel: 'දැනුම් පදනම',
    selectAll: 'සියල්ල තෝරන්න',

    // File uploader
    uploadTitle: 'ලේඛන Upload කරන්න',
    uploadSubtitle: 'PDF, Word, Excel, රූප, අතින් ලියූ ලේඛන',
    categoryLabel: 'ලේඛන වර්ගය',
    dropzone: 'ගොනු සඳහා තට්ටු කරන්න හෝ ඇදගෙන යන්න',
    dropzoneActive: 'ගොනු මෙහි දමන්න',
    dropzoneTypes: 'PDF · Word · Excel · JPG · PNG',
    cancel: 'අවලංගු කරන්න',
    uploadFiles: (n) => n > 0 ? `ගොනු ${n}ක් Upload කරන්න` : 'Upload කරන්න',

    // Chat
    welcomeMessage: `**ExaminerAI** වෙත සාදරයෙන් පිළිගනිමු 👮

මම ඔබේ මෝටර් රථ දෙපාර්තමේන්තු ලේඛන සඳහා පුද්ගලික දැනුම් සහායකයා වෙමි.

**භාවිතා කරන ආකාරය:**
1. පහත 📎 බොත්තම භාවිතයෙන් ඔබේ ලේඛන Upload කරන්න
2. පෙරහන භාවිතයෙන් සෙවිය යුතු දැනුම් මූලාශ්‍ර තෝරන්න
3. ස්වාභාවික භාෂාවෙන් ඕනෑම ප්‍රශ්නයක් අසන්න

මම ඔබේ Upload කළ ලේඛනවලින් පමණක් පිළිතුරු දෙන්නෙමි — අන්තර්ජාල ප්‍රවේශයක් නොමැත.

**නිදසුන් ප්‍රශ්න:**
• අක්ෂ 3ක වාහනයක් සඳහා බර සීමාව කීයද?
• රෝද හැසිරවීමේ දෝෂ නිසා ඇතිවූ අනතුරු සම්බන්ධ රෙගුලාසි මොනවාද?
• බර 130 සහතික සඳහා පරීක්ෂා කිරීමේ අවශ්‍යතා මොනවාද?`,

    inputPlaceholderEmpty: 'මුලින්ම ලේඛන Upload කරන්න, ඉන්පසු ප්‍රශ්නයක් අසන්න...',
    inputPlaceholder: 'ඔබේ ලේඛනවලින් ප්‍රශ්නයක් අසන්න...',

    // Errors
    errGeneric: (msg) => `දෝෂයක් ඇතිවිය: ${msg}`,
    errApiKey: '⚠️ Gemini API යතුර සකසා නොමැත. .env ගොනුවට VITE_GEMINI_API_KEY එකතු කර dev server නැවත ආරම්භ කරන්න.',
    errInvalidKey: '⚠️ වලංගු නොවන API යතුරකි. .env ගොනුවේ VITE_GEMINI_API_KEY පරීක්ෂා කරන්න.',
    errRateLimit: '⏳ නොමිලේ ස්ථරයේ සීමාව ඉක්මවා ඇත. තත්පර 60ක් රැඳී නැවත උත්සාහ කරන්න.',
    errRequest: (msg) => '⚠️ ඉල්ලීමේ දෝෂය: ' + msg,

    // Toast messages
    toastAdded: (n) => `✅ ලේඛන ${n}ක් දැනුම් පදනමට එකතු කරන ලදී`,
    toastFailed: (name) => `⚠️ සැකසීමට නොහැකි විය: ${name}`,
    toastRemoved: 'ලේඛනය ඉවත් කරන ලදී',

    // Misc
    visionBadge: 'දෘශ්‍ය',
    remove: 'ලේඛනය ඉවත් කරන්න',
  }
}

// React context
import { createContext, useContext, useState } from 'react'

export const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState('sin')
  const t = translations[lang]
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
