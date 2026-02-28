import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
        ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
    }
});
const ddbDocClient = DynamoDBDocumentClient.from(client);

// Fetch History and Usage Logs for a given userId
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        // Fetch History
        const historyCommand = new QueryCommand({
            TableName: "PashuKrishi_History",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            }
        });

        // Fetch Usage Logs
        const usageLogsCommand = new QueryCommand({
            TableName: "PashuKrishi_UsageLogs",
            KeyConditionExpression: "userId = :userId",
            ExpressionAttributeValues: {
                ":userId": userId
            }
        });

        const [historyResponse, usageResponse] = await Promise.all([
            ddbDocClient.send(historyCommand),
            ddbDocClient.send(usageLogsCommand)
        ]);

        // Fallback: manually sort them descending by timestamp just in case the tables lack a formal Sort Key
        const history = (historyResponse.Items || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const usageLogs = (usageResponse.Items || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({
            history,
            usageLogs
        });

    } catch (error: any) {
        console.error("DynamoDB GET Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch remote data", details: error.message },
            { status: 500 }
        );
    }
}
