// Internationalisation (i18n) setup.
//
// Two languages: English (default) and Hindi — to serve rural students who are
// more comfortable in Hindi. The choice persists in localStorage and a
// LanguageSwitcher in the navbar toggles it. Translations are namespaced
// mirroring the app's pages/components for maintainability.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const STORAGE_KEY = 'sm_lang';

const en = {
  common: {
    appName: 'Scholarship Matcher',
    browse: 'Browse',
    dashboard: 'Dashboard',
    applications: 'Applications',
    admin: 'Admin',
    login: 'Login',
    logout: 'Logout',
    signup: 'Get started',
    loading: 'Loading…',
    save: 'Save',
    saved: '★ Saved',
    applyNow: 'Apply now ↗',
    source: 'Source ↗',
    search: 'Search',
    profile: 'Profile',
  },
  landing: {
    badge: 'Education for All',
    heroTitle: 'Find every scholarship you',
    heroTitleHighlight: 'actually qualify for',
    heroSubtitle: 'Stop searching hundreds of portals manually. Fill your profile once and instantly see matched scholarships, ranked by eligibility.',
    createProfile: 'Create your profile',
    browseScholarships: 'Browse scholarships',
    features: {
      matching: { title: 'Smart matching engine', body: 'We compare your income, category, state, course, marks, gender and more against every scholarship rule — automatically.' },
      reminders: { title: 'Deadline reminders', body: 'Never miss a deadline again. See countdowns and upcoming alerts right on your dashboard.' },
      secure: { title: 'Private & secure', body: 'Your data lives in your own profile. Only you can edit it, secured by Firestore rules.' },
      mobile: { title: 'Mobile-first', body: 'Built for phones first — so rural and low-bandwidth students can use it easily.' },
    },
  },
  dashboard: {
    hello: 'Hello, {{name}} 👋',
    matchesLine: '{{count}} full matches out of {{total}} scholarships.',
    completeProfilePrompt: 'Complete your profile to see personalized matches.',
    sortBy: 'Sort by:',
    sortMatch: 'Match % (high → low)',
    sortDeadline: 'Deadline (soonest first)',
    sortAmount: 'Amount (high → low)',
    findingMatches: 'Finding your matches…',
    buildProfileFirst: 'Build your profile first',
    buildProfileBody: 'Tell us your category, income, state, marks and more — our engine will instantly match you to every eligible scholarship.',
    completeYourProfile: 'Complete your profile',
    yourProfile: 'Your profile',
    editProfile: 'Edit profile',
    disability: 'Disability',
    minority: 'Minority',
    profileAlgorithmNote: 'These details feed the matching engine live — update any field to re-rank your matches instantly.',
    aiFinderTitle: '🤖 AI Scholarship Finder',
    aiFinderBody: 'Powered by Groq AI. Discovers additional real scholarships across government & private portals beyond our verified dataset.',
    aiFinderBtn: '✨ Find more scholarships',
    aiSearching: '🤖 Searching…',
    noMatches: 'No scholarships loaded yet',
    dataUpdated: 'Data last updated: {{date}}',
  },
  profile: {
    title: 'Student profile',
    subtitle: 'The more accurate your details, the better your scholarship matches.',
    completeness: 'Profile completeness',
    completenessHint: 'The more complete your profile, the more accurate your scholarship matches.',
    completenessDone: '🎉 Your profile is complete — you get the most accurate matches.',
    stillMissing: 'Still missing:',
    fullName: 'Full name',
    age: 'Age',
    gender: 'Gender',
    state: 'State',
    category: 'Category',
    income: 'Annual family income (₹)',
    educationLevel: 'Education level',
    course: 'Course / stream',
    marks: 'Current marks / percentage (%)',
    disability: 'I am differently-abled (have a disability)',
    minority: 'I belong to a minority community',
    save: 'Save profile & find matches',
    saving: 'Saving…',
    select: 'Select…',
    savedSuccess: '✅ Profile saved! Taking you to your matches…',
    savedLocal: '✅ Profile saved on this device! Taking you to your matches…',
    saveError: 'Could not save',
  },
  applications: {
    title: 'Application Tracker',
    subtitle: "Track the status of every scholarship you've applied to — all in one place.",
    all: 'All',
    empty: 'No applications tracked yet',
    emptyBody: 'When you apply for a scholarship, set its status on the card (Applied / Under Review / Approved / Rejected) and it will show up here.',
    findScholarships: 'Find scholarships',
  },
  card: {
    whyMatched: "Why matched? / What's missing?",
    hideDetails: 'Hide details',
    documents: 'Documents',
    trackApp: 'Track application',
    notApplied: 'Not applied yet',
    docChecklist: '📂 Document checklist',
    ready: 'ready',
    allDocsReady: '✓ All documents ready — you can apply!',
    becomeEligible: '💡 How to become eligible',
    noDeadline: 'No deadline',
  },
  browse: {
    title: 'Browse scholarships',
    subtitle: 'Search and filter all available scholarships.',
    searchPlaceholder: 'Search by name, provider…',
    state: 'State',
    category: 'Category',
    allStates: 'All states',
    allCategories: 'All categories',
    showing: 'Showing {{shown}} of {{total}} scholarships',
    noResults: 'No scholarships match your filters.',
  },
};

