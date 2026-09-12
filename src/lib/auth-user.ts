import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function getOrCreateAppUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress;

  return prisma.user.upsert({
    where: { id: userId },
    update: {
      email: email || `${userId}@clerk.local`,
      name: clerkUser?.firstName || clerkUser?.username || null,
      avatar: clerkUser?.imageUrl || null,
    },
    create: {
      id: userId,
      email: email || `${userId}@clerk.local`,
      name: clerkUser?.firstName || clerkUser?.username || null,
      avatar: clerkUser?.imageUrl || null,
    },
  });
}
