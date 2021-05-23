// import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
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

const queryRss = async (url) => {
  const response = await axios.get(url);
  return response.data;
};

const avoidCorsProblem = (url) => (
  `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`
);

export default () => {
  const state = {
    error: null,
    rssForm: {
      fields: {
        url: {
          valid: true,
          error: null,
          value: '',
        },
      },
      status: 'filling',
    },
  };

  const input = document.querySelector('[data-url]');
  const form = document.querySelector('.rss-form');
  input.focus();

  form.addEventListener('submit', async (e) => {
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

    const urlWithoutCorsProblem = avoidCorsProblem(rssUrl);

    try {
      // state.error = null;
      // state.form.status = 'loading';
      console.log(rssUrl);
      const todo = await queryRss(urlWithoutCorsProblem);
      console.log(todo);
      // state.form.status = 'filling';
      // state.todos.push(todo);
    } catch (err) {
      console.log(err);
      // state.form.status = 'failed';
      // state.error = err.message;
    }

    form.reset();
    input.focus();
  });
};
