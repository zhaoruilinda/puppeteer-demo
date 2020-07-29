
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

var FeatureMethod;
(function (FeatureMethod) {
    FeatureMethod["PerceptualHash"] = "perceive hash";
})(FeatureMethod || (FeatureMethod = {}));

function getSrcFromImageData(imgData) {
    var _a;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    (_a = ctx) === null || _a === void 0 ? void 0 : _a.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
}

class ChainHandler {
    constructor({ imgData, fingerprint, method }) {
        this.imgData = imgData;
        this.fingerprint = fingerprint;
        this.method = method;
    }
    getNewImg() {
        return getSrcFromImageData(this.imgData);
    }
}

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
function cosineSimilarity(sampleFingerprint, targetFingerprint) {
    const length = sampleFingerprint.length;
    let innerProduct = 0;
    for (let i = 0; i < length; i++) {
        innerProduct += sampleFingerprint[i] * targetFingerprint[i];
    }
    let vecA = 0;
    let vecB = 0;
    for (let i = 0; i < length; i++) {
        vecA += Math.pow(sampleFingerprint[i], 2);
        vecB += Math.pow(targetFingerprint[i], 2);
    }
    const outerProduct = Math.sqrt(vecA) * Math.sqrt(vecB);
    return innerProduct / outerProduct;
}
function memoizeCosines(N, cosMap) {
    cosMap = cosMap || {};
    cosMap[N] = new Array(N * N);
    let PI_N = Math.PI / N;
    for (let k = 0; k < N; k++) {
        for (let n = 0; n < N; n++) {
            cosMap[N][n + (k * N)] = Math.cos(PI_N * (n + 0.5) * k);
        }
    }
    return cosMap;
}
function dct(signal, scale = 2) {
    let L = signal.length;
    let cosMap = null;
    if (!cosMap || !cosMap[L]) {
        cosMap = memoizeCosines(L, cosMap);
    }
    let coefficients = signal.map(function () { return 0; });
    return coefficients.map(function (_, ix) {
        return scale * signal.reduce(function (prev, cur, index) {
            return prev + (cur * cosMap[L][index + (ix * L)]);
        }, 0);
    });
}
function createMatrix(arr) {
    const length = arr.length;
    const matrixWidth = Math.sqrt(length);
    const matrix = [];
    for (let i = 0; i < matrixWidth; i++) {
        const _temp = arr.slice(i * matrixWidth, i * matrixWidth + matrixWidth);
        matrix.push(_temp);
    }
    return matrix;
}
function getMatrixRange(matrix, range = 1) {
    const rangeMatrix = [];
    for (let i = 0; i < range; i++) {
        for (let j = 0; j < range; j++) {
            rangeMatrix.push(matrix[i][j]);
        }
    }
    return rangeMatrix;
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
function getPHashFingerprint(imgData) {
    const dctData = dct(imgData.data);
    const dctMatrix = createMatrix(dctData);
    const rangeMatrix = getMatrixRange(dctMatrix, dctMatrix.length / 8);
    const rangeAve = rangeMatrix.reduce((pre, cur) => pre + cur, 0) / rangeMatrix.length;
    return rangeMatrix.map(val => (val >= rangeAve ? 1 : 0)).join('');
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
        console.log('constructor');
        this.imgSrc = imgSrc;
        this.imgWidth = imgWidth;
        console.log('imgWidth', imgWidth);
    }
    static compareFingerprint(fingerprint1, fingerprint2, method) {
        if (!method) {
            throw new Error(`Param "method" must be one of "perceptual hash", "color seperate" or "content feature", but found "${method}"`);
        }
        if (typeof fingerprint1 !== typeof fingerprint2) {
            throw new Error(`Type ${typeof fingerprint1} of fingerprint1 could not compare with type ${typeof fingerprint2} of fingerprint2.`);
        }

        if (method === FeatureMethod.PerceptualHash) {
            fingerprint1 = fingerprint1 || [];
            fingerprint2 = fingerprint2 || [];
            const hammingDistance = hammingDistance(fingerprint1, fingerprint2);
            return {
                hammingSimilarity: ((fingerprint1.length - hammingDistance) / fingerprint1.length).toFixed(2),
                cosineSimilarity: (cosineSimilarity(fingerprint1.split('').map(f => Number(f)), fingerprint2.split('').map(f => Number(f)))).toFixed(2),
                method
            };
        }
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
    getHash(isPHash = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const imgData = yield this.compressImg();
            const grayImgData = createGrayscale(imgData);
            const fingerprint = isPHash ? getPHashFingerprint(grayImgData) : getAHashFingerprint(grayImgData);
            return new ChainHandler({
                imgData: grayImgData,
                fingerprint,
                method: FeatureMethod.PerceptualHash
            });
        });
    }
}

module.export = Presbyopic;