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
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

async function main() {
  // Set up environment variables
  const env = {
    ALGOLIA_APP_ID: process.env.ALGOLIA_APP_ID,
    ALGOLIA_ADMIN_API_KEY: process.env.ALGOLIA_ADMIN_API_KEY,
    APP_URL: process.env.APP_URL,
  };

  if (!env.ALGOLIA_APP_ID || !env.ALGOLIA_ADMIN_API_KEY) {
    throw new Error('Please set ALGOLIA_APP_ID and ALGOLIA_ADMIN_API_KEY environment variables');
  }

  // Set ffmpeg path (adjust based on your system)
  ffmpeg.setFfmpegPath('/opt/homebrew/bin/ffmpeg');
  ffmpeg.setFfprobePath('/opt/homebrew/bin/ffprobe');

  const algolia = new AlgoliaClient(env as any);

  const entries = await algolia.getAllEntries();
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

  const pinataGateway = 'https://ipfs.skyhitz.io/ipfs';
  const publicBaseUrl = BASE_URL + '/skyhitz';

  let mp4Count = 0;
  let hlsCount = 0;

  for (const entry of entries) {
    console.log(`Processing entry: ${entry.id}`);
    
    const hash = entry.videoUrl.replace('ipfs://', '');
    const videoUrl = `${pinataGateway}/${hash}`;
    const mp4Key = `${hash}/mp4/index.mp4`;
    const hlsKey = `${hash}/hls/index.m3u8`;

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
          const key = `${hash}/hls/${file}`;
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

      // Optionally update Algolia (commented out as per user change)
      // const newVideoUrl = `${publicBaseUrl}/${hash}/hls/index.m3u8`;
      // console.log(`Updated entry ${entry.id} with new videoUrl: ${newVideoUrl}`);
    } catch (error) {
      console.error(`Error processing entry ${entry.id}:`, error);
    } finally {
      await cleanup();
    }
  }

  console.log(`MP4 entries: ${mp4Count}`);
  console.log(`HLS entries: ${hlsCount}`);
  console.log(`Total Algolia entries: ${entries.length}`);
  console.log('Migration completed');
}

main().catch(console.error); 