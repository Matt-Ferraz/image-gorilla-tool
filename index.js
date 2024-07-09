const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
let memoryLogs = {}

const inputImagePaths = [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/TEIDE.JPG/1920px-TEIDE.JPG",
];

const outputDir = "output";
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const sizes = [32, 64, 128, 256];
const chunkSize = 1;
const delayBetweenChunks = 2000;
const delayBetweenImages = 1500;

function logMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const logMessage = `- RSS: ${memoryUsage.rss / 1024 / 1024} MB`;
    // - Heap Total: ${memoryUsage.heapTotal / 1024 / 1024} MB
    // - Heap Used: ${memoryUsage.heapUsed / 1024 / 1024} MB

    fs.appendFileSync("memory_logs.txt", logMessage + "\n");
}

async function downloadImage(url, outputPath) {
    const response = await axios({
        url,
        responseType: "stream",
    });

    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        writer.on("finish", async () => {
            const stats = fs.statSync(outputPath);
            setTimeout(resolve, delayBetweenImages);
        });
        writer.on("error", reject);
    });
}

async function resizeImage(inputPath, size, outputPath) {
    try {
        const originalStats = fs.statSync(inputPath);
        await sharp(inputPath)
            .resize(size, size)
            .png({ quality: 80, compressionLevel: 9 })
            .toFile(outputPath);
        const resizedStats = fs.statSync(outputPath);
        console.log(
            `Resized image size: ${size}x${size} ${resizedStats.size / 1000} KB`,
        );
    } catch (error) {
        console.error(`Error resizing image to ${size}x${size}:`, error);
    }
}

async function processImage(inputPath) {
    const isUrl = inputPath.startsWith("http");
    const tempImagePath = isUrl
        ? path.join(outputDir, `${crypto.randomUUID()}`)
        : inputPath;

    if (isUrl) {
        await downloadImage(inputPath, tempImagePath);
    }

    for (const size of sizes) {
        const outputImagePath = path.join(
            outputDir,
            `${path.basename(tempImagePath, path.extname(tempImagePath))}_${size}x${size}.png`,
        );
        await resizeImage(tempImagePath, size, outputImagePath);
    }

    fs.unlinkSync(tempImagePath);
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processImagesInChunks(imagePaths, chunkSize) {
    for (let i = 0; i < imagePaths.length; i += chunkSize) {
        const chunk = imagePaths.slice(i, i + chunkSize);
        await Promise.all(chunk.map((inputPath) => processImage(inputPath)));
        if (i + chunkSize < imagePaths.length) {
            console.log(
                `We chillin' for ${delayBetweenChunks}ms`,
            );
            await delay(delayBetweenChunks);
        }
    }
}

function startMemoryLogging(interval) {
    setInterval(() => {
        logMemoryUsage();
    }, interval);
}

processImagesInChunks(inputImagePaths, chunkSize);

startMemoryLogging(1000);
