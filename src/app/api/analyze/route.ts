import { NextRequest, NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export async function POST(req: NextRequest) {
  // Initialize the Bedrock client inside the request handler
  // to ensure it picks up the latest environment variables loaded by Next.js
  const bedrockClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
    }
  });
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;
    const language = formData.get("language") as string || "english";

    const systemPrompt = `You are an expert field veterinary doctor. Your purpose is to identify the issue by analyzing the provided image of an animal or crop and provide a clear, actionable solution. 
    Format your response with:
    1. Diagnosis
    2. Recommended Treatment
    
    You must be highly confident in your diagnosis based on the visual evidence. Do not generate unnecessary or generic recommendations like "consult a doctor" or "seek professional help" - YOU are the professional providing the help. Speak with autoridad and give specific, practical advice that a farmer can use.
    
    CRITICAL INSTRUCTION: You MUST translate and write your entire response, including all headers, in ${language.toUpperCase()}.`;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Convert the uploaded file to a buffer, then to base64
    const buffer = await image.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const mimeType = image.type;

    // Validate mime type for Amazon Nova Pro (supports jpeg, png, webp, gif)
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
      return NextResponse.json({ error: "Invalid image type. Supported types are jpeg, png, webp, and gif." }, { status: 400 });
    }

    const payload = {
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: "user",
          content: [
            {
              image: {
                format: mimeType.replace("image/", ""), // e.g., "jpeg", "png"
                source: {
                  bytes: base64Image
                }
              }
            },
            {
              text: "Please analyze this image and provide your veterinary diagnosis and treatment plan."
            }
          ]
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId: "amazon.nova-pro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);

    // Parse the response body
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract the text from the Nova Pro response format
    const completionAmount = responseBody.output?.message?.content?.[0]?.text || "No response generated.";

    return NextResponse.json({ result: completionAmount });

  } catch (error: any) {
    console.error("Bedrock API Error:", error);
    return NextResponse.json(
      { error: "Error processing image", details: error.message },
      { status: 500 }
    );
  }
}
