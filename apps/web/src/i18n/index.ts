export type Locale = 'en' | 'yo' | 'ig' | 'ha' | 'pcm';

export interface TranslationKeys {
  // Navigation
  nav: {
    home: string;
    browse: string;
    movies: string;
    comedy: string;
    games: string;
    sports: string;
    music: string;
    lifestyle: string;
    live: string;
    search: string;
    wallet: string;
    settings: string;
    profile: string;
    notifications: string;
  };
  // Common
  common: {
    loading: string;
    error: string;
    retry: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    remove: string;
    back: string;
    next: string;
    previous: string;
    search: string;
    noResults: string;
    viewAll: string;
    learnMore: string;
    getStarted: string;
    subscribe: string;
    unsubscribe: string;
    signIn: string;
    signOut: string;
    signUp: string;
  };
  // Home
  home: {
    welcome: string;
    recentlyWatched: string;
    trending: string;
    popular: string;
    newReleases: string;
    forYou: string;
  };
  // Wallet
  wallet: {
    balance: string;
    addFunds: string;
    transactions: string;
    transfer: string;
    withdraw: string;
    history: string;
  };
  // Settings
  settings: {
    title: string;
    preferences: string;
    appearance: string;
    language: string;
    notifications: string;
    privacy: string;
    account: string;
  };
}

const en: TranslationKeys = {
  nav: {
    home: 'Home',
    browse: 'Browse',
    movies: 'Movies',
    comedy: 'Comedy',
    games: 'Games',
    sports: 'Sports',
    music: 'Music',
    lifestyle: 'Lifestyle',
    live: 'Live',
    search: 'Search',
    wallet: 'Wallet',
    settings: 'Settings',
    profile: 'Profile',
    notifications: 'Notifications',
  },
  common: {
    loading: 'Loading...',
    error: 'Something went wrong',
    retry: 'Try again',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    noResults: 'No results found',
    viewAll: 'View all',
    learnMore: 'Learn more',
    getStarted: 'Get started',
    subscribe: 'Subscribe',
    unsubscribe: 'Unsubscribe',
    signIn: 'Sign in',
    signOut: 'Sign out',
    signUp: 'Sign up',
  },
  home: {
    welcome: 'Welcome to Azeebo+',
    recentlyWatched: 'Recently Watched',
    trending: 'Trending',
    popular: 'Popular',
    newReleases: 'New Releases',
    forYou: 'For You',
  },
  wallet: {
    balance: 'Balance',
    addFunds: 'Add Funds',
    transactions: 'Transactions',
    transfer: 'Transfer',
    withdraw: 'Withdraw',
    history: 'History',
  },
  settings: {
    title: 'Settings',
    preferences: 'Preferences',
    appearance: 'Appearance',
    language: 'Language',
    notifications: 'Notifications',
    privacy: 'Privacy',
    account: 'Account',
  },
};

const yo: Partial<TranslationKeys> = {
  nav: {
    home: 'Ile',
    browse: 'Wa wo',
    movies: 'Filimu',
    comedy: 'Ere ibere',
    games: 'Ere',
    sports: 'Ere abala',
    music: 'Orin',
    lifestyle: 'Igbesiaye',
    live: 'Nisin',
    search: 'Wa',
    wallet: 'Akanda owo',
    settings: 'Eto',
    profile: 'Profaili',
    notifications: 'Alafia',
  },
  common: {
    loading: 'N la...',
    error: 'Ohunkohun koli',
    retry: 'Tun try',
    save: 'Fi pamọ',
    cancel: 'Fagile',
    delete: 'Pa re',
    edit: 'Ṣe atunṣe',
    add: 'Fi kun',
    remove: 'Yo kuro',
    back: 'Padanwo',
    next: 'Tẹle',
    previous: 'Tẹhin',
    search: 'Wa',
    noResults: 'Ko si结果',
    viewAll: 'Wo gbogbo',
    learnMore: 'Ko si',
    getStarted: 'Bẹrẹ',
    subscribe: 'Forukunsilẹ',
    unsubscribe: 'Fagile forukunsilẹ',
    signIn: 'Wọ inu',
    signOut: 'Jade',
    signUp: 'Forukunsilẹ',
  },
  home: {
    welcome: 'Kaabo si Azeebo+',
    recentlyWatched: 'Ti o ti wo',
    trending: 'O n ta',
    popular: 'Gbajumo',
    newReleases: 'Titun',
    forYou: 'Fun ọ',
  },
  wallet: {
    balance: 'Iye owo',
    addFunds: 'Fi owo kun',
    transactions: 'Iṣowo',
    transfer: 'Fi lọ',
    withdraw: 'Ya kuro',
    history: 'Itan',
  },
  settings: {
    title: 'Eto',
    preferences: 'Anfani',
    appearance: 'Irinwo',
    language: 'Ede',
    notifications: 'Alafia',
    privacy: 'Adura',
    account: 'Akọwọ',
  },
};

