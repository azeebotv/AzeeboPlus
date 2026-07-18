import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      home: {
        scrollLeft: 'Scroll left',
        scrollRight: 'Scroll right',
        recentlyWatched: 'Recently Watched',
        continueWatching: 'Continue Watching',
        forYou: 'For You',
        trending: 'Trending',
        newReleases: 'New Releases',
        viewAll: 'View All',
        emptyState: 'No content available yet',
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
      },
      auth: {
        login: 'Login',
        register: 'Register',
        logout: 'Logout',
        forgotPassword: 'Forgot Password',
      },
    },
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
i18n.use(initReactI18next as any).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
