import '@testing-library/jest-dom';
import { screen, waitFor, getByText } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import fs from 'fs';
import path from 'path';

import init from '../src/application.js';

const pathToIndex = path.join('__fixtures__', 'index.html');
const pathToResponse = path.join('__fixtures__', 'response.json');
const initialHtml = fs.readFileSync(pathToIndex, 'utf-8');
const response = fs.readFileSync(pathToResponse, 'utf-8');

const pathToResponse2 = path.join('__fixtures__', 'response2.json');
const response2 = fs.readFileSync(pathToResponse2, 'utf-8');

const pathToResponse3 = path.join('__fixtures__', 'response3.json');
const response3 = fs.readFileSync(pathToResponse3, 'utf-8');

const pathToResponse4 = path.join('__fixtures__', 'response4.json');
const response4 = fs.readFileSync(pathToResponse4, 'utf-8');

const feeds = {
  feed1: {
    header: 'Lorem ipsum feed for an interval of 1 minutes with 2 item(s)',
    description: 'Feed 1 description',
  },
  feed2: {
    header: 'Lorem ipsum feed for an interval of 1 minutes with 1 item(s)',
    description: 'Feed 2 description',
  },
};

const posts = {
  post1: {
    header: 'Lorem ipsum 2021-06-04T10:14:00Z',
    description: 'Ad sunt mollit eu aliqua incididunt quis sit pariatur sint ut ullamco occaecat ullamco adipisicing.',
    link: 'http://example.com/test/1622801640',
  },
  post2: {
    header: 'Lorem ipsum 2021-06-04T10:15:00Z',
    description: 'Dolor sint sit do minim et consectetur ex ad enim esse deserunt esse quis.',
    link: 'http://example.com/test/1622801700',
  },
  post3: {
    header: 'Lorem ipsum 2021-06-04T10:16:00Z',
    description: 'Ea mollit voluptate labore amet culpa pariatur amet quis adipisicing qui consequat excepteur et.',
    link: 'http://example.com/test/1622801760',
  },
  post4: {
    header: 'Lorem ipsum 2021-06-04T10:18:00Z',
    description: 'Lorem irure excepteur irure consectetur sunt ad commodo nulla Lorem excepteur qui voluptate excepteur mollit.',
    link: 'http://example.com/test/1622801880',
  },
};

const elements = {};

jest.setTimeout(8000);

beforeAll(() => {
  nock.disableNetConnect();
});

beforeEach(() => {
  document.body.innerHTML = initialHtml;
  init();

  elements.submit = screen.getByLabelText('add');
  elements.input = screen.getByLabelText('url');
  elements.feedback = document.querySelector('.feedback');
  elements.feeds = document.querySelector('.feeds');
  elements.posts = document.querySelector('.posts');
});

