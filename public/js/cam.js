const MODEL_PATH = window.AppConfig.modelPath;
const video = document.getElementById('webcam');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const statusEl = document.getElementById('status');
const countEl = document.getElementById('person-count');
const SIZE = 640;
const TOTAL_PIXELS = SIZE * SIZE;
const floatArr = new Float32Array(3 * TOTAL_PIXELS);
const SEND_INTERVAL_MS = 5 * 1000;
let sampleHistory = [];
let lastSampleTime = 0;
let lastSendTime = Date.now();

const canvas = Object.assign(document.createElement('canvas'), { width: SIZE, height: SIZE });
const canvasCtx = canvas.getContext('2d', { willReadFrequently: true });

let session = null;

ctx.strokeStyle = '#22c55e';
ctx.lineWidth = 2;

async function sendCountToBackend(count) {
    try {
        const response = await fetch('/api/log-count', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ count: count })
        });
        const data = await response.json();
        console.log(`[${new Date().toLocaleTimeString()}] Sent to Sheet:`, data);
    } catch (err) {
        console.error('Failed to log count:', err);
    }
}


/*---------------------------------------------------------------------------------------------------------------------------*/


async function startWebcam() {
    video.srcObject = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    await new Promise((res) => (video.onloadedmetadata = res));
    overlay.width = video.videoWidth;
    overlay.height = video.videoHeight;
}

function getTensor() {
    canvasCtx.drawImage(video, 0, 0, SIZE, SIZE);
    const { data } = canvasCtx.getImageData(0, 0, SIZE, SIZE);

    for (let i = 0; i < TOTAL_PIXELS; i++) {
        const srcIdx = i * 4;
        floatArr[i] = data[srcIdx] / 255.0;
        floatArr[TOTAL_PIXELS + i] = data[srcIdx + 1] / 255.0;
        floatArr[TOTAL_PIXELS * 2 + i] = data[srcIdx + 2] / 255.0;
    }

    return new ort.Tensor('float32', floatArr, [1, 3, SIZE, SIZE]);
}

function computeIoU(boxA, boxB) {
    const x1 = Math.max(boxA.x, boxB.x);
    const y1 = Math.max(boxA.y, boxB.y);
    const x2 = Math.min(boxA.x + boxA.w, boxB.x + boxB.w);
    const y2 = Math.min(boxA.y + boxA.h, boxB.y + boxB.h);

    const interArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const unionArea = boxA.w * boxA.h + boxB.w * boxB.h - interArea;

    return unionArea === 0 ? 0 : interArea / unionArea;
}

async function detect() {
    if (!session) return;

    const input = getTensor();
    const results = await session.run({ [session.inputNames[0]]: input });
    const output = results[session.outputNames[0]].data;

    ctx.clearRect(0, 0, overlay.width, overlay.height);

    const numBoxes = 8400;
    const scaleX = overlay.width / SIZE;
    const scaleY = overlay.height / SIZE;
    const candidates = [];

    for (let i = 0; i < numBoxes; i++) {
        const score = output[4 * numBoxes + i];

        if (score > 0.5) {
            const cx = output[i];
            const cy = output[numBoxes + i];
            const rawW = output[2 * numBoxes + i];
            const rawH = output[3 * numBoxes + i];

            const w = rawW * scaleX;
            const h = rawH * scaleY;
            const x = (cx - rawW / 2) * scaleX;
            const y = (cy - rawH / 2) * scaleY;

            candidates.push({ x, y, w, h, score });
        }
    }

    candidates.sort((a, b) => b.score - a.score);

    const finalBoxes = [];
    while (candidates.length > 0) {
        const best = candidates.shift();
        finalBoxes.push(best);

        for (let i = candidates.length - 1; i >= 0; i--) {
            if (computeIoU(best, candidates[i]) > 0.45) {
                candidates.splice(i, 1);
            }
        }
    }

    // 4. Render boxes
    for (const box of finalBoxes) {
        ctx.strokeRect(box.x, box.y, box.w, box.h);
    }

    countEl.innerText = finalBoxes.length;

    const currentFrameCount = finalBoxes.length;
    const now = Date.now();

    if (now - lastSendTime >= SEND_INTERVAL_MS) {
        let finalReportedCount = 0;

        if (sampleHistory.length > 0) {
            sampleHistory.sort((a, b) => a - b);
            const mid = Math.floor(sampleHistory.length / 2);
            finalReportedCount = sampleHistory.length % 2 !== 0
                ? sampleHistory[mid]
                : Math.round((sampleHistory[mid - 1] + sampleHistory[mid]) / 2);
        } else {
            finalReportedCount = currentFrameCount;
        }

        sendCountToBackend(finalReportedCount);

        sampleHistory = [];
        lastSendTime = now;
    }

    requestAnimationFrame(detect);


}

async function init() {
    try {
        await startWebcam();
        statusEl.innerText = 'Loading exp.onnx...';
        session = await ort.InferenceSession.create(MODEL_PATH, { executionProviders: ['webgpu', 'wasm'] });
        statusEl.innerText = 'Running detection';
        detect();
    } catch (err) {
        statusEl.innerText = `Error: ${err.message}`;
        console.error(err);
    }
}



init();