const hi = {
  common: {
    appName: 'स्कॉलरशिप मैचर',
    browse: 'ब्राउज़',
    dashboard: 'डैशबोर्ड',
    applications: 'आवेदन',
    admin: 'एडमिन',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    signup: 'शुरू करें',
    loading: 'लोड हो रहा है…',
    save: 'सहेजें',
    saved: '★ सहेजा गया',
    applyNow: 'अभी आवेदन करें ↗',
    source: 'स्रोत ↗',
    search: 'खोज',
    profile: 'प्रोफ़ाइल',
  },
  landing: {
    badge: 'सबके लिए शिक्षा',
    heroTitle: 'हर वह स्कॉलरशिप खोजें जिसके लिए आप',
    heroTitleHighlight: 'वास्तव में पात्र हैं',
    heroSubtitle: 'सैकड़ों पोर्टल मैन्युअल रूप से खोजना बंद करें। अपनी प्रोफ़ाइल एक बार भरें और तुरंत पात्रता के अनुसार क्रमबद्ध मिलान स्कॉलरशिप देखें।',
    createProfile: 'अपनी प्रोफ़ाइल बनाएं',
    browseScholarships: 'स्कॉलरशिप ब्राउज़ करें',
    features: {
      matching: { title: 'स्मार्ट मैचिंग इंजन', body: 'हम आपकी आय, श्रेणी, राज्य, कोर्स, अंक, लिंग आदि की तुलना हर स्कॉलरशिप नियम से करते हैं — स्वचालित रूप से।' },
      reminders: { title: 'समयसीमा रिमाइंडर', body: 'कोई समयसीमा मिस न करें। अपने डैशबोर्ड पर काउंटडाउन और आगामी अलर्ट देखें।' },
      secure: { title: 'निजी और सुरक्षित', body: 'आपका डेटा आपकी अपनी प्रोफ़ाइल में रहता है। केवल आप इसे संपादित कर सकते हैं, फायरस्टोर नियमों द्वारा सुरक्षित।' },
      mobile: { title: 'मोबाइल-फर्स्ट', body: 'पहले फोन के लिए बनाया गया — ताकि ग्रामीण और कम-बैंडविड्थ वाले छात्र इसे आसानी से उपयोग कर सकें।' },
    },
  },
  dashboard: {
    hello: 'नमस्ते, {{name}} 👋',
    matchesLine: '{{total}} स्कॉलरशिप में से {{count}} पूर्ण मिलान।',
    completeProfilePrompt: 'व्यक्तिगत मिलान देखने के लिए अपनी प्रोफ़ाइल पूरी करें।',
    sortBy: 'क्रमबद्ध करें:',
    sortMatch: 'मिलान % (अधिक → कम)',
    sortDeadline: 'समयसीमा (सबसे पहले)',
    sortAmount: 'राशि (अधिक → कम)',
    findingMatches: 'आपके मिलान खोजे जा रहे हैं…',
    buildProfileFirst: 'पहले अपनी प्रोफ़ाइल बनाएं',
    buildProfileBody: 'अपनी श्रेणी, आय, राज्य, अंक और बताएं — हमारा इंजन तुरंत आपको हर पात्र स्कॉलरशिप से मिलाएगा।',
    completeYourProfile: 'अपनी प्रोफ़ाइल पूरी करें',
    yourProfile: 'आपकी प्रोफ़ाइल',
    editProfile: 'प्रोफ़ाइल संपादित करें',
    disability: 'विकलांगता',
    minority: 'अल्पसंख्यक',
    profileAlgorithmNote: 'ये विवरण मैचिंग इंजन को लाइव फीड करते हैं — कोई भी फ़ील्ड अपडेट करें और आपके मिलान तुरंत फिर से क्रमबद्ध हो जाएंगे।',
    aiFinderTitle: '🤖 एआई स्कॉलरशिप फाइंडर',
    aiFinderBody: 'ग्रोक एआई द्वारा संचालित। हमारे सत्यापित डेटासेट से परे सरकारी और निजी पोर्टल पर अतिरिक्त वास्तविक स्कॉलरशिप खोजता है।',
    aiFinderBtn: '✨ और स्कॉलरशिप खोजें',
    aiSearching: '🤖 खोज रहे हैं…',
    noMatches: 'अभी कोई स्कॉलरशिप लोड नहीं हुई',
    dataUpdated: 'डेटा अंतिम बार अपडेट: {{date}}',
  },
  profile: {
    title: 'छात्र प्रोफ़ाइल',
    subtitle: 'आपके विवरण जितने सटीक, उतने ही बेहतर स्कॉलरशिप मिलान।',
    completeness: 'प्रोफ़ाइल पूर्णता',
    completenessHint: 'आपकी प्रोफ़ाइल जितनी पूर्ण, उतने ही सटीक स्कॉलरशिप मिलान।',
    completenessDone: '🎉 आपकी प्रोफ़ाइल पूर्ण है — आपको सबसे सटीक मिलान मिलेंगे।',
    stillMissing: 'अभी भी गायब:',
    fullName: 'पूरा नाम',
    age: 'आयु',
    gender: 'लिंग',
    state: 'राज्य',
    category: 'श्रेणी',
    income: 'वार्षिक पारिवारिक आय (₹)',
    educationLevel: 'शिक्षा स्तर',
    course: 'कोर्स / स्ट्रीम',
    marks: 'वर्तमान अंक / प्रतिशत (%)',
    disability: 'मैं दिव्यांग हूँ (विकलांगता है)',
    minority: 'मैं अल्पसंख्यक समुदाय से हूँ',
    save: 'प्रोफ़ाइल सहेजें और मिलान खोजें',
    saving: 'सहेज रहे हैं…',
    select: 'चुनें…',
    savedSuccess: '✅ प्रोफ़ाइल सहेजी गई! आपको अपने मिलान पर ले जा रहे हैं…',
    savedLocal: '✅ प्रोफ़ाइल इस डिवाइस पर सहेजी गई! आपको अपने मिलान पर ले जा रहे हैं…',
    saveError: 'सहेज नहीं सका',
  },
  applications: {
    title: 'आवेदन ट्रैकर',
    subtitle: 'हर स्कॉलरशिप की स्थिति ट्रैक करें जिसके लिए आपने आवेदन किया है — एक ही जगह।',
    all: 'सभी',
    empty: 'अभी कोई आवेदन ट्रैक नहीं किया गया',
    emptyBody: 'जब आप किसी स्कॉलरशिप के लिए आवेदन करते हैं, तो कार्ड पर इसकी स्थिति सेट करें (आवेदन / समीक्षा में / स्वीकृत / अस्वीकृत) और यह यहाँ दिखाई देगी।',
    findScholarships: 'स्कॉलरशिप खोजें',
  },
  card: {
    whyMatched: 'क्यों मिलान? / क्या गायब है?',
    hideDetails: 'विवरण छिपाएं',
    documents: 'दस्तावेज़',
    trackApp: 'आवेदन ट्रैक करें',
    notApplied: 'अभी तक आवेदन नहीं किया',
    docChecklist: '📂 दस्तावेज़ चेकलिस्ट',
    ready: 'तैयार',
    allDocsReady: '✓ सभी दस्तावेज़ तैयार — आप आवेदन कर सकते हैं!',
    becomeEligible: '💡 पात्र कैसे बनें',
    noDeadline: 'कोई समयसीमा नहीं',
  },
  browse: {
    title: 'स्कॉलरशिप ब्राउज़ करें',
    subtitle: 'सभी उपलब्ध स्कॉलरशिप खोजें और फ़िल्टर करें।',
    searchPlaceholder: 'नाम, प्रदाता से खोजें…',
    state: 'राज्य',
    category: 'श्रेणी',
    allStates: 'सभी राज्य',
    allCategories: 'सभी श्रेणियाँ',
    showing: '{{total}} में से {{shown}} स्कॉलरशिप दिखाई जा रही हैं',
    noResults: 'आपके फ़िल्टर से कोई स्कॉलरशिप मेल नहीं खाती।',
  },
};

const savedLang = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  } catch {
    return 'en';
  }
})();

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// Keep the language choice in sync with localStorage.
i18n.on('languageChanged', (lng) => {
  try { localStorage.setItem(STORAGE_KEY, lng); } catch { /* ignore */ }
});

export default i18n;
