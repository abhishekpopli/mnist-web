let canvas, ctx, ctx2, grayscaleImage;
let clearBeforeDrawing = false, continuePaint = false;
let timeOut;

const startStopToggle = document.getElementById('startStopToggleBtn');

startStopToggle.addEventListener('click', (e) => {
    toggleFullScreen();
    if (e.target.value == 'Start') {
        e.target.value = 'Stop';
        e.target.innerHTML = 'Stop';
        e.target.classList.remove('btn-outline-info');
        e.target.classList.add('btn-outline-success');
    } else {
        e.target.value = 'Start';
        e.target.innerHTML = 'Start';
        e.target.classList.remove('btn-outline-success');
        e.target.classList.add('btn-outline-info');
    }
});

function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;
  
    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
  
    if(!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
      requestFullScreen.call(docEl);
    }
    else {
      cancelFullScreen.call(doc);
    }
}

function changeContinuePaint(result) {
    if (result == true) {
        document.body.classList.add('no-scroll-y');
    };
    if (result == false) document.body.classList.remove('no-scroll-y');
    continuePaint = result;
}

function getMeanKernal() {
    const meanKernal = [];
    const meanKernalSum = 100;

    for (let i = 0; i < 10; i++) {
        meanKernal[i] = [];
        for (let j = 0; j < 10; j++) {
            meanKernal[i][j] = 1;
        }
    }

    return {
        kernal: meanKernal,
        sum: meanKernalSum
    }
}


const clearBtn = document.getElementById('clearBtn');
const recogniseBtn = document.getElementById('recogniseBtn');

clearBtn.addEventListener('click', () => {

    if (timeOut)
        clearTimeout(timeOut);
    
    recogniseBtn.innerHTML = "Recognise";

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
})

recogniseBtn.addEventListener('click', recognise);

function init() {
    canvas = document.getElementById('drawArea');
    ctx = canvas.getContext("2d");

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    canvas.addEventListener("mousemove", (e) => {
        interactEvent('move', e);
    });

    canvas.addEventListener("mousedown", (e) => {
        interactEvent('down', e);
    });

    canvas.addEventListener("mouseup", (e) => {
        interactEvent('up', e);
    });

    canvas.addEventListener("mouseout", (e) => {
        interactEvent('out', e);
    });

    canvas.addEventListener("touchmove", (e) => {
        // console.log('touch move detected');
        interactEvent('move', e);
    });

    canvas.addEventListener("touchstart", (e) => {
        // console.log('touch start detected');
        interactEvent('down', e);
    });

    canvas.addEventListener("touchend", (e) => {
        // console.log('touch end detected');
        interactEvent('up', e);
    });

    canvas.addEventListener("touchcancel", (e) => {
        // console.log('touch cancel detected');
        interactEvent('up', e);
    });
};

function interactEvent(type, e) {
    if (type == 'down') {
        if (clearBeforeDrawing == true) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            clearBeforeDrawing = false;
        }

        const coords = getInteractionCoords(e);
        currX = coords.x;
        currY = coords.y;

        // draw a cicle
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = 'white';
        ctx.arc(currX, currY, 10, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
        ctx.fill();

        changeContinuePaint(true);
    }

    else if (type == 'up' || type == 'out') {
        changeContinuePaint(false);
    }

    else if (type == 'move') {
        if (continuePaint) {

            prevX = currX;
            prevY = currY;

            const coords = getInteractionCoords(e);
            currX = coords.x;
            currY = coords.y;
        
            // draw line
            ctx.beginPath();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 20;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(currX, currY);
            ctx.stroke();
            ctx.closePath();
        }
    }
}


