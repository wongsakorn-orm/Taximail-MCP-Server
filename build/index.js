import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
const TAXIMAIL_API_BASE = "https://api.taximail.com/";
const USER_AGENT = "taximail-mcp/1.0";
const TAXIMAIL_API_KEY = process.env.TAXIMAIL_API_KEY;
const TAXIMAIL_SECRET_KEY = process.env.TAXIMAIL_SECRET_KEY;
if (!TAXIMAIL_API_KEY || !TAXIMAIL_SECRET_KEY) {
    console.error("The TAXIMAIL_API_KEY or TAXIMAIL_SECRET_KEY environment variable is not set.");
    process.exit(1);
}
const server = new McpServer({
    name: "Taximail",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});
server.tool("send-sms-transactional", "A transactional email is a kind of email that is triggered by a user action on an app. It is sent to facilitate an agreed-upon transaction between the sender and the recipient.", {
    from: z
        .string()
        .describe("From specifies the sender name for your message."),
    to: z
        .string()
        .describe("This parameter determines the destination phone number for your SMS message. It is MSIDSN of the recipient that the message will be sent to. Format this number with a country code, e.g. 66175551212 (66 is TH code)."),
    text: z
        .string()
        .describe("The text parameter includes the full text of the message you want to send. It is the message content in which you can include any URL."),
}, async ({ from, to, text }) => {
    const pointsUrl = `${TAXIMAIL_API_BASE}v2/sms/`;
    let credentials = Buffer.from(`${TAXIMAIL_API_KEY}:${TAXIMAIL_SECRET_KEY}`).toString("base64");
    const headers = {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Basic ${credentials}`,
    };
    try {
        const response = await fetch(pointsUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({ from, to, text }),
        });
        if (!response.ok) {
            return {
                content: [
                    {
                        type: "text",
                        text: `HTTP error! status: ${response.status}`,
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: await response.json(),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: "Error making Taximail POST request: " + error,
                },
            ],
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Taximail MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
