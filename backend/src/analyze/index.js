const { BedrockRuntimeClient, InvokeModelCommand } = require("@aws-sdk/client-bedrock-runtime");
const { BedrockAgentRuntimeClient, RetrieveCommand } = require("@aws-sdk/client-bedrock-agent-runtime");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const Busboy = require("busboy");

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

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
const bedrockAgentClient = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

exports.handler = async (event) => {
    try {
        // Determine the boundary from the content-type header
        const contentType = event.headers["content-type"] || event.headers["Content-Type"];
        if (!contentType || !contentType.includes("multipart/form-data")) {
            return { statusCode: 400, body: JSON.stringify({ error: "Request must be multipart/form-data" }) };
        }

        // API Gateway sets isBase64Encoded if it's binary data
        const bodyBuffer = event.isBase64Encoded ? Buffer.from(event.body, "base64") : Buffer.from(event.body);

        const formData = await parseMultipartFormData(bodyBuffer, contentType);

        const mediaFiles = formData.media || [];
        const language = formData.language || "english";
        const previousDiagnosis = formData.previousDiagnosis || null;
        const symptoms = formData.symptoms || null;

        // In Cognito, the user ID (sub) is available in the request context after authorization
        // We will extract it from the authorizer if present, otherwise fallback to form data
        const userId = event.requestContext?.authorizer?.claims?.sub || formData.userId;

        const animalName = formData.animalName || null;
        const thumbnailBase64 = formData.thumbnailBase64 || null;
        const caseId = formData.caseId || null;

        if (!userId) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing userId" }) };
        }

        const symptomsPrompt = symptoms
            ? `\n<ADDITIONAL_CONTEXT>\nThe farmer has also provided the following additional observational context and symptoms regarding the animal:\n"${symptoms}"\n\nYou MUST take this written context into heavy consideration alongside your visual analysis to form a complete diagnosis.\n</ADDITIONAL_CONTEXT>\n`
            : "";

        const protocolPrompt = previousDiagnosis
            ? `\n<FOLLOW_UP_PROTOCOL>\nThe farmer has provided FOLLOW-UP media for an animal with a previously diagnosed condition.\nHere is the previous timeline history of this case:\n\n<CASE_HISTORY>\n${previousDiagnosis}\n</CASE_HISTORY>\n\nYour task is to compare the new media against the context of the previous diagnosis.\n- Determine if the condition is IMPROVING, STABLE, or WORSENING.\n- If it is improving or stable, provide updated home-care steps to continue the healing process.\n- CRITICAL EXCEPTION: If the condition is clearly WORSENING, you MUST explicitly advise the farmer to seek out a physical veterinarian immediately ("recommendHumanVet": true).\n</FOLLOW_UP_PROTOCOL>`
            : `\n<DIAGNOSIS_PROTOCOL>\nIF the media is perfectly clear and the subject's issue is visible, you must scrutinize it extremely closely. Pay special attention to:\n- Eyes (infections, redness, discharge, cloudiness)\n- Skin/Coat (lesions, ticks, abnormal patches)\n- Hooves/Feet\n- Unusual movement or posture\n\nCRUCIAL: Our target audience is rural farmers who may not have easy access to a veterinarian. YOU MUST ACT AS THEIR PRIMARY VETERINARIAN.\n- Provide immediate, actionable home treatments and cures they can administer themselves. \n- ABSOLUTELY DO NOT lightly suggest "consult a veterinarian" unless it is a severe structural trauma (broken bones, major fractures, deep muscle ruptures). \n- Your goal is to give them exactly the medicines and care steps to cure manageable infections/diseases at home.\n</DIAGNOSIS_PROTOCOL>`;

        const jsonFormatPrompt = `\n<JSON_SCHEMA_REQUIREMENT>\nYou MUST output your ENTIRE final diagnosis STRICTLY as a raw JSON object matching the exact structure below. \nDo NOT wrap the JSON in Markdown ticks (like \`\`\`json). Do NOT include any conversational preamble or postscript. ONLY output the JSON.\n\n{\n  "diseaseIdentification": "string (name of the disease, pest, or diagnosis)",\n  "confidenceScore": number (0 to 100 representing your visual certainty),\n  "subjectType": "cow|lamb|sheep|dog|crop|unknown",\n  "diseaseDetails": {\n    "description": "string (Detailed explanation of what the disease is, how it looks, and its causes)",\n    "typicalSymptoms": [\n      "string (Symptom 1)",\n      "string (Symptom 2)"\n    ]\n  },\n  "followUpAssessment": {\n    "status": "improving|worsening|unchanged|not_applicable",\n    "notes": "string (brief assessment comparing current media to previous diagnosis context, or 'not applicable' if this is a first diagnosis)"\n  },\n  "prescription": {\n    "medicines": [\n      {\n        "name": "string (name of the commonly available drug or natural remedy)",\n        "dosage": "string (how much to apply/feed)",\n        "frequency": "string (how often)",\n        "duration": "string (for how many days)",\n        "unitPriceEstimate": "string (e.g., '₹50 / 10ml', provide an educated estimate STRICTLY in INR)",\n        "totalCostEstimate": "string (e.g., '₹150 for full course', provide an educated estimate STRICTLY in INR)",\n        "purchaseQuery": "string (Specific search query for buying this online, e.g., 'Ivermectin 1% veterinary buy online')"\n      }\n    ],\n    "careSteps": [\n      "string (actionable home-care step 1)",\n      "string (actionable home-care step 2)"\n    ]\n  },\n  "recommendHumanVet": boolean (true ONLY if confidence < 60% OR condition is critically worsening/needs surgery, otherwise false)\n}\n</JSON_SCHEMA_REQUIREMENT>`;

        const systemPrompt = `You are a strict, expert veterinary doctor and agricultural inspector.\n    \n<ABSOLUTE_PRIORITY_INSTRUCTIONS>\nBEFORE attempting any diagnosis, you MUST evaluate the quality of the provided media. \n\nIf ANY of the following rules are violated, you MUST IMMEDIATELY STOP ANALYSIS AND REJECT THE MEDIA:\n1. The subject is captured from too far a distance to see medical details.\n2. The media is heavily blurred, shaky, or completely unreadable.\n3. The specific medical issue, anomaly, or infection is not clearly visible in high detail.\n4. There are multiple animals in the media and it is not blatantly obvious which one is the patient.\n\nIf a rule is violated, DO NOT GUESS. DO NOT PROVIDE ANY PREVENTATIVE ADVICE OR HOME REMEDIES. \nInstead, you must instantly output the following JSON format to tell the user exactly what is wrong and advise them to recapture the media:\n\n{\n  "diseaseIdentification": "Media Unclear: [Explain exactly which rule was violated, e.g., 'The animals are too far away to see fine details like skin lesions', or 'There are multiple animals and it is unclear who the patient is']. Please recapture the video or image from a closer look, focusing directly on the infected or diseased area.",\n  "confidenceScore": 0,\n  "subjectType": "unknown",\n  "diseaseDetails": {\n    "description": "",\n    "typicalSymptoms": []\n  },\n  "followUpAssessment": {\n    "status": "not_applicable",\n    "notes": ""\n  },\n  "prescription": {\n    "medicines": [],\n    "careSteps": []\n  },\n  "recommendHumanVet": true\n}\n</ABSOLUTE_PRIORITY_INSTRUCTIONS>\n\nIf all rules are followed and the media is clear enough for a highly confident visual diagnosis, proceed with the following context and protocols:\n\n    ${symptomsPrompt}\n\n    ${protocolPrompt}\n    \n    ${jsonFormatPrompt}\n        \n    CRITICAL INSTRUCTION: You MUST translate and write ALL string values inside the JSON object into ${language.toUpperCase()}. The JSON keys must remain exact English matches.`;

        if (!mediaFiles || mediaFiles.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "No media file provided" }) };
        }

        const contentBlocks = [];

        for (const mediaFile of mediaFiles) {
            const base64Media = mediaFile.content.toString("base64");
            const mimeType = mediaFile.mimeType;

            const isVideo = mimeType.startsWith("video/");
            const isImage = mimeType.startsWith("image/");

            if (isImage && !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mimeType)) {
                return { statusCode: 400, body: JSON.stringify({ error: "Invalid image type. Supported types are jpeg, png, webp, and gif." }) };
            }

            if (isVideo && !["video/mp4", "video/webm", "video/quicktime"].includes(mimeType)) {
                return { statusCode: 400, body: JSON.stringify({ error: "Invalid video type. Supported types are mp4, webm, and mov." }) };
            }

            if (!isImage && !isVideo) {
                return { statusCode: 400, body: JSON.stringify({ error: "Unsupported file type." }) };
            }

            if (isVideo) {
                contentBlocks.push({
                    video: {
                        format: mimeType.replace("video/", "").replace("quicktime", "mov"),
                        source: { bytes: base64Media }
                    }
                });
            } else {
                contentBlocks.push({
                    image: {
                        format: mimeType.replace("image/", ""),
                        source: { bytes: base64Media }
                    }
                });
            }
        }

        // --- STEP 1: VISUAL TRIAGE ---
        const triagePayload = {
            system: [{ text: "You are a veterinary triage AI. Analyze this image/video and identify the top 3 most likely diseases or visible symptoms. Return EXACTLY 3 text-based search queries optimized for a veterinary database. Output ONLY a raw JSON array of 3 strings. Example: [\"symptom 1\", \"disease 2\", \"treatment 3\"]" }],
            messages: [{ role: "user", content: [...contentBlocks, { text: "Analyze this media and provide the 3 search queries." }] }]
        };

        const triageCommand = new InvokeModelCommand({
            modelId: "us.amazon.nova-lite-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(triagePayload),
        });

        const triageResponse = await bedrockClient.send(triageCommand);
        const triageResponseBody = JSON.parse(new TextDecoder().decode(triageResponse.body));
        let triageOutput = triageResponseBody.output?.message?.content?.[0]?.text || "[]";

        if (triageOutput.startsWith("\`\`\`json")) {
            triageOutput = triageOutput.replace(/^\`\`\`json\s*/, "").replace(/\s*\`\`\`$/, "");
        }

        let searchQueries = [];
        try {
            searchQueries = JSON.parse(triageOutput);
            if (!Array.isArray(searchQueries)) searchQueries = [symptoms || "veterinary diagnosis"];
        } catch (e) {
            searchQueries = [symptoms || "veterinary disease symptoms", "veterinary treatment protocols", "animal disease reporting guidelines"];
        }
        if (searchQueries.length === 0) searchQueries = ["veterinary disease diagnosis", "animal health guidelines", "livestock treatment protocols"];

        // --- STEP 2: PARALLEL RETRIEVAL ---
        const kbId = "P3YY6FFDJY";
        const retrievalPromises = searchQueries.map(query => {
            const retrieveCmd = new RetrieveCommand({
                knowledgeBaseId: kbId,
                retrievalQuery: { text: query },
                retrievalConfiguration: { vectorSearchConfiguration: { numberOfResults: 4 } }
            });
            return bedrockAgentClient.send(retrieveCmd).catch(err => {
                console.error("Retrieval error for query:", query, err);
                return { retrievalResults: [] };
            });
        });

        const retrievalResultsArray = await Promise.all(retrievalPromises);
        let rawRetrievedText = "";
        retrievalResultsArray.forEach(res => {
            if (res.retrievalResults) {
                res.retrievalResults.forEach(result => {
                    rawRetrievedText += `\n- ${result.content?.text || ""}`;
                });
            }
        });

        let groundedContext = "No specific database knowledge retrieved.";
        if (rawRetrievedText.trim().length > 10) {
            // --- STEP 3: INFORMATION GROUNDING ---
            const groundingPrompt = `You are the Grounding Engine. Review the following retrieved veterinary database chunks.\nExtract and strictly categorize the facts into:\n1. Clinical (Dosages, treatments, ethno-veterinary remedies)\n2. Epidemiological (Outbreak risks, region data)\n3. Regulatory (Mandatory reporting, culling, movement restrictions)\n\nIf a fact is not in the text, DO NOT hallucinate. Just leave it empty.\nFilter out noise and keep only the critical facts.\n\n<AVAILABLE_FACTS>\n${rawRetrievedText}\n</AVAILABLE_FACTS>`;

            const groundingPayload = {
                system: [{ text: "You are the Grounding Engine for a Veterinary AI. Accurately organize and summarize facts strictly from the provided text." }],
                messages: [{ role: "user", content: [{ text: groundingPrompt }] }]
            };

            const groundingCommand = new InvokeModelCommand({
                modelId: "us.amazon.nova-pro-v1:0",
                contentType: "application/json",
                accept: "application/json",
                body: JSON.stringify(groundingPayload),
            });

            try {
                const groundingResponse = await bedrockClient.send(groundingCommand);
                const groundingResponseBody = JSON.parse(new TextDecoder().decode(groundingResponse.body));
                groundedContext = groundingResponseBody.output?.message?.content?.[0]?.text || groundedContext;
            } catch (err) {
                groundedContext = rawRetrievedText;
            }
        }

        // --- STEP 4: FINAL JSON SYNTHESIS ---
        const finalSynthesisPrompt = `Please analyze this media and provide your veterinary diagnosis and treatment plan.\n      \nCRITICAL: You MUST base your analysis on the following Grounded Knowledge retrieved from our database:\n\n<GROUNDED_KNOWLEDGE>\n${groundedContext}\n</GROUNDED_KNOWLEDGE>\n\nApply the Grounded Knowledge as follows:\n- "medicationPlan" & "careSteps": Use ONLY the treatments or ethno-veterinary remedies listed in the Clinical section of the Grounded Knowledge (if applicable to your visual diagnosis).\n- "confidenceScore": Analyze the visual evidence, but adjust the score based on the Epidemiological risks provided.\n- "recommendHumanVet": Set to 'true' if the condition matches a Notifiable Disease in the Regulatory section or if there are legal mandates to report it.`;

        const payload = {
            system: [{ text: systemPrompt }],
            messages: [{ role: "user", content: [...contentBlocks, { text: finalSynthesisPrompt }] }]
        };

        const command = new InvokeModelCommand({
            modelId: "us.amazon.nova-pro-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(payload),
        });

        const response = await bedrockClient.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const completionAmount = responseBody.output?.message?.content?.[0]?.text || "No response generated.";
        const modelUsed = "us.amazon.nova-pro-v1:0";
        const timestamp = new Date().toISOString();

        let inputMediaSizeBytes = 0;
        for (const mf of mediaFiles) {
            inputMediaSizeBytes += mf.content.length;
        }

        let cleanedOutput = completionAmount;
        if (cleanedOutput.startsWith("\`\`\`json")) {
            cleanedOutput = cleanedOutput.replace(/^\`\`\`json\s*/, "").replace(/\s*\`\`\`$/, "");
        }

        const finalCaseId = caseId || generateUUID();
        if (completionAmount !== "No response generated." && userId) {
            const historyItem = {
                userId,
                timestamp,
                id: generateUUID(),
                caseId: finalCaseId,
                diagnosis: cleanedOutput,
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
                ddbDocClient.send(new PutCommand({ TableName: process.env.TABLE_HISTORY || "PashuKrishi_History", Item: historyItem })),
                ddbDocClient.send(new PutCommand({ TableName: process.env.TABLE_USAGE || "PashuKrishi_UsageLogs", Item: usageItem }))
            ]);
        }

        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*" },
            body: JSON.stringify({ result: cleanedOutput, modelUsed, caseId: finalCaseId })
        };

    } catch (error) {
        console.error("Bedrock API Error:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*" },
            body: JSON.stringify({ error: "Error processing image", details: error.message })
        };
    }
};

// Helper to parse multipart/form-data using busboy
function parseMultipartFormData(buffer, contentType) {
    return new Promise((resolve, reject) => {
        const bb = busboy({ headers: { 'content-type': contentType } });
        const result = { media: [] };

        bb.on('file', (name, file, info) => {
            const { filename, encoding, mimeType } = info;
            const chunks = [];
            file.on('data', (data) => chunks.push(data));
            file.on('end', () => {
                result.media.push({
                    filename,
                    mimeType,
                    content: Buffer.concat(chunks)
                });
            });
        });

        bb.on('field', (name, val) => {
            result[name] = val;
        });

        bb.on('finish', () => resolve(result));
        bb.on('error', reject);

        bb.end(buffer);
    });
}
