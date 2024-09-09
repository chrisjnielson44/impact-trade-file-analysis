import { getF22FxTrades} from "@/app/lib/data";
import {NextResponse} from "next/server";

export async function GET() {
    const data = await getF22FxTrades();
    return NextResponse.json(data);

}

