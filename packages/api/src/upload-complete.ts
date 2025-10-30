import { authenticateUser } from './auth/auth-context';
import { analyzeAudio } from './audio/analyzer';
import StorageClient from './util/storage-client';

/**
 * Complete upload flow: Upload files, analyze audio, return results
 * This combines file upload and analysis into one endpoint
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

    console.log(`📤 Uploading files for user ${context.user.id}...`);
    
    // Initialize storage client
    const storage = new StorageClient(env);

    // Upload audio file to R2
    console.log('🎵 Uploading audio file...');
    const audioBuffer = new Uint8Array(await audioFile.arrayBuffer());
    const audioUploadResult = await storage.pinBuffer(audioBuffer as any);
    console.log(`✅ Audio uploaded: ${audioUploadResult.IpfsHash}`);

    // Upload image file to R2
    console.log('🖼️  Uploading image file...');
    const imageBuffer = new Uint8Array(await imageFile.arrayBuffer());
    const imageUploadResult = await storage.pinBuffer(imageBuffer as any);
    console.log(`✅ Image uploaded: ${imageUploadResult.IpfsHash}`);

    // Analyze audio quality
    console.log('🔍 Analyzing audio quality...');
    const audioArrayBuffer = await audioFile.arrayBuffer();
    const analysisResult = await analyzeAudio(audioArrayBuffer);
    console.log(`✅ Analysis complete: Score ${analysisResult.scores.finalScore}/10, Cost ${analysisResult.mintCost} XLM`);

    // Return combined result
    return new Response(
      JSON.stringify({
        ...analysisResult,
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

