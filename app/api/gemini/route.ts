import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Initialize Gemini client strictly with server-side environment variables and standard header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

export async function POST(req: NextRequest) {
  try {
    const { message, subject, promptType, history } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Missing query message" },
        { status: 400 }
      );
    }

    // System instruction focusing on high school curriculum & exam prep (THPT Quốc Gia)
    const systemInstruction = `Bạn là Trợ lý Học tập Thông minh mang tên "Studydase AI Tutor" dành cho học sinh cấp 3 ôn thi tốt nghiệp trung học phổ thông (THPT Quốc gia) tại Việt Nam.
Nhiệm vụ chính của bạn là hỗ trợ, giải đáp, giảng giải các kiến thức một cách ngắn gọn, khoa học, dễ hiểu, tránh phức tạp hóa vấn đề.

Quy tắc trả lời:
1. Trả lời bằng tiếng Việt, thân thiện, khuyến khích học sinh.
2. Hướng tới các môn học THPT Việt Nam (Toán học, Vật lý, Hóa học, Sinh học, Ngữ văn, Tiếng Anh).
3. Khi giải bài tập toán hay khoa học, hãy tiến hành giải thích theo 3 phần:
   - "Phân tích đề bài" (Mấu chốt nằm ở đâu, phương pháp giải nào khả thi)
   - "Các bước giải chi tiết" (Từng bước cụ thể bằng ký tự công thức rõ ràng, dễ nhìn)
   - "Cảnh báo lỗi thường gặp" (Học sinh hay nhầm lẫn ở điểm nào, ví dụ như quên điều kiện xác định, đổi dấu, v.v.)
4. Định dạng câu trả lời bằng Markdown đẹp đẽ, dùng danh sách có thụt lề rõ ràng để học sinh dễ đọc trên giao diện web.

Chế độ chuyên sâu hiện tại: ${
      promptType || "Giải đáp thắc mắc chung"
    }. Môn học liên quan: ${subject || "Mọi môn học"}.`;

    // Process chat history into structure supported by Gemini generating content
    const contents: any[] = [];

    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }

    // Append current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // 1. Sửa từ 3.5 thành 2.5-flash để chạy ổn định
      contents: message, // 2. Hãy đảm bảo truyền đúng tên biến (message) nhận từ frontend
      config: {
        systemInstruction:
          "Bạn là Trợ lý Học tập AI dành cho học sinh cấp 3 ôn thi. TUYỆT ĐỐI KHÔNG sử dụng ký hiệu dấu đô-la ($) hay cú pháp LaTeX. Hãy viết công thức theo cách gõ văn bản thông thường (ví dụ: f'(x), x = 3, suy ra,...) để tránh lỗi font hiển thị.",
        temperature: 0.7,
      },
    });

    const replyText =
      response.text ||
      "Xin lỗi, trợ lý AI gặp chút gián đoạn trong việc tổng hợp câu trả lời rộng mở. Bạn vui lòng thử lại!";

    return NextResponse.json({ text: replyText });
  } catch (error: any) {
    console.error("Gemini API Error in route:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Đã xảy ra lỗi hệ thống khi kết nối với AI. Vui lòng thử lại sau.",
      },
      { status: 500 }
    );
  }
}
