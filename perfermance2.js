
const puppeteer = require('puppeteer');
const iPhone = puppeteer.devices['iPhone 6'];
const url = 'https://f.m.taobao.com/wow/z/pcraft/act/wupr?scm=&wh_biz=tm&wh_weex=true&wh_pid=act%2FMFM-copy&program_type=H5&ttid=201300%40travel_h5_3.1.0&spm=181.11925144.100000.1&_preProjVer=1.17.3';

const NETWORK_PRESETS = {
  // 所有速度 / 8 是因为网络速度通常以比特/秒,而 DevTools 预计吞吐量在字节/秒! （1字节 = 8比特）
  GPRS: {
    offline: false, // 是否连接
    downloadThroughput: (50 * 1024) / 8, // 模拟下载速度
    uploadThroughput: (20 * 1024) / 8,  // 模拟上传速度 
    latency: 500 // 模拟延迟（毫秒）
  },
  Regular2G: {
    offline: false,
    downloadThroughput: (250 * 1024) / 8,
    uploadThroughput: (50 * 1024) / 8,
    latency: 300
  },
  Good2G: {
    offline: false,
    downloadThroughput: (450 * 1024) / 8,
    uploadThroughput: (150 * 1024) / 8,
    latency: 150
  },
  Regular3G: {
    offline: false,
    downloadThroughput: (750 * 1024) / 8,
    uploadThroughput: (250 * 1024) / 8,
    latency: 100
  },
  Good3G: {
    offline: false,
    downloadThroughput: (1.5 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
    latency: 40
  },
  Regular4G: {
    offline: false,
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
    latency: 20
  },
  DSL: {
    offline: false,
    downloadThroughput: (2 * 1024 * 1024) / 8,
    uploadThroughput: (1 * 1024 * 1024) / 8,
    latency: 5
  },
  WiFi: {
    offline: false,
    downloadThroughput: (30 * 1024 * 1024) / 8,
    uploadThroughput: (15 * 1024 * 1024) / 8,
    latency: 2
  }
};




(async () => {

  const browser = await puppeteer.launch({
    headless: true,
    args: [ '--no-sandbox', '--disable-setuid-sandbox' ],
  });
  const page = await browser.newPage();
  await page.emulate(iPhone);
  await page.goto(url, { waitUntil: ['networkidle0'] });

  // const client = await page.target().createCDPSession();
  // await client.send('Network.emulateNetworkConditions', NETWORK_PRESETS['WiFi']);

  const monitorData = await page.evaluate(() => {  
    const getData = {};
    const performance = window.performance || window.msPerformance || window.webkitPerformance;
    const timing = performance.timing;
    const TIME_DATA = {
      cache: ['domainLookupStart', 'fetchStart'], // 读取缓存时间
      dns: ['domainLookupEnd', 'domainLookupStart'], // DNS 解析耗时
      tcp: ['connectEnd', 'connectStart'], // TCP 连接耗时
      req: ['responseStart', 'requestStart'], // 网络请求耗时
      res: ['responseEnd', 'responseStart'], // 数据传输耗时
      dom: ['domContentLoadedEventStart', 'domLoading'], // DOM 解析耗时
      readycb: ['domContentLoadedEventEnd', 'domContentLoadedEventStart'], // domContentLoaded回调函数耗时
      fasrt: ['domComplete', 'domContentLoadedEventEnd'], // 首屏异步资源加载耗时，即domContentLoaded和load之间加载的资源，一般为图片加载，JS异步加载的资源
      loadcb: ['loadEventEnd', 'loadEventStart'], // load回调函数耗时
      ready: ['domContentLoadedEventEnd', 'fetchStart'], // 	DOM Ready耗时，白屏时间
      load: ['loadEventEnd', 'fetchStart'] //	页面完全加载时间
    };

    Object.keys(TIME_DATA).map(item => {
      const firstParams = timing[TIME_DATA[item][0]];
      const secondParams = timing[TIME_DATA[item][1]];
      const value = Math.round(firstParams - secondParams);
      value >= 0 && value < 36e5 && (getData[item] = value);
    });
    return Promise.resolve(getData);
  });
  
  console.log(monitorData);
  
})();
