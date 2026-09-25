/**
 * Shared i18n for Azeebo+ clients (mobile + TV).
 *
 * Single source of truth for the 6-language resource bundle, device-language
 * detection, and persistence. Previously forked verbatim in
 * apps/mobile/src/i18n.ts and apps/tv/src/i18n.ts — both now re-export this
 * module. The app _layout.tsx files side-effect import it at startup.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const LANGUAGES_KEY = '@azeebo/language';

const resources = {
  en: {
    translation: {
      home: {
        scrollLeft: 'Scroll left',
        scrollRight: 'Scroll right',
        recentlyWatched: 'Recently Watched',
        continueWatching: 'Continue Watching',
        forYou: 'For You',
        newReleases: 'New Releases',
        viewAll: 'View All',
        emptyState: 'No content available yet',
        greeting: 'Welcome to Azeebo+',
        greetingSecondary: 'Your Ultimate Entertainment Hub',
        title: 'Discover Amazing Content',
        description: 'Stream movies, watch reality shows, enjoy comedy, and more',
        trending: 'Trending Now',
        trendingSubtitle: "What's hot right now",
        earnWhileWatching: 'EARN WHILE WATCHING',
        unlockRewards: 'Unlock Rewards',
        rewardsDescription: 'Earn points for watching, interacting, and inviting friends',
        startEarning: 'Start Earning',
        exploreByUniverse: 'Explore by Universe',
        explore: 'Explore',
        newUpdate: 'A new update is available!',
        installNow: 'Install Now',
        welcomeBack: 'Welcome back',
        recentlyWatchedSubtitle: 'Pick up where you left off',
        continueWatchingSubtitle: 'Your in-progress content',
        trendingAcrossPlatform: 'Most popular across Azeebo+',
        newReleasesSubtitle: 'Fresh content added recently',
        popularInYourRegion: 'Popular in Your Region',
        popularNearYou: 'Trending content near you',
        topPicksForYou: 'Top Picks For You',
        basedOnHistory: 'Based on your watch history',
        popularRightNow: 'Popular Right Now',
        inviteFriends: 'Invite Friends, Earn Rewards',
        inviteFriendsDescription: 'Share your referral link and earn points when friends join',
        shareYourLink: 'Share Your Link',
        featuredContent: 'Featured Content',
        contentList: 'Content list',
      },
      content: {
        watch: 'Watch',
        watched: 'Watched',
      },
      common: {
        loading: 'Loading...',
        error: 'Something went wrong',
        retry: 'Retry',
        cancel: 'Cancel',
        confirm: 'Confirm',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        search: 'Search',
        searchPlaceholder: 'Search movies, shows, creators…',
        searchNoResults: 'No results for “{{query}}”',
        // L12 shared error-message catalog: user-facing failures render these
        // keys instead of ad-hoc English strings, so all 6 languages get them.
        errorNetwork: 'Could not reach Azeebo+. Check your connection and try again.',
        errorEntitlement: 'This title is included with Azeebo+ Premium.',
        errorPaymentUnavailable:
          'No payment providers are available right now. Please try again later.',
        premium: 'Premium',
      },
      auth: {
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        forgotPassword: 'Forgot Password',
        getStarted: 'Get Started',
        alreadyHaveAccount: 'Already have an account?',
      },
      settings: {
        title: 'Settings',
        language: 'Language',
        selectLanguage: 'Select Language',
      },
    },
  },
  fr: {
    translation: {
      home: {
        scrollLeft: 'Défiler vers la gauche',
        scrollRight: 'Défiler vers la droite',
        recentlyWatched: 'Récemment regardé',
        continueWatching: 'Continuer à regarder',
        forYou: 'Pour vous',
        newReleases: 'Nouveautés',
        viewAll: 'Voir tout',
        emptyState: 'Aucun contenu disponible',
        greeting: 'Bienvenue sur Azeebo+',
        greetingSecondary: 'Votre plateforme de divertissement ultime',
        title: 'Découvrez du contenu incroyable',
        description:
          'Regardez des films, des émissions de télé-réalité, de la comédie et plus encore',
        trending: 'Tendance',
        trendingSubtitle: 'Ce qui est chaud en ce moment',
        earnWhileWatching: 'GAGNEZ EN REGARDANT',
        unlockRewards: 'Débloquez des récompenses',
        rewardsDescription:
          'Gagnez des points en regardant, en interagissant et en invitant des amis',
        startEarning: 'Commencer à gagner',
        exploreByUniverse: 'Explorer par univers',
        explore: 'Explorer',
        newUpdate: 'Une nouvelle mise à jour est disponible !',
        installNow: 'Installer maintenant',
        welcomeBack: 'Bon retour',
        recentlyWatchedSubtitle: 'Reprenez la ou vous vous etes arrete',
        continueWatchingSubtitle: 'Votre contenu en cours',
        trendingAcrossPlatform: 'Le plus populaire sur Azeebo+',
        newReleasesSubtitle: 'Contenu frais ajoute recemment',
        popularInYourRegion: 'Populaire dans votre region',
        popularNearYou: 'Contenu tendance pres de chez vous',
        topPicksForYou: 'Meilleurs choix pour vous',
        basedOnHistory: 'Base sur votre historique de visionnage',
        popularRightNow: 'Populaire en ce moment',
        inviteFriends: 'Invitez des amis, gagnez des recompenses',
        inviteFriendsDescription: 'Partagez votre lien de parrainage et gagnez des points',
        shareYourLink: 'Partagez votre lien',
        featuredContent: 'Contenu en vedette',
        contentList: 'Liste de contenu',
      },
      content: {
        watch: 'Regarder',
        watched: 'Vu',
      },
      common: {
        loading: 'Chargement...',
        error: 'Une erreur est survenue',
        retry: 'Réessayer',
        cancel: 'Annuler',
        confirm: 'Confirmer',
        save: 'Enregistrer',
        delete: 'Supprimer',
        edit: 'Modifier',
        search: 'Rechercher',
        searchPlaceholder: 'Rechercher films, séries, créateurs…',
        searchNoResults: 'Aucun résultat pour « {{query}} »',
        errorNetwork: "Impossible d'accéder à Azeebo+. Vérifiez votre connexion et réessayez.",
        errorEntitlement: 'Ce titre est inclus avec Azeebo+ Premium.',
        errorPaymentUnavailable:
          'Aucun prestataire de paiement n’est disponible pour le moment. Réessayez plus tard.',
        premium: 'Premium',
      },
      auth: {
        login: 'Connexion',
        register: "S'inscrire",
        logout: 'Déconnexion',
        forgotPassword: 'Mot de passe oublié',
        getStarted: 'Commencer',
        alreadyHaveAccount: 'Vous avez déjà un compte ?',
      },
      settings: {
        title: 'Paramètres',
        language: 'Langue',
        selectLanguage: 'Choisir la langue',
      },
    },
  },
  pt: {
    translation: {
      home: {
        scrollLeft: 'Rolar para a esquerda',
        scrollRight: 'Rolar para a direita',
        recentlyWatched: 'Assistidos recentemente',
        continueWatching: 'Continuar assistindo',
        forYou: 'Para você',
        newReleases: 'Novos lançamentos',
        viewAll: 'Ver tudo',
        emptyState: 'Nenhum conteúdo disponível',
        greeting: 'Bem-vindo ao Azeebo+',
        greetingSecondary: 'Seu centro de entretenimento definitivo',
        title: 'Descubra conteúdo incrível',
        description: 'Assista filmes, reality shows, comédia e muito mais',
        trending: 'Em alta',
        trendingSubtitle: 'O que está bombando agora',
        earnWhileWatching: 'GANHE ASSISTINDO',
        unlockRewards: 'Desbloqueie recompensas',
        rewardsDescription: 'Ganhe pontos assistindo, interagindo e convidando amigos',
        startEarning: 'Comece a ganhar',
        exploreByUniverse: 'Explorar por universo',
        explore: 'Explorar',
        newUpdate: 'Uma nova atualização está disponível!',
        installNow: 'Instalar agora',
        welcomeBack: 'Bem-vindo de volta',
        recentlyWatchedSubtitle: 'Continue de onde parou',
        continueWatchingSubtitle: 'Seu conteudo em andamento',
        trendingAcrossPlatform: 'Mais popular no Azeebo+',
        newReleasesSubtitle: 'Conteudo novo adicionado recentemente',
        popularInYourRegion: 'Popular na sua regiao',
        popularNearYou: 'Conteudo em alta perto de voce',
        topPicksForYou: 'Principais escolhas para voce',
        basedOnHistory: 'Baseado no seu historico',
        popularRightNow: 'Popular agora',
        inviteFriends: 'Convide amigos, ganhe recompensas',
        inviteFriendsDescription: 'Compartilhe seu link e ganhe pontos',
        shareYourLink: 'Compartilhe seu link',
        featuredContent: 'Conteudo em destaque',
        contentList: 'Lista de conteudo',
      },
      content: {
        watch: 'Assistir',
        watched: 'Assistido',
      },
      common: {
        loading: 'Carregando...',
        error: 'Algo deu errado',
        retry: 'Tentar novamente',
        cancel: 'Cancelar',
        confirm: 'Confirmar',
        save: 'Salvar',
        delete: 'Excluir',
        edit: 'Editar',
        search: 'Pesquisar',
        searchPlaceholder: 'Pesquisar filmes, séries, criadores…',
        searchNoResults: 'Nenhum resultado para “{{query}}”',
        errorNetwork:
          'Não foi possível acessar o Azeebo+. Verifique sua conexão e tente novamente.',
        errorEntitlement: 'Este título está incluído no Azeebo+ Premium.',
        errorPaymentUnavailable:
          'Nenhum provedor de pagamento está disponível no momento. Tente novamente mais tarde.',
        premium: 'Premium',
      },
      auth: {
        login: 'Entrar',
        register: 'Cadastrar',
        logout: 'Sair',
        forgotPassword: 'Esqueceu a senha',
        getStarted: 'Começar',
        alreadyHaveAccount: 'Já tem uma conta?',
      },
      settings: {
        title: 'Configurações',
        language: 'Idioma',
        selectLanguage: 'Selecionar idioma',
      },
    },
  },
  ha: {
    translation: {
      home: {
        scrollLeft: 'Gungura hagu',
        scrollRight: 'Gungura dama',
        recentlyWatched: 'Kwanan nan da aka kalla',
        continueWatching: 'Ci gaba da kallo',
        forYou: 'A gare ka',
        newReleases: 'Sabbin fitowar',
        viewAll: 'Duba duka',
        emptyState: 'Babu abun kallo a yanzu',
        greeting: 'Barka da zuwa Azeebo+',
        greetingSecondary: 'Cibiyar nishaɗin ku',
        title: "Gano abubuwan ban sha'awa",
        description: 'Kalli fina-finai, shirye-shiryen gaskiya, wasan barkwanci da ƙari',
        trending: 'Shahararru a yanzu',
        trendingSubtitle: 'Abin da ke zafi a yanzu',
        earnWhileWatching: 'SAMU LADA YAYIN KALLON',
        unlockRewards: 'Buɗe lada',
        rewardsDescription: "Samu maki ta kallo, mu'amala, da gayyatar abokai",
        startEarning: 'Fara samun lada',
        exploreByUniverse: 'Bincika ta sararin samaniya',
        explore: 'Bincika',
        newUpdate: 'Akwai sabon sabuntawa!',
        installNow: 'Shigar yanzu',
        welcomeBack: 'Barka da dawowa',
        recentlyWatchedSubtitle: 'Ci gaba daga inda ka tsaya',
        continueWatchingSubtitle: 'Abubuwan da kake kallo',
        trendingAcrossPlatform: 'Mafi shahara a Azeebo+',
        newReleasesSubtitle: 'Sabbin abubuwa da aka kara kwanan nan',
        popularInYourRegion: 'Shahararru a yankin ku',
        popularNearYou: 'Abubuwan da suka shahara a kusa da ku',
        topPicksForYou: 'Zabin mafi kyau a gare ku',
        basedOnHistory: 'Bisa ga tarihin kallan ku',
        popularRightNow: 'Shahararru a yanzu',
        inviteFriends: 'Gayyatar abokai, sami lada',
        inviteFriendsDescription: 'Raba hanyar hadin ku kuma sami maki',
        shareYourLink: 'Raba hanyar hadin ku',
        featuredContent: 'Fitattun abubuwa',
        contentList: 'Jerin abubuwa',
      },
      content: {
        watch: 'Kalla',
        watched: 'An kalla',
      },
      common: {
        loading: 'Ana lodawa...',
        error: 'Wani abu ya yi kuskure',
        retry: 'Sake gwadawa',
        cancel: 'Soke',
        confirm: 'Tabbatar',
        save: 'Ajiye',
        delete: 'Share',
        edit: 'Gyara',
        search: 'Bincika',
        searchPlaceholder: 'Binciko fina-finai, shirye-shirye, mahalarta…',
        searchNoResults: "Babu sakamako don '{{query}}'",
        errorNetwork: 'Ba za a iya samun Azeebo+ ba. Duba haɗin ka ka sake gwadawa.',
        errorEntitlement: 'Wannan yana cikin Azeebo+ Premium.',
        errorPaymentUnavailable: 'Babu mai biyan kuɗi a halin yanzu. Ka sake gwadawa daga baya.',
        premium: 'Premium',
      },
      auth: {
        login: 'Shiga',
        register: 'Yi rajista',
        logout: 'Fita',
        forgotPassword: 'Manta kalmar sirri',
        getStarted: 'Fara',
        alreadyHaveAccount: 'Kuna da asusu?',
      },
      settings: {
        title: 'Saituna',
        language: 'Harshe',
        selectLanguage: 'Zaɓi harshe',
      },
    },
  },
  yo: {
    translation: {
      home: {
        scrollLeft: 'Yi lọ si apa osi',
        scrollRight: 'Yi lọ si apa ọtun',
        recentlyWatched: 'Titi di akiwo',
        continueWatching: 'Tẹsiwaju wiwo',
        forYou: 'Fun ọ',
        newReleases: 'Awọn tuntun',
        viewAll: 'Wo gbogbo',
        emptyState: 'Ko si ohun ti o wa',
        greeting: 'Kaabo si Azeebo+',
        greetingSecondary: 'Ile-iṣẹ ere idaraya rẹ',
        title: 'Ṣawari Awọn akoonu iyanu',
        description: 'Wo fiimu, awọn ifihan otito, awada ati diẹ sii',
        trending: 'Gbajumo ni bayi',
        trendingSubtitle: 'Ohun ti o gbona ni bayi',
        earnWhileWatching: "JO'GBA ERE NIGBATI O NWO",
        unlockRewards: 'Ṣii awọn ere',
        rewardsDescription: "Jo'gba ojuami nipa wiwo, ibaraenisepo, ati pipe awọn ọrẹ",
        startEarning: 'Bẹrẹ jijere',
        exploreByUniverse: 'Ṣawari nipasẹ agbaye',
        explore: 'Ṣawari',
        newUpdate: 'Imudojuiwọn tuntun wa!',
        installNow: 'Fi sori ero bayi',
        welcomeBack: 'Kaabo pada',
        recentlyWatchedSubtitle: 'Tesiwaju lati ibi ti o ti duro',
        continueWatchingSubtitle: 'Akoonu re ti nlọ lowo',
        trendingAcrossPlatform: 'Gbayi julo ni Azeebo+',
        newReleasesSubtitle: 'Akoonu tuntun ti a fi kun laipe',
        popularInYourRegion: 'Gbayi ni agbegbe re',
        popularNearYou: 'Akoonu ti o gbona nitosi re',
        topPicksForYou: 'Asayan ti o dara julọ fun o',
        basedOnHistory: 'Da lori itan wiwo re',
        popularRightNow: 'Gbayi ni bayi',
        inviteFriends: 'Pe awon ore, jogba ere',
        inviteFriendsDescription: 'Pin ona asopo re ki o jogba ojuami',
        shareYourLink: 'Pin ona asopo re',
        featuredContent: 'Akoonu ifihan',
        contentList: 'Akojọ akoonu',
      },
      content: {
        watch: 'Wo',
        watched: 'Ti wo',
      },
      common: {
        loading: 'Ti n ṣe agberu...',
        error: 'Nkan kan ti ṣe aṣiṣe',
        retry: 'Tun gbiyanju',
        cancel: 'Fagilee',
        confirm: 'Jẹrisi',
        save: 'Fipamọ',
        delete: 'Pa run',
        edit: 'Ṣatunkọ',
        search: 'Ṣewadii',
        searchPlaceholder: 'Ṣàwárí fíìmù, àwọn ifihan, àwọn ẹdá…',
        searchNoResults: 'Kò sí èsì fún “{{query}}”',
        errorNetwork: 'Kò sí ọ̀nà láti dé Azeebo+. Ṣayẹ̀wò ayélujára rẹ kí o tó gbìyànjú.',
        errorEntitlement: 'Àkọ́lé yìí wà nínú Azeebo+ Premium.',
        errorPaymentUnavailable: 'Kò sí ọ̀nà ìsanwóó ní àkókò yìí. Gbìyànjú lẹ́ẹ̀kan si.',
        premium: 'Premium',
      },
      auth: {
        login: 'Wo ile',
        register: 'Forukọsilẹ',
        logout: 'Jade',
        forgotPassword: 'Gbagbe ọrọ igbaniwọle',
        getStarted: 'Bẹrẹ',
        alreadyHaveAccount: 'Ṣe o ni akọọlẹ tẹlẹ?',
      },
      settings: {
        title: 'Awọn eto',
        language: 'Ede',
        selectLanguage: 'Yan ede',
      },
    },
  },
  ig: {
    translation: {
      home: {
        scrollLeft: 'Pịgharịa aka ekpe',
        scrollRight: 'Pịgharịa aka nri',
        recentlyWatched: 'Nke ikpeazụ ị lere',
        continueWatching: "Gaa n'ihu ịlele",
        forYou: 'Maka gị',
        newReleases: 'Mwepụta ọhụrụ',
        viewAll: 'Leghachi ihe niile',
        emptyState: 'Enweghị ihe ọdịnaya dị',
        greeting: 'Nnọọ na Azeebo+',
        greetingSecondary: 'Ebe ntụrụndụ kacha elu gị',
        title: 'Chọpụta Ọdịnaya Dị Iche',
        description: 'Hụ ihe nkiri, ihe ngosi eziokwu, ihe ọchị na ihe ndị ọzọ',
        trending: 'Na-ewu ewu ugbu a',
        trendingSubtitle: 'Ihe na-ekpo ọkụ ugbu a',
        earnWhileWatching: 'NATA ỤGWỌ MGBE Ị NA-ELE',
        unlockRewards: 'Mepee ụgwọ ọrụ',
        rewardsDescription: 'Nweta isi site na ịlele, imekọ ihe, na ịkpọ ndị enyi',
        startEarning: 'Bido Inweta',
        exploreByUniverse: 'Nyocha site na mbara igwe',
        explore: 'Nyochaa',
        newUpdate: 'Mmelite ọhụrụ dị!',
        installNow: 'Wunye ugbu a',
        welcomeBack: 'Nnoo na nlota',
        recentlyWatchedSubtitle: "Gaa n'ihu ebe i kwusiri",
        continueWatchingSubtitle: "Odjnaya gi na-aga n'ihu",
        trendingAcrossPlatform: 'Kacha ewu ewu na Azeebo+',
        newReleasesSubtitle: 'Odjnaya ohuru agbakwunyere na nso nso a',
        popularInYourRegion: 'Na-ewu ewu na mpaghara gi',
        popularNearYou: 'Odjnaya na-ekpo oku nakụkụ gi',
        topPicksForYou: 'Nhoro kacha mma maka gi',
        basedOnHistory: 'Dabere na akụkọ ihe mere eme gi',
        popularRightNow: 'Na-ewu ewu ugbu a',
        inviteFriends: 'Kpọọ ndi enyi, nata ugwo oru',
        inviteFriendsDescription: 'Kesaa njiko gi ma nweta isi',
        shareYourLink: 'Kesaa njiko gi',
        featuredContent: 'Odjnaya egosiputara',
        contentList: 'Ndepụta odjnaya',
      },
      content: {
        watch: 'Lere',
        watched: 'Lerela',
      },
      common: {
        loading: 'Na-ebugo...',
        error: 'Ihe mejọrọ',
        retry: 'Nwaa ọzọ',
        cancel: 'Kagbuo',
        confirm: 'Kwenye',
        save: 'Chekwaa',
        delete: 'Hichapụ',
        edit: 'Dezie',
        search: 'Chọọ',
        searchPlaceholder: 'Chọọ ihe nkiri, ihe onyonyo, ndi okike…',
        searchNoResults: 'Ọnweghị nsonaazụ maka “{{query}}”',
        errorNetwork: 'Enweghị ike iru Azeebo+. Lelee njikọ gị ma nwaa ọzọ.',
        errorEntitlement: 'Aha a dị na Azeebo+ Premium.',
        errorPaymentUnavailable: 'Ọ dịghị ụzọ ịkwụ ụgwọ ugbu a. Nwaa ọzọ emesịa.',
        premium: 'Premium',
      },
      auth: {
        login: 'Banye',
        register: 'Deba aha',
        logout: 'Pụọ',
        forgotPassword: 'Chefuru okwuntughe',
        getStarted: 'Bido',
        alreadyHaveAccount: 'Ị nweelarị akaụntụ?',
      },
      settings: {
        title: 'Ntọala',
        language: 'Asụsụ',
        selectLanguage: 'Họrọ asụsụ',
      },
    },
  },
};

export type SupportedLanguage = keyof typeof resources;

export const LANGUAGES: { code: SupportedLanguage; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo' },
];

/**
 * Detect the device's preferred language and return a supported language code.
 * Falls back to 'en' if the device language is not supported.
 */
