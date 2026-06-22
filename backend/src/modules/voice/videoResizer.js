import { uploadToImageKit, getVideoTransformUrl } from "./imagekitUploader.js";

// Platform specs
const PLATFORM_SPECS = {
  youtube:           { width: 1920, height: 1080, label: "YouTube (16:9)"         },
  youtube_shorts:    { width: 1080, height: 1920, label: "YouTube Shorts (9:16)"  },
  instagram_reels:   { width: 1080, height: 1920, label: "Instagram Reels (9:16)" },
  instagram_feed:    { width: 1080, height: 1080, label: "Instagram Feed (1:1)"   },
  linkedin:          { width: 1280, height:  720, label: "LinkedIn (16:9)"         },
  twitter:           { width: 1280, height:  720, label: "Twitter/X (16:9)"        },
};

/**
 * Upload video to ImageKit and return transformation URLs for all/selected platforms
 * @param {string} filePath  - local temp file path
 * @param {string} fileName  - original file name
 * @param {string[]} platforms - list of platforms (empty = all)
 */
export async function resizeForPlatforms(filePath, fileName, platforms = []) {
  // Step 1: Upload original video to ImageKit
  const uploaded = await uploadToImageKit(filePath, fileName, "/crewflow/videos");

  // Step 2: Generate transformation URLs for requested platforms
  const targetPlatforms = platforms.length
    ? platforms.filter((p) => PLATFORM_SPECS[p])
    : Object.keys(PLATFORM_SPECS);

  const results = targetPlatforms.map((platform) => {
    const spec = PLATFORM_SPECS[platform];
    const transformUrl = getVideoTransformUrl(uploaded.filePath, spec.width, spec.height);
    return {
      platform,
      label: spec.label,
      width: spec.width,
      height: spec.height,
      url: transformUrl,
    };
  });

  return {
    original: {
      url: uploaded.url,
      fileId: uploaded.fileId,
      size: uploaded.size,
    },
    platforms: results,
  };
}

export { PLATFORM_SPECS };
