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