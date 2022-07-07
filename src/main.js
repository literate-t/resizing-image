// 검색해서 나온 이미지를 원하는 사이즈로 리사이징

const http = require('http');

// @ts-check
const fetch = (...args) =>
  /* eslint-disable-next-line */ // @ts-ignore
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const { createApi } = require('unsplash-js');
// const { default: fetch } = require('node-fetch');

const unsplash = createApi({
  accessKey: '4y8h2nh5RK7lRtQzkTcXIc7hrU4K684mrg88TY5sxbo',
  // @ts-ignore
  fetch,
});

/**
 *
 * @param {string} query
 */
const searchImage = async (query) => {
  const result = await unsplash.search.getPhotos({ query });

  if (!result.response) {
    throw new Error('Image search error');
  }

  const image = result.response?.results[0];
  if (!image) {
    throw new Error('No image found');
  }

  return {
    description: image.description || image.alt_description,
    url: image.urls.regular,
  };
};

const PORT = 5000;
const server = http.createServer((req, res) => {
  const main = async () => {
    const result = await searchImage('mountain');
    const response = await fetch(result.url);
    // 이미지를 그대로 돌려주기
    response.body.pipe(res);
  };
  main();
});

server.listen(PORT, () => {
  console.log(`The server is listening at port:${PORT}`);
});
