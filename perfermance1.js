
const puppeteer = require('puppeteer');

// 检测页面url
const url = '';
// 检测次数
const times = 5;
// 承载数据
const recordList = [];

(async () => {
  // 性能数据分析
  const calculate =  function(timing) {
    return {
      // 白屏时间
      whiteScreenTime: timing.responseStart - timing.navigationStart,
      // 请求时间
      requestTime: timing.responseEnd - timing.responseStart
    };
  }

  // 循环获取页面数据
  for (let i = 0; i < times; i++) {
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: {
        width: 375,
        height: 667,
        isMoblie: true,
        hasTouch: true,
      }
    });
    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: 'networkidle0', // 不再网络连接时，认为goto完成。
    });

    // 等待保证页面加载完成
    await page.waitFor(5000);

    // 获取页面的 window.performance 属性
    const timing = JSON.parse(await page.evaluate(
      () => JSON.stringify(window.performance.timing)
    ));
    recordList.push(calculate(timing));
    await browser.close();
  }
  // 计算平均数据
  let whiteScreenTime = 0, requestTime = 0;
  for (let item of recordList) {
    whiteScreenTime += item.whiteScreenTime;
    requestTime += item.requestTime;
  }
  console.log(`平均白屏时间：${whiteScreenTime / times} ms`);
  console.log(`平均请求时间：${requestTime / times} ms`);

  // table表格显示每次的详细数据
  console.table(recordList);

})();
