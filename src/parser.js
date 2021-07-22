export default (content) => {
  const domparser = new DOMParser();
  const dom = domparser.parseFromString(content, 'application/xml');
  const error = dom.querySelector('parsererror');
  if (error) {
    throw new Error('withoutRss');
  }

  return dom;
};