const ig: Partial<TranslationKeys> = {
  nav: {
    home: 'Ụlọ',
    browse: 'Leba anya',
    movies: 'Filim',
    comedy: 'Agwa egwu',
    games: 'Egwu',
    sports: 'Egwu sport',
    music: 'Osu',
    lifestyle: 'Ndụ',
    live: 'Ochie',
    search: 'Chọọ',
    wallet: 'Apụtọ ego',
    settings: 'Nzọọhazi',
    profile: 'Profaịlụ',
    notifications: 'Ọkwa',
  },
  common: {
    loading: 'Na-adọwn...',
    error: 'Ihe mechiri',
    retry: 'Nwaa ọzọ',
    save: 'Chekwa',
    cancel: 'Kagbuo',
    delete: 'Hichapụ',
    edit: 'Dezọta',
    add: 'Mee ka',
    remove: 'Wepụ',
    back: 'Azụ',
    next: 'Ọzọ',
    previous: 'Gara aga',
    search: 'Chọọ',
    noResults: 'Enwere m ike',
    viewAll: 'Leba anya',
    learnMore: 'Mụtakwute',
    getStarted: 'Bido',
    subscribe: 'Debanye aha',
    unsubscribe: 'Kagbuo debanye aha',
    signIn: 'Banye',
    signOut: 'Pụọ',
    signUp: 'Debanye aha',
  },
  home: {
    welcome: 'Nnọọ na Azeebo+',
    recentlyWatched: 'Ị na-ele anya',
    trending: 'Na-eso ọkwa',
    popular: 'A ma ama',
    newReleases: 'Ohuru',
    forYou: 'Gị',
  },
  wallet: {
    balance: 'Ego',
    addFunds: 'Mee ka ego',
    transactions: 'Azụmaahịa',
    transfer: "Ruo n'ụlọ",
    withdraw: 'Wepụ',
    history: 'Akụkọ',
  },
  settings: {
    title: 'Nzọọhazi',
    preferences: 'Nhọrọ',
    appearance: 'Ịdị',
    language: 'Kọwaa',
    notifications: 'Ọkwa',
    privacy: ' Nzọọhazi',
    account: 'Akaụntụ',
  },
};

