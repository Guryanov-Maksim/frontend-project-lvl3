import _ from 'lodash';

const getElementDetails = (dom) => {
  const titleElement = dom.querySelector('title');
  const title = titleElement.textContent;
  const descriptionElement = dom.querySelector('description');
  const description = descriptionElement.textContent;
  const linkElement = dom.querySelector('link');
  const link = linkElement.textContent;
  const id = _.uniqueId();
  return {
    title,
    description,
    link,
    id,
  };
};

export default (content) => {
  const domparser = new DOMParser();
  const dom = domparser.parseFromString(content, 'application/xml');
  const error = dom.querySelector('parsererror');
  if (error) {
    return {
      feed: null,
      posts: null,
      isValid: false,
    };
  }
  const feedDetails = getElementDetails(dom);
  const feedId = feedDetails.id;
  const postElements = dom.querySelectorAll('item');
  const posts = [...postElements].reduce((acc, postElement) => {
    const postDetails = getElementDetails(postElement);
    const post = {
      title: postDetails.title,
      link: postDetails.link,
      description: postDetails.description,
      feedId,
      id: postDetails.id,
    };
    return [...acc, post];
  }, []);
  const feed = {
    title: feedDetails.title,
    link: feedDetails.link,
    description: feedDetails.description,
    id: feedDetails.id,
  };
  return {
    feed,
    posts,
    isValid: true,
  };
};
