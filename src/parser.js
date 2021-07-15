export default (content, i18nInstance) => {
  const domparser = new DOMParser();
  const dom = domparser.parseFromString(content, 'application/xml');
  const error = dom.querySelector('parsererror');
  if (error) {
    return {
      dom: null,
      parserError: i18nInstance.t('errors.withoutRss'),
    };
  }

  return {
    dom,
    parserError: null,
  };
};
