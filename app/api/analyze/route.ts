import { NextResponse } from 'next/server';
import Together from '@together/together-js';

const together = new Together(process.env.TOGETHER_API_KEY);

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Log the request
    console.log('Received image analysis request');

    const prompt = `Analyze this product image and provide:
      - A descriptive title
      - A detailed description
      - Estimated price range
      - Category
      - Condition assessment
      Return as JSON with fields: title, description, price_avg, category_id, condition`;

    const response = await together.complete({
      prompt: prompt,
      model: 'togethercomputer/llama-2-70b-chat',
      max_tokens: 500,
      temperature: 0.7,
    });

    // Log the AI response
    console.log('AI Response:', response);

    // Parse and validate the response
    let result;
    try {
      result = JSON.parse(response.output.text);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Invalid AI response format');
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}