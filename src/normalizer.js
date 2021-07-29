import _ from 'lodash';

export default (parsedContent, rssLink) => {
  const {
    title,
    link,
    description,
    posts,
  } = parsedContent;

  const feedId = _.uniqueId();
  const feed = {
    title,
    link,
    description,
    id: feedId,
    rssLink,
  };

  const normalizedPosts = posts.map((post) => (
    {
      title: post.title,
      link: post.link,
      description: post.description,
      feedId,
      id: _.uniqueId(),
    }
  ));

  return { feed, posts: normalizedPosts };
};
