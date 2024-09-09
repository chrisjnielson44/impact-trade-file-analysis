import {getQUICFxTrades} from "@/app/lib/data";

export async function GET() {
    const data = await getQUICFxTrades();
    return data;
}