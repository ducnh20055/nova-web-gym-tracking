import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-black p-4">
      <SignIn />
    </main>
  );
}
