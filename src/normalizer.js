import _ from 'lodash';

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

export default (dom, rssLink) => {
  const feedDetails = getElementDetails(dom);
  const feedId = _.uniqueId();
  const feed = {
    title: feedDetails.title,
    link: feedDetails.link,
    description: feedDetails.description,
    id: feedId,
    rssLink,
  };

  const postElements = dom.querySelectorAll('item');
  const posts = [...postElements].map((postElement) => {
    const postDetails = getElementDetails(postElement);
    const post = {
      title: postDetails.title,
      link: postDetails.link,
      description: postDetails.description,
      feedId,
      id: _.uniqueId(),
    };
    return post;
  });

  return { feed, posts };
};
