import { NextRequest, NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
    const animalName = formData.get("animalName") as string | null;
    const thumbnailBase64 = formData.get("thumbnailBase64") as string | null;
    const caseId = formData.get("caseId") as string | null;

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
Here is the previous timeline history of this case:

<CASE_HISTORY>
${previousDiagnosis}
</CASE_HISTORY>

Your task is to compare the new media against the context of the previous diagnosis.
- Determine if the condition is IMPROVING, STABLE, or WORSENING.
- If it is improving or stable, provide updated home-care steps to continue the healing process.
- CRITICAL EXCEPTION: If the condition is clearly WORSENING, you MUST explicitly advise the farmer to seek out a physical veterinarian immediately ("recommendHumanVet": true).
</FOLLOW_UP_PROTOCOL>`
      : `
<DIAGNOSIS_PROTOCOL>
IF the media is perfectly clear and the subject's issue is visible, you must scrutinize it extremely closely. Pay special attention to:
- Eyes (infections, redness, discharge, cloudiness)
- Skin/Coat (lesions, ticks, abnormal patches)
- Hooves/Feet
- Unusual movement or posture

CRUCIAL: Our target audience is rural farmers who may not have easy access to a veterinarian. YOU MUST ACT AS THEIR PRIMARY VETERINARIAN.
- Provide immediate, actionable home treatments and cures they can administer themselves. 
- ABSOLUTELY DO NOT lightly suggest "consult a veterinarian" unless it is a severe structural trauma (broken bones, major fractures, deep muscle ruptures). 
- Your goal is to give them exactly the medicines and care steps to cure manageable infections/diseases at home.
</DIAGNOSIS_PROTOCOL>`;

    const jsonFormatPrompt = `
<JSON_SCHEMA_REQUIREMENT>
You MUST output your ENTIRE final diagnosis STRICTLY as a raw JSON object matching the exact structure below. 
Do NOT wrap the JSON in Markdown ticks (like \`\`\`json). Do NOT include any conversational preamble or postscript. ONLY output the JSON.

{
  "diseaseIdentification": "string (name of the disease, pest, or diagnosis)",
  "confidenceScore": number (0 to 100 representing your visual certainty),
  "subjectType": "cow|lamb|sheep|dog|crop|unknown",
  "diseaseDetails": {
    "description": "string (Detailed explanation of what the disease is, how it looks, and its causes)",
    "typicalSymptoms": [
      "string (Symptom 1)",
      "string (Symptom 2)"
    ]
  },
  "followUpAssessment": {
    "status": "improving|worsening|unchanged|not_applicable",
    "notes": "string (brief assessment comparing current media to previous diagnosis context, or 'not applicable' if this is a first diagnosis)"
  },
  "prescription": {
    "medicines": [
      {
        "name": "string (name of the commonly available drug or natural remedy)",
        "dosage": "string (how much to apply/feed)",
        "frequency": "string (how often)",
        "duration": "string (for how many days)",
        "unitPriceEstimate": "string (e.g., '₹50 / 10ml', provide an educated estimate STRICTLY in INR)",
        "totalCostEstimate": "string (e.g., '₹150 for full course', provide an educated estimate STRICTLY in INR)",
        "purchaseQuery": "string (Specific search query for buying this online, e.g., 'Ivermectin 1% veterinary buy online')"
      }
    ],
    "careSteps": [
      "string (actionable home-care step 1)",
      "string (actionable home-care step 2)"
    ]
  },
  "recommendHumanVet": boolean (true ONLY if confidence < 60% OR condition is critically worsening/needs surgery, otherwise false)
}
</JSON_SCHEMA_REQUIREMENT>`;

    const systemPrompt = `You are a strict, expert veterinary doctor and agricultural inspector.
    
<ABSOLUTE_PRIORITY_INSTRUCTIONS>
BEFORE attempting any diagnosis, you MUST evaluate the quality of the provided media. 

If ANY of the following rules are violated, you MUST IMMEDIATELY STOP ANALYSIS AND REJECT THE MEDIA:
1. The subject is captured from too far a distance to see medical details.
2. The media is heavily blurred, shaky, or completely unreadable.
3. The specific medical issue, anomaly, or infection is not clearly visible in high detail.
4. There are multiple animals in the media and it is not blatantly obvious which one is the patient.

If a rule is violated, DO NOT GUESS. DO NOT PROVIDE ANY PREVENTATIVE ADVICE OR HOME REMEDIES. 
Instead, you must instantly output the following JSON format to tell the user exactly what is wrong and advise them to recapture the media:

{
  "diseaseIdentification": "Media Unclear: [Explain exactly which rule was violated, e.g., 'The animals are too far away to see fine details like skin lesions', or 'There are multiple animals and it is unclear who the patient is']. Please recapture the video or image from a closer look, focusing directly on the infected or diseased area.",
  "confidenceScore": 0,
  "subjectType": "unknown",
  "diseaseDetails": {
    "description": "",
    "typicalSymptoms": []
  },
  "followUpAssessment": {
    "status": "not_applicable",
    "notes": ""
  },
  "prescription": {
    "medicines": [],
    "careSteps": []
  },
  "recommendHumanVet": true
}
</ABSOLUTE_PRIORITY_INSTRUCTIONS>

If all rules are followed and the media is clear enough for a highly confident visual diagnosis, proceed with the following context and protocols:

    ${symptomsPrompt}

    ${protocolPrompt}
    
    ${jsonFormatPrompt}
        
    CRITICAL INSTRUCTION: You MUST translate and write ALL string values inside the JSON object into ${language.toUpperCase()}. The JSON keys must remain exact English matches.`;

    if (!mediaFiles || mediaFiles.length === 0) {
      return NextResponse.json({ error: "No media file provided" }, { status: 400 });
    }

    const contentBlocks: Record<string, unknown>[] = [];

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

    // Clean up potential markdown JSON wrapping from Bedrock output before saving
    let cleanedOutput = completionAmount;
    if (cleanedOutput.startsWith("\`\`\`json")) {
      cleanedOutput = cleanedOutput.replace(/^\`\`\`json\s*/, "").replace(/\s*\`\`\`$/, "");
    }

    // 2. Build the chained diagnosis record for history
    // Since we expect JSON now, if there is a previous diagnosis, we should inject a "PREVIOUS_HISTORY_NOTE" into the new JSON
    // Or simpler: just let the LLM generate the new JSON. The previous context is just strings of previous JSON outputs.
    // For local display purposes, we just return the latest JSON.
    const finalDiagnosisText = cleanedOutput;

    // 3. Save to DynamoDB
    const finalCaseId = caseId || generateUUID();
    if (completionAmount !== "No response generated." && userId) {
      const historyItem = {
        userId,
        timestamp,
        id: generateUUID(),
        caseId: finalCaseId,
        diagnosis: finalDiagnosisText,
        language,
        animalName: animalName || undefined,
        thumbnailBase64: thumbnailBase64 || undefined
      };

      const usageItem = {
        userId,
        timestamp,
        id: generateUUID(),
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
      modelUsed: modelUsed,
      caseId: finalCaseId
    });

  } catch (error: unknown) {
    console.error("Bedrock API Error:", error);
    return NextResponse.json(
      { error: "Error processing image", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
