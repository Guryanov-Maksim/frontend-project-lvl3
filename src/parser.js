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

export default (content) => {
  const domparser = new DOMParser();
  const dom = domparser.parseFromString(content, 'application/xml');
  const error = dom.querySelector('parsererror');
  if (error) {
    throw new Error('withoutRss');
  }
  const postElements = dom.querySelectorAll('item');
  const posts = [...postElements].map((postElement) => {
    const postDetails = getElementDetails(postElement);
    const post = {
      title: postDetails.title,
      link: postDetails.link,
      description: postDetails.description,
    };
    return post;
  });

  const feedDetails = getElementDetails(dom);
  return ({
    title: feedDetails.title,
    link: feedDetails.link,
    description: feedDetails.description,
    posts,
  });
};
