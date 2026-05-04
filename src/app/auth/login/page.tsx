import { redirect } from "next/navigation";

export default function AuthLoginAliasPage() {
  // The real login UI lives at `/login` (route group `src/app/(auth)/login`).
  // Keep `/auth/login` as a stable alias since it's used across the app and in shared links.
  redirect("/login");
}

