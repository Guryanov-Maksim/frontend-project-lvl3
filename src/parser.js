const getElementDetails = (element) => {
  const titleElement = element.querySelector('title');
  const descriptionElement = element.querySelector('description');
  const linkElement = element.querySelector('link');

  return {
    title: titleElement.textContent,
    description: descriptionElement.textContent,
    link: linkElement.textContent,
  };
};

export default (content) => {
  const domparser = new DOMParser();
  const dom = domparser.parseFromString(content, 'application/xml');
  const error = dom.querySelector('parsererror');
  if (error) {
    throw new Error('withoutRss');
  }
  const itemElements = dom.querySelectorAll('item');

  const items = [...itemElements].map(getElementDetails);

  const feedDetails = getElementDetails(dom);
  return ({
    title: feedDetails.title,
    description: feedDetails.description,
    items,
  });
};
