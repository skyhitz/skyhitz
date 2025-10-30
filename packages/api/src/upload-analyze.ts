import { authenticateUser } from './auth/auth-context';
import { analyzeAudio } from './audio/analyzer';

/**
 * Handle upload and analysis request
 * Accepts audio file, analyzes it, and returns quality scores + mint cost
 */
export async function handleUploadAnalyze(
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
    const description = formData.get('description');

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

    // Validate audio file size (max 150MB)
    if (audioFile.size > 150 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Audio file too large (max 150MB)' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate image file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'Image file too large (max 10MB)' }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate audio file type
    const validAudioTypes = ['audio/mpeg', 'audio/mp4', 'audio/aiff', 'audio/x-aiff', 'audio/wav', 'audio/x-wav'];
    const validAudioExtensions = ['.mp3', '.mp4', '.aiff', '.wav', '.m4a'];
    const audioExtension = audioFile.name.toLowerCase().slice(audioFile.name.lastIndexOf('.'));
    
    if (!validAudioTypes.includes(audioFile.type) && !validAudioExtensions.includes(audioExtension)) {
      return new Response(
        JSON.stringify({ error: 'Invalid audio file type. Supported: MP3, MP4, AIFF, WAV' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate image file type
    if (!imageFile.type.startsWith('image/')) {
      return new Response(JSON.stringify({ error: 'Invalid image file type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Convert audio file to ArrayBuffer
    const audioBuffer = await audioFile.arrayBuffer();

    // Analyze the audio
    const analysisResult = await analyzeAudio(audioBuffer);

    // Log the analysis for the user
    console.log(`Audio analysis for user ${context.user.id}:`, {
      title,
      artist,
      finalScore: analysisResult.scores.finalScore,
      mintCost: analysisResult.mintCost,
      rejected: analysisResult.rejected,
    });

    // Return the analysis result
    return new Response(JSON.stringify(analysisResult), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Upload analyze error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to analyze audio',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

