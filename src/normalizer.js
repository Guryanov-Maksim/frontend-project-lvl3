import _ from 'lodash';

export default (parsedContent, attachedFeed) => {
  const {
    title,
    description,
    items,
  } = parsedContent;
  const { rssLink } = attachedFeed;

  const feedId = _.get(attachedFeed, 'id', _.uniqueId());
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
