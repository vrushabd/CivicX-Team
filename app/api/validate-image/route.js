import { google } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

const imageValidationSchema = z.object({
  isValid: z
    .boolean()
    .describe("Whether the image shows a civic issue like pothole, garbage, or infrastructure problem"),
  confidence: z.number().min(0).max(100).describe("Confidence percentage (0-100)"),
  issueType: z
    .enum(["pothole", "garbage", "streetlight", "sidewalk", "other", "none"])
    .describe("Type of civic issue detected"),
  description: z.string().describe("Brief description of what is visible in the image"),
  suggestions: z.array(z.string()).describe("Suggestions for better image if invalid"),
})

function fallbackImageValidation(imageData) {
  // Simple heuristic validation based on file size and format
  const isValidFormat = imageData.includes("data:image/")
  const fileSize = imageData.length

  // Assume valid if it's a proper image format and reasonable size
  if (isValidFormat && fileSize > 10000) {
    return {
      isValid: true,
      confidence: 75,
      issueType: "other",
      message: "Image appears to be valid. AI validation is currently unavailable, so manual review may be needed.",
      suggestions: ["Ensure the image clearly shows the civic issue", "Take the photo in good lighting conditions"],
    }
  } else {
    return {
      isValid: false,
      confidence: 0,
      issueType: "none",
      message: "Invalid image format or file too small.",
      suggestions: ["Upload a clear photo showing the civic issue", "Ensure the image is in JPG or PNG format"],
    }
  }
}

export async function POST(req) {
  let imageData

  try {
    const body = await req.json()
    imageData = body.imageData

    if (!imageData) {
      return Response.json({ error: "No image data provided" }, { status: 400 })
    }

    const hasGoogleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY

    if (!hasGoogleKey) {
      console.log("[v0] Google API key not found, using fallback validation")
      const fallbackResult = fallbackImageValidation(imageData)
      return Response.json(fallbackResult)
    }

    // Remove data URL prefix if present
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "")

    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        const { object } = await generateObject({
          model: google("gemini-1.5-flash"), // Using Gemini Flash for vision tasks
          schema: imageValidationSchema,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this image to determine if it shows a civic issue that should be reported to municipal authorities. 

Look for:
- Potholes or road damage
- Garbage, litter, or waste management issues  
- Broken streetlights or infrastructure
- Sidewalk damage or accessibility issues
- Other municipal maintenance problems

Provide a confidence score and specific feedback. If the image doesn't show a clear civic issue, suggest what kind of photo would be more appropriate.`,
                },
                {
                  type: "image",
                  image: base64Data,
                },
              ],
            },
          ],
          maxOutputTokens: 300,
        })

        return Response.json({
          isValid: object.isValid,
          confidence: object.confidence,
          issueType: object.issueType,
          message: object.description,
          suggestions: object.suggestions,
        })
      } catch (aiError) {
        attempts++
        console.log(`[v0] AI validation attempt ${attempts} failed:`, aiError.message)

        if (
          aiError.message?.includes("quota") ||
          aiError.message?.includes("billing") ||
          aiError.message?.includes("API_KEY")
        ) {
          console.log("[v0] Google API quota/key issue, switching to fallback validation")
          break // Exit retry loop and use fallback
        }

        if (attempts >= maxAttempts) {
          console.log("[v0] Max AI validation attempts reached, using fallback")
          break
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 1000))
      }
    }

    console.log("[v0] Using fallback validation due to AI service issues")
    const fallbackResult = fallbackImageValidation(imageData)
    return Response.json({
      ...fallbackResult,
      message: `${fallbackResult.message} (AI validation temporarily unavailable)`,
    })
  } catch (error) {
    console.error("[v0] Image validation error:", error)

    if (imageData) {
      const fallbackResult = fallbackImageValidation(imageData)
      return Response.json({
        ...fallbackResult,
        message: `${fallbackResult.message} (Error occurred during validation)`,
      })
    }

    return Response.json(
      {
        error: "Failed to process image validation request",
        isValid: false,
        confidence: 0,
        issueType: "none",
        message: "Unable to validate image due to server error",
        suggestions: ["Please try uploading the image again"],
      },
      { status: 500 },
    )
  }
}
