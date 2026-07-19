"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [form, setForm] = React.useState({ name: "", email: "", team: "", password: "" });
  const [pending, setPending] = React.useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name, team: form.team } },
    });
    setPending(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      // Hard navigation, not router.push — guarantees the server sees the just-set session
      // cookie on the very next request instead of racing a client-side RSC transition against
      // the browser client's cookie write.
      window.location.assign("/dashboard");
    } else {
      // Email confirmation is required by this Supabase project's Auth settings.
      setAwaitingConfirmation(true);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="flex w-[360px] flex-col gap-3 text-center">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-text-secondary">
          We sent a confirmation link to <span className="font-medium text-text-primary">{form.email}</span>.
          Click it to activate your account, then log in.
        </p>
        <Link href="/login" className="text-sm font-medium text-accent-default hover:underline">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-[360px] flex-col gap-4">
      <div>
        <h1 className="mb-0.5 text-xl font-semibold">Create your workspace</h1>
        <p className="text-sm text-text-secondary">
          Set up tentwenty QA Studio for your team in a couple of minutes.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Full Name</Label>
        <Input
          placeholder="e.g. Mushtaq Ahmed"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Work Email</Label>
        <Input
          type="email"
          placeholder="you@company.com"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Team / Company Name</Label>
        <Input
          placeholder="e.g. tentwenty Digital Agency"
          value={form.team}
          onChange={(e) => setForm((f) => ({ ...f, team: e.target.value }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Password</Label>
        <Input
          type="password"
          placeholder="At least 8 characters"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        />
      </div>
      <Button type="submit" disabled={pending} className="justify-center py-2.75">
        {pending ? "Creating…" : "Create Account"}
      </Button>
      <p className="text-center text-[11.5px] text-text-secondary">
        By continuing you agree to the Terms of Service and Privacy Policy.
      </p>
      <div className="text-center text-sm text-text-secondary">
        Already have a workspace?{" "}
        <Link href="/login" className="font-medium text-accent-default hover:underline">
          Log in
        </Link>
      </div>
    </form>
  );
}
