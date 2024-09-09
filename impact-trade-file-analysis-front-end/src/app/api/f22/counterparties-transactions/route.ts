// app/api/counterparties-transactions/route.ts
import { getF22CounterpartiesAndTransactions } from "@/app/lib/data";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const data = await getF22CounterpartiesAndTransactions();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching counterparties and transactions:', error);
        return NextResponse.json({ error: 'Error fetching counterparties and transactions' }, { status: 500 });
    }
}