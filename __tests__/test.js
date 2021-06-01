import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import fs from 'fs';
import path from 'path';

import init from '../src/application.js';

const pathToIndex = path.join('__fixtures__', 'index.html');
const pathToResponse = path.join('__fixtures__', 'response.json');
const initialHtml = fs.readFileSync(pathToIndex, 'utf-8');
const response = fs.readFileSync(pathToResponse, 'utf-8');
// console.log(response);
const elements = {};

beforeAll(() => {
  nock.disableNetConnect();
});

beforeEach(() => {
  document.body.innerHTML = initialHtml;
  init();

  elements.submit = screen.getByLabelText('add');
  elements.input = screen.getByLabelText('url');
});

test('form is disabled while submitting', async () => {
  const url = 'http://localhost.com/feed';
  userEvent.type(elements.input, url);

  const scope = nock('https://hexlet-allorigins.herokuapp.com')
    .defaultReplyHeaders({
      'access-control-allow-origin': '*',
      // 'access-control-allow-credentials': 'true',
    })
    .get('/get?url=http%3A%2F%2Flocalhost.com%2Ffeed&disableCache=true')
    // .reply(200, response);
    .reply(200);

  expect(elements.submit).not.toBeDisabled();
  expect(elements.input).not.toBeDisabled();
  userEvent.click(elements.submit);
  expect(elements.submit).toBeDisabled();
  expect(elements.input).toBeDisabled();

  await waitFor(() => {
    expect(elements.submit).not.toBeDisabled();
    expect(elements.input).not.toBeDisabled();
  });

  scope.done();
});
