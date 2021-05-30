import onChange from 'on-change';

// to do:
// 1. exclude xss violations
// 2. Не содержит RSS

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
    `<li>
      <h3>${feed.title}</h3>
      <p>${feed.description}</p>
    </li>`
  ));
  const header = i18nInstance.t('feeds.header');
  container.innerHTML = `<h2>${header}</h2><ul>${li.join('')}</ul>`;
};

const renderPosts = (state, elements, i18nInstance) => {
  const header = i18nInstance.t('posts.header');
  elements.postsContainer.innerHTML = `<h2>${header}</h2>`;
  const ul = document.createElement('ul');
  state.posts.forEach((post) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <a class="fw-bold font-weight-bold" href=${post.link} data-id="${post.id}">${post.title}</a>
      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
        Просмотр
      </button>`;
    const seeLink = li.querySelector('[data-id]');
    seeLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.open(post.link, '_blank').focus();
    });

    if (state.uiState.visitedPostId.includes(post.id)) {
      seeLink.classList.remove('fw-bold', 'font-weight-bold');
      seeLink.classList.add('fw-normal', 'font-weight-normal');
    } else {
      seeLink.classList.add('fw-bold', 'font-weight-bold');
      seeLink.classList.remove('fw-normal', 'font-weight-normal');
    }

    li.addEventListener('click', () => {
      elements.modalTitle.textContent = post.title;
      elements.modalBody.textContent = post.description;
      elements.modalDetails.setAttribute('href', post.link);
      seeLink.classList.remove('fw-bold', 'font-weight-bold');
      seeLink.classList.add('fw-normal', 'font-weight-normal');
      state.uiState.visitedPostId.push(post.id);
      console.log(state.uiState.visitedPostId);
    });
    ul.appendChild(li);
  });
  elements.postsContainer.appendChild(ul);
};

const initView = (state, elements, i18nInstance) => {
  const mapping = {
    'rssForm.feedback': () => renderFeedback(state.rssForm.feedback, elements.feedback),
    'feeds.contents': () => renderFeeds(state.feeds.contents, elements.feedContainer, i18nInstance),
    posts: () => renderPosts(state, elements, i18nInstance),
    'rssForm.fields.url': () => renderInput(state, elements),
    'rssForm.status': () => renderForm(state, elements),
  };

  const watchedState = onChange(state, (path) => {
    console.log(path);
    if (mapping[path]) {
      mapping[path]();
    }
  });

  return watchedState;
};

export default initView;
