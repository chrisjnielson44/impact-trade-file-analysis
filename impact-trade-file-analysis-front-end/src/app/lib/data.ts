import { prisma } from './prisma';
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

export async function getF22FxPFE(counterparty: string, TransactionID: string) {
    const session = await getServerSession(authOptions)
    if (!session) {
        throw new Error('Unauthorized')
    }

    const pfe = await prisma.f22_fx_pfe.findFirst({
        where: {
            TransactionID,
            CounterpartyID: counterparty,
        }
    })

    if (!pfe) {
        throw new Error('No PFE found')
    }

    return pfe

}

export async function getQUICFxPFE(counterparty: string, TransactionID: string) {
    const session = await getServerSession(authOptions)
    if (!session) {
        throw new Error('Unauthorized')
    }

    const pfe = await prisma.quic_fx_pfe.findFirst({
        where: {
            TransactionID,
            CounterpartyID: counterparty,
        }
    })

    if (!pfe) {
        throw new Error('No PFE found')
    }

    return pfe

}