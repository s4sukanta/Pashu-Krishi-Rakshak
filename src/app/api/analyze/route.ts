import { NextRequest, NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

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

  const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
    }
  });
  const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

  try {
    const formData = await req.formData();
    const mediaFiles = formData.getAll("media") as File[];
    const language = formData.get("language") as string || "english";
    const previousDiagnosis = formData.get("previousDiagnosis") as string | null;
    const symptoms = formData.get("symptoms") as string | null;
    const userId = formData.get("userId") as string;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const symptomsPrompt = symptoms
      ? `\n<ADDITIONAL_CONTEXT>\nThe farmer has also provided the following additional observational context and symptoms regarding the animal:\n"${symptoms}"\n\nYou MUST take this written context into heavy consideration alongside your visual analysis to form a complete diagnosis.\n</ADDITIONAL_CONTEXT>\n`
      : "";

    const protocolPrompt = previousDiagnosis
      ? `
<FOLLOW_UP_PROTOCOL>
The farmer has provided FOLLOW-UP media for an animal with a previously diagnosed condition.
Here is the previous diagnosis and treatment plan context:

<PREVIOUS_DIAGNOSIS>
${previousDiagnosis}
</PREVIOUS_DIAGNOSIS>

Your task is to compare the new media against the context of the previous diagnosis.
- Determine if the condition is IMPROVING, STABLE, or WORSENING.
- If it is improving or stable, provide updated home-care steps to continue the healing process.
- CRITICAL EXCEPTION: If the condition is clearly WORSENING (e.g., an infection is actively spreading, a wound is more severe, loss of condition), you MUST explicitly advise the farmer to seek out a physical veterinarian immediately, as home treatment is no longer sufficient. Do not hesitate to refer if it is worsening.

Format your response with:
1. Progress Assessment (Improving/Stable/Worsening)
2. Updated Treatment Plan or Next Action Steps
</FOLLOW_UP_PROTOCOL>`
      : `
<DIAGNOSIS_PROTOCOL>
IF the media is perfectly clear and the subject's issue is visible, you must scrutinize it extremely closely. Pay special attention to:
- Eyes (infections, redness, discharge, cloudiness)
- Skin/Coat (lesions, ticks, abnormal patches)
- Hooves/Feet
- Unusual movement or posture

Format your response with:
1. Diagnosis
2. Recommended Treatment (focus heavily on home/farm remedies and available medicines)

CRUCIAL: Our target audience is rural farmers who may not have easy access to a veterinarian. YOU MUST ACT AS THEIR PRIMARY VETERINARIAN.
- Provide immediate, actionable, step-by-step home treatments and cures they can administer themselves. 
- Suggest specific, commonly available veterinary medicines (e.g., specific ointments, antibiotics, or natural remedies) with dosages if applicable.
- ABSOLUTELY DO NOT suggest "consult a veterinarian" or "seek professional help" for infections, diseases, or manageable injuries. YOU are the professional providing the help.
- The ONLY EXCEPTION where you may advise referring to a physical veterinarian is for severe structural trauma that cannot be managed at home, such as broken bones, major fractures, or deep muscle ruptures requiring surgery. Otherwise, give them exactly what they need to cure it themselves.
</DIAGNOSIS_PROTOCOL>`;

    const systemPrompt = `You are an expert, eagle-eyed field veterinary doctor and agricultural inspector.
    
<CRITICAL_INSTRUCTIONS>
YOU MUST EVALUATE THE MEDIA BEFORE ATTEMPTING A DIAGNOSIS.

IF ANY of the following rules are violated:
1. The subject is captured from too far a distance.
2. The media is heavily blurred or shaky.
3. The specific issue, anomaly, or infection is not clearly visible in high detail.
4. There are multiple animals in the media and it is not blatantly obvious which one is the patient.

THEN you MUST immediately STOP analysis and reply with the following template:
**Media Unclear**
[Explain exactly which rule was violated, e.g., "The animals are too far away to see fine details like skin lesions or eye infections."]
Please recapture the video or image from a closer look, focusing directly on the infected or diseased area.

DO NOT GUESS. DO NOT ATTEMPT TO PROVIDE A DIAGNOSIS OR HOME REMEDIES IF THE RULES ARE VIOLATED.
</CRITICAL_INSTRUCTIONS>

${symptomsPrompt}

${protocolPrompt}
    
CRITICAL INSTRUCTION: You MUST translate and write your ENTIRE response (whether a rejection or a diagnosis) in ${language.toUpperCase()}.`;

    if (!mediaFiles || mediaFiles.length === 0) {
      return NextResponse.json({ error: "No media file provided" }, { status: 400 });
    }

    const contentBlocks: any[] = [];

    for (const mediaFile of mediaFiles) {
      // Convert the uploaded file to a buffer, then to base64
      const buffer = await mediaFile.arrayBuffer();
      const base64Media = Buffer.from(buffer).toString("base64");
      const mimeType = mediaFile.type;

      const isVideo = mimeType.startsWith("video/");
      const isImage = mimeType.startsWith("image/");

      // Validate mime type for Amazon Nova Pro
      if (isImage && !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
        return NextResponse.json({ error: "Invalid image type. Supported types are jpeg, png, webp, and gif." }, { status: 400 });
      }

      if (isVideo && !["video/mp4", "video/webm", "video/quicktime"].includes(mimeType)) {
        return NextResponse.json({ error: "Invalid video type. Supported types are mp4, webm, and mov." }, { status: 400 });
      }

      if (!isImage && !isVideo) {
        return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
      }

      // Construct the correct media block based on whether it's an image or video
      if (isVideo) {
        contentBlocks.push({
          video: {
            format: mimeType.replace("video/", "").replace("quicktime", "mov"),
            source: {
              bytes: base64Media
            }
          }
        });
      } else {
        contentBlocks.push({
          image: {
            format: mimeType.replace("image/", ""),
            source: {
              bytes: base64Media
            }
          }
        });
      }
    }

    const payload = {
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: "user",
          content: [
            ...contentBlocks,
            {
              text: "Please analyze this media and provide your veterinary diagnosis and treatment plan."
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
    const modelUsed = "amazon.nova-pro-v1:0";
    const timestamp = new Date().toISOString();

    // 1. Calculate input media size
    let inputMediaSizeBytes = 0;
    for (const mf of mediaFiles) {
      inputMediaSizeBytes += mf.size;
    }

    // 2. Build the chained diagnosis record for history
    const finalDiagnosisText = previousDiagnosis
      ? previousDiagnosis + "\n\n*** FOLLOW UP RECORD: ***\n\n" + completionAmount
      : completionAmount;

    // 3. Save to DynamoDB
    if (completionAmount !== "No response generated." && userId) {
      const historyItem = {
        userId,
        timestamp,
        id: crypto.randomUUID(),
        diagnosis: finalDiagnosisText,
        language
      };

      const usageItem = {
        userId,
        timestamp,
        id: crypto.randomUUID(),
        modelUsed,
        inputMediaSizeBytes
      };

      await Promise.all([
        ddbDocClient.send(new PutCommand({
          TableName: "PashuKrishi_History",
          Item: historyItem
        })),
        ddbDocClient.send(new PutCommand({
          TableName: "PashuKrishi_UsageLogs",
          Item: usageItem
        }))
      ]);
    }

    return NextResponse.json({
      result: completionAmount,
      modelUsed: modelUsed
    });

  } catch (error: any) {
    console.error("Bedrock API Error:", error);
    return NextResponse.json(
      { error: "Error processing image", details: error.message },
      { status: 500 }
    );
  }
}
