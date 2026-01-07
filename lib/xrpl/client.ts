import { Client } from "xrpl";
import { XRPL_TESTNET_URL } from "./constants";

let client: Client | null = null;

export async function getClient(): Promise<Client> {
    if (!client) {
        client = new Client(XRPL_TESTNET_URL);
    }
    if (!client.isConnected()) {
        await client.connect();
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
