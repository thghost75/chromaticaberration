const imageInput = document.querySelector("#imageInput");
const uploadZone = document.querySelector("#uploadZone");
const previewCanvas = document.querySelector("#previewCanvas");
const loupeCanvas = document.querySelector("#loupeCanvas");
const emptyState = document.querySelector("#emptyState");
const strengthRange = document.querySelector("#strengthRange");
const strengthValue = document.querySelector("#strengthValue");
const angleRange = document.querySelector("#angleRange");
const angleValue = document.querySelector("#angleValue");
const opacityRange = document.querySelector("#opacityRange");
const opacityValue = document.querySelector("#opacityValue");
const downloadButton = document.querySelector("#downloadButton");
const resetButton = document.querySelector("#resetButton");

const ctx = previewCanvas.getContext("2d", { willReadFrequently: true });
const originalCanvas = document.createElement("canvas");
const originalCtx = originalCanvas.getContext("2d");
const loupeCtx = loupeCanvas.getContext("2d");
const loupeSize = 220;
let originalImage = null;
let originalFileName = "chromatic-aberration.png";
let renderTimer = 0;
let loupeShowsOriginal = false;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setReadyState(isReady) {
  previewCanvas.classList.toggle("ready", isReady);
  loupeCanvas.classList.toggle("ready", isReady);
  loupeCanvas.classList.remove("visible");
  emptyState.classList.toggle("hidden", isReady);
  downloadButton.disabled = !isReady;
  resetButton.disabled = !isReady;
}

function updateLabels() {
  strengthValue.textContent = `${strengthRange.value} px`;
  angleValue.textContent = `${angleRange.value} deg`;
  opacityValue.textContent = `${opacityRange.value}%`;
}

function loadImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  originalFileName = file.name || "chromatic-aberration.png";
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const image = new Image();
    image.addEventListener("load", () => {
      originalImage = image;
      previewCanvas.width = image.naturalWidth;
      previewCanvas.height = image.naturalHeight;
      originalCanvas.width = image.naturalWidth;
      originalCanvas.height = image.naturalHeight;
      originalCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
      originalCtx.drawImage(image, 0, 0, originalCanvas.width, originalCanvas.height);
      setReadyState(true);
      renderAberration();
    });
    image.src = reader.result;
  });
  reader.readAsDataURL(file);
}

function sampleChannel(source, x, y, channel, width, height) {
  const sx = clamp(Math.round(x), 0, width - 1);
  const sy = clamp(Math.round(y), 0, height - 1);
  return source[(sy * width + sx) * 4 + channel];
}

function renderAberration() {
  if (!originalImage) {
    return;
  }

  updateLabels();

  const width = previewCanvas.width;
  const height = previewCanvas.height;
  const strength = Number(strengthRange.value);
  const opacity = Number(opacityRange.value) / 100;
  const angle = (Number(angleRange.value) * Math.PI) / 180;
  const dx = Math.cos(angle) * strength;
  const dy = Math.sin(angle) * strength;

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(originalImage, 0, 0, width, height);

  if (strength === 0 || opacity === 0) {
    return;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const source = imageData.data;
  const output = new Uint8ClampedArray(source);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const shiftedRed = sampleChannel(source, x - dx, y - dy, 0, width, height);
      const shiftedBlue = sampleChannel(source, x + dx, y + dy, 2, width, height);
      output[index] = source[index] + (shiftedRed - source[index]) * opacity;
      output[index + 2] = source[index + 2] + (shiftedBlue - source[index + 2]) * opacity;
    }
  }

  ctx.putImageData(new ImageData(output, width, height), 0, 0);
}

function queueRender() {
  window.clearTimeout(renderTimer);
  renderTimer = window.setTimeout(renderAberration, 20);
  updateLabels();
}

function downloadImage() {
  if (!originalImage) {
    return;
  }

  const link = document.createElement("a");
  link.download = getDownloadFileName(originalFileName);
  link.href = previewCanvas.toDataURL("image/png");
  link.click();
}

function getDownloadFileName(fileName) {
  const cleanName = fileName.trim() || "chromatic-aberration.png";
  const extensionIndex = cleanName.lastIndexOf(".");
  const hasExtension = extensionIndex > 0;
  const baseName = hasExtension ? cleanName.slice(0, extensionIndex) : cleanName;

  return `${baseName}_CAS.png`;
}

function getCanvasPoint(event) {
  const rect = previewCanvas.getBoundingClientRect();
  const scaleX = previewCanvas.width / rect.width;
  const scaleY = previewCanvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  return {
    x: clamp(x, 0, previewCanvas.width),
    y: clamp(y, 0, previewCanvas.height),
    rect,
  };
}

function moveLoupe(event) {
  if (!originalImage) {
    return;
  }

  const { x, y, rect } = getCanvasPoint(event);
  const sourceSize = Math.min(loupeSize, previewCanvas.width, previewCanvas.height);
  const sx = clamp(Math.round(x - sourceSize / 2), 0, previewCanvas.width - sourceSize);
  const sy = clamp(Math.round(y - sourceSize / 2), 0, previewCanvas.height - sourceSize);

  loupeCanvas.width = loupeSize;
  loupeCanvas.height = loupeSize;
  loupeCtx.clearRect(0, 0, loupeSize, loupeSize);
  loupeShowsOriginal = event.buttons === 1;
  loupeCanvas.classList.toggle("original", loupeShowsOriginal);
  loupeCtx.drawImage(
    loupeShowsOriginal ? originalCanvas : previewCanvas,
    sx,
    sy,
    sourceSize,
    sourceSize,
    0,
    0,
    loupeSize,
    loupeSize,
  );

  loupeCanvas.style.left = `${rect.left - previewCanvas.parentElement.getBoundingClientRect().left + event.clientX - rect.left}px`;
  loupeCanvas.style.top = `${rect.top - previewCanvas.parentElement.getBoundingClientRect().top + event.clientY - rect.top}px`;
  loupeCanvas.classList.add("visible");
}

function hideLoupe() {
  loupeShowsOriginal = false;
  loupeCanvas.classList.remove("original");
  loupeCanvas.classList.remove("visible");
}

imageInput.addEventListener("change", (event) => {
  loadImage(event.target.files[0]);
});

strengthRange.addEventListener("input", queueRender);
angleRange.addEventListener("input", queueRender);
opacityRange.addEventListener("input", queueRender);
downloadButton.addEventListener("click", downloadImage);
resetButton.addEventListener("click", () => {
  strengthRange.value = 2;
  angleRange.value = 0;
  opacityRange.value = 100;
  renderAberration();
});

["dragenter", "dragover"].forEach((eventName) => {
  uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadZone.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  uploadZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    uploadZone.classList.remove("drag-over");
  });
});

uploadZone.addEventListener("drop", (event) => {
  loadImage(event.dataTransfer.files[0]);
});

previewCanvas.addEventListener("pointermove", moveLoupe);
previewCanvas.addEventListener("pointerdown", (event) => {
  if (event.button === 0) {
    event.preventDefault();
    moveLoupe(event);
  }
});
previewCanvas.addEventListener("pointerup", moveLoupe);
previewCanvas.addEventListener("pointerleave", hideLoupe);

updateLabels();
setReadyState(false);
