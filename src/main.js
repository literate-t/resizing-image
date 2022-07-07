// 검색해서 나온 이미지를 원하는 사이즈로 리사이징

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5000;

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
 * @param {string} query
 */
const searchImageFromAPI = async (query) => {
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

/**
 *
 * @param {string} imagePath
 * @return {Promise<boolean>}
 */
const exists = async (imagePath) => {
  try {
    await fs.promises.access(imagePath);
    return true;
  } catch {
    return false;
  }
};
/**
 * 이미지를 캐시에서 먼저 검색 후 없다면 unsplash에 요청
 */
const getImages = async (query) => {
  const imageFilePath = path.resolve(__dirname, `../images/${query}`);

  // if (fs.existsSync(imageFilePath)) {
  //   return {
  //     message: `Cached image returned: ${query}`,
  //     stream: fs.createReadStream(imageFilePath),
  //   };
  // }
  if (await exists(imageFilePath)) {
    return {
      message: `Cached image returned: ${query}`,
      stream: fs.createReadStream(imageFilePath),
    };
  }

  const result = await searchImageFromAPI(query);
  const response = await fetch(result.url);

  response.body.pipe(fs.createWriteStream(imageFilePath)); // 사용된 stream은 끝남

  return {
    message: `New image returned:${query}`,
    stream: fs.createReadStream(imageFilePath),
  };
};
/**
 * @param {string} url
 */
const convertURL = (url) => url.slice(1);

const server = http.createServer((req, res) => {
  const main = async () => {
    if (!req.url) {
      res.statusCode = 400; // wrong request
      res.end('Wrong url');
      return;
    }
    const query = convertURL(req.url);
    try {
      const { message, stream } = await getImages(query);
      // 이미지를 그대로 돌려주기
      console.log(message);
      stream.pipe(res);
    } catch {
      res.statusCode = 400;
      res.end();
    }
  };
  main();
});

server.listen(PORT, () => {
  console.log(`The server is listening at port:${PORT}`);
});
