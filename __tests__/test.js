import '@testing-library/jest-dom';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import nock from 'nock';
import fs from 'fs';
import path from 'path';
import init from '../src/init.js';

jest.setTimeout(8000);

const createPath = (fileName) => path.join('__fixtures__', fileName);

const responsesForMocks = {
  feedsAndPosts: 'feedsAndPosts.json',
  initialHtml: 'index.html',
  feedWithTwoPosts: 'response1.json',
  feedWithOneNewPost: 'response2.json',
  newFeedWithOnePost: 'response3.json',
  responseWithoutRss: 'response4.json',
};

const testData = {};
const elements = {};

const getTestData = async (responses) => {
  const promises = Object.values(responses).map((fileName) => {
    const pathToFile = createPath(fileName);
    return fs.promises.readFile(pathToFile, 'utf-8');
  });
  const testFilesData = await Promise.all(promises);
  const testDataEntries = Object.keys(responses).map((responseName, index) => (
    [responseName, testFilesData[index]]
  ));
  return testDataEntries;
};

const avoidCorsProblem = (url) => (
  `https://hexlet-allorigins.herokuapp.com/get?url=${encodeURIComponent(url)}`
);

const createHttpMock = (url, response = '') => {
  const urlWithoutCorsProblem = new URL(avoidCorsProblem(url));
  urlWithoutCorsProblem.searchParams.append('disableCache', 'true');
  const scope = nock(urlWithoutCorsProblem.origin)
    .defaultReplyHeaders({
      'access-control-allow-origin': '*',
    })
    .get(`${urlWithoutCorsProblem.pathname}${urlWithoutCorsProblem.search}`)
    .reply(200, response);
  return scope;
};

beforeAll(async () => {
  nock.disableNetConnect();
  const testDataEntries = await getTestData(responsesForMocks);
  testDataEntries.forEach(([dataName, testFileData]) => {
    testData[dataName] = testFileData;
  });
});

beforeEach(() => {
  document.body.innerHTML = testData.initialHtml;

  init();

  elements.submit = screen.getByLabelText('add');
  elements.input = screen.getByLabelText('url');
  elements.feedback = screen.getByTestId('feedback');
});

test.each([
  [' ', 'Не должно быть пустым'],
  ['wrongUrl.wrong', 'Ссылка должна быть валидным URL'],
])('validation: url = \'%s\', feedback message = \'%s\'', (url, expectedFeedback) => {
  userEvent.type(elements.input, url);
  userEvent.click(elements.submit);
  expect(screen.getByText(expectedFeedback)).toBeInTheDocument();
});

test('form is disabled while submitting', async () => {
  const url = 'http://localhost.com/feed';
  const scope = createHttpMock(url);

  userEvent.type(elements.input, url);

  expect(elements.submit).toBeEnabled();
  expect(elements.input).not.toHaveAttribute('readonly');
  userEvent.click(elements.submit);
  expect(elements.submit).toBeDisabled();
  expect(elements.input).toHaveAttribute('readonly');

  await waitFor(() => {
    expect(elements.submit).toBeEnabled();
    expect(elements.input).not.toHaveAttribute('readonly');
  });

  scope.done();
});

test('add feeds and posts', async () => {
  const { feeds, posts } = JSON.parse(testData.feedsAndPosts);

  const url = 'http://localhost.com/feed';
  const scope = createHttpMock(url, testData.feedWithTwoPosts);

  userEvent.type(elements.input, url);
  userEvent.click(elements.submit);

  await waitFor(() => {
    expect(screen.getByText('Фиды')).toBeInTheDocument();
    expect(screen.getByText('Посты')).toBeInTheDocument();
    expect(screen.getByText(feeds.feed1.header)).toBeInTheDocument();
    expect(screen.getByText(feeds.feed1.description)).toBeInTheDocument();
    const postItems = screen.getAllByTestId('post');
    expect(postItems).toHaveLength(2);
    const link1 = screen.getByText(posts.post1.header);
    expect(link1).toBeInTheDocument();
    expect(link1).toHaveAttribute('href', posts.post1.link);
    const link2 = screen.getByText(posts.post2.header);
    expect(link2).toBeInTheDocument();
    expect(link2).toHaveAttribute('href', posts.post2.link);
  });

  scope.done();

  const scope2 = createHttpMock(url, testData.feedWithOneNewPost);

  await waitFor(() => {
    const postItems = screen.getAllByTestId('post');
    expect(postItems).toHaveLength(3);
    const link = screen.getByText(posts.post3.header);
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', posts.post3.link);
  }, { timeout: 6000 });

  scope2.done();

  const newFeedUrl = 'http://localhost.com/feed2';
  const scope3 = createHttpMock(newFeedUrl, testData.newFeedWithOnePost);

  userEvent.type(elements.input, newFeedUrl);
  userEvent.click(elements.submit);

  await waitFor(() => {
    const feedItems = screen.getAllByTestId('feed');
    expect(feedItems).toHaveLength(2);
    expect(screen.getByText(feeds.feed2.header)).toBeInTheDocument();
    expect(screen.getByText(feeds.feed2.description)).toBeInTheDocument();
    const postItems = screen.getAllByTestId('post');
    expect(postItems).toHaveLength(4);
    const link = screen.getByText(posts.post4.header);
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', posts.post4.link);
  });

  scope3.done();
});

test('should not add feed without rss', async () => {
  const url = 'http://localhost.com/feed;';
  createHttpMock(url, testData.responseWithoutRss);

  userEvent.type(elements.input, url);
  userEvent.click(elements.submit);
  await waitFor(() => {
    expect(elements.feedback).toHaveTextContent('Ресурс не содержит валидный RSS');
  });
});

test('should not add feed twice', async () => {
  const url = 'http://localhost.com/feed;';
  const scope = createHttpMock(url, testData.feedWithTwoPosts);

  userEvent.type(elements.input, url);
  userEvent.click(elements.submit);
  await waitFor(() => {
    scope.done();
  });
  userEvent.type(elements.input, url);
  userEvent.click(elements.submit);
  expect(elements.feedback).toHaveTextContent('RSS уже существует');
});

test('modal opening and closing', async () => {
  const { posts } = JSON.parse(testData.feedsAndPosts);

  const url = 'http://localhost.com/feed;';
  createHttpMock(url, testData.newFeedWithOnePost);

  userEvent.type(elements.input, url);
  userEvent.click(elements.submit);
  await waitFor(() => {
    userEvent.click(screen.getByTestId('post'));
    expect(screen.getByTestId('modal-title')).toHaveTextContent(posts.post4.header);
    expect(screen.getByTestId('modal-body')).toHaveTextContent(posts.post4.description);
    expect(screen.getByTestId('modal-details')).toHaveAttribute('href', posts.post4.link);
  });
  userEvent.click(screen.getByTestId('modal-close'));
  expect(screen.getByTestId('modal-title')).toBeEmptyDOMElement();
  expect(screen.getByTestId('modal-body')).toBeEmptyDOMElement();
  expect(screen.getByTestId('modal-details')).toHaveAttribute('href', '#');
});
