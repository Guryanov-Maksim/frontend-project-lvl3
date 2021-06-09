import axios from 'axios';
import * as yup from 'yup';
import initView from './view.js';
import parseRssContent from './parser.js';

const validateUrl = (url) => {
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

const avoidCorsProblem = (url) => (
  `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`
);

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
      const urlWithoutCorsProblem = new URL(avoidCorsProblem(link));
      urlWithoutCorsProblem.searchParams.append('disableCache', 'true');
      return axios.get(urlWithoutCorsProblem);
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

  const { watchedState, watchedUiState } = initView(state, elements, i18nInstance);

  const handleModalClearing = (event, rightTarget) => {
    if (event.target !== rightTarget) {
      return;
    }
    watchedUiState.activePost = null;
  };

  elements.modal.addEventListener('click', (event) => handleModalClearing(event, elements.modal));

  elements.closeButtons.forEach((button) => {
    button.addEventListener('click', (event) => handleModalClearing(event, button));
  });

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
        // error: attachedFeedError,
        valid: false,
      };
      watchedState.rssForm.status = 'failed';
      return;
    }

    const urlWithoutCorsProblem = new URL(avoidCorsProblem(rssLink));
    urlWithoutCorsProblem.searchParams.append('disableCache', 'true');

    watchedState.rssForm.fields.url = {
      // error: null,
      valid: true,
      // value: rssLink,
    };
    // watchedState.error = null;
    watchedState.rssForm.status = 'loading';
    axios.get(urlWithoutCorsProblem)
      .then((response) => {
        const { feed, posts, isValid } = parseRssContent(response.data.contents);
        if (!isValid) {
          watchedState.rssForm.feedback = i18nInstance.t('errors.withoutRss');
          watchedState.rssForm.status = 'failed';
          return;
        }
        watchedState.rssForm.feedback = i18nInstance.t('success');
        watchedState.feeds.contents = [feed, ...watchedState.feeds.contents];
        watchedState.feeds.links.push(rssLink);
        watchedState.posts = [...posts, ...watchedState.posts];
        watchedState.rssForm.status = 'filling';
        elements.form.reset();
        elements.input.focus();
      })
      .catch(() => {
        watchedState.rssForm.feedback = i18nInstance.t('errors.network');
        watchedState.rssForm.status = 'failed';
      });
  });

  watchRssFeed(watchedState);
};
