import onChange from 'on-change';

const renderForm = (state, elements) => {
  switch (state.rssForm.status) {
    case 'loading':
      elements.addButton.setAttribute('disabled', true);
      elements.input.setAttribute('readonly', true);
      break;
    case 'filling':
      elements.addButton.removeAttribute('disabled');
      elements.input.removeAttribute('readonly');
      elements.feedback.classList.remove('text-danger');
      elements.feedback.classList.add('text-success');
      break;
    case 'failed':
      elements.feedback.classList.add('text-danger');
      elements.feedback.classList.remove('text-success');
      elements.addButton.removeAttribute('disabled');
      elements.input.removeAttribute('readonly');
      break;
    default: {
      throw new Error(`Unsupported status: ${state.rssForm.status}`);
    }
  }
};

const renderInput = (state, { input }) => {
  if (!state.rssForm.fields.url.valid) {
    input.classList.add('border', 'border-warning');
    return;
  }
  input.classList.remove('border', 'border-warning');
};

const renderFeedback = (feedback, container) => {
  container.textContent = feedback;
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
  listElements.forEach((li) => {
    ul.append(li);
  });
  container.innerHTML = '';
  container.append(header);
  container.append(ul);
};

const renderModal = (uiState, elements) => {
  if (uiState.activePost === null) {
    elements.modalTitle.textContent = '';
    elements.modalBody.textContent = '';
    elements.modalDetails.setAttribute('href', '#');
    return;
  }
  elements.modalTitle.textContent = uiState.activePost.title;
  elements.modalBody.textContent = uiState.activePost.description;
  elements.modalDetails.setAttribute('href', uiState.activePost.link);
};

const renderPostLink = (uiState, elements) => {
  if (uiState.activePost === null) {
    return;
  }
  const link = elements.postsContainer.querySelector(`[data-id="${uiState.activePost.id}"]`);
  link.classList.remove('fw-bold');
  link.classList.add('fw-normal');
};

const handlePostWatch = (uiState, post) => {
  uiState.activePost = post;
  uiState.visitedPostId.push(post.id);
};

const renderPosts = (state, elements, i18nInstance, watchedUiState) => {
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
    if (state.uiState.visitedPostId.includes(post.id)) {
      link.classList.remove('fw-bold');
      link.classList.add('fw-normal');
    }
    link.textContent = post.title;
    link.addEventListener('click', () => handlePostWatch(watchedUiState, post));

    const button = document.createElement('button');
    button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#exampleModal');
    button.textContent = 'Просмотр';
    button.addEventListener('click', () => handlePostWatch(watchedUiState, post));

    const li = document.createElement('li');
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
    li.append(link);
    li.append(button);

    ul.append(li);
  });
  elements.postsContainer.append(ul);
};

const initView = (state, elements, i18nInstance) => {
  const uiMapping = {
    activePost: (uiState) => {
      renderModal(uiState, elements);
      renderPostLink(uiState, elements);
    },
  };

  const watchedUiState = onChange(state.uiState, (path) => {
    if (uiMapping[path]) {
      uiMapping[path](state.uiState);
    }
  });

  const mapping = {
    'rssForm.feedback': () => renderFeedback(state.rssForm.feedback, elements.feedback),
    'feeds.contents': () => renderFeeds(state.feeds.contents, elements.feedContainer, i18nInstance),
    posts: () => renderPosts(state, elements, i18nInstance, watchedUiState),
    'rssForm.fields.url': () => renderInput(state, elements),
    'rssForm.status': () => renderForm(state, elements),
  };

  const watchedState = onChange(state, (path) => {
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return { watchedState, watchedUiState };
};

export default initView;
