import onChange from 'on-change';

const initView = (appState, elements, i18nInstance) => {
  const {
    feedback,
    feedContainer,
    postsContainer,
    input,
    addButton,
    modalTitle,
    modalBody,
    modalDetails,
    form,
  } = elements;

  const renderFeedback = (error) => {
    if (error) {
      feedback.textContent = i18nInstance.t(`errors.${error}`);
      feedback.classList.add('text-danger');
      feedback.classList.remove('text-success');
      return;
    }
    feedback.textContent = i18nInstance.t('success');
    feedback.classList.remove('text-danger');
    feedback.classList.add('text-success');
  };

  const renderFeeds = ({ feeds }) => {
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
    feedContainer.innerHTML = '';
    feedContainer.append(header);
    feedContainer.append(ul);
  };

  const renderForm = ({ feedAddingProcess: { error, state } }) => {
    switch (state) {
      case 'loaded':
        renderFeedback(error);
        break;
      case 'loading':
        addButton.setAttribute('disabled', true);
        input.setAttribute('readonly', true);
        break;
      case 'filling':
        addButton.removeAttribute('disabled');
        input.removeAttribute('readonly');
        form.reset();
        input.focus();
        break;
      case 'failed':
        renderFeedback(error);
        addButton.removeAttribute('disabled');
        input.removeAttribute('readonly');
        break;
      default: {
        throw new Error(`Unsupported state: ${state}`);
      }
    }
  };

  const renderModal = (state) => {
    const activePost = state.posts.find((post) => post.id === state.uiState.activePostId);
    const { title, description, link } = activePost;
    modalTitle.textContent = title;
    modalBody.textContent = description;
    modalDetails.setAttribute('href', link);
  };

  const renderPosts = (state) => {
    const header = i18nInstance.t('posts.header');
    postsContainer.innerHTML = `<h2>${header}</h2>`;
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
      button.setAttribute('data-id', post.id);
      button.textContent = i18nInstance.t('posts.seeButton');

      const li = document.createElement('li');
      li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      li.append(link);
      li.append(button);

      ul.append(li);
    });
    postsContainer.append(ul);
  };

  const renderPostLink = ({ uiState: { activePostId } }) => {
    const link = postsContainer.querySelector(`[data-id="${activePostId}"]`);
    link.classList.remove('fw-bold');
    link.classList.add('fw-normal');
  };

  const renderValidationResult = ({ feedAddingProcess: { error, validationState } }) => {
    switch (validationState) {
      case 'valid': {
        input.classList.remove('border', 'border-warning');
        break;
      }
      case 'invalid': {
        renderFeedback(error);
        input.classList.add('border', 'border-warning');
        break;
      }
      default:
        throw new Error(`Unsupported validation state: ${validationState}`);
    }
  };

  const mapping = {
    feeds: (state) => renderFeeds(state),
    'feedAddingProcess.state': (state) => renderForm(state),
    'feedAddingProcess.validationState': (state) => renderValidationResult(state),
    posts: (state) => renderPosts(state),
    'uiState.activePostId': (state) => {
      renderModal(state);
      renderPostLink(state);
    },
  };

  return onChange(appState, (path) => {
    if (mapping[path]) {
      mapping[path](appState);
    }
  });
};

export default initView;
