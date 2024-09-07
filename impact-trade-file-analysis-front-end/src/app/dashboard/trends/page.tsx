import React from 'react';
import { Metadata } from 'next';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Nav } from '@/app/dashboard/components/nav/Nav';
import { UserNav } from '@/app/dashboard/components/nav/ProfileAvatar';
import {MobileProfile} from "@/app/dashboard/components/nav/mobilenav";

export const metadata: Metadata = {
    title: 'Dashboard',
    description: 'Example dashboard app built using the components.',
};

export default async function DashboardPage() {
    return (
        <>
            <div>
                <Nav desktopProfile={<UserNav/>} mobileNav={<MobileProfile/>}/>
            </div>
            <div className="flex-col md:flex">
                <div className="flex-1 space-y-4 p-8 pt-4">
                    <div className="flex items-center justify-between space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Trends</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    </div>
                </div>
            </div>
        </>
    );
}
