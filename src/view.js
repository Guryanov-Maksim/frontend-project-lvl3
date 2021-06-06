import onChange from 'on-change';

// to do:
// 1. exclude xss violations
// 3. понять как я запустил тесты (помог бабель?)
// 4. Почему в тестах нужно добавлять 'access-control-allow-origin': '*',
// 5. посмотреть обязателен ли pubDate в RSS
const renderForm = (state, elements) => {
  switch (state.rssForm.status) {
    case 'loading':
      elements.addButton.setAttribute('disabled', true);
      elements.input.setAttribute('readonly', true);
      break;
    case 'filling':
    case 'failed': {
      elements.addButton.removeAttribute('disabled');
      elements.input.removeAttribute('readonly');
      break;
    }
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
  const li = feeds.map((feed) => (
    `<li data-testid="feed">
      <h3>${feed.title}</h3>
      <p>${feed.description}</p>
    </li>`
  ));
  const header = i18nInstance.t('feeds.header');
  container.innerHTML = `<h2>${header}</h2><ul>${li.join('')}</ul>`;
};

const renderModal = (uiState, elements) => {
  console.log(uiState.activePost);
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
  // uiState.visitedPostId.forEach((id) => {
  //   const link = elements.postsContainer.querySelector(`[data-id="${id}"]`);
  //   link.classList.remove('fw-bold', 'font-weight-bold');
  //   link.classList.add('fw-normal', 'font-weight-normal');
  // });
  if (uiState.activePost === null) {
    return;
  }
  const link = elements.postsContainer.querySelector(`[data-id="${uiState.activePost.id}"]`);
  link.classList.remove('fw-bold', 'font-weight-bold');
  link.classList.add('fw-normal', 'font-weight-normal');
  // const modalBackdrop = document.querySelector('.modal-backdrop');
  // console.log(modalBackdrop);
  // modalBackdrop.addEventListener('click', () => {
  //   console.log(modalBackdrop);
  //   uiState.activePost = null;
  // }, true);
};

const handlePostWatch = (uiState, post) => {
  uiState.activePost = post;
  uiState.visitedPostId.push(post.id);
};

const renderPosts = (state, elements, i18nInstance, watchedUiState) => {
  const header = i18nInstance.t('posts.header');
  elements.postsContainer.innerHTML = `<h2>${header}</h2>`;
  const ul = document.createElement('ul');
  state.posts.forEach((post) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="fw-bold font-weight-bold" href=${post.link} data-id="${post.id}" data-testid="post">${post.title}</a>
      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
        Просмотр
      </button>`;
    const seeLink = li.querySelector('[data-id]');
    seeLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(post.link, '_blank').focus();
    });
    const button = li.querySelector('[data-bs-toggle="modal"]');

    if (state.uiState.visitedPostId.includes(post.id)) {
      seeLink.classList.remove('fw-bold', 'font-weight-bold');
      seeLink.classList.add('fw-normal', 'font-weight-normal');
    }

    // li.addEventListener('click', () => {
    //   elements.modalTitle.textContent = post.title;
    //   elements.modalBody.textContent = post.description;
    //   elements.modalDetails.setAttribute('href', post.link);
    //   seeLink.classList.remove('fw-bold', 'font-weight-bold');
    //   seeLink.classList.add('fw-normal', 'font-weight-normal');
    //   state.uiState.visitedPostId.push(post.id);
    // });

    button.addEventListener('click', () => handlePostWatch(watchedUiState, post));
    seeLink.addEventListener('click', () => handlePostWatch(watchedUiState, post));
    // li.addEventListener('click', () => handlePostWatch(watchedUiState, post));

    // renderModal();

    ul.appendChild(li);
  });
  elements.postsContainer.appendChild(ul);
};

const initView = (state, elements, i18nInstance) => {
  const { uiState } = state;
  const watchedUiState = onChange(uiState, (path) => {
    switch (path) {
      case 'activePost':
        renderModal(uiState, elements);
        renderPostLink(uiState, elements);
        break;
      case 'visitedPostId':
        // renderPostLink(uiState, elements);
        break;
      default:
        throw new Error(`non supported path: ${path}`);
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
