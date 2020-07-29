const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const iPhone = puppeteer.devices['iPhone 6'];
// const url = 'https://f.m.taobao.com/wow/z/pcraft/act/wupr?scm=&wh_biz=tm&wh_weex=true&wh_pid=act%2FMFM-copy&program_type=H5&ttid=201300%40travel_h5_3.1.0&spm=181.11925144.100000.1&_preProjVer=1.17.3';
const url = 'https://market.m.taobao.com/app/fliggy-shop/rax-pi/pages/weex?wh_weex=true&bizId=4163445365&bizCode=hotel&pagePath=custom-1549653977762.htm&shopId=255024280&spm=181.11557699.splitpicture_5252043.splitpicture_5252043_0';
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();
  const deviceHeight = iPhone.viewport.height;
  const deviceWidth = iPhone.viewport.width;
  await page.emulate(iPhone);

  page.on('console', msg => {
    for (let i = 0; i < msg.args().length; ++i)
      console.log(`${i}: ${msg.args()[i]}`);
  });

  await page.goto(url, { waitUntil: ['networkidle0'] });

  let title = await page.title(); // 获取页面标题
  console.log(title);
 
  await page.evaluate(() => {
    const clientHeight = document.documentElement.clientHeight;
    const divs = [...document.querySelectorAll('div')];
    const len = divs.length;
    let boxEl = null;
    let i = 0; 
    for(; i < len; i++) {
      const div = divs[i];
      if(div.scrollHeight > clientHeight)  {
        boxEl = div;
        break;
      }
    }
    if(!boxEl && i === len) {
      boxEl = document.querySelector('body');
    }
    boxEl.setAttribute('id', 'Puppeteer_Page_Box');
  });
  
  const scrollableSectionEl = await page.$('#Puppeteer_Page_Box');

  await page.evaluate(async (scrollableSectionEl, deviceHeight = 667) => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      let times = 0;
      const timer = setInterval(() => {
          times++;
          const scrollHeight = scrollableSectionEl.scrollHeight;
          scrollableSectionEl.scrollBy(0, deviceHeight);
          totalHeight = totalHeight + deviceHeight;
          if(times > 5 || totalHeight >= scrollHeight){
            clearInterval(timer);
            resolve();
          }
      }, 2000);
    });
  }, scrollableSectionEl, deviceHeight);

  const scrollHeight = await page.$eval('#Puppeteer_Page_Box', el => el.scrollHeight);
  console.log('scrollHeight', scrollHeight);

  const bgImgInfoList = await page.evaluate(async () => {
    let bgImgs = [...document.querySelectorAll('div[placeholder]')];
    
    async function getBackgroundSize(elem) {
      var computedStyle = getComputedStyle(elem),
          image = new Image(),
          src = computedStyle.backgroundImage.replace(/url\((['"])?(.*?)\1\)/gi, '$2'),
          cssSize = computedStyle.backgroundSize,
          elemW = parseInt(computedStyle.width.replace('px', ''), 10),
          elemH = parseInt(computedStyle.height.replace('px', ''), 10),
          elemDim = [elemW, elemH],
          computedDim = [],
          ratio;
      image.src = src;
      ratio = image.width > image.height ? image.width / image.height : image.height / image.width;
      cssSize = cssSize.split(' ');
      computedDim[0] = cssSize[0];
      computedDim[1] = cssSize.length > 1 ? cssSize[1] : 'auto';
      const base64Reg = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i;
      const isBase64 = base64Reg.test(src);
      let size = 0;
      if(isBase64){
        let str = src.replace(/^\s*data:image\/(png|gif|jpg);base64,/, '');
        const equalIndex = str.indexOf('=');
        if (str.indexOf('=') > 0) {
            str = str.substring(0, equalIndex);
        }
        const strLength = str.length;
        size = parseInt(strLength - (strLength / 8) * 2);
      } else {
        const res = await fetch(src, {
          method: 'HEAD'
        });
        size = res.headers.get('content-length');
      }
      
      if(cssSize[0] === 'cover') {
        if(elemDim[0] > elemDim[1]) {
            if(elemDim[0] / elemDim[1] >= ratio) {
                computedDim[0] = elemDim[0];
                computedDim[1] = 'auto';
            } else {
                computedDim[0] = 'auto';
                computedDim[1] = elemDim[1];
            }
        } else {
            computedDim[0] = 'auto';
            computedDim[1] = elemDim[1];
        }
      } else if(cssSize[0] === 'contain') {
          if(elemDim[0] < elemDim[1]) {
              computedDim[0] = elemDim[0];
              computedDim[1] = 'auto';
          } else {
              if(elemDim[0] / elemDim[1] >= ratio) {
                  computedDim[0] = 'auto';
                  computedDim[1] = elemDim[1];
              } else {
                  computedDim[1] = 'auto';
                  computedDim[0] = elemDim[0];
              }
          }
      } else {
          for(var i = cssSize.length; i--;) {
            if (cssSize[i].indexOf('px') > -1) {
              computedDim[i] = cssSize[i].replace('px', '');
            } else if (cssSize[i].indexOf('%') > -1) {
              computedDim[i] = elemDim[i] * (cssSize[i].replace('%', '') / 100);
            }
          }
      }
      if(computedDim[0] === 'auto' && computedDim[1] === 'auto') {
          computedDim[0] = image.width;
          computedDim[1] = image.height;
      } else {
        ratio = computedDim[0] === 'auto' ? image.height / computedDim[1] : image.width / computedDim[0];
        computedDim[0] = computedDim[0] === 'auto' ? image.width / ratio : computedDim[0];
        computedDim[1] = computedDim[1] === 'auto' ? image.height / ratio : computedDim[1];
      }

      return {
        src,
        size,
        width: computedDim[0],
        height: computedDim[1],
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
      };
    }
    const promises = bgImgs.map(async el => {
      return await getBackgroundSize(el);
    });
    const list = await Promise.all(promises);
    return list;
  });
  
  const imgInfoList = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('img')];
    const promises = imgs.map(async img => {
      const base64Reg = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i;
      let size = 0;
      const src = img && img.src || '';
      const isBase64 = base64Reg.test(src);
      if(isBase64){
        let str = src.replace(/^\s*data:image\/(png|gif|jpg);base64,/, '');
        const equalIndex = str.indexOf('=');
        if (str.indexOf('=') > 0) {
            str = str.substring(0, equalIndex);
        }
        const strLength = str.length;
        size = parseInt(strLength - (strLength / 8) * 2);
      } else {
        const res = await fetch(src, {
          method: 'HEAD'
        });
        size = res.headers.get('content-length');
      }
      return {
        src,
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        size,
      };
    });
    const list = await Promise.all(promises);
    return list;
  });

  const imgList = bgImgInfoList.concat(imgInfoList);

  console.log('------imgList-------', imgList.length);
  const filterImgList = imgList.filter(item => {
    return (item.height >= 50 || item.width >= 50);
  })

  console.log('------filterImgList-------', filterImgList.length);

  await page.evaluate(filterImgList => {
    window.filterImgList = filterImgList;
    console.log('**********window.filterImgList', window.filterImgList.length);
  }, filterImgList);

  const newImgList = await page.evaluate(async () => {
    function createImgData(dataDetail) {
      var _a;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const imgWidth = Math.sqrt(dataDetail.length / 4);
      const newImageData = (_a = ctx) === null || _a === void 0 ? void 0 : _a.createImageData(imgWidth, imgWidth);
      for (let i = 0; i < dataDetail.length; i += 4) {
          let R = dataDetail[i];
          let G = dataDetail[i + 1];
          let B = dataDetail[i + 2];
          let Alpha = dataDetail[i + 3];
          newImageData.data[i] = R;
          newImageData.data[i + 1] = G;
          newImageData.data[i + 2] = B;
          newImageData.data[i + 3] = Alpha;
      }
      return newImageData;
    }
    function createGrayscale(imgData) {
      const newData = Array(imgData.data.length);
      newData.fill(0);
      imgData.data.forEach((_data, index) => {
        if ((index + 1) % 4 === 0) {
            const R = imgData.data[index - 3];
            const G = imgData.data[index - 2];
            const B = imgData.data[index - 1];
            const gray = ~~((R + G + B) / 3);
            newData[index - 3] = gray;
            newData[index - 2] = gray;
            newData[index - 1] = gray;
            newData[index] = 255;
        }
      });
      return createImgData(newData);
    }
    function getAHashFingerprint(imgData) {
        const grayList = imgData.data.reduce((pre, cur, index) => {
            if ((index + 1) % 4 === 0) {
                pre.push(imgData.data[index - 1]);
            }
            return pre;
        }, []);
        const length = grayList.length;
        const grayAverage = grayList.reduce((pre, next) => (pre + next), 0) / length;
        return grayList.map(gray => (gray >= grayAverage ? 1 : 0)).join('');
    }
    const imgList = window.filterImgList || [];
    console.log('********* inner imgList ****', imgList.length);
    const newImgList = [].concat(imgList);
    console.log('newImgList.length', newImgList.length);

    for(let img of imgList) {
      const src = img.src || '';
      const originSrcs = /([a-z|A-Z|0-9|_|!|\.|\/|-])*?\.(png|jpg)/.exec(src) || [];
      const originSrc = originSrcs[0] || '';
      async function compressImg(src, imgWidth = 8){
        return new Promise(function(resolve){
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const image = new Image();
          image.crossOrigin = 'Anonymous';
          image.onload = function(){
            var _a, _b;
            canvas.width = imgWidth;
            canvas.height = imgWidth;
            (_a = ctx) === null || _a === void 0 ? void 0 : _a.drawImage(image, 0, 0, imgWidth, imgWidth);
            const data = (_b = ctx) === null || _b === void 0 ? void 0 : _b.getImageData(0, 0, imgWidth, imgWidth);
            resolve(data);
          }
          image.onerror = function(){
            resolve("");
          }
          image.src = src;
        });
      }
      const imgData = await compressImg(originSrc);
      const grayImgData = createGrayscale(imgData);
      const hash = getAHashFingerprint(grayImgData);
      
      for(let i = 0, len = newImgList.length; i < len; i++) {
        const imgItem = newImgList[i] || {};
        if(imgItem.src === src) {
          newImgList[i].hash = hash;
          break;
        }
      }
    }
    return newImgList;
  });

  // for(let i = 0, len = newImgList.length; i < len; i++) {
  //   const base64 = newImgList[i] && newImgList[i].base64 || '';
  //   const hash = await getHash(base64);
  //   console.log('hash', hash);
  //   newImgList.hash = hash;
  //   delete newImgList[i].base64;
  // }
  // console.log('----------');
  // console.log(newImgList);

  function getHammingDistance(str1, str2) {
    let distance = 0;
    const str1Arr = str1.split('');
    const str2Arr = str2.split('');
    distance = Math.abs(str1Arr.length - str2Arr.length);
    str1Arr.forEach((letter, index) => {
      if (letter !== str2Arr[index]) {
        distance++;
      }
    });
    return distance;
  }
  const len = newImgList.length;
  const repeatImgs = [];
  console.log('^^^^^^^^^^^^^^^^^newImgList len', len);
  
  for(let i = 0; i < len - 1; i++) {
    for(let j = i + 1; j < len; j++) {
      const hash1 = newImgList[i].hash || '';
      const hash2 = newImgList[j].hash || '';
      const hammingDistance = getHammingDistance(hash1, hash2);
      const hammingSimilarity = ((hash1.length - hammingDistance) / hash1.length).toFixed(2);
      if(hammingSimilarity >= 0.95) {
        repeatImgs.push({
          src1: newImgList[i].src,
          src2: newImgList[j].src,
          hammingSimilarity,
        });
      }
    }
  }

  console.log('repeatImgs');
  console.log(repeatImgs);

  console.log(imgList);

  const errorImgList = []; // 图片尺寸要小于展示尺寸的2倍，且图片小于50KB
  const reg = /_(\d)*x(\d)*/;

  imgList.forEach(img => {
    if(!reg.test(img.src) && img.size > 10240) {
      errorImgList.push({
        ...img,
        errorCode: 'origin',
      });
    } else if(img.size > 51200) {
      errorImgList.push({
        ...img,
        errorCode: 'size',
      });
    } else if(img.naturalWidth > (img.width * 2)) {
      errorImgList.push({
        ...img,
        errorCode: 'suggest',
      });
    }
  });
  console.log(errorImgList);

  await browser.close();
})();
