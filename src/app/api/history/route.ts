import { NextRequest, NextResponse } from "next/server";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

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

    } catch (error: unknown) {
        console.error("DynamoDB GET Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch remote data", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}

// Delete a Case or a Specific Record
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, caseId, timestamp } = body;

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }
        if (!caseId && !timestamp) {
            return NextResponse.json({ error: "Must provide either caseId (to delete full case) or timestamp (to delete specific visit)" }, { status: 400 });
        }

        let itemsToDelete: { userId: string, timestamp: string }[] = [];

        // If they want to delete a single record, it's easy
        if (timestamp && !caseId) {
            itemsToDelete.push({ userId, timestamp });
        }
        // If they want to delete a full case, query all items first
        else if (caseId) {
            const queryCommand = new QueryCommand({
                TableName: "PashuKrishi_History",
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: {
                    ":userId": userId
                }
            });
            const response = await ddbDocClient.send(queryCommand);
            const items = response.Items || [];

            // Filter only items that match the caseId
            itemsToDelete = items
                .filter(item => item.caseId === caseId || item.id === caseId) // fallbacks for old records
                .map(item => ({ userId: item.userId, timestamp: item.timestamp }));
        }
        else if (caseId && timestamp) {
            // Safe fallback if they somehow provided both, but prioritize just one
            itemsToDelete.push({ userId, timestamp });
        }

        if (itemsToDelete.length === 0) {
            return NextResponse.json({ message: "No matching records found to delete." });
        }

        // Execute deletions
        const deletePromises = itemsToDelete.map(key =>
            ddbDocClient.send(new DeleteCommand({
                TableName: "PashuKrishi_History",
                Key: {
                    userId: key.userId,
                    timestamp: key.timestamp
                }
            }))
        );

        await Promise.all(deletePromises);

        return NextResponse.json({ message: "Successfully deleted records", deletedCount: itemsToDelete.length });

    } catch (error: unknown) {
        console.error("DynamoDB DELETE Error:", error);
        return NextResponse.json(
            { error: "Failed to delete record(s)", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