function recognise() {

    if (timeOut)
        clearTimeout(timeOut);
    
    recogniseBtn.innerHTML = "Recognising...";

    const imageData = ctx.getImageData(0, 0, 280, 280);
    grayscaleImage = convertToGrayscale(imageData);
    const boundingRectangle = getBoundingRectangle(grayscaleImage);
    const trans = translateCOMtoCenter(grayscaleImage);

    const canvasCopy = document.createElement('canvas');
    canvasCopy.width = imageData.width;
    canvasCopy.height = imageData.height;
    const ctxCopy = canvasCopy.getContext('2d');

    const widthDiff = boundingRectangle.maxX - boundingRectangle.minX + 1;
    const heightDiff = boundingRectangle.maxY - boundingRectangle.minY + 1;
    const largerDiff = widthDiff > heightDiff ? widthDiff : heightDiff;

    // Taking only 190 out of 200
    const scaleFactor = 190 / largerDiff;

    // scaling
    ctxCopy.translate(canvas.width / 2, canvas.height / 2);
    ctxCopy.scale(scaleFactor, scaleFactor);
    ctxCopy.translate(-canvas.width / 2, -canvas.height / 2);

    // translate
    ctxCopy.translate(trans.transX, trans.transY);
    ctxCopy.drawImage(ctx.canvas, 0, 0);


    const imageDataCopy = ctxCopy.getImageData(0, 0, 280, 280);
    const grayscaleImageCopy = convertToGrayscale(imageDataCopy);

    const output = []

    // Choose kernel
    const kernalData = getMeanKernal();
    const kernal = kernalData.kernal;
    const kernalSum = kernalData.sum;

    // Apply convolution
    for (let i = 0; i < 28; i++) {
        for (let j = 0; j < 28; j++) {
            let sum = 0;

            for (let y = i * 10; y < i * 10 + 10; y++) {
                for (let x = j * 10; x < j * 10 + 10; x++) {
                    sum += grayscaleImageCopy[y][x] + kernal[y % 10][x % 10];
                }
            }

            const average = sum / kernalSum;
            const result = average - 1;

            output.push(result);
        }
    }

    const objToSend = {data: output}

    fetch('https://mnist-mait.herokuapp.com/recognise', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(objToSend)
    })
        .then(res => res.json())
        .then(res => {
            recogniseBtn.innerHTML = `It is ${res.result} :)`;

            timeOut = setTimeout(() => {
                recogniseBtn.innerHTML = 'Recognise';
            }, 5000);
        })
        .catch(err => {
            console.log(err);
            recogniseBtn.innerHTML = 'Error occurred :(';

            timeOut = setTimeout(() => {
                recogniseBtn.innerHTML = 'Recognise';
            }, 3000);
        });
}

function convertToGrayscale(imageData) {
    let grayscaleImage = [];

    for (let i = 0; i < imageData.height; i++) {
        grayscaleImage[i] = [];
        for (let j = 0; j < imageData.width; j++) {
            const offset = 4 * (i * imageData.width + j);
            grayscaleImage[i][j] = imageData.data[offset] === 0 ? 0 : 1;
        }
    }

    return grayscaleImage;
}

function getBoundingRectangle(grayscaleImage) {
    const rows = grayscaleImage.length;
    const columns = grayscaleImage[0].length;

    let minX = columns;
    let minY = rows;
    let maxX = -1;
    let maxY = -1;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            if (grayscaleImage[i][j] == 1) {
                if (i < minX) minX = i;
                if (i > maxX) maxX = i;
                if (j < minY) minY = j;
                if (j > maxY) maxY = j;
            }    
        }
    }

    return {
        minX: minX,
        maxX: maxX,
        minY: minY,
        maxY: maxY
    }
}

function translateCOMtoCenter(grayscaleImage) {
    let noOfWhite = 0, sumOfWhiteX = 0, sumOfWhiteY = 0;
    
    const rows = grayscaleImage.length;
    const columns = grayscaleImage[0].length;

    for (let i = 0; i < rows; i++) {
        for(let j = 0; j < columns; j++) {
            if (grayscaleImage[i][j] == 1) {
                noOfWhite++;
                sumOfWhiteX += j;
                sumOfWhiteY += i;
            }
        }
    }

    const meanX = sumOfWhiteX / noOfWhite;
    const meanY = sumOfWhiteY / noOfWhite;
    
    const dX = Math.round(columns / 2 - meanX);
    const dY = Math.round(rows / 2 - meanY);
    return {transX: dX, transY: dY};
}

function getInteractionCoords(e) {
    let currX, currY;

    const rect = canvas.getBoundingClientRect();
    
    if (e.pageX && e.pageY) {
        currX = e.pageX - rect.left;
        currY = e.pageY - rect.top;
    } else {
        currX = e.changedTouches[0].clientX - rect.left;
        currY = e.changedTouches[0].clientY - rect.top;
    }
    
    return {x:currX, y:currY}
}

init();