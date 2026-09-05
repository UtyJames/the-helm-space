"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function adminSignIn(formData: FormData) {
  const mode = (formData.get("mode") as string) || "credentials";
  const username = (formData.get("username") as string)?.trim() || "";
  const password = (formData.get("password") as string) || "";
  const pin = (formData.get("pin") as string) || "";

  try {
    await signIn("credentials", {
      username,
      password,
      pin,
      mode,
      redirect: false,
    });
  } catch (error: any) {
    if (error?.digest?.startsWith?.("NEXT_REDIRECT")) {
      throw error;
    }
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return {
          success: false,
          message: mode === "pin" ? "Incorrect PIN. Please try again." : "Invalid username or password.",
        };
      }
      return {
        success: false,
        message: "Sign-in error: " + (error.cause?.err?.message || error.message),
      };
    }
    const msg = error?.message || String(error);
    if (msg.includes("CredentialsSignin") || msg.includes("credentials")) {
      return {
        success: false,
        message: mode === "pin" ? "Incorrect PIN. Please try again." : "Invalid username or password.",
      };
    }
    return { success: false, message: "Sign-in failed. Please try again." };
  }

  redirect("/admin/dashboard");
}

export async function adminSignOut() {
  await signOut({ redirectTo: "/admin" });
}