function detectDeviceLanguage(): SupportedLanguage {
  try {
    let locale: string;

    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      // Use NativeModules on React Native
      locale =
        NativeModules.I18nManager?.localeIdentifier ||
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'en_US';
    } else {
      // Fallback for web
      locale = navigator.language || 'en-US';
    }

    const langCode = locale.split('_')[0].split('-')[0].toLowerCase();

    // Check if the detected language is in our supported list
    if (LANGUAGES.some((l) => l.code === langCode)) {
      return langCode as SupportedLanguage;
    }
  } catch {
    // Silently fall back to English
  }

  return 'en';
}

// Initialize i18n
i18n.use(initReactI18next as unknown as Parameters<typeof i18n.use>[0]);

// Load saved language and initialize. Runs at module import — app/_layout.tsx
// imports './src/i18n' (side-effect import) so translations are live from the
// first render, not just after the user opens Settings.
void (async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGES_KEY);
    const detectedLanguage = detectDeviceLanguage();
    const initialLanguage = savedLanguage || detectedLanguage;

    await i18n.init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      // Don't suspend UI on translations; fall back to the key until ready.
      react: {
        useSuspense: false,
      },
    });
  } catch {
    await i18n.init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  }
})();

/**
 * Change the app language and persist the choice to AsyncStorage.
 */
export async function changeLanguage(language: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LANGUAGES_KEY, language);
}

export default i18n;
