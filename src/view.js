import onChange from 'on-change';

const renderForm = (formState, elements) => {
  switch (formState) {
    case 'loading':
      elements.input.classList.remove('border', 'border-warning');
      elements.addButton.setAttribute('disabled', true);
      elements.input.setAttribute('readonly', true);
      break;
    case 'filling':
      elements.addButton.removeAttribute('disabled');
      elements.input.removeAttribute('readonly');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      elements.input.classList.remove('border', 'border-warning');
      break;
    case 'failed':
      elements.feedback.classList.add('text-danger');
      elements.feedback.classList.remove('text-success');
      elements.addButton.removeAttribute('disabled');
      elements.input.removeAttribute('readonly');
      elements.input.classList.add('border', 'border-warning');
      break;
    default: {
      throw new Error(`Unsupported state: ${formState}`);
    }
  }
};

const renderFeedback = (error, container) => {
  container.textContent = error;
};

const renderFeeds = (feeds, container, i18nInstance) => {
  const listElements = feeds.map((feed) => {
    const header = document.createElement('h3');
    header.classList.add('h6', 'm-0');
    header.textContent = feed.title;

    const p = document.createElement('p');
    p.classList.add('m-0', 'small', 'text-black-50');
    p.textContent = feed.description;

    const li = document.createElement('li');
    li.classList.add('list-group-item', 'border-0', 'border-end-0');
    li.setAttribute('data-testid', 'feed');
    li.append(header);
    li.append(p);
    return li;
  });
  const header = document.createElement('h2');
  header.textContent = i18nInstance.t('feeds.header');
  const ul = document.createElement('ul');
  ul.classList.add('list-group-item', 'border-0', 'border-end-0');
  ul.append(...listElements);
  container.innerHTML = '';
  container.append(header);
  container.append(ul);
};

const renderModal = (activePost, elements) => {
  const { title, description, link } = activePost;
  elements.modalTitle.textContent = title;
  elements.modalBody.textContent = description;
  elements.modalDetails.setAttribute('href', link);
};

const renderPostLink = (activePostId, elements) => {
  const link = elements.postsContainer.querySelector(`[data-id="${activePostId}"]`);
  link.classList.remove('fw-bold');
  link.classList.add('fw-normal');
};

const handlePostWatch = (uiState, post) => {
  uiState.activePost = post;
  uiState.visitedPostIds.add(post.id);
};

const renderPosts = (state, elements, i18nInstance) => {
  const header = i18nInstance.t('posts.header');
  elements.postsContainer.innerHTML = `<h2>${header}</h2>`;
  const ul = document.createElement('ul');
  ul.classList.add('list-group', 'border-0', 'rounded-0');
  state.posts.forEach((post) => {
    const link = document.createElement('a');
    const linkAttributes = [
      ['href', post.link],
      ['target', '_black'],
      ['data-id', post.id],
      ['data-testid', 'post'],
    ];
    linkAttributes.forEach(([attribute, value]) => {
      link.setAttribute(attribute, value);
    });
    link.classList.add('fw-bold');
    if (state.uiState.visitedPostIds.has(post.id)) {
      link.classList.remove('fw-bold');
      link.classList.add('fw-normal');
    }
    link.textContent = post.title;

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#exampleModal');
    button.textContent = i18nInstance.t('posts.seeButton');

    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    li.append(link);
    li.append(button);
    li.addEventListener('click', (event) => {
      switch (event.target) {
        case button:
        case link:
          handlePostWatch(state.uiState, post);
          break;
        default:
          break;
      }
    });

    ul.append(li);
  });
  elements.postsContainer.append(ul);
};

const initView = (state, elements, i18nInstance) => {
  const mapping = {
    'rssForm.error': () => renderFeedback(state.rssForm.error, elements.feedback),
    feeds: () => renderFeeds(state.feeds, elements.feedContainer, i18nInstance),
    posts: (watchedState) => renderPosts(watchedState, elements, i18nInstance),
    'rssForm.state': () => renderForm(state.rssForm.state, elements),
    'uiState.activePost': (watchedState) => {
      renderModal(watchedState.uiState.activePost, elements);
      renderPostLink(watchedState.uiState.activePost.id, elements);
    },
  };

  const watchedState = onChange(state, (path) => {
    if (mapping[path]) {
      mapping[path](watchedState);
    }
  });

  return watchedState;
};

export default initView;
