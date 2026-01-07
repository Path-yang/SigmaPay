import { getClient } from "./client";
import { RLUSD_ISSUER, RLUSD_CURRENCY } from "./constants";
import { dropsToXrp } from "xrpl";

export interface Balances {
    xrp: string;
    rlusd: string;
}

export async function getBalances(address: string): Promise<Balances> {
    const client = await getClient();

    let xrpBalance = "0";
    let rlusdBalance = "0";

    try {
        // Get XRP balance
        const accountInfo = await client.request({
            command: "account_info",
            account: address,
        });
        xrpBalance = dropsToXrp(accountInfo.result.account_data.Balance).toString();
    } catch {
        // Account not found/funded
        xrpBalance = "0";
    }

    try {
        // Get RLUSD balance
        const accountLines = await client.request({
            command: "account_lines",
            account: address,
            peer: RLUSD_ISSUER,
        });

        const rlusdLine = accountLines.result.lines.find(
            (line) => line.currency === RLUSD_CURRENCY
        );

        if (rlusdLine) {
            rlusdBalance = rlusdLine.balance;
        }
    } catch {
        rlusdBalance = "0";
    }

    return { xrp: xrpBalance, rlusd: rlusdBalance };
}

export async function isAccountFunded(address: string): Promise<boolean> {
    try {
        const client = await getClient();
        await client.request({
            command: "account_info",
            account: address,
        });
        return true;
    } catch {
        return false;
    }
}
