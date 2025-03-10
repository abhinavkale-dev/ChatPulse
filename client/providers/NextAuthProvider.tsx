"use client"

import { SessionProvider } from "next-auth/react"

export function AuthProvider({children}:{children:React.ReactNode}) {
    return (
        <SessionProvider
        refetchInterval={0} 
        refetchOnWindowFocus={true}
        >
            {children}
        </SessionProvider>
    )
}