import onChange from 'on-change';
import 'bootstrap/dist/css/bootstrap.min.css';

const renderForm = (state, elements) => {
  switch (state.rssForm.status) {
    case 'loading':
      elements.addButton.setAttribute('disabled', true);
      break;
    case 'filling':
    case 'failed': {
      elements.addButton.removeAttribute('disabled');
      break;
    }
    default: {
      throw new Error(`Unsupported status: ${state.rssForm.status}`);
    }
  }
};

const renderInput = (state, { input }) => {
  console.log(state.rssForm.fields.url.valid);
  if (!state.rssForm.fields.url.valid) {
    input.classList.add('border', 'border-warning');
    return;
  }
  input.classList.remove('border', 'border-warning');
};

const renderFeedback = (feedback, container) => {
  container.textContent = feedback;
};

const renderFeeds = (feeds, container) => {
  const li = feeds.map((feed) => (
    `<li>
      <h3>${feed.title}</h3>
      <p>${feed.description}</p>
    </li>`
  ));
  container.innerHTML = `<h2>Фиды</h2><ul>${li.join('')}</ul>`;
};

const renderPosts = (posts, container) => {
  const links = posts.map((post) => (
    `<li><a href=${post.link}>${post.title}</a></li>`
  ));
  container.innerHTML = `<h2>Посты</h2><ul>${links.join('')}</ul>`;
};

const initView = (state, elements) => {
  const mapping = {
    'rssForm.feedback': () => renderFeedback(state.rssForm.feedback, elements.feedback),
    'feeds.contents': () => renderFeeds(state.feeds.contents, elements.feedContainer),
    posts: () => renderPosts(state.posts, elements.postsContainer),
    'rssForm.fields.url': () => renderInput(state, elements),
    'rssForm.status': () => renderForm(state, elements),
  };

  const watchedState = onChange(state, (path) => {
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return watchedState;
};

export default initView;
