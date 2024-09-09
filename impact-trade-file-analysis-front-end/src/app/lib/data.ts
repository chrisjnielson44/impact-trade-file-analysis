import prisma from './prisma';
import { authOptions } from './authOptions';
import { getServerSession } from 'next-auth';
import bcrypt, { compare } from 'bcrypt';

export async function getUserData() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            throw new Error('User session not found');
        }

        const userid = parseInt(session.user.id);
        if (isNaN(userid)) {
            throw new Error('Invalid user ID');
        }

        const data = await prisma.user.findUnique({
            where: { id: userid },
        });

        return data;
    } catch (error) {
        console.error('Error in getUserData:', error);
        throw error;
    }
}


export async function deleteUserData() {
    const session = await getServerSession(authOptions);
    const userid = parseInt(session?.user.id);

    await prisma.user.delete({
        where: { id: userid },
    });

}

export async function CheckUserPassword(password: string) {
    const session = await getServerSession(authOptions)
    const userid = parseInt(session?.user.id)
    const data = await prisma.user.findUnique(
        {
            where: { id: userid },
        }
    );
    if (!data) {
        throw new Error('User not found');
    }
    const passwordCorrect = await compare(password, data.password);
    if (!passwordCorrect) {
        throw new Error('Password is incorrect');
    }
    return passwordCorrect;
}


export async function getF22FxTrades(limit: number = 1000, offset: number = 0) {
    const session = await getServerSession(authOptions)
    if (!session) {
        throw new Error('Unauthorized')
    }

    const trades = await prisma.f22_fx_trades.findMany({
        take: limit,
        skip: offset,
    })

    const serializedTrades = trades.map(trade => ({
        ...trade,
        TransactionID: trade.TransactionID.toString(),
        ACADIAID: trade.ACADIAID?.toString(),
        BuyNotional: trade.BuyNotional?.toString(),
        CounterpartyID: trade.CounterpartyID?.toString(),
    }));

    if (!trades) {
        throw new Error('No trades found')
    }

    return serializedTrades
}

export async function getQUICFxTrades(limit: number = 1000, offset: number = 0) {
    const session = await getServerSession(authOptions)
    if (!session) {
        throw new Error('Unauthorized')
    }

    const trades = await prisma.quic_fx_trades.findMany({
        take: limit,
        skip: offset,
    })

    if (!trades) {
        throw new Error('No trades found')
    }

    return trades
}

export async function getF22FxPFE(counterpartyId: string, transactionId?: string) {
    const session = await getServerSession(authOptions);
    if (!session) {
        throw new Error('Unauthorized');
    }

    let whereClause: any = { CounterpartyID: BigInt(counterpartyId) };
    if (transactionId) {
        whereClause.TransactionID = BigInt(transactionId);
    }

    const pfeData = await prisma.f22_pfe_results.groupBy({
        by: ['Days'],
        where: whereClause,
        _avg: {
            Uncollateralized_PFE: true,
            Collateralized_PFE: true,
        },
    });

    return pfeData.map((item) => ({
        day: Number(item.Days), // Convert BigInt to Number if necessary
        Uncollateralized_PFE: item._avg.Uncollateralized_PFE || 0,
        Collateralized_PFE: item._avg.Collateralized_PFE || 0,
    }));
}

export async function getQUICFxPFE(counterpartyId: string, transactionId?: string) {
    const session = await getServerSession(authOptions);
    if (!session) {
        throw new Error('Unauthorized');
    }

    let whereClause: any = { CounterpartyID: BigInt(counterpartyId) };
    if (transactionId) {
        whereClause.TransactionID = BigInt(transactionId);
    }

    const pfeData = await prisma.quic_pfe_results.groupBy({
        by: ['Days'],
        where: whereClause,
        _avg: {
            Uncollateralized_PFE: true,
            Collateralized_PFE: true,
        },
    });

    return pfeData.map((item) => ({
        day: Number(item.Days), // Convert BigInt to Number if necessary
        Uncollateralized_PFE: item._avg.Uncollateralized_PFE || 0,
        Collateralized_PFE: item._avg.Collateralized_PFE || 0,
    }));
}

export async function getF22CounterpartiesAndTransactions() {
    const session = await getServerSession(authOptions);
    if (!session) {
        throw new Error('Unauthorized');
    }

    const counterparties = await prisma.f22_fx_trades.groupBy({
        by: ['CounterpartyID'],
        _count: {
            CounterpartyID: true,
        },
    });

    const formattedCounterparties = await Promise.all(counterparties.map(async cp => {
        if (cp.CounterpartyID === null) {
            return null; // or handle the null case appropriately
        }

        const transactions = await prisma.f22_fx_trades.findMany({
            where: { CounterpartyID: cp.CounterpartyID },
            select: { TransactionID: true },
        });

        return {
            id: cp.CounterpartyID.toString(),
            name: `Counterparty ${cp.CounterpartyID}`,
            transactions: transactions.map(t => ({
                id: t.TransactionID.toString(),
                name: `Transaction ${t.TransactionID}`,
            })),
        };
    }));

    return formattedCounterparties.filter(cp => cp !== null);
}

