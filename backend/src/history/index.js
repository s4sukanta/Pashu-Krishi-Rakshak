const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const ddbDocClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    try {
        const method = event.httpMethod || event.requestContext?.http?.method || "GET";

        if (method === "GET") {
            // Cognito user from authorizer, fallback to query string
            const userId = event.requestContext?.authorizer?.claims?.sub || event.queryStringParameters?.userId;

            if (!userId) {
                return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing userId" }) };
            }

            const historyCommand = new QueryCommand({
                TableName: process.env.TABLE_HISTORY || "PashuKrishi_History",
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: { ":userId": userId }
            });

            const usageLogsCommand = new QueryCommand({
                TableName: process.env.TABLE_USAGE || "PashuKrishi_UsageLogs",
                KeyConditionExpression: "userId = :userId",
                ExpressionAttributeValues: { ":userId": userId }
            });

            const [historyResponse, usageResponse] = await Promise.all([
                ddbDocClient.send(historyCommand),
                ddbDocClient.send(usageLogsCommand)
            ]);

            const history = (historyResponse.Items || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const usageLogs = (usageResponse.Items || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ history, usageLogs }) };
        }

        else if (method === "DELETE") {
            const body = JSON.parse(event.body || "{}");
            // Always prefer Cognito principal as truth to prevent arbitrary deletes
            const authenticatedUserId = event.requestContext?.authorizer?.claims?.sub;
            const userId = authenticatedUserId || body.userId;
            const { caseId, timestamp } = body;

            if (!userId) {
                return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Missing userId" }) };
            }

            if (!caseId && !timestamp) {
                return { statusCode: 400, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ error: "Must provide caseId or timestamp" }) };
            }

            let itemsToDelete = [];

            if (timestamp && !caseId) {
                itemsToDelete.push({ userId, timestamp });
            } else if (caseId) {
                const queryCommand = new QueryCommand({
                    TableName: process.env.TABLE_HISTORY || "PashuKrishi_History",
                    KeyConditionExpression: "userId = :userId",
                    ExpressionAttributeValues: { ":userId": userId }
                });
                const response = await ddbDocClient.send(queryCommand);
                const items = response.Items || [];

                itemsToDelete = items
                    .filter(item => item.caseId === caseId || item.id === caseId)
                    .map(item => ({ userId: item.userId, timestamp: item.timestamp }));
            }

            if (itemsToDelete.length === 0) {
                return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "No matching records found to delete." }) };
            }

            const deletePromises = itemsToDelete.map(key =>
                ddbDocClient.send(new DeleteCommand({
                    TableName: process.env.TABLE_HISTORY || "PashuKrishi_History",
                    Key: { userId: key.userId, timestamp: key.timestamp }
                }))
            );

            await Promise.all(deletePromises);

            return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify({ message: "Successfully deleted records", deletedCount: itemsToDelete.length }) };
        }

        return { statusCode: 405, body: "Method Not Allowed" };

    } catch (error) {
        console.error("DynamoDB Handler Error:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ error: "Failed to process history", details: error.message })
        };
    }
};
