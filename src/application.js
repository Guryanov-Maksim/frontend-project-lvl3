// import 'bootstrap/dist/css/bootstrap.min.css';
import * as yup from 'yup';

const validateUrl = (url) => {
  const schema = yup.string().url().required();
  try {
    schema.validateSync(url);
    return null;
  } catch (error) {
    return error.message;
  }
};

export default () => {
  const state = {
    rssForm: {
      fields: {
        url: {
          valid: true,
          error: null,
          value: '',
        },
      },
    },
  };

  const input = document.querySelector('[data-url]');
  const form = document.querySelector('.rss-form');
  input.focus();

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const rssUrl = formData.get('rss-url');

    const error = validateUrl(rssUrl);

    if (error) {
      state.rssForm.fields.url = {
        error,
        valid: false,
      };
      return;
    }
    state.rssForm.fields.url = {
      error: null,
      valid: true,
      value: rssUrl,
    };

    input.focus();
  });
};
