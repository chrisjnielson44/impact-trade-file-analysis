import SignIn from "./SignIn";
import { ModeToggle } from "@/components/ui/theme-toggle";
import { getServerSession } from "next-auth";
import { authOptions } from "./lib/authOptions";
import { redirect } from "next/navigation";
import React from "react";



export default async function Home() {
    const session = getServerSession(authOptions);
    if (await session) {
        redirect('/dashboard');
    }

    return (
        <main>
            <div className="container relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
                <div className="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
                    <div className="absolute inset-0 bg-zinc-900 dark:bg-dot-white/[0.1] bg-dot-black/[0.2]" />
                    <div className="relative z-20 flex items-center text-lg font-medium">
                        <img src='/o-dark.png' className='h-8 w-auto'/>
                    </div>
                    <div className="relative z-20 flex items-center mt-auto">
                    </div>
                </div>

                <div className="lg:p-8">
                    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                        <div className="absolute right-4 top-4 md:right-8 md:top-8">
                            <ModeToggle />
                        </div>
                        <div className="flex flex-col space-y-2 text-center">
                     
                        </div>
                        <SignIn />
                        <p className="px-8 text-center text-sm text-muted-foreground">
                            {/*Don&apos;t have an account?{" "}*/}
                            {/*<Link*/}
                            {/*    href="/sign-up"*/}
                            {/*    className="underline underline-offset-4 hover:text-primary"*/}
                            {/*>*/}
                            {/*    Sign Up*/}
                            {/*</Link>*/}
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