export async function getQuicCounterpartiesAndTransactions() {
    const session = await getServerSession(authOptions);
    if (!session) {
        throw new Error('Unauthorized');
    }

    const counterparties = await prisma.quic_fx_trades.groupBy({
        by: ['CounterpartyID'],
        _count: {
            CounterpartyID: true,
        },
    });

    const formattedCounterparties = await Promise.all(counterparties.map(async cp => {
        if (cp.CounterpartyID === null) {
            return null; // or handle the null case appropriately
        }

        const transactions = await prisma.quic_fx_trades.findMany({
            where: { CounterpartyID: cp.CounterpartyID },
            select: { TransactionID: true },
        });

        return {
            id: cp.CounterpartyID.toString(), // Convert BigInt to string
            name: `Counterparty ${cp.CounterpartyID.toString()}`, // Convert BigInt to string
            transactions: transactions.map(t => ({
                id: t.TransactionID.toString(), // Convert BigInt to string
                name: `Transaction ${t.TransactionID.toString()}`, // Convert BigInt to string
            })),
        };
    }));

    return formattedCounterparties.filter(cp => cp !== null);
}

export async function getF22FxTradesWithPFE(limit: number = 1000, offset: number = 0) {
    const session = await getServerSession(authOptions);
    if (!session) {
        throw new Error('Unauthorized');
    }

    // Fetch FX trades
    const trades = await prisma.f22_fx_trades.findMany({
        take: limit,
        skip: offset,
    });

    // Fetch PFE results for all trades
    const pfeResults = await prisma.f22_pfe_results.findMany({
        where: {
            TransactionID: { in: trades.map(trade => trade.TransactionID) },
            Days: { in: [5, 15, 30] }
        },
    });

    // Create a map for quick PFE lookup
    const pfeMap = new Map();
    pfeResults.forEach(pfe => {
        if (!pfeMap.has(pfe.TransactionID)) {
            pfeMap.set(pfe.TransactionID, {});
        }
        pfeMap.get(pfe.TransactionID)[`UncollatPFE_${pfe.Days}D`] = pfe.Uncollateralized_PFE;
        pfeMap.get(pfe.TransactionID)[`CollatPFE_${pfe.Days}D`] = pfe.Collateralized_PFE;
    });

    // Combine FX trades with PFE results
    const serializedTrades = trades.map(trade => {
        const pfeData = pfeMap.get(trade.TransactionID) || {};

        return {
            ...trade,
            TransactionID: trade.TransactionID.toString(),
            ACADIAID: trade.ACADIAID?.toString(),
            BuyNotional: trade.BuyNotional?.toString(),
            CounterpartyID: trade.CounterpartyID?.toString(),
            TradingDate: trade.TradingDate?.toISOString(),
            MaturityDate: trade.MaturityDate?.toISOString(),
            ...pfeData,
            UncollatPFE_5D: pfeData.UncollatPFE_5D || null,
            UncollatPFE_15D: pfeData.UncollatPFE_15D || null,
            UncollatPFE_30D: pfeData.UncollatPFE_30D || null,
            CollatPFE_5D: pfeData.CollatPFE_5D || null,
            CollatPFE_15D: pfeData.CollatPFE_15D || null,
            CollatPFE_30D: pfeData.CollatPFE_30D || null,
        };
    });

    if (!trades.length) {
        throw new Error('No trades found');
    }

    return serializedTrades;
}

export async function getQuicFxTradesWithPFE(limit: number = 1000, offset: number = 0) {
    const session = await getServerSession(authOptions);
    if (!session) {
        throw new Error('Unauthorized');
    }

    // Fetch FX trades
    const trades = await prisma.quic_fx_trades.findMany({
        take: limit,
        skip: offset,
    });

    // Fetch PFE results for all trades
    const pfeResults = await prisma.quic_pfe_results.findMany({
        where: {
            TransactionID: { in: trades.map(trade => trade.TransactionID) },
            Days: { in: [5, 15, 30] }
        },
    });

    // Create a map for quick PFE lookup
    const pfeMap = new Map();
    pfeResults.forEach(pfe => {
        if (!pfeMap.has(pfe.TransactionID)) {
            pfeMap.set(pfe.TransactionID, {});
        }
        pfeMap.get(pfe.TransactionID)[`UncollatPFE_${pfe.Days}D`] = pfe.Uncollateralized_PFE;
        pfeMap.get(pfe.TransactionID)[`CollatPFE_${pfe.Days}D`] = pfe.Collateralized_PFE;
    });

    // Combine FX trades with PFE results
    const serializedTrades = trades.map(trade => {
        const pfeData = pfeMap.get(trade.TransactionID) || {};

        return {
            ...Object.fromEntries(
                Object.entries(trade).map(([key, value]) => [
                    key,
                    typeof value === 'bigint' ? value.toString() : value
                ])
            ),
            TransactionID: trade.TransactionID.toString(),
            ACADIAID: trade.QUICID?.toString(),
            BuyNotional: trade.BuyNotional?.toString(),
            CounterpartyID: trade.CounterpartyID?.toString(),
            TradingDate: trade.TradingDate?.toISOString(),
            MaturityDate: trade.MaturityDate?.toISOString(),
            ...Object.fromEntries(
                Object.entries(pfeData).map(([key, value]) => [
                    key,
                    typeof value === 'bigint' ? value.toString() : value
                ])
            ),
            UncollatPFE_5D: pfeData.UncollatPFE_5D?.toString() || null,
            UncollatPFE_15D: pfeData.UncollatPFE_15D?.toString() || null,
            UncollatPFE_30D: pfeData.UncollatPFE_30D?.toString() || null,
            CollatPFE_5D: pfeData.CollatPFE_5D?.toString() || null,
            CollatPFE_15D: pfeData.CollatPFE_15D?.toString() || null,
            CollatPFE_30D: pfeData.CollatPFE_30D?.toString() || null,
        };
    });

    if (!trades.length) {
        throw new Error('No trades found');
    }

    return serializedTrades;
}



