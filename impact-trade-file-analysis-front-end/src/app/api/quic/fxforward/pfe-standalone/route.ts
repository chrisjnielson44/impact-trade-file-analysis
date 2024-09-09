// app/api/quic-pfe-standalone/route.ts
import { getQUICFxPFE } from "@/app/lib/data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const counterpartyId = searchParams.get('counterpartyId');
    const transactionId = searchParams.get('transactionId');

    if (!counterpartyId) {
        return NextResponse.json({ error: 'CounterpartyId is required' }, { status: 400 });
    }

    try {
        const data = await getQUICFxPFE(counterpartyId, transactionId || undefined);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching QUIC PFE data:', error);
        return NextResponse.json({ error: 'Error fetching QUIC PFE data' }, { status: 500 });
    }
}