export default (link) => (
  `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(link)}&disableCache=true`
);
