import { NextResponse } from 'next/server';
import Together from 'together-js';

const together = new Together(process.env.TOGETHER_API_KEY || '');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('Processing image analysis request...');

    const result = await together.inference.invoke(
      'togethercomputer/llama-2-70b-chat',
      {
        prompt: `
          Analyze this product image and provide details in JSON format:
          - title: A descriptive title
          - description: A detailed description
          - price_avg: Estimated price (number)
          - category_id: Main category
          - condition: Item condition

          Image: ${image}
        `,
        max_tokens: 1000,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }
    );

    console.log('Together API response:', result);

    const parsedResult = JSON.parse(result.output.text);
    
    return NextResponse.json(parsedResult);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}