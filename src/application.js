import axios from 'axios';
import * as yup from 'yup';
import _ from 'lodash';
import i18next from 'i18next';
import initView from './view.js';
import resources from './locales';

const validateUrl = (url) => {
  yup.setLocale({
    mixed: {
      required: 'empty',
    },
    string: {
      url: 'invalidUrl',
    },
  });
  const schema = yup.string().url().required();
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

const parseRssContent = (content) => {
  const domparser = new DOMParser();
  const dom = domparser.parseFromString(content, 'application/xml');
  // console.log(dom);
  const feedTitleElement = dom.querySelector('title');
  const feedTitle = feedTitleElement.textContent;
  const feedDescriptionElement = dom.querySelector('description');
  const feedDescription = feedDescriptionElement.textContent;
  const feedPubDateElement = dom.querySelector('pubDate');
  const pubDate = feedPubDateElement.textContent;
  const feedLinkElement = dom.querySelector('link');
  const feedLink = feedLinkElement.textContent;
  const feedId = _.uniqueId();
  const postElements = dom.querySelectorAll('item');
  const posts = [...postElements].reduce((acc, postElement) => {
    const postTitleElement = postElement.querySelector('title');
    const title = postTitleElement.textContent;
    const postLinkElement = postElement.querySelector('link');
    const link = postLinkElement.textContent;
    const postDescriptionElement = dom.querySelector('description');
    const description = postDescriptionElement.textContent;
    const postPubDateElement = dom.querySelector('pubDate');
    const postPubDate = postPubDateElement.textContent;
    const id = _.uniqueId();
    const post = {
      title,
      link,
      description,
      feedId,
      postPubDate,
      id,
    };
    return [...acc, post];
  }, []);
  const feed = {
    title: feedTitle,
    description: feedDescription,
    id: feedId,
    pubDate,
    link: feedLink,
  };
  return {
    feed,
    posts,
  };
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

export default () => {
  const i18nInstance = i18next.createInstance();
  i18nInstance.init({
    lng: 'ru',
    debug: false,
    resources,
  }).then(() => {
    const state = {
      error: null,
      feeds: {
        links: [],
        contents: [],
      },
      posts: [],
      rssForm: {
        fields: {
          url: {
            valid: true,
            error: null,
            value: '',
          },
        },
        feedback: '',
        status: 'filling',
      },
      uiState: {
        visitedPostId: [],
      },
    };

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
    };

    const input = document.querySelector('[data-url]');
    const form = document.querySelector('.rss-form');

    input.focus();

    const watchedState = initView(state, elements, i18nInstance);

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const rssLink = formData.get('rss-url');

      const error = validateUrl(rssLink);
      if (error) {
        handleError(watchedState, error, i18nInstance);
        return;
      }

      const attachedFeedError = checkRssTracking(rssLink, watchedState.feeds.links);
      if (attachedFeedError) {
        watchedState.rssForm.feedback = i18nInstance.t(`errors.${attachedFeedError}`);
        watchedState.rssForm.fields.url = {
          error: attachedFeedError,
          valid: false,
        };
        return;
      }

      const urlWithoutCorsProblem = new URL(avoidCorsProblem(rssLink));
      urlWithoutCorsProblem.searchParams.append('disableCache', 'true');

      watchedState.rssForm.fields.url = {
        error: null,
        valid: true,
        value: rssLink,
      };
      watchedState.error = null;
      watchedState.rssForm.status = 'loading';
      axios.get(urlWithoutCorsProblem)
        .then((response) => {
          // console.log(data);
          const { feed, posts } = parseRssContent(response.data.contents);
          watchedState.rssForm.feedback = i18nInstance.t('success');
          watchedState.feeds.contents = [feed, ...watchedState.feeds.contents];
          watchedState.feeds.links.push(rssLink);
          console.log([...posts, ...watchedState.posts]);
          watchedState.posts = [...posts, ...watchedState.posts];
          watchedState.rssForm.status = 'filling';
          form.reset();
          input.focus();
        })
        .catch(() => {
          watchedState.rssForm.feedback = i18nInstance.t('errors.network');
          watchedState.rssForm.status = 'failed';
          // watchedState.error = i18nInstance.t('errors.network');
        });
    });

    const watchRssFeed = (links) => {
      const timeout = 5000;
      // const postLinks = document.querySelectorAll('[data-id]');
      // console.log(postLinks);
      // postLinks.forEach((link) => {
      //   link.addEventListener('click', (e) => {
      //     e.preventDefault();
      //     watchedState.uiState.visitedPostId.push(link.dataset.id);
      //   });
      // });
      setTimeout(() => {
        const promises = links.map((link) => {
          const urlWithoutCorsProblem = new URL(avoidCorsProblem(link));
          urlWithoutCorsProblem.searchParams.append('disableCache', 'true');
          return axios.get(urlWithoutCorsProblem);
        });
        Promise.all(promises)
          .then((response) => {
            response.forEach((xml) => {
              const { feed, posts } = parseRssContent(xml.data.contents);
              const newPosts = getNewPosts(posts, state, feed);
              watchedState.posts = [...newPosts, ...watchedState.posts];
            });
          })
          .catch((error) => {
            console.log(error);
          })
          .finally(() => watchRssFeed(links));
      }, timeout);
    };
    watchRssFeed(watchedState.feeds.links);
  });
};
