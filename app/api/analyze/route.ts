import { NextResponse } from 'next/server';
import Together from 'together-ai';

export async function POST(req: Request) {
  try {
    const { imageData, prompt } = await req.json();

    if (!imageData || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('API Route: Starting analysis...');

    const together = new Together({
      apiKey: process.env.NEXT_PUBLIC_TOGETHER_API_KEY,
    });

    // Updated format according to Together.ai docs
    const response = await together.chat.completions.create({
      model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      messages: [
        {
          role: "user",
          content: prompt // Send prompt first
        },
        {
          role: "assistant",
          content: "I'll help analyze the image."
        },
        {
          role: "user",
          content: `data:image/jpeg;base64,${imageData}` // Send image data
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    console.log('API Route: Response received:', {
      status: 'success',
      choices: response.choices?.length
    });

    return NextResponse.json(response);
  } catch (error) {
    // Log the actual error for debugging
    console.error('API Route Error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Return a user-friendly error
    return NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    );
  }
}