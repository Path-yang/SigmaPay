import { Client } from "xrpl";
import { XRPL_TESTNET_URL } from "./constants";

let client: Client | null = null;

export async function getClient(): Promise<Client> {
    if (!client) {
        client = new Client(XRPL_TESTNET_URL);
    }
    if (!client.isConnected()) {
        // Add timeout for connection
        const connectPromise = client.connect();
        const connectTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error("Failed to connect to XRPL testnet within 15 seconds. Please check your internet connection and try again."));
            }, 15000); // 15 second timeout for connection
        });
        
        try {
            await Promise.race([connectPromise, connectTimeout]);
            console.log("✅ Connected to XRPL testnet");
        } catch (error) {
            // Reset client on connection failure
            client = null;
            console.error("❌ Failed to connect to XRPL:", error);
            throw error;
        }
    }
    return client;
}

export async function disconnectClient(): Promise<void> {
    if (client && client.isConnected()) {
        await client.disconnect();
        client = null;
    }
}

export function isClientConnected(): boolean {
    return client !== null && client.isConnected();
}