const ha: Partial<TranslationKeys> = {
  nav: {
    home: 'Gida',
    browse: 'Duba',
    movies: 'Fim',
    comedy: 'Baki',
    games: 'Wasa',
    sports: 'Wasan kwaikwayi',
    music: 'Waƙa',
    lifestyle: 'Rayuwa',
    live: 'Kai tsaye',
    search: 'Bincika',
    wallet: 'Jakar kuɗi',
    settings: 'Saituna',
    profile: 'Bayani',
    notifications: 'Sanarwa',
  },
  common: {
    loading: 'Ana lodi...',
    error: 'Wani abu ya sace',
    retry: 'Sake gwadawa',
    save: 'Ajiye',
    cancel: 'Soke',
    delete: 'Share',
    edit: 'Gyara',
    add: 'Ƙara',
    remove: 'Cire',
    back: 'Baya',
    next: 'Gaba',
    previous: 'Baya',
    search: 'Bincika',
    noResults: 'Ba a sami sakamako ba',
    viewAll: 'Duba duk',
    learnMore: 'Koyi ƙari',
    getStarted: 'Fara',
    subscribe: 'Yi rajista',
    unsubscribe: 'Soke rajista',
    signIn: 'Shiga',
    signOut: 'Fita',
    signUp: 'Yi rajista',
  },
  home: {
    welcome: 'Barka da Azeebo+',
    recentlyWatched: 'Kusan duba',
    trending: 'Ana bi',
    popular: 'Shahara',
    newReleases: 'Sabo',
    forYou: 'Maka',
  },
  wallet: {
    balance: "Ma'aunin kuɗi",
    addFunds: 'Ƙara kuɗi',
    transactions: 'Ayyuka',
    transfer: 'Rufa',
    withdraw: 'Cire',
    history: 'Tarihi',
  },
  settings: {
    title: 'Saituna',
    preferences: 'Zaɓuɓɓuka',
    appearance: 'Bayyanar',
    language: 'Harshe',
    notifications: 'Sanarwa',
    privacy: 'Sirri',
    account: 'Asusu',
  },
};

const pcm: Partial<TranslationKeys> = {
  nav: {
    home: 'House',
    browse: 'Look',
    movies: 'Film',
    comedy: 'Laugh',
    games: 'Game',
    sports: 'Ball',
    music: 'Song',
    lifestyle: 'Life',
    live: 'Now',
    search: 'Find',
    wallet: 'Money',
    settings: 'Setting',
    profile: 'Self',
    notifications: 'Alert',
  },
  common: {
    loading: 'Wait...',
    error: 'Something break',
    retry: 'Try again',
    save: 'Keep am',
    cancel: 'No do',
    delete: 'Cut am',
    edit: 'Change am',
    add: 'Put',
    remove: 'Take am',
    back: 'Go back',
    next: 'Next one',
    previous: 'Before one',
    search: 'Find',
    noResults: 'Nothing dey',
    viewAll: 'See all',
    learnMore: 'No know',
    getStarted: 'Start',
    subscribe: 'Join',
    unsubscribe: 'Leave',
    signIn: 'Enter',
    signOut: 'Comot',
    signUp: 'Register',
  },
  home: {
    welcome: 'Welcome for Azeebo+',
    recentlyWatched: 'You watch am lately',
    trending: 'People dey watch',
    popular: 'E popular',
    newReleases: 'New one just drop',
    forYou: 'Na for you',
  },
  wallet: {
    balance: 'How much you get',
    addFunds: 'Add money',
    transactions: 'How you spend',
    transfer: 'Send money',
    withdraw: 'Take money out',
    history: 'How you take spend',
  },
  settings: {
    title: 'Setting',
    preferences: 'Wetin you like',
    appearance: 'How e look',
    language: 'Wetin you talk',
    notifications: 'Alert',
    privacy: 'Your business',
    account: 'Your account',
  },
};

const translations: Record<Locale, TranslationKeys> = {
  en,
  yo: { ...en, ...yo } as TranslationKeys,
  ig: { ...en, ...ig } as TranslationKeys,
  ha: { ...en, ...ha } as TranslationKeys,
  pcm: { ...en, ...pcm } as TranslationKeys,
};

let currentLocale: Locale = 'en';

export function setLocale(locale: Locale) {
  currentLocale = locale;
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
  }
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('locale') as Locale | null;
    if (stored && translations[stored]) {
      currentLocale = stored;
    }
  }
  return currentLocale;
}

export function t(key: string): string {
  const keys = key.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = translations[currentLocale];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
}

export function getAvailableLocales(): { code: Locale; name: string; nativeName: string }[] {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
    { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
    { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
    { code: 'pcm', name: 'Nigerian Pidgin', nativeName: 'Naijá' },
  ];
}
