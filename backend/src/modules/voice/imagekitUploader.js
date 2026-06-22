import ImageKit from "@imagekit/nodejs";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Upload any file (audio/video/image) to ImageKit
 * @param {string} filePath - local temp file path
 * @param {string} fileName - name to save as
 * @param {string} folder   - ImageKit folder (e.g. /audio, /video)
 */
export async function uploadToImageKit(filePath, fileName, folder = "/crewflow") {
  const fileBuffer = fs.readFileSync(filePath);
  const response = await imagekit.upload({
    file: fileBuffer,
    fileName,
    folder,
    useUniqueFileName: true,
  });
  return {
    url: response.url,
    fileId: response.fileId,
    name: response.name,
    size: response.size,
    filePath: response.filePath,
  };
}

/**
 * Get a video transformation URL from ImageKit
 * Resizes video to target platform dimensions
 */
export function getVideoTransformUrl(filePath, width, height) {
  return imagekit.url({
    path: filePath,
    transformation: [
      { width, height, cropMode: "pad_resize", background: "000000" },
    ],
  });
}

export default imagekit;
