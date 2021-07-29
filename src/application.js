import axios from 'axios';
import * as yup from 'yup';
import initView from './view.js';
import parseRssContent from './parser.js';
import createCrossOriginUrl from './url.js';
import normalizeContent from './normalizer.js';

const validateUrl = (url, feeds) => {
  const trackedFeedUrls = feeds.map((feed) => feed.rssLink);
  const schema = yup
    .string()
    .trim()
    .url()
    .required()
    .notOneOf(trackedFeedUrls);
  return schema.validate(url);
};

const getNewPosts = (posts, state, feed) => {
  const attachedFeed = state.feeds.find((feedInState) => feed.link === feedInState.link);
  const feedPosts = state.posts.filter((post) => post.feedId === attachedFeed.id);
  const newPosts = posts
    .filter((post) => !feedPosts.some((feedPost) => feedPost.link === post.link))
    .map((post) => {
      post.feedId = attachedFeed.id;
      return post;
    });
  return newPosts;
};

const watchRssFeed = (watchedState, i18nInstance) => {
  const { feeds } = watchedState;
  const links = feeds.map((feed) => feed.rssLink);
  const timeout = 5000;
  setTimeout(() => {
    const promises = links.map((link) => {
      const url = createCrossOriginUrl(link);
      return axios.get(url);
    });
    Promise.all(promises)
      .then((responses) => responses.map((response) => parseRssContent(response.data.contents)))
      .then((parsedContents) => parsedContents.map((content) => normalizeContent(content)))
      .then((normalizedContents) => {
        normalizedContents.forEach(({ feed, posts }) => {
          const newPosts = getNewPosts(posts, watchedState, feed);
          watchedState.posts = [...newPosts, ...watchedState.posts];
        });
      })
      .catch((error) => {
        throw error;
      })
      .then(() => watchRssFeed(watchedState, i18nInstance));
  }, timeout);
};

const watchMapping = {
  stop: (state, i18nInstance) => {
    state.rssWathing = 'run';
    watchRssFeed(state, i18nInstance);
  },
  run: () => {},
};

const addFeed = (state, elements, i18nInstance, rssLink) => {
  const url = createCrossOriginUrl(rssLink);

  axios.get(url)
    .then((response) => parseRssContent(response.data.contents))
    .then((parsedContent) => normalizeContent(parsedContent, rssLink))
    .then(({ feed, posts }) => {
      state.rssForm.error = 'success';
      state.feeds = [feed, ...state.feeds];
      state.posts = [...posts, ...state.posts];
      state.rssForm.state = 'filling';
      elements.form.reset();
      elements.input.focus();
    })
    .catch((error) => {
      state.rssForm.error = error.message;
      state.rssForm.state = 'failed';
    })
    .then(() => {
      watchMapping[state.rssWatching](state, i18nInstance);
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

    validateUrl(rssLink, watchedState.feeds)
      .then((validUrl) => {
        watchedState.rssForm.state = 'loading';
        addFeed(watchedState, elements, i18nInstance, validUrl);
      })
      .catch((error) => {
        watchedState.rssForm.error = error.message;
        watchedState.rssForm.state = 'failed';
      });
  });
};
