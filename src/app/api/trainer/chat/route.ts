import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateAppUser } from "@/lib/auth-user";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");
const requestWindows = new Map<string, number[]>();

const SYSTEM_PROMPT = `
Bạn là AI Personal Trainer chuyên nghiệp, am hiểu sâu về Thể hình (Bodybuilding) và Dinh dưỡng.
- Trả lời ngắn gọn, đúng trọng tâm, dễ đọc.
- Định dạng câu trả lời rõ ràng (dùng danh sách đánh số hoặc gạch đầu dòng).
- Khi tư vấn lịch tập, ưu tiên các nguyên tắc chuẩn khoa học (như Push/Pull/Legs, Tempo, RPE, TDEE, Macro).
`;

// 1. GET: Lấy danh sách các phiên chat HOẶC lấy tin nhắn của 1 phiên cụ thể
export async function GET(req: Request) {
  const user = await getOrCreateAppUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");
  const type = searchParams.get("type");

  // Lấy toàn bộ danh sách phiên chat để hiển thị ở Sidebar
  if (type === "sessions") {
    try {
      const sessions = await prisma.trainerSession.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
      });
      return NextResponse.json({ sessions });
    } catch (error) {
      console.error("[GET_SESSIONS_ERROR]", error);
      return NextResponse.json(
        { error: "Không thể tải lịch sử chat" },
        { status: 500 },
      );
    }
  }

  // Lấy lịch sử tin nhắn của phiên chat đang chọn
  if (!sessionId) {
    return NextResponse.json({ messages: [] });
  }

  try {
    const session = await prisma.trainerSession.findUnique({
      where: { id: sessionId, userId: user.id },
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Phiên trò chuyện không tồn tại", messages: [] },
        { status: 404 },
      );
    }

    const messages = await prisma.trainerMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[GET_CHAT_HISTORY_ERROR]", error);
    return NextResponse.json({ messages: [] });
  }
}

// 2. POST: Gửi tin nhắn mới, lưu DB & gọi Gemini AI
export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chưa cấu hình GEMINI_API_KEY trong file .env.local" },
      { status: 500 },
    );
  }

  try {
    const user = await getOrCreateAppUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = Date.now();
    const recentRequests = (requestWindows.get(user.id) || []).filter(
      (time) => now - time < 60_000,
    );
    if (recentRequests.length >= 20) {
      return NextResponse.json(
        { error: "Bạn đã đạt giới hạn 20 tin nhắn/phút" },
        { status: 429 },
      );
    }
    requestWindows.set(user.id, [...recentRequests, now]);

    const { sessionId, message } = await req.json();

    if (
      !message ||
      typeof message !== "string" ||
      !message.trim() ||
      message.length > 2000
    ) {
      return NextResponse.json(
        { error: "Dữ liệu tin nhắn không hợp lệ" },
        { status: 400 },
      );
    }

    // Bước 1: Tạo phiên chat mới nếu chưa có sessionId
    let activeSessionId: string | null = sessionId || null;
    if (activeSessionId) {
      const existingSession = await prisma.trainerSession.findUnique({
        where: { id: activeSessionId, userId: user.id },
        select: { id: true },
      });

      if (!existingSession) activeSessionId = null;
    }

    if (!activeSessionId) {
      const newSession = await prisma.trainerSession.create({
        data: { title: message.slice(0, 30), userId: user.id },
      });
      activeSessionId = newSession.id;
    }

    // Bước 2: Lưu tin nhắn của USER vào Database
    await prisma.trainerMessage.create({
      data: {
        sessionId: activeSessionId,
        sender: "user",
        text: message,
      },
    });

    // Bước 3: Lấy toàn bộ lịch sử trong CSDL để xây dựng Context cho AI
    const dbHistory = await prisma.trainerMessage.findMany({
      where: { sessionId: activeSessionId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    dbHistory.reverse();

    // Lọc bỏ tin nhắn vừa lưu để truyền vào sendMessage bên dưới
    const previousMessages = dbHistory.slice(0, dbHistory.length - 1);

    // Đảm bảo history truyền cho Gemini luôn bắt đầu từ lượt của "user"
    const firstUserIndex = previousMessages.findIndex(
      (m) => m.sender === "user",
    );
    const validPreviousMessages =
      firstUserIndex !== -1 ? previousMessages.slice(firstUserIndex) : [];

    const history = validPreviousMessages.map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    // Bước 4: Khởi tạo model Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction: SYSTEM_PROMPT,
    });

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const aiReplyText = result.response.text();

    // Bước 5: Lưu phản hồi của AI vào Database
    const aiMessage = await prisma.trainerMessage.create({
      data: {
        sessionId: activeSessionId,
        sender: "ai",
        text: aiReplyText,
      },
    });

    // Cập nhật updatedAt cho TrainerSession
    await prisma.trainerSession.update({
      where: { id: activeSessionId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      sessionId: activeSessionId,
      text: aiMessage.text,
    });
  } catch (error) {
    console.error("[GEMINI_CHAT_ERROR]", error);
    return NextResponse.json(
      { error: "HLV AI đang bận một chút, vui lòng thử lại sau!" },
      { status: 500 },
    );
  }
}
