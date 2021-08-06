import _ from 'lodash';

export default (parsedContent, rssLink) => {
  const {
    title,
    description,
    items,
  } = parsedContent;

  const feedId = _.uniqueId();
  const feed = {
    title,
    description,
    id: feedId,
    rssLink,
  };

  const posts = items.map((item) => (
    {
      ...item,
      feedId,
      id: _.uniqueId(),
    }
  ));

  return { feed, posts };
};
