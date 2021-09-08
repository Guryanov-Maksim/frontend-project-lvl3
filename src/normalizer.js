import _ from 'lodash';

export default (feedData, { id = null, rssLink }) => {
  const {
    title,
    description,
    items,
  } = feedData;

  const feedId = id || _.uniqueId();
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
