import Together from 'together-js';

const together = new Together(process.env.NEXT_PUBLIC_TOGETHER_API_KEY || '');

export async function analyzeImage(imageFile: File): Promise<{
  title: string;
  description: string;
  price_avg: number;
  category_id: string;
  condition: string;
}> {
  try {
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    console.log('Sending image for analysis...');

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }

    if (!data.title || !data.description || !data.price_avg || !data.category_id) {
      throw new Error('Missing required fields in response');
    }

    return data;

  } catch (error) {
    console.error('Analysis failed:', error);
    throw new Error('Failed to analyze image. Please try again.');
  }
} 