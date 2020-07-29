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
 
  const imgList = [{
    src: '//gw.alicdn.com/imgextra/i4/4163445365/O1CN01HjXKEC1pVDUWng4LM_!!4163445365.jpg_790x10000Q75.jpg_.webp',
  }];


  const newImgList = await page.evaluate(async (imgList = []) => {

    var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
      function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
      return new (P || (P = Promise))(function (resolve, reject) {
          function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
          function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
          function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    function compressImg(imgSrc, imgWidth = 8) {
        return new Promise((resolve, reject) => {
            if (!imgSrc) {
                reject('imgSrc can not be empty!');
            }
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () {
                var _a, _b;
                canvas.width = imgWidth;
                canvas.height = imgWidth;
                (_a = ctx) === null || _a === void 0 ? void 0 : _a.drawImage(img, 0, 0, imgWidth, imgWidth);
                const data = (_b = ctx) === null || _b === void 0 ? void 0 : _b.getImageData(0, 0, imgWidth, imgWidth);
                resolve(data);
            };
            img.src = imgSrc;
        });
    }
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
    function hammingDistance(str1, str2) {
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
    class Presbyopic {
      constructor({ imgSrc = '', imgWidth = 8 }) {
          this.imgSrc = imgSrc;
          this.imgWidth = imgWidth;
      }
      static compareFingerprint(fingerprint1, fingerprint2) {
          if (!method) {
              throw new Error(`Param "method" must be one of "perceptual hash", "color seperate" or "content feature", but found "${method}"`);
          }
          if (typeof fingerprint1 !== typeof fingerprint2) {
              throw new Error(`Type ${typeof fingerprint1} of fingerprint1 could not compare with type ${typeof fingerprint2} of fingerprint2.`);
          }
  
          fingerprint1 = fingerprint1 || [];
          fingerprint2 = fingerprint2 || [];
          const hammingDistance = hammingDistance(fingerprint1, fingerprint2);
          const hammingSimilarity = ((fingerprint1.length - hammingDistance) / fingerprint1.length).toFixed(2);
          return hammingSimilarity;
      }
      compressImg() {
          return __awaiter(this, void 0, void 0, function* () {
              return compressImg(this.imgSrc, this.imgWidth);
          });
      }
      compressFingerprint() {
          return __awaiter(this, void 0, void 0, function* () {
              const imgData = yield compressImg(this.imgSrc, this.imgWidth);
              return imgData;
          });
      }
      getHash() {
          return __awaiter(this, void 0, void 0, function* () {
            console.log('getHash');
              const imgData = yield this.compressImg();
              const grayImgData = createGrayscale(imgData);
              const fingerprint = getAHashFingerprint(grayImgData);
              console.log('fingerprint', fingerprint);
              return fingerprint;
          });
      }
    }
    const newImgList = [].concat(imgList);
    for(let img of imgList) {
      const src = img.src || '';
      console.log('src', src);
      const originSrcs = /([a-z|A-Z|0-9|_|!|\.|\/|-])*?\.(png|jpg)/.exec(src) || [];
      const originSrc = originSrcs[0] || '';
      console.log('originSrc', originSrc);
      async function loadImage(src){
        return new Promise(function(resolve){
          const image = new Image();
          image.crossOrigin = 'Anonymous';
          image.src = src;
          image.onload = async function(){
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0, image.width, image.height);
            const base64 = canvas.toDataURL();
            const presbyopic = new Presbyopic({
              imgSrc: base64,
              imgWidth: 8
            });
            const hash = await presbyopic.getHash();
            console.log('hash', hash);
            resolve(hash);
          }
          image.onerror = function(){
            resolve("");
          }
        })
      }

      const hash = await loadImage(originSrc);
      console.log('hash', hash);

      for(let i = 0, len = newImgList.length; i < len; i++) {
        const imgItem = newImgList[i] || {};
        if(imgItem.src === src) {
          newImgList[i].hash = hash;
          break;
        }
      }
    }
    console.log(newImgList[0]);
    return newImgList;
    
  }, imgList);

  console.log(newImgList);


  await browser.close();
})();
