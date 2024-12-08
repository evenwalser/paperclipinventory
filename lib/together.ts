import Together from '@together/together-js'

const together = new Together(process.env.NEXT_PUBLIC_TOGETHER_API_KEY)

export async function analyzeImage(imageFile: File): Promise<{
  title: string
  description: string
  price_avg: number
  category_id: string
  condition: string
}> {
  try {
    // Convert image to base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(imageFile)
    })

    // Log the request
    console.log('Sending image for analysis...')

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Validate response data
    if (!data.title || !data.description || !data.price_avg || !data.category_id) {
      throw new Error('Invalid response data')
    }

    return data

  } catch (error) {
    console.error('Client Error:', error)
    throw new Error('Failed to analyze image. Please try again.')
  }
} 