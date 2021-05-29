import axios from 'axios';
import * as yup from 'yup';
import _ from 'lodash';
import initView from './view.js';

const validateUrl = (url) => {
  const schema = yup.string().url().required();
  try {
    schema.validateSync(url);
    return null;
  } catch (error) {
    return error.message;
  }
};

const checkRssTracking = (link, attachedFeedLinks) => (
  attachedFeedLinks.some((attachedLink) => attachedLink === link)
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
    const post = {
      title,
      link,
      description,
      feedId,
      postPubDate,
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

const handleError = (state, error) => {
  switch (error) {
    case ('this is a required field'):
      state.rssForm.feedback = 'Не должно быть пустым';
      break;
    case ('this must be a valid URL'):
      state.rssForm.feedback = 'Ссылка должна быть валидным URL';
      break;
    default:
      throw new Error(`non-processed form error: ${error}`);
  }

  state.rssForm.fields.url = {
    error,
    valid: false,
  };
};

export default () => {
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
  };

  const elements = {
    feedback: document.querySelector('.feedback'),
    feedContainer: document.querySelector('.feeds'),
    postsContainer: document.querySelector('.posts'),
    input: document.querySelector('[data-url = "url"]'),
    addButton: document.querySelector('#feed-submit'),
  };

  const input = document.querySelector('[data-url]');
  const form = document.querySelector('.rss-form');

  input.focus();

  const watchedState = initView(state, elements);

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const rssLink = formData.get('rss-url');

    const error = validateUrl(rssLink);

    if (error) {
      handleError(watchedState, error);
      return;
    }

    const urlWithoutCorsProblem = new URL(avoidCorsProblem(rssLink));
    urlWithoutCorsProblem.searchParams.append('disableCache', 'true');

    const attachedFeedError = checkRssTracking(rssLink, state.feeds.links);

    if (attachedFeedError) {
      watchedState.rssForm.feedback = 'RSS уже подключен';
      watchedState.rssForm.fields.url = {
        error: attachedFeedError,
        valid: false,
      };
      return;
    }
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
        watchedState.rssForm.feedback = 'RSS успешно загружен';
        watchedState.feeds.contents = [feed, ...watchedState.feeds.contents];
        watchedState.feeds.links.push(rssLink);
        watchedState.posts = [...posts, ...watchedState.posts];
        watchedState.rssForm.status = 'filling';
      })
      .catch((err) => {
        console.log(err);
        watchedState.rssForm.feedback = 'Ошибка сети';
        watchedState.rssForm.status = 'failed';
        watchedState.error = error.message;
      }).finally(() => {
        form.reset();
        input.focus();
      });
  });

  const watchRssFeed = (links) => {
    setInterval(() => {
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
        });
    }, 5000);
  };
  watchRssFeed(watchedState.feeds.links);
};
