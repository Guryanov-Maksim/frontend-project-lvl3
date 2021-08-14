import _ from 'lodash';

export default (parsedContent, rssLink, attachedFeed) => {
  const {
    title,
    description,
    items,
  } = parsedContent;

  const feedId = attachedFeed ? attachedFeed.id : _.uniqueId();
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
