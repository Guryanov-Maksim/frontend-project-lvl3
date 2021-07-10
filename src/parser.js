const getElementDetails = (dom) => {
  const titleElement = dom.querySelector('title');
  const title = titleElement.textContent;
  const descriptionElement = dom.querySelector('description');
  const description = descriptionElement.textContent;
  const linkElement = dom.querySelector('link');
  const link = linkElement.textContent;
  return {
    title,
    description,
    link,
  };
};

export default (content, state) => {
  const domparser = new DOMParser();
  const dom = domparser.parseFromString(content, 'application/xml');
  const error = dom.querySelector('parsererror');
  if (error) {
    return {
      feed: [],
      posts: [],
      isValid: false,
    };
  }
  const feedDetails = getElementDetails(dom);
  const feedId = state.feeds.currentId;
  const postElements = dom.querySelectorAll('item');
  const posts = [...postElements].reduce((acc, postElement, index) => {
    const postDetails = getElementDetails(postElement);
    const post = {
      title: postDetails.title,
      link: postDetails.link,
      description: postDetails.description,
      feedId,
      id: state.posts.length + index + 1,
    };
    return [...acc, post];
  }, []);
  const feed = {
    title: feedDetails.title,
    link: feedDetails.link,
    description: feedDetails.description,
    id: feedId,
  };
  return {
    feed,
    posts,
    isValid: true,
  };
};
