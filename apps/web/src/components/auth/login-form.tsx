"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    // Hard navigation — see signup-form.tsx's comment for why (avoids racing the session
    // cookie write against a client-side RSC transition).
    window.location.assign("/dashboard");
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error("Enter your email above first, then click this again.");
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) toast.error(error.message);
    else toast("Password reset email sent — check your inbox.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-[360px] flex-col gap-4">
      <div>
        <h1 className="mb-0.5 text-xl font-semibold">Log in to your workspace</h1>
        <p className="text-sm text-text-secondary">Welcome back — pick up right where you left off.</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Work Email</Label>
        <Input
          type="email"
          placeholder="you@company.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Password</Label>
        <Input
          type="password"
          placeholder="••••••••"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs font-medium text-accent-default hover:underline"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </button>
      </div>
      <Button type="submit" disabled={pending} className="justify-center py-2.75">
        {pending ? "Logging in…" : "Log In"}
      </Button>
      <div className="flex items-center gap-2.5 text-[11.5px] text-text-secondary before:h-px before:flex-1 before:bg-border-default after:h-px after:flex-1 after:bg-border-default">
        or
      </div>
      <Button
        type="button"
        variant="secondary"
        className="justify-center py-2.75"
        onClick={() => toast("Google sign-in isn't configured for this project yet.")}
      >
        Continue with Google
      </Button>
      <div className="text-center text-sm text-text-secondary">
        Don&apos;t have a workspace yet?{" "}
        <Link href="/signup" className="font-medium text-accent-default hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  );
}
