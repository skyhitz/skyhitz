
import { AlgoliaClient } from '../algolia/algolia';
import { Entry } from '../util/types';

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
// @ts-ignore
import tmp from 'tmp-promise';
// @ts-ignore
import ffmpeg from 'fluent-ffmpeg';
// @ts-ignore
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import mime from 'mime-types';

const BASE_URL = 'https://8d06a01e958a084add5fcf155430e0fa.r2.cloudflarestorage.com';

  const s3 = new S3Client({
    region: 'auto',
    endpoint: BASE_URL,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });

  async function objectExists(key: string): Promise<boolean> {
    try {
      await s3.send(new HeadObjectCommand({ Bucket: 'skyhitz', Key: key }));
      return true;
    } catch (err: any) {
      if (err.name === 'NotFound') return false;
      throw err;
    }
  }

  async function downloadWithRetry(url: string, retries = 3, delay = 1000): Promise<Buffer> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
        return Buffer.from(response.data);
      } catch (error) {
        if (attempt === retries) throw error;
        console.log(`Download failed (attempt ${attempt}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
    throw new Error('Download failed after retries');
  }

async function main() {
  // Set up environment variables
  const env = {
    ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID || '',
    ALGOLIA_ADMIN_API_KEY: process.env.ALGOLIA_ADMIN_API_KEY || '',
    APP_URL: process.env.APP_URL || 'https://skyhitz.io',
  };

  if (!env.ALGOLIA_APP_ID || !env.ALGOLIA_ADMIN_API_KEY) {
    throw new Error('Please set ALGOLIA_APP_ID and ALGOLIA_ADMIN_API_KEY environment variables');
  }

  // Set ffmpeg path (adjust based on your system)
  ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg');
  ffmpeg.setFfprobePath('/opt/homebrew/bin/ffprobe');

  const algolia = new AlgoliaClient(env as any);

  const entries = await algolia.getAllEntries();
  
  const pinataGateway = 'https://ipfs.io/ipfs';
  const publicBaseUrl = BASE_URL + '/skyhitz';

  let mp4Count = 0;
  let hlsCount = 0;
  let metaCount = 0;
  let imageCount = 0;

  for (const entry of entries) {
    console.log(`Processing entry: ${entry.id}`);
    
    // Handle metadata (using entry.id as hash)
    const metaHash = entry.id;
    const metaKey = `${metaHash}/index.json`;
    const metaExists = await objectExists(metaKey);
    if (!metaExists) {
      const metaUrl = `${pinataGateway}/${metaHash}`;
      let metaData;
      try {
        metaData = await downloadWithRetry(metaUrl);
      } catch (error) {
        console.error(`Failed to download metadata for ${entry.id}:`, error);
      }
      if (metaData) {
        await s3.send(new PutObjectCommand({
          Bucket: 'skyhitz',
          Key: metaKey,
          Body: metaData,
          ContentType: 'application/json',
        }));
        console.log(`Uploaded metadata to ${metaKey}`);
      }
    } else {
      console.log(`Metadata already exists: ${metaKey}`);
    }
    metaCount++;

    // Handle image (using entry.imageUrl hash)
    const imageHash = entry.imageUrl.replace('ipfs://', '');
    const imageUrl = `${pinataGateway}/${imageHash}`;
    let imageExt = 'png';
    try {
      const headRes = await axios.head(imageUrl);
      imageExt = mime.extension(headRes.headers['content-type']) || 'png';
    } catch (error) {
      console.error(`Failed to get image type for ${entry.id}:`, error);
    }
    // Store without extension like IPFS - rely on Content-Type header
    const imageKey = `${imageHash}/index`;
    const imageExists = await objectExists(imageKey);
    if (!imageExists) {
      let imageData;
      try {
        imageData = await downloadWithRetry(imageUrl);
      } catch (error) {
        console.error(`Failed to download image for ${entry.id}:`, error);
      }
      if (imageData) {
        // Detect file type from content for proper Content-Type header
        if (imageExt === 'png' && imageData.length > 8) {
          const signature = imageData.subarray(0, 8);
          if (signature[0] === 0xFF && signature[1] === 0xD8 && signature[2] === 0xFF) {
            imageExt = 'jpg';
          } else if (signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4E && signature[3] === 0x47) {
            imageExt = 'png';
          } else if (signature.toString('ascii', 0, 4) === 'RIFF' && signature.toString('ascii', 8, 12) === 'WEBP') {
            imageExt = 'webp';
          } else if (signature.toString('ascii', 0, 3) === 'GIF') {
            imageExt = 'gif';
          }
        }
        
        await s3.send(new PutObjectCommand({
          Bucket: 'skyhitz',
          Key: imageKey,
          Body: imageData,
          ContentType: mime.lookup(imageExt) || 'image/png',
        }));
        console.log(`Uploaded image to ${imageKey} (${imageExt})`);
      }
    } else {
      console.log(`Image already exists: ${imageKey}`);
    }
    imageCount++;

    // // Handle video (using entry.videoUrl hash)
    const videoHash = entry.videoUrl.replace('ipfs://', '');
    const videoUrl = `${pinataGateway}/${videoHash}`;
    const mp4Key = `${videoHash}/mp4/index.mp4`;
    const hlsKey = `${videoHash}/hls/index.m3u8`;

    // Create temporary directory
    const { path: tempDir, cleanup } = await tmp.dir({ unsafeCleanup: true });

    try {
      // Handle MP4
      const mp4Exists = await objectExists(mp4Key);
      let mp4Path = path.join(tempDir, 'index.mp4');

      if (!mp4Exists) {
        // Download original video
        const downloadPath = path.join(tempDir, 'input');
        const videoData = await downloadWithRetry(videoUrl);
        await fs.writeFile(downloadPath, videoData);

        // Probe format
        const probe = await new Promise((resolve, reject) => {
          ffmpeg.ffprobe(downloadPath, (err: Error | null, metadata: any) => {
            if (err) reject(err);
            else resolve(metadata);
          });
        }) as any;

        const isMp4 = probe.format.format_name?.includes('mp4');

        if (!isMp4) {
          await new Promise((resolve, reject) => {
            ffmpeg(downloadPath)
              .output(mp4Path)
              .videoCodec('libx264')
              .outputOptions([
                '-preset', 'slow',
                '-crf', '23'
              ])
              .on('end', resolve)
              .on('error', reject)
              .run();
          });
        } else {
          await fs.rename(downloadPath, mp4Path);
        }

        // Upload MP4
        const mp4Body = await fs.readFile(mp4Path);
        await s3.send(new PutObjectCommand({
          Bucket: 'skyhitz',
          Key: mp4Key,
          Body: mp4Body,
          ContentType: 'video/mp4',
        }));
        console.log(`Uploaded MP4 to ${mp4Key}`);
      } else {
        console.log(`MP4 already exists: ${mp4Key}`);
        // Download MP4 from R2 for HLS conversion if needed
        const res = await s3.send(new GetObjectCommand({ Bucket: 'skyhitz', Key: mp4Key }));
        const body = await res.Body?.transformToByteArray();
        if (body) {
          await fs.writeFile(mp4Path, Buffer.from(body));
        } else {
          throw new Error('Failed to download MP4 from R2');
        }
      }
      mp4Count++;

      // Handle HLS
      const hlsExists = await objectExists(hlsKey);
      if (!hlsExists) {
        const hlsDir = path.join(tempDir, 'hls');
        await fs.mkdir(hlsDir);
        const hlsPath = path.join(hlsDir, 'index.m3u8');

        await new Promise((resolve, reject) => {
          ffmpeg(mp4Path)
            .output(hlsPath)
            .outputOptions([
              '-profile:v', 'baseline',
              '-level', '3.0',
              '-hls_time', '10',
              '-hls_list_size', '0',
              '-f', 'hls'
            ])
            .on('end', resolve)
            .on('error', reject)
            .run();
        });

        // Upload HLS files
        const hlsFiles = await fs.readdir(hlsDir);
        for (const file of hlsFiles) {
          const filePath = path.join(hlsDir, file);
          const fileBody = await fs.readFile(filePath);
          const contentType = file.endsWith('.m3u8') ? 'application/x-mpegURL' : 'video/MP2T';
          const key = `${videoHash}/hls/${file}`;
          await s3.send(new PutObjectCommand({
            Bucket: 'skyhitz',
            Key: key,
            Body: fileBody,
            ContentType: contentType,
          }));
          console.log(`Uploaded ${key}`);
        }
      } else {
        console.log(`HLS already exists: ${hlsKey}`);
      }
      hlsCount++;
    } catch (error) {
      console.error(`Error processing entry ${entry.id}:`, error);
    } finally {
      await cleanup();
    }
  }

  console.log(`MP4 entries: ${mp4Count}`);
  console.log(`HLS entries: ${hlsCount}`);
  console.log(`Meta entries: ${metaCount}`);
  console.log(`Image entries: ${imageCount}`);
  console.log(`Total Algolia entries: ${entries.length}`);
  console.log('Migration completed');
  
  // // Then migrate users with proper extension detection
  // await migrateUsers(algolia, s3, pinataGateway);
}

main().catch(console.error);

// Add after main
async function migrateUsers(algolia: AlgoliaClient, s3: S3Client, pinataGateway: string) {
  const users = await algolia.getAllUsers();
  let avatarCount = 0;
  let backgroundCount = 0;

  for (const user of users) {
    console.log(`Processing user: ${user.objectID || user.id}`);

    // Handle avatar
    if (user.avatarUrl) {
      const hash = user.avatarUrl.replace('ipfs://', '');
      
      // Check if this is a legacy Cloudinary URL
      if (hash.startsWith('https://res.cloudinary.com/')) {
        console.log(`Skipping legacy Cloudinary avatar for user ${user.objectID}: ${hash}`);
        continue;
      }
      
      const url = `${pinataGateway}/${hash}`;
      let ext = 'png'; // Default
      try {
        const headRes = await axios.head(url);
        ext = mime.extension(headRes.headers['content-type']) || 'png';
      } catch (error) {
        console.error(`Failed to get avatar type for user ${user.objectID}:`, error);
        // Don't continue here, still try to download with default extension
      }
      // Store without extension like IPFS - rely on Content-Type header
      const key = `${hash}/index`;

      const exists = await objectExists(key);
      if (!exists) {
        try {
          const data = await downloadWithRetry(url);
          
          // Detect file type from content for proper Content-Type header
          if (ext === 'png' && data.length > 8) {
            const signature = data.subarray(0, 8);
            if (signature[0] === 0xFF && signature[1] === 0xD8 && signature[2] === 0xFF) {
              ext = 'jpg';
            } else if (signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4E && signature[3] === 0x47) {
              ext = 'png';
            } else if (signature.toString('ascii', 0, 4) === 'RIFF' && signature.toString('ascii', 8, 12) === 'WEBP') {
              ext = 'webp';
            } else if (signature.toString('ascii', 0, 3) === 'GIF') {
              ext = 'gif';
            }
          }
          
          await s3.send(new PutObjectCommand({
            Bucket: 'skyhitz',
            Key: key,
            Body: data,
            ContentType: mime.lookup(ext) || 'image/png',
          }));
          console.log(`Uploaded avatar for ${user.objectID} to ${key} (${ext})`);
        } catch (error) {
          console.error(`Failed to upload avatar for ${user.objectID}:`, error);
        }
      } else {
        console.log(`Avatar already exists: ${key}`);
      }
      avatarCount++;
    }

    // Handle background
    if (user.backgroundUrl) {
      const hash = user.backgroundUrl.replace('ipfs://', '');
      
      // Check if this is a legacy Cloudinary URL
      if (hash.startsWith('https://res.cloudinary.com/')) {
        console.log(`Skipping legacy Cloudinary background for user ${user.objectID}: ${hash}`);
        continue;
      }
      
      const url = `${pinataGateway}/${hash}`;
      let ext = 'png'; // Default
      try {
        const headRes = await axios.head(url);
        ext = mime.extension(headRes.headers['content-type']) || 'png';
      } catch (error) {
        console.error(`Failed to get background type for user ${user.objectID}:`, error);
        // Don't continue here, still try to download with default extension
      }
      // Store without extension like IPFS - rely on Content-Type header
      const key = `${hash}/index`;

      const exists = await objectExists(key);
      if (!exists) {
        try {
          const data = await downloadWithRetry(url);
          
          // Detect file type from content for proper Content-Type header
          if (ext === 'png' && data.length > 8) {
            const signature = data.subarray(0, 8);
            if (signature[0] === 0xFF && signature[1] === 0xD8 && signature[2] === 0xFF) {
              ext = 'jpg';
            } else if (signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4E && signature[3] === 0x47) {
              ext = 'png';
            } else if (signature.toString('ascii', 0, 4) === 'RIFF' && signature.toString('ascii', 8, 12) === 'WEBP') {
              ext = 'webp';
            } else if (signature.toString('ascii', 0, 3) === 'GIF') {
              ext = 'gif';
            }
          }
          
          await s3.send(new PutObjectCommand({
            Bucket: 'skyhitz',
            Key: key,
            Body: data,
            ContentType: mime.lookup(ext) || 'image/png',
          }));
          console.log(`Uploaded background for ${user.objectID} to ${key} (${ext})`);
        } catch (error) {
          console.error(`Failed to upload background for ${user.objectID}:`, error);
        }
      } else {
        console.log(`Background already exists: ${key}`);
      }
      backgroundCount++;
    }
  }

  console.log(`Migrated ${avatarCount} avatars and ${backgroundCount} backgrounds`);
}
