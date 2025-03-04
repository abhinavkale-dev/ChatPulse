import {object, string} from "zod"

export const signInSchema = object({
    email: string({required_error: "Email is required"})
    .min(3, "Email Required")
    .email("Invalid email"),

    password: string({required_error: "Password is required"})
    .min(2, "Password Required")
    .min(8, "Password must have more than 8 characters")
    .max(32, "Password cannot exceed more than 32 characters")
})

export const signUpSchema = object({
    email: string({required_error: "Email is required"})
    .min(3, "Email Required")
    .email("Invalid email"),

    password: string({required_error: "Password is required"})
    .min(2, "Password Required")
    .min(8, "Password must have more than 8 characters")
    .max(32, "Password cannot exceed more than 32 characters"),

    confirmPassword: string({required_error: "Password is required"})
    .min(2, "Password Required")
    .min(8, "Password must have more than 8 characters")
    .max(32, "Password cannot exceed more than 32 characters")
})

    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords are not matching",
        path: ["confirmPassword"]
    })