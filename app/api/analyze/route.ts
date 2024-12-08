import { NextResponse } from 'next/server';
import Together from 'together-ai';

const together = new Together({ 
  apiKey: process.env.TOGETHER_API_KEY || '' 
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile || !(imageFile instanceof Blob)) {
      return NextResponse.json({ error: 'No valid image provided' }, { status: 400 });
    }

    // Convert image to base64
    const imageBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const completion = await together.chat.completions.create({
      model: "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo",
      messages: [
        {
          role: "system",
          content: "You are a product analyst. Analyze the image and provide details in JSON format."
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              url: imageBase64
            }
          ]
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Parse and validate response
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!result.title || !result.description || !result.price_avg || !result.category_id) {
      throw new Error('Missing required fields in response');
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to analyze image' 
    }, { status: 500 });
  }
}