test.each([
  [' ', 'Не должно быть пустым'],
  ['wrongUrl.wrong', 'Ссылка должна быть валидным URL'],
])('validation: url = \'%s\', feedback message = \'%s\'', (url, expecterFeedback) => {
  userEvent.type(elements.input, url);
  userEvent.click(elements.submit);
  expect(elements.feedback).toHaveTextContent(expecterFeedback);
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

test('add feeds and posts', async () => {
  const url = 'http://localhost.com/feed';
  userEvent.type(elements.input, url);
  userEvent.click(elements.submit);

  const scope = nock('https://hexlet-allorigins.herokuapp.com')
    .defaultReplyHeaders({
      'access-control-allow-origin': '*',
      // 'access-control-allow-credentials': 'true',
    })
    // .persist()
    .get('/get?url=http%3A%2F%2Flocalhost.com%2Ffeed&disableCache=true')
    .reply(200, response);

  await waitFor(() => {
    expect(screen.getByText('Фиды')).toBeInTheDocument();
    expect(screen.getByText('Посты')).toBeInTheDocument();
    const feedItems = elements.feeds.querySelectorAll('li');
    expect(feedItems).toHaveLength(1);
    expect(screen.getByText(feeds.feed1.header)).toBeInTheDocument();
    expect(screen.getByText(feeds.feed1.description)).toBeInTheDocument();
    const postItems = elements.posts.querySelectorAll('li');
    expect(postItems).toHaveLength(2);
    const link1 = screen.getByText(posts.post1.header);
    expect(link1).toBeInTheDocument();
    expect(link1).toHaveAttribute('href', posts.post1.link);
    const link2 = screen.getByText(posts.post2.header);
    expect(link2).toBeInTheDocument();
    expect(link2).toHaveAttribute('href', posts.post2.link);
  });

  scope.done();

  const scope2 = nock('https://hexlet-allorigins.herokuapp.com')
    .defaultReplyHeaders({
      'access-control-allow-origin': '*',
      // 'access-control-allow-credentials': 'true',
    })
    .get('/get?url=http%3A%2F%2Flocalhost.com%2Ffeed&disableCache=true')
    .reply(200, response2);

  await waitFor(() => {
    const postItems = elements.posts.querySelectorAll('li');
    expect(postItems).toHaveLength(3);
    const newestPostElement = elements.posts.querySelector('li');
    const link = getByText(newestPostElement, posts.post3.header);
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', posts.post3.link);
  }, { timeout: 6000 });

  scope2.done();

  const scope3 = nock('https://hexlet-allorigins.herokuapp.com')
    .defaultReplyHeaders({
      'access-control-allow-origin': '*',
      'access-control-allow-credentials': 'true',
    })
    .get('/get?url=http%3A%2F%2Flocalhost.com%2Ffeed2&disableCache=true')
    .reply(200, response3);

  const url2 = 'http://localhost.com/feed2';
  userEvent.type(elements.input, url2);
  userEvent.click(elements.submit);

  await waitFor(() => {
    const feedItems = elements.feeds.querySelectorAll('li');
    expect(feedItems).toHaveLength(2);
    expect(screen.getByText(feeds.feed2.header)).toBeInTheDocument();
    expect(screen.getByText(feeds.feed2.description)).toBeInTheDocument();
    const postItems = elements.posts.querySelectorAll('li');
    expect(postItems).toHaveLength(4);
    const link = screen.getByText(posts.post4.header);
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', posts.post4.link);
  });

  scope3.done();

  // userEvent.type(elements.input, 'http://localhost.com/feed');
  // userEvent.click(elements.submit);
  // expect(elements.feedback).toHaveTextContent('RSS уже подключен');

  // const scope4 = nock('https://hexlet-allorigins.herokuapp.com')
  //   .defaultReplyHeaders({
  //     'access-control-allow-origin': '*',
  //     'access-control-allow-credentials': 'true',
  //   })
  //   .get('/get?url=http%3A%2F%2Flocalhost.com%2Ffeed3&disableCache=true')
  //   .reply(200, response4);

  // userEvent.type(elements.input, 'http://localhost.com/feed3');
  // userEvent.click(elements.submit);
  // await waitFor(() => {
  //   expect(elements.feedback).toHaveTextContent('Ресурс не содержит валидный RSS');
  // });

  // scope4.done();
});

test('should not add feed without rss', async () => {
  const scope = nock('https://hexlet-allorigins.herokuapp.com')
    .defaultReplyHeaders({
      'access-control-allow-origin': '*',
      'access-control-allow-credentials': 'true',
    })
    .get('/get?url=http%3A%2F%2Flocalhost.com%2Ffeed&disableCache=true')
    .reply(200, response4);

  userEvent.type(elements.input, 'http://localhost.com/feed');
  userEvent.click(elements.submit);
  await waitFor(() => {
    expect(elements.feedback).toHaveTextContent('Ресурс не содержит валидный RSS');
  });

  scope.done();
});

test('should not add feed twice', async () => {
  const scope = nock('https://hexlet-allorigins.herokuapp.com')
    .defaultReplyHeaders({
      'access-control-allow-origin': '*',
      'access-control-allow-credentials': 'true',
    })
    .get('/get?url=http%3A%2F%2Flocalhost.com%2Ffeed&disableCache=true')
    .reply(200, response);

  userEvent.type(elements.input, 'http://localhost.com/feed');
  userEvent.click(elements.submit);
  await waitFor(() => {
    scope.done();
  });
  userEvent.type(elements.input, 'http://localhost.com/feed');
  userEvent.click(elements.submit);
  expect(elements.feedback).toHaveTextContent('RSS уже подключен');
});
