const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const timeExecuted = Date.now()
let memoryLogs = {}
let num = 0;
let inputImagePaths = [];

const outputDir = "output";
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const sizes = [32, 64, 128, 256, 512];
let chunkSize = 15;
const delayBetweenChunks = 2000;
const delayBetweenImages = 10;

function writeFileLog() {
    let _buffer = JSON.stringify(memoryLogs)

    fs.writeFile(`memory-dump-${timeExecuted}.json`, _buffer, (ds) => {
        process.exit()
    console.log(ds)
    })

}

function logMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    const logMessage = `RAM: ${memoryUsage.rss.toFixed(2) / 1024 / 1024} MB `;
    memoryLogs[parseInt(Date.now())] = {memory: memoryUsage.rss.toFixed(2) / 1024 / 1024, time: new Date(), memory_magnitude: "mb"}
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
            setTimeout(resolve, delayBetweenImages);
        });
        writer.on("error", reject);
    });
}

async function resizeImage(inputPath, size, outputPath) {
    try {
        await sharp(inputPath)
            .resize(size, size)
            .png({ quality: 80, compressionLevel: 6 })
            .toFile(outputPath);
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
        num++
        console.log("foram", num)
    }
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
                `We've got ${chunkSize}, bow chillin for ${delayBetweenChunks}ms`,
            );
            await delay(delayBetweenChunks);
        }

    }


    writeFileLog()
}

function startMemoryLogging(interval) {
    setInterval(() => {
        logMemoryUsage();
    }, interval);
}


startMemoryLogging(10);

const testFolder = './input-sample/';

fs.readdir(testFolder, (err, files) => {
    for(let i = 0; i < files.length; i++){
        if(files[i].split('.')[1] != "png"){
            delete files[i]
        } else files[i] = ('./input-sample/' + files[i])//.split("\\").join("/")
    }

    inputImagePaths = files
    chunkSize = 400

    processImagesInChunks(inputImagePaths, chunkSize);
});
