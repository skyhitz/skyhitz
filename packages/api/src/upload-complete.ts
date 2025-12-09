import { authenticateUser } from './auth/auth-context';
import StorageClient from './util/storage-client';
import { validateImageFile, validateAudioFile } from './util/file-validation';
import { AlgoliaClient } from './algolia/algolia';
import { PendingUpload } from './util/types';
import { ADMIN_ID } from './constants/constants';
import Mailer from './postmark/mailer';
import crypto from 'crypto';

/**
 * Complete upload flow: Upload files and create pending upload for curator review
 * Files are stored in R2 and a pending upload record is created in Algolia
 * Curators will review and approve/reject uploads
 */
export async function handleUploadComplete(
  request: Request,
  env: Env,
  execContext: ExecutionContext
): Promise<Response> {
  const context = await authenticateUser({ env, request });
  if (!context.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    const imageFile = formData.get('image');
    const title = formData.get('title');
    const artist = formData.get('artist');
    const description = formData.get('description') || '';
    const artistEquityBpsStr = formData.get('artistEquityBps');
    
    // Parse artist equity - only if user is verified artist and value is provided
    let artistEquityBps: number | undefined;
    if (artistEquityBpsStr && typeof artistEquityBpsStr === 'string') {
      const parsed = parseInt(artistEquityBpsStr, 10);
      // Validate: must be 0-9990 (0% - 99.9%)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 9990) {
        artistEquityBps = parsed;
      }
    }

    // Validate required fields
    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!imageFile || !(imageFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'No image file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!title || typeof title !== 'string') {
      return new Response(JSON.stringify({ error: 'Title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!artist || typeof artist !== 'string') {
      return new Response(JSON.stringify({ error: 'Artist is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate file sizes
    if (audioFile.size > 150 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Audio file too large (max 150MB)' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (imageFile.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Image file too large (max 10MB)' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Read file contents for validation
    const audioBuffer = new Uint8Array(await audioFile.arrayBuffer());
    const imageBuffer = new Uint8Array(await imageFile.arrayBuffer());

    // Validate audio file type using magic bytes
    const audioValidation = validateAudioFile(audioFile, audioBuffer);
    if (!audioValidation.valid) {
      console.warn(`Upload rejected for user ${context.user.id}: Invalid audio file - ${audioValidation.error}`);
      return new Response(JSON.stringify({ error: audioValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate image file type using magic bytes
    const imageValidation = validateImageFile(imageFile, imageBuffer);
    if (!imageValidation.valid) {
      console.warn(`Upload rejected for user ${context.user.id}: Invalid image file - ${imageValidation.error}`);
      return new Response(JSON.stringify({ error: imageValidation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`📤 Uploading files for user ${context.user.id}...`);
    
    // Initialize storage client
    const storage = new StorageClient(env);

    // Upload audio file to R2
    console.log('🎵 Uploading audio file...');
    const audioUploadResult = await storage.pinBuffer(audioBuffer as any);
    console.log(`✅ Audio uploaded: ${audioUploadResult.IpfsHash}`);

    // Upload image file to R2
    console.log('🖼️  Uploading image file...');
    const imageUploadResult = await storage.pinBuffer(imageBuffer as any);
    console.log(`✅ Image uploaded: ${imageUploadResult.IpfsHash}`);

    // Create pending upload record for curator review
    console.log('📝 Creating pending upload for curator review...');
    const algolia = new AlgoliaClient(env);
    const pendingUploadId = `pending-upload-${crypto.randomUUID()}`;
    
    // Check if uploader is a verified artist
    const isVerifiedArtist = context.user.verifiedArtist === true;
    
    const pendingUpload: PendingUpload = {
      objectID: pendingUploadId,
      userId: context.user.id,
      userEmail: context.user.email,
      userName: context.user.displayName || context.user.username,
      audioHash: audioUploadResult.IpfsHash,
      imageHash: imageUploadResult.IpfsHash,
      title: title as string,
      artist: artist as string,
      description: description as string,
      // Artist equity - only store if user is verified and provided equity
      isVerifiedArtist,
      artistEquityBps: isVerifiedArtist && artistEquityBps ? artistEquityBps : undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
      createdAtTimestamp: Math.floor(Date.now() / 1000),
    };

    await algolia.savePendingUpload(pendingUpload);
    console.log(`✅ Pending upload created: ${pendingUploadId}`);

    // Notify all curators about the new upload
    try {
      const mailer = new Mailer(env);
      const curators = await algolia.getAllCurators();
      
      // Get admin user email
      let adminEmail: string | undefined;
      try {
        const adminUser = await algolia.getUser(ADMIN_ID);
        adminEmail = adminUser?.email;
      } catch (e) {
        console.warn('Could not fetch admin user for notification');
      }
      
      // Collect all curator emails (including admin)
      const curatorEmails = curators.map((c) => c.userEmail);
      if (adminEmail && !curatorEmails.includes(adminEmail)) {
        curatorEmails.push(adminEmail);
      }
      
      if (curatorEmails.length > 0) {
        await mailer.sendNewPendingUploadNotification({
          curatorEmails,
          uploaderName: context.user.displayName || context.user.username,
          trackTitle: title as string,
          trackArtist: artist as string,
          pendingUploadId,
        });
        console.log(`✅ Notified ${curatorEmails.length} curator(s) about new upload`);
      }
    } catch (error) {
      console.error('❌ Failed to send curator notifications:', error);
      // Don't fail the upload if notifications fail
    }

    // Return success response - upload is pending review
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your upload has been submitted for review. A curator will review it shortly.',
        pendingUploadId,
        audioHash: audioUploadResult.IpfsHash,
        imageHash: imageUploadResult.IpfsHash,
        title,
        artist,
        description,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Upload complete error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process upload',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

