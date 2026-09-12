import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Khai báo các trang PUBLIC (không bắt buộc login)
const isPublicRoute = createRouteMatcher(["/auth(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Nếu không phải trang auth công khai -> Bắt buộc phải login mới cho xem
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpeg|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
