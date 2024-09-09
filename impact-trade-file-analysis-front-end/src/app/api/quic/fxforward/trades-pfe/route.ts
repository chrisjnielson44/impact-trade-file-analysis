import {getQuicFxTradesWithPFE} from "@/app/lib/data";
import {NextRequest, NextResponse} from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '1000');
    const offset = parseInt(searchParams.get('offset') || '0');

    try {
        const data = await getQuicFxTradesWithPFE(limit, offset);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching Quic FX trades with PFE data:', error);
        return NextResponse.json({ error: 'Error fetching Quic FX trades with PFE data' }, { status: 500 });
    }
}