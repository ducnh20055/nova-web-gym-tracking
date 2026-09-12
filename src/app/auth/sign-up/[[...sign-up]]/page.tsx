import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-black p-4">
      <SignUp />
    </main>
  );
}
