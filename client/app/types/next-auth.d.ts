import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user : {
            id?: string | null
            email?: string | null
            avatar?: string | NonNullable
        } &DefaultSession["user"]
    }

    interface User {
        avatar?: string | null
    }

    interface Profile {
        picture: string | null
    }

    declare module "next-auth/jwt" {
        interface JWT extends DefaultJWT {
            id?: string | null 
            emai?: string | null
            avatar?: string | null
        }
    }
}