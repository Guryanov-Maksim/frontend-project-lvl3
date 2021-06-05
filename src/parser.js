import _ from 'lodash';

export default (content) => {
  const domparser = new DOMParser();
  const dom = domparser.parseFromString(content, 'application/xml');
  // console.log(dom);
  const error = dom.querySelector('parsererror');
  // console.log(error);
  if (error) {
    return {
      feed: null,
      posts: null,
      isValid: false,
    };
  }
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
    const postDescriptionElement = postElement.querySelector('description');
    const description = postDescriptionElement.textContent;
    const postPubDateElement = postElement.querySelector('pubDate');
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
    isValid: true,
  };
};
