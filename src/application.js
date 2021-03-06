import _ from 'lodash';
import axios from 'axios';
import * as yup from 'yup';
import initView from './view.js';
import parse from './parser.js';
import normalize from './normalizer.js';

const postsUpdateTimeout = 5000;

const addProxy = (url) => `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}&disableCache=true`;

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

const getFeedAndPosts = (rssLink, { feeds }) => {
  const crossOriginUrl = addProxy(rssLink);

  return axios.get(crossOriginUrl)
    .then((response) => parse(response.data.contents))
    .then((feedData) => {
      const feed = feeds.find((feedInState) => feedInState.rssLink === rssLink) || { rssLink };
      return normalize(feedData, feed);
    });
};

const watchRssFeed = (state) => {
  const { feeds } = state;
  const links = feeds.map((feed) => feed.rssLink);

  setTimeout(() => {
    const promises = links.map((link) => getFeedAndPosts(link, state));
    Promise.all(promises)
      .then((feedsWithPosts) => {
        feedsWithPosts.forEach(({ posts }) => {
          const newPosts = _.differenceWith(
            posts,
            state.posts,
            ((post1, post2) => post1.link === post2.link),
          );
          state.posts = [...newPosts, ...state.posts];
        });
      })
      .catch((error) => {
        console.error(error);
      })
      .finally(() => watchRssFeed(state));
  }, postsUpdateTimeout);
};

const addFeed = (state, rssLink) => {
  state.feedAddingProcess.state = 'loading';

  getFeedAndPosts(rssLink, state)
    .then(({ feed, posts }) => {
      state.feedAddingProcess.state = 'loaded';
      state.feedAddingProcess.error = null;
      state.feeds = [feed, ...state.feeds];
      state.posts = [...posts, ...state.posts];
      state.feedAddingProcess.state = 'filling';
    })
    .catch((error) => {
      state.feedAddingProcess.error = axios.isAxiosError(error)
        ? 'network'
        : error.message;
      state.feedAddingProcess.state = 'failed';
    });
};

export default (state, i18nInstance) => {
  const elements = {
    feedback: document.querySelector('.feedback'),
    feedContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    input: document.querySelector('[data-url = "url"]'),
    addButton: document.querySelector('#feed-submit'),
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalDetails: document.querySelector('[data-details]'),
    form: document.querySelector('.rss-form'),
  };

  elements.input.focus();

  const watchedState = initView(state, elements, i18nInstance);

  elements.postsContainer.addEventListener('click', (event) => {
    const { id } = event.target.dataset;
    if (!id) {
      return;
    }
    watchedState.uiState.activePostId = id;
    watchedState.uiState.visitedPostIds.add(id);
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const rssLink = formData.get('rss-url');

    validateUrl(rssLink, watchedState.feeds)
      .then((validUrl) => {
        watchedState.feedAddingProcess.error = null;
        watchedState.feedAddingProcess.validationState = 'valid';
        addFeed(watchedState, validUrl);
      })
      .catch((error) => {
        watchedState.feedAddingProcess.error = error.message;
        watchedState.feedAddingProcess.validationState = 'invalid';
      });
  });
  watchRssFeed(watchedState);
};
