import { PrismaClient } from "@prisma/client";

declare global {
    /* eslint-disable no-var */
    var prisma : PrismaClient | undefined
}
/* eslint-enable no-var */


const prisma = global.prisma || new PrismaClient();

export default prisma;