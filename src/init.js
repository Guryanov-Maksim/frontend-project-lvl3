import i18next from 'i18next';
import resources from './locales';
import addAndWatchFeeds from './application.js';

export default () => {
  const defaultLanguage = 'ru';
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: defaultLanguage,
    debug: false,
    resources,
  }).then(() => {
    const state = {
      // error: null,
      feeds: {
        links: [],
        contents: [],
      },
      posts: [],
      rssForm: {
        fields: {
          url: {
            valid: true,
            // error: null,
            // value: '',
          },
        },
        feedback: '',
        status: 'filling',
      },
      uiState: {
        visitedPostId: [],
        activePost: null,
      },
    };
    addAndWatchFeeds(state, i18nInstance);
  });
};
