import axios from 'axios';
import * as yup from 'yup';
import initView from './view.js';
import parseRssContent from './parser.js';
import createCrossOriginUrl from './url.js';

yup.setLocale({
  mixed: {
    required: 'empty',
  },
  string: {
    url: 'invalidUrl',
  },
});

const schema = yup
  .string()
  .trim()
  .url()
  .required();

const validateUrl = (url) => {
  try {
    schema.validateSync(url);
    return null;
  } catch (error) {
    return error.message;
  }
};

const checkRssTracking = (link, attachedFeedLinks) => (
  (attachedFeedLinks.some((attachedLink) => attachedLink === link))
    ? 'isAdded'
    : null
);

const getNewPosts = (posts, state, feed) => {
  const attachedFeed = state.feeds.contents.find((feedInState) => feed.link === feedInState.link);
  const feedPosts = state.posts.filter((post) => post.feedId === attachedFeed.id);
  const newPosts = posts
    .filter((post) => !feedPosts.some((feedPost) => feedPost.link === post.link))
    .map((post) => {
      post.feedId = attachedFeed.id;
      return post;
    });
  return newPosts;
};

const handleError = (state, error, i18nInstance) => {
  state.rssForm.fields.url = {
    error,
    valid: false,
  };
  state.rssForm.feedback = i18nInstance.t(`errors.${error}`);
};

const watchRssFeed = (watchedState) => {
  const { links } = watchedState.feeds;
  const timeout = 5000;
  setTimeout(() => {
    const promises = links.map((link) => {
      const url = createCrossOriginUrl(link);
      return axios.get(url);
    });
    Promise.all(promises)
      .then((responses) => {
        responses.forEach((response) => {
          const { feed, posts } = parseRssContent(response.data.contents);
          const newPosts = getNewPosts(posts, watchedState, feed);
          watchedState.posts = [...newPosts, ...watchedState.posts];
        });
      })
      .catch((error) => {
        throw error;
      })
      .finally(() => watchRssFeed(watchedState));
  }, timeout);
};

const addFeed = (url, state, elements, i18nInstance, rssLink) => {
  axios.get(url)
    .then((response) => {
      const { feed, posts, isValid } = parseRssContent(response.data.contents);
      if (!isValid) {
        state.rssForm.feedback = i18nInstance.t('errors.withoutRss');
        state.rssForm.status = 'failed';
        return;
      }
      state.rssForm.feedback = i18nInstance.t('success');
      state.feeds.contents = [feed, ...state.feeds.contents];
      state.feeds.links.push(rssLink);
      state.posts = [...posts, ...state.posts];
      state.rssForm.status = 'filling';
      elements.form.reset();
      elements.input.focus();
    })
    .catch(() => {
      state.rssForm.feedback = i18nInstance.t('errors.network');
      state.rssForm.status = 'failed';
    });
};

export default (state, i18nInstance) => {
  const elements = {
    feedback: document.querySelector('.feedback'),
    feedContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    input: document.querySelector('[data-url = "url"]'),
    addButton: document.querySelector('#feed-submit'),
    modal: document.querySelector('#exampleModal'),
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalDetails: document.querySelector('[data-details]'),
    closeButtons: document.querySelectorAll('[data-bs-dismiss="modal"]'),
    form: document.querySelector('.rss-form'),
  };

  elements.input.focus();

  const watchedState = initView(state, elements, i18nInstance);

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const rssLink = formData.get('rss-url');

    const error = validateUrl(rssLink);
    if (error) {
      handleError(watchedState, error, i18nInstance);
      watchedState.rssForm.status = 'failed';
      return;
    }

    const attachedFeedError = checkRssTracking(rssLink, watchedState.feeds.links);
    if (attachedFeedError) {
      watchedState.rssForm.feedback = i18nInstance.t(`errors.${attachedFeedError}`);
      watchedState.rssForm.fields.url = {
        valid: false,
      };
      watchedState.rssForm.status = 'failed';
      return;
    }

    const url = createCrossOriginUrl(rssLink);

    watchedState.rssForm.fields.url = {
      valid: true,
    };
    watchedState.rssForm.status = 'loading';
    addFeed(url, watchedState, elements, i18nInstance, rssLink);
  });

  watchRssFeed(watchedState);
};
