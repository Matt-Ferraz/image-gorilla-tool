const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const timeExecuted = Date.now()
let memoryLogs = {}

let inputImagePaths = [
    // "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/TEIDE.JPG/1920px-TEIDE.JPG",
    // "C:/Users/ferra/Documents/GitHub/a/image-gorilla-tool/test/0a0c1312be06.png",
    // "C:/Users/ferra/Documents/GitHub/a/image-gorilla-tool/test/0bbb78f96f46.png"
];

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
    memoryLogs[parseInt(Date.now())] = {memory: memoryUsage.rss.toFixed(2) / 1024 / 1024, time: Date.now(), memory_magnitude: "mb"}

    // console.log(logMessage)

    // fs.appendFileSync(`memory_logs-${timeExecuted}.logs`, logMessage + "\n");
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
            // const stats = fs.statSync(outputPath);
            setTimeout(resolve, delayBetweenImages);
        });
        writer.on("error", reject);
    });
}

async function resizeImage(inputPath, size, outputPath) {
    try {
        // const originalStats = fs.statSync(inputPath);
        await sharp(inputPath)
            .resize(size, size)
            .png({ quality: 80, compressionLevel: 9 })
            .toFile(outputPath);
        // const resizedStats = fs.statSync(outputPath);
        // console.log(
        //     `Resized image size: ${size}x${size} ${resizedStats.size / 1000} KB`,
        // );
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

    // fs.unlinkSync(tempImagePath);
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
// processImagesInChunks(inputImagePaths, chunkSize);

startMemoryLogging(10);


// process.on('exit', writeFileLog)
const testFolder = './output/';
fs.readdir(testFolder, (err, files) => {
    console.log(files.length/5)
    // files.forEach((file) => file[0])

    // // windows requires this to work
    // for(let i = 0; i < files.length; i++){
    //     files[i] = (__dirname + '/test/' + files[i]).split("\\").join("/")
    // }
    // // console.log(files, files[0], files.length, typeof files, typeof files[0])
    // inputImagePaths = files

    // chunkSize = 500
    // // console.log(inputImagePaths)
    // processImagesInChunks(inputImagePaths, chunkSize);

});