import i18next from 'i18next';
import * as yup from 'yup';
import { ru, errors } from './locales';
import addAndWatchFeeds from './application.js';
import 'bootstrap/js/dist/modal.js';

export default () => {
  yup.setLocale(errors);

  const defaultLanguage = 'ru';
  const i18nInstance = i18next.createInstance();
  return i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources: {
      ru,
    },
  }).then(() => {
    const state = {
      feeds: [],
      posts: [],
      rssForm: {
        error: null,
        state: 'filling',
      },
      uiState: {
        visitedPostIds: new Set(),
        activePostId: null,
      },
    };
    addAndWatchFeeds(state, i18nInstance);
  });
};
