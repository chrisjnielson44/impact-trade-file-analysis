import { getF22FxPFE } from "@/app/lib/data";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const counterpartyId = searchParams.get('counterpartyId');
    const transactionId = searchParams.get('transactionId');

    if (!counterpartyId) {
        return NextResponse.json({ error: 'CounterpartyId is required' }, { status: 400 });
    }

    try {
        const data = await getF22FxPFE(counterpartyId, transactionId || undefined);

        // Convert BigInt to string
        const serializedData = JSON.parse(JSON.stringify(data, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));

        return NextResponse.json(serializedData);
    } catch (error) {
        console.error('Error fetching F22 PFE data:', error);
        return NextResponse.json({ error: 'Error fetching F22 PFE data' }, { status: 500 });
    }
}