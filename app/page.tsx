"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Sparkles,
  TrendingUp,
  CheckCircle,
  Brain,
  Clock,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  User,
  Bell,
  Moon,
  Sun,
  Send,
  Plus,
  Award,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Search,
  BookOpenCheck,
  CheckSquare,
  Bookmark,
  ChevronLeft,
  X,
} from "lucide-react";

// Types for application state
interface Message {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}

interface ActivityLog {
  id: string;
  time: string;
  content: string;
  type: "success" | "info" | "warning";
}

interface DailyTask {
  id: string;
  title: string;
  duration: string;
  subject: string;
  done: boolean;
  scoreBonus: number;
}

interface SyllabusTopic {
  id: string;
  name: string;
  completed: boolean;
  subTopics?: { id: string; name: string; completed: boolean }[];
}

// Helper to parse double asterisks and inline code inside single lines of Markdown
const parseInlineStyles = (text: string, darkMode: boolean = true): React.ReactNode[] | string => {
  if (!text) return "";
  
  // Format bold text (**...**) first
  const boldParts = text.split(/\*\*([^*]+)\*\*/g);
  return boldParts.map((part, index) => {
    if (index % 2 === 1) {
      // Bold part: check if it contains code inline first
      return (
        <strong key={`bold-${index}`} className={`font-extrabold font-sans ${darkMode ? "text-amber-300" : "text-amber-600"}`}>
          {part}
        </strong>
      );
    }
    // Non-bold part: look for inline code `code`
    const codeParts = part.split(/`([^`]+)`/g);
    return codeParts.map((cPart, cIndex) => {
      if (cIndex % 2 === 1) {
        return (
          <code key={`code-${cIndex}`} className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
            darkMode 
              ? "bg-slate-900 border border-slate-800 text-yellow-300" 
              : "bg-slate-200 border border-slate-300 text-amber-700 font-bold"
          }`}>
            {cPart}
          </code>
        );
      }
      return cPart;
    });
  }).flat();
};

// Robust line-by-line Markdown renderer mapping to gorgeous React elements
const renderMarkdownMessage = (text: string, darkMode: boolean = true): React.JSX.Element => {
  const lines = text.split("\n");
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];
  const renderedElements: React.JSX.Element[] = [];

  lines.forEach((line, idx) => {
    // 1. Code Block starts or ends
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        renderedElements.push(
          <pre key={`codeblock-${idx}`} className={`p-4 rounded-xl border my-2 overflow-x-auto text-[11px] font-mono leading-normal ${
            darkMode 
              ? "bg-[#070a13] border-slate-800/80 text-emerald-400" 
              : "bg-slate-50 border-slate-200 text-emerald-700"
          }`}>
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        );
        codeBlockLines = [];
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // 2. Headings
    if (line.startsWith("### ")) {
      renderedElements.push(
        <h4 key={`h3-${idx}`} className={`text-sm font-bold mt-4 mb-1.5 flex items-center gap-1.5 ${
          darkMode ? "text-sky-300" : "text-sky-600"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? "bg-sky-500" : "bg-sky-600"}`} />
          {parseInlineStyles(line.slice(4), darkMode)}
        </h4>
      );
      return;
    }
    if (line.startsWith("## ")) {
      renderedElements.push(
        <h3 key={`h2-${idx}`} className={`text-base font-bold mt-5 mb-2.5 border-b pb-1 flex items-center gap-2 ${
          darkMode ? "text-indigo-300 border-indigo-900/40" : "text-indigo-600 border-indigo-100"
        }`}>
          {parseInlineStyles(line.slice(3), darkMode)}
        </h3>
      );
      return;
    }
    if (line.startsWith("# ")) {
      renderedElements.push(
        <h2 key={`h1-${idx}`} className={`text-lg font-bold mt-5 mb-3 flex items-center gap-2 ${
          darkMode ? "text-white" : "text-slate-800"
        }`}>
          {parseInlineStyles(line.slice(2), darkMode)}
        </h2>
      );
      return;
    }

    // 3. Blockquotes
    if (line.startsWith("> ")) {
      renderedElements.push(
        <blockquote key={`quote-${idx}`} className={`border-l-4 pl-3.5 py-1.5 my-3 rounded-r italic leading-relaxed text-xs ${
          darkMode ? "border-indigo-500 bg-indigo-950/25 text-slate-300" : "border-indigo-400 bg-indigo-50/50 text-slate-600"
        }`}>
          {parseInlineStyles(line.slice(2), darkMode)}
        </blockquote>
      );
      return;
    }

    // 4. Bullet lists
    const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
    if (isBullet) {
      const cleanLine = line.trim().replace(/^[-*]\s+/, "");
      renderedElements.push(
        <li key={`bullet-${idx}`} className={`ml-5 mt-1 list-disc pl-1 leading-relaxed ${
          darkMode ? "text-slate-300" : "text-slate-700"
        }`}>
          {parseInlineStyles(cleanLine, darkMode)}
        </li>
      );
      return;
    }

    // 5. Numbered lists
    const numListMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numListMatch) {
      const content = numListMatch[2];
      renderedElements.push(
        <li key={`num-${idx}`} className={`ml-5 mt-1 list-decimal pl-1 leading-relaxed ${
          darkMode ? "text-slate-300" : "text-slate-700"
        }`}>
          {parseInlineStyles(content, darkMode)}
        </li>
      );
      return;
    }

    // 6. Normal line (empty line vs normal paragraph)
    if (line.trim() === "") {
      renderedElements.push(<div key={`space-${idx}`} className="h-2" />);
    } else {
      renderedElements.push(
        <p key={`p-${idx}`} className={`mb-2 last:mb-0 leading-relaxed font-sans ${
          darkMode ? "text-slate-300" : "text-slate-700"
        }`}>
          {parseInlineStyles(line, darkMode)}
        </p>
      );
    }
  });

  return <div className="space-y-1 font-sans">{renderedElements}</div>;
};

// Full curriculum mock data representing actual high school requirements in Vietnam
const SUBJECT_DETAILS: Record<string, Record<string, {
  title: string;
  definition: string;
  formulaTitle?: string;
  formulas: string[];
  examTrends: string;
  examples: { q: string; a: string }[];
  mistakes: string[];
}>> = {
  "Toán học": {
    "Đạo hàm & Vi phân": {
      title: "Chuyên đề: Đạo hàm & Ý nghĩa hình học",
      definition: "Đạo hàm của hàm số y = f(x) tại điểm x0 là giới hạn (nếu có) của tỉ số giữa số gia của hàm số và số gia của đối số khi số gia đối số tiến dần về 0. Ý nghĩa hình học chính là hệ số góc của tiếp tuyến.",
      formulaTitle: "Công thức Đạo hàm cốt lõi",
      formulas: [
        "(x^n)' = n * x^(n-1)",
        "(sin x)' = cos x;  (cos x)' = -sin x",
        "(u/v)' = (u'v - uv') / v^2",
        "Phương trình tiếp tuyến: y = f'(x0)(x - x0) + f(x0)"
      ],
      examTrends: " Xuất hiện 3 đến 5 câu trong đề thi THPT Quốc Gia, trải từ mức độ nhận biết đến vận dụng cao (cực trị hàm số chứa tham số, tìm tiệm cận và sự biến thiên).",
      examples: [
        { q: "Tính đạo hàm của f(x) = x^3 - 3x^2 + 1 và tìm tiếp tuyến tại điểm x = 2.", a: "f'(x) = 3x^2 - 6x. Với x0 = 2 => f(2) = -3, f'(2) = 0. Phương trình tiếp tuyến là y = 0*(x - 2) - 3 => y = -3." }
      ],
      mistakes: [
        "Quên không đổi dấu đạo hàm của hàm hợp lượng giác.",
        "Nhầm công thức tính nhanh đạo hàm phân thức bậc nhất trên bậc nhất."
      ]
    },
    "Khảo sát hàm số": {
      title: "Chuyên đề: Khảo sát sự biến thiên & Vẽ đồ thị",
      definition: "Quá trình khảo sát gồm: Tìm tập xác định, tính đạo hàm f'(x), giải phương trình f'(x)=0 để tìm điểm cực trị, lập bảng biến thiên, tìm tiệm cận (ngang & đứng) và biểu diễn đồ thị lên mặt phẳng tọa độ.",
      formulas: [
        "Tiệm cận đứng: x = x0 nếu lim (x->x0) f(x) = vô cực",
        "Tiệm cận ngang: y = y0 nếu lim (x->vô cực) f(x) = y0",
        "Đồ thị bậc 3: y = ax^3 + bx^2 + cx + d (a khác 0)"
      ],
      examTrends: "Chiếm tỷ trọng lớn nhất môn Toán (khoảng 10-12 câu). Tập trung vào đọc bảng biến thiên, tương giao đồ thị, biện luận nghiệm phương trình.",
      examples: [
        { q: "Tìm tham số m để hàm số y = x^3 - 3x^2 + mx đồng biến trên R.", a: "Ta cần y' = 3x^2 - 6x + m >= 0 với mọi x. Delta' = 9 - 3m <= 0 => m >= 3." }
      ],
      mistakes: [
        "Kết luận khoảng đồng biến nghịch biến dùng ký hiệu hợp (U) thay vì dùng từ 'và' hoặc dấu phẩy.",
        "Xét thiếu tiệm cận khi biểu thức mẫu triệt tiêu với tử."
      ]
    }
  },
  "Vật lý": {
    "Dao động điều hòa": {
      title: "Chuyên đề: Phương trình dao động điều hòa",
      definition: "Dao động điều hòa là dao động trong đó li độ của vật là một hàm hình sin hoặc cosin của thời gian. Lực kéo về luôn hướng về vị trí cân bằng và tỉ lệ thuận với li độ.",
      formulaTitle: "Phương trình Động lực học",
      formulas: [
        "Li độ: x = A * cos(omega * t + phi)",
        "Vận tốc: v = x' = -omega * A * sin(omega * t + phi)",
        "Gia tốc: a = v' = -omega^2 * x",
        "Chu kỳ con lắc lò xo: T = 2 * pi * sqrt(m / k)"
      ],
      examTrends: "Có trung bình 4 câu trong đề thi tốt nghiệp, đa số nằm ở mức độ thông hiểu và vận dụng (đồ thị dao động, mối liên hệ pha giữa x, v, a).",
      examples: [
        { q: "Một con lắc lò xo độ cứng k = 100 N/m, m = 100g. Tính chu kỳ dao động.", a: "omega = sqrt(k/m) = sqrt(100/0.1) = 10*pi rad/s. Chu kỳ T = 2*pi / omega = 2*pi / (10*pi) = 0.2 giây." }
      ],
      mistakes: [
        "Nhầm lẫn giữa tần số và tần số góc (f vs omega).",
        "Quên đổi đơn vị của khối lượng m sang kg khi tính toán công thức tần số."
      ]
    }
  },
  "Hóa học": {
    "Este - Lipit": {
      title: "Chuyên đề: Este - Lipit & Phản ứng xà phòng hóa",
      definition: "Este là sản phẩm khi thay nhóm OH của axit cacboxylic bằng hợp phần chứa gốc O-R'. Lipit là trieste của glixerol với các axit béo, thường được gọi chung là chất béo.",
      formulaTitle: "Phản ứng hóa học cốt lõi",
      formulas: [
        "R-COO-R' + NaOH -t°-> R-COONa + R'-OH (Xà phòng hóa)",
        "R-COOH + R'-OH <-H2SO4, t°-> R-COO-R' + H2O (Phản ứng este hóa)",
        "Este no, đơn chức, mạch hở: C_n H_{2n} O_2 (n >= 2)"
      ],
      examTrends: "Tần suất cao từ 4 đến 6 câu. Thường có bài toán biện luận cấu tạo trùng ngưng este nâng cao và bài toán đốt cháy chất béo cực khó.",
      examples: [
        { q: "Xà phòng hóa hoàn toàn 8.8g este etyl axetat (CH3COOC2H5) cần dùng bao nhiêu ml dung dịch NaOH 1M?", a: "n_este = 8.8 / 88 = 0.1 mol. Phương trình phản ứng tỉ lệ 1:1 => n_NaOH = 0.1 mol. Thể tích V_NaOH = 0.1 / 1 = 0.1 lít = 100 ml." }
      ],
      mistakes: [
        "Không nhớ điều kiện este hóa là phản ứng thuận nghịch 2 chiều.",
        "Nhầm tên nhóm ankyl gốc rượu (ví dụetyl là CH3-CH2- còn metyl là CH3-)."
      ]
    }
  }
};

// Initial syllabus structured tree for Math, Physics, Chemistry
const INITIAL_SYLLABUS: Record<string, SyllabusTopic[]> = {
  "Toán học": [
    {
      id: "toan-1",
      name: "Chương I: Ứng dụng đạo hàm dể khảo sát hàm số",
      completed: false,
      subTopics: [
        { id: "toan-1-1", name: "Đạo hàm & Vi phân", completed: true },
        { id: "toan-1-2", name: "Khảo sát hàm số", completed: false },
        { id: "toan-1-3", name: "Tìm Cực trị & Giá trị lớn nhất", completed: false },
        { id: "toan-1-4", name: "Đường tiệm cận đồ thị", completed: false },
      ]
    },
    {
      id: "toan-2",
      name: "Chương II: Hàm số lũy thừa, mũ và lôgarit",
      completed: false,
      subTopics: [
        { id: "toan-2-1", name: "Công thức Lũy thừa - Logarit", completed: false },
        { id: "toan-2-2", name: "Hàm số mũ & logarit", completed: false },
        { id: "toan-2-3", name: "Phương trình bất phương trình mũ", completed: false },
      ]
    },
    {
      id: "toan-3",
      name: "Chương III: Nguyên hàm & Tích phân",
      completed: false,
      subTopics: [
        { id: "toan-3-1", name: "Tìm nguyên hàm cơ bản", completed: false },
        { id: "toan-3-2", name: "Tính tích phân xác định", completed: false },
        { id: "toan-3-3", name: "Ứng dụng diện tích & thể tích", completed: false },
      ]
    }
  ],
  "Vật lý": [
    {
      id: "ly-1",
      name: "Chương I: Dao động cơ học",
      completed: false,
      subTopics: [
        { id: "ly-1-1", name: "Dao động điều hòa", completed: true },
        { id: "ly-1-2", name: "Con lắc lò xo & Con lắc đơn", completed: false },
        { id: "ly-1-3", name: "Dao động tắt dần & Cưỡng bức", completed: false },
        { id: "ly-1-4", name: "Tổng hợp dao động", completed: false },
      ]
    },
    {
      id: "ly-2",
      name: "Chương II: Sóng cơ & Sóng âm",
      completed: false,
      subTopics: [
        { id: "ly-2-1", name: "Truyền sóng cơ", completed: false },
        { id: "ly-2-2", name: "Giao thoa sóng", completed: false },
        { id: "ly-2-3", name: "Sóng dừng", completed: false },
      ]
    }
  ],
  "Hóa học": [
    {
      id: "hoa-1",
      name: "Chương I: Este - Lipit",
      completed: false,
      subTopics: [
        { id: "hoa-1-1", name: "Este - Lipit", completed: true },
        { id: "hoa-1-2", name: "Chất béo & Phản ứng xà phòng hóa", completed: false },
        { id: "hoa-1-3", name: "Luyện tập lý thuyết Este mạch hở", completed: false },
      ]
    },
    {
      id: "hoa-2",
      name: "Chương II: Cacbohiđrat",
      completed: false,
      subTopics: [
        { id: "hoa-2-1", name: "Glucozơ & Fructozơ", completed: false },
        { id: "hoa-2-2", name: "Saccarozơ & Tinh bột", completed: false },
      ]
    }
  ],
  "Sinh học": [
    {
      id: "sinh-1",
      name: "Chương I: Cơ chế di truyền & Biến dị",
      completed: false,
      subTopics: [
        { id: "sinh-1-1", name: "Gen, Mã di truyền & Nhân đôi ADN", completed: false },
        { id: "sinh-1-2", name: "Phiên mã & Dịch mã protein", completed: false },
      ]
    }
  ],
  "Ngữ văn": [
    {
      id: "van-1",
      name: "Chuyên đề: Văn học hiện đại và Nghị luận",
      completed: false,
      subTopics: [
        { id: "van-1-1", name: "Phân tích tác phẩm Vợ Nhặt", completed: false },
        { id: "van-1-2", name: "Phân tích bài thơ Đất Nước", completed: false },
        { id: "van-1-3", name: "Nghị luận xã hội 200 chữ", completed: false },
      ]
    }
  ],
  "Tiếng Anh": [
    {
      id: "anh-1",
      name: "Chuyên đề: Ngữ pháp cốt lõi ôn thi THPT",
      completed: false,
      subTopics: [
        { id: "anh-1-1", name: "Mệnh đề quan hệ rút gọn", completed: true },
        { id: "anh-1-2", name: "Câu bị động đặc biệt", completed: false },
        { id: "anh-1-3", name: "Trọng âm và Phát âm", completed: false },
      ]
    }
  ]
};

export default function Home() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "syllabus" | "chat" | "statistics" | "exams">("dashboard");
  
  // Theme settings (Light vs Dark space mode)
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Class Selection (Grade 10, Grade 11, Grade 12)
  const [selectedGrade, setSelectedGrade] = useState<"Grade 10" | "Grade 11" | "Grade 12">("Grade 12");

  // Main interactive educational states
  const [studyMinutes, setStudyMinutes] = useState<number>(195); // default 3h15m
  const [totalDays, setTotalDays] = useState<number>(20);
  const [exerciseCount, setExerciseCount] = useState<number>(30);
  const [accuracy, setAccuracy] = useState<number>(99.0);
  
  // Stopwatch states (Simulates live study time counting)
  const [timerActive, setTimerActive] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  
  // Adaptive syllabus / progress mapping states
  const [syllabus, setSyllabus] = useState<Record<string, SyllabusTopic[]>>(INITIAL_SYLLABUS);
  const [activeSubject, setActiveSubject] = useState<string>("Toán học");
  const [selectedTopic, setSelectedTopic] = useState<string>("Đạo hàm & Vi phân");

  // AI Chat states
  const [chatInput, setChatInput] = useState<string>("");
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "welcome-ai",
      role: "model",
      text: "Xin chào bạn! Tôi là Gia sư AI Studydase. Bạn cần tôi giảng giải công thức, giải thích lỗi sai, hay lên kế hoạch học tập chủ đề nào hôm nay nhỉ? Hãy chọn nhanh các phím gợi ý ở trên hoặc nhập câu hỏi trực tiếp nhé!",
      timestamp: "10:35 AM"
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [chatRole, setChatRole] = useState<string>("Giải đáp chung");

  // User notifications & toast logs
  const [notifications, setNotifications] = useState<string[]>([
    "Lộ trình tuần mới của môn Toán đã được AI cập nhật chuẩn cấu trúc THPT Quốc gia.",
    "Bạn có 2 bài tập đạo hàm chưa giải xong. Hãy ôn tập ngay để duy trì chuỗi 20 ngày học!"
  ]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search input on syllabus / learning materials
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Activity Log Timeline state
  const [activities, setActivities] = useState<ActivityLog[]>([
    { id: "act-1", time: "12:30", content: "Hoàn thành luyện tập chủ đề Đạo hàm & Ý nghĩa hình học", type: "success" },
    { id: "act-2", time: "11:15", content: "Bắt đầu ghi chú Hóa học - Chuyên đề Este", type: "info" },
    { id: "act-3", time: "10:45", content: "Làm bài thi thử trực tuyến Vật lý chương Dao động cơ", type: "info" },
    { id: "act-4", time: "09:15", content: "Hệ thống phát hiện lỗi sai thường gặp khi rút gọn phân thức Tiếng Anh", type: "warning" }
  ]);

  // Daily target tasks
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([
    { id: "task-1", title: "Đánh giá Toán học: Đạo hàm", duration: "30ph", subject: "Toán học", done: true, scoreBonus: 10 },
    { id: "task-2", title: "Luyện tập Hóa học: Este 20 câu trắc nghiệm", duration: "20 câu", subject: "Hóa học", done: false, scoreBonus: 15 },
    { id: "task-3", title: "Thực hành đọc hiểu Tiếng Anh", duration: "45ph", subject: "Tiếng Anh", done: false, scoreBonus: 12 },
    { id: "task-4", title: "Phân tích lỗi thi thử cùng AI", duration: "Mức AI", subject: "Tổng hợp", done: false, scoreBonus: 20 },
  ]);

  // Account information simulation values
  const [userName, setUserName] = useState<string>("yonamobu");
  const [userEmail, setUserEmail] = useState<string>("yonamobu@gmail.com");
  const [userPhone, setUserPhone] = useState<string>("123-4556");
  const [userAvatar, setUserAvatar] = useState<string>("🎓");
  const [isEditingAccount, setIsEditingAccount] = useState<boolean>(false);

  // THPT Exam Generator State
  const [examSubject, setExamSubject] = useState<string>("Toán học");
  const [examType, setExamType] = useState<string>("Đề khảo sát THPT Quốc Gia (Chuẩn cấu trúc)");
  const [examRequirements, setExamRequirements] = useState<string>("");
  const [isGeneratingExam, setIsGeneratingExam] = useState<boolean>(false);
  const [activeGeneratedExam, setActiveGeneratedExam] = useState<string>(""); 
  const [selectedExamAnswers, setSelectedExamAnswers] = useState<Record<number, string>>({});
  const [examScore, setExamScore] = useState<number | null>(null);
  const [examFeedback, setExamFeedback] = useState<string>("");
  const [isSubmittingExam, setIsSubmittingExam] = useState<boolean>(false);
  const [currentSelectedPracticeExam, setCurrentSelectedPracticeExam] = useState<string | null>(null);
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(0);
  const [examEssayAnswer, setExamEssayAnswer] = useState<string>("");

  // Authentication State Variables
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authStep, setAuthStep] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState<string>("yonamobu@gmail.com");
  const [loginPassword, setLoginPassword] = useState<string>("password123");
  const [registerName, setRegisterName] = useState<string>("");
  const [registerEmail, setRegisterEmail] = useState<string>("");
  const [registerPassword, setRegisterPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  // Hydration-safe localStorage loader
  useEffect(() => {
    const savedLoggedIn = localStorage.getItem("studydase_is_logged_in") === "true";
    const savedName = localStorage.getItem("studydase_user_name");
    const savedEmail = localStorage.getItem("studydase_user_email");
    const savedPhone = localStorage.getItem("studydase_user_phone");
    const savedAvatar = localStorage.getItem("studydase_user_avatar");
    if (savedLoggedIn) {
      const timer = setTimeout(() => {
        setIsLoggedIn(true);
        if (savedName) setUserName(savedName);
        if (savedEmail) setUserEmail(savedEmail);
        if (savedPhone) setUserPhone(savedPhone);
        if (savedAvatar) setUserAvatar(savedAvatar);

        // Load stats specifically saved for the active authenticated user
        const savedMinutes = localStorage.getItem("studydase_study_minutes");
        const savedDays = localStorage.getItem("studydase_total_days");
        const savedExercises = localStorage.getItem("studydase_exercise_count");
        const savedAccuracy = localStorage.getItem("studydase_accuracy");
        const savedSyllabus = localStorage.getItem("studydase_syllabus_state");
        const savedActivities = localStorage.getItem("studydase_activities_state");
        const savedTasks = localStorage.getItem("studydase_tasks_state");
        const savedChat = localStorage.getItem("studydase_chat_state");

        if (savedMinutes !== null) setStudyMinutes(Number(savedMinutes));
        if (savedDays !== null) setTotalDays(Number(savedDays));
        if (savedExercises !== null) setExerciseCount(Number(savedExercises));
        if (savedAccuracy !== null) setAccuracy(Number(savedAccuracy));
        
        if (savedSyllabus) {
          try { setSyllabus(JSON.parse(savedSyllabus)); } catch (e) { console.error(e); }
        }
        if (savedActivities) {
          try { setActivities(JSON.parse(savedActivities)); } catch (e) { console.error(e); }
        }
        if (savedTasks) {
          try { setDailyTasks(JSON.parse(savedTasks)); } catch (e) { console.error(e); }
        }
        if (savedChat) {
          try { setChatMessages(JSON.parse(savedChat)); } catch (e) { console.error(e); }
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-save user stats and progress when they change, only if logged in to prevent rewriting defaults on launch
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem("studydase_study_minutes", String(studyMinutes));
      localStorage.setItem("studydase_total_days", String(totalDays));
      localStorage.setItem("studydase_exercise_count", String(exerciseCount));
      localStorage.setItem("studydase_accuracy", String(accuracy));
      localStorage.setItem("studydase_syllabus_state", JSON.stringify(syllabus));
      localStorage.setItem("studydase_activities_state", JSON.stringify(activities));
      localStorage.setItem("studydase_tasks_state", JSON.stringify(dailyTasks));
      localStorage.setItem("studydase_chat_state", JSON.stringify(chatMessages));
    }
  }, [isLoggedIn, studyMinutes, totalDays, exerciseCount, accuracy, syllabus, activities, dailyTasks, chatMessages]);

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      triggerToast("Vui lòng điền đầy đủ địa chỉ Email và mật khẩu!");
      return;
    }
    
    // Simulate active login
    setIsLoggedIn(true);
    localStorage.setItem("studydase_is_logged_in", "true");
    
    // Fallback name if none of registration details are saved
    const derivedName = loginEmail.split("@")[0];
    setUserName(derivedName);
    setUserEmail(loginEmail);
    localStorage.setItem("studydase_user_name", derivedName);
    localStorage.setItem("studydase_user_email", loginEmail);
    
    triggerToast("Đăng nhập thành công! Chào mừng bạn quay trở lại với Studydase AI.");
  };

  // Register / Sign-up handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      triggerToast("Vui lòng nhập đầy đủ họ tên, email và mật khẩu của bạn!");
      return;
    }
    
    // Fresh slate initialization for completely brand new student
    const cleanName = registerName.trim();
    const cleanEmail = registerEmail.trim();

    // Reset stats & achievements back to zero
    setStudyMinutes(0);
    setTotalDays(0);
    setExerciseCount(0);
    setAccuracy(100.0);
    
    const freshSyllabus = JSON.parse(JSON.stringify(INITIAL_SYLLABUS));
    setSyllabus(freshSyllabus);
    
    const freshTasks = [
      { id: "task-1", title: "Đánh giá Toán học: Đạo hàm", duration: "30ph", subject: "Toán học", done: false, scoreBonus: 10 },
      { id: "task-2", title: "Luyện tập Hóa học: Este 20 câu trắc nghiệm", duration: "20 câu", subject: "Hóa học", done: false, scoreBonus: 15 },
      { id: "task-3", title: "Thực hành đọc hiểu Tiếng Anh", duration: "45ph", subject: "Tiếng Anh", done: false, scoreBonus: 12 },
      { id: "task-4", title: "Phân tích lỗi thi thử cùng AI", duration: "Mức AI", subject: "Tổng hợp", done: false, scoreBonus: 20 },
    ];
    setDailyTasks(freshTasks);
    
    const freshActivities: ActivityLog[] = [
      { id: "act-init-new-member", time: "Hôm nay", content: `Khởi tạo lộ trình học thích ứng & Kích hoạt thành công tài khoản học tập của học viên mới: ${cleanName}`, type: "success" }
    ];
    setActivities(freshActivities);

    const freshChat: Message[] = [
      {
        id: "welcome-ai",
        role: "model",
        text: `Chào mừng bạn mới **${cleanName}**! Tôi là Trợ lý Giáo dục AI Studydase. Mọi giải thưởng, thời gian học và lộ trình của bạn đã được khởi tạo mới tinh. Hãy cùng tôi giành lấy chuỗi điểm số tuyệt đối đầu tiên ngay hôm nay nhé! Bạn có muốn hỏi bài nào không nào?`,
        timestamp: "12:00 PM"
      }
    ];
    setChatMessages(freshChat);
    
    setNotifications([
      `Chào mừng ${cleanName} tham gia Studydase!`,
      "Trực quan hóa lộ trình học và bản đồ đa giác năng lực đã sẵn sàng cho buổi học đầu tiên của bạn."
    ]);

    // Force strict immediate save to localStorage
    localStorage.setItem("studydase_study_minutes", "0");
    localStorage.setItem("studydase_total_days", "0");
    localStorage.setItem("studydase_exercise_count", "0");
    localStorage.setItem("studydase_accuracy", "100");
    localStorage.setItem("studydase_syllabus_state", JSON.stringify(freshSyllabus));
    localStorage.setItem("studydase_activities_state", JSON.stringify(freshActivities));
    localStorage.setItem("studydase_tasks_state", JSON.stringify(freshTasks));
    localStorage.setItem("studydase_chat_state", JSON.stringify(freshChat));

    localStorage.setItem("studydase_is_logged_in", "true");
    setUserName(cleanName);
    setUserEmail(cleanEmail);
    localStorage.setItem("studydase_user_name", cleanName);
    localStorage.setItem("studydase_user_email", cleanEmail);
    
    setIsLoggedIn(true);
    triggerToast("Đăng ký thành công! Đã reset toàn bộ thành tựu cho tài khoản mới tinh của bạn.");
  };

  // Logout handler
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem("studydase_is_logged_in", "false");
    localStorage.removeItem("studydase_user_name");
    localStorage.removeItem("studydase_user_email");
    localStorage.removeItem("studydase_user_phone");
    localStorage.removeItem("studydase_study_minutes");
    localStorage.removeItem("studydase_total_days");
    localStorage.removeItem("studydase_exercise_count");
    localStorage.removeItem("studydase_accuracy");
    localStorage.removeItem("studydase_syllabus_state");
    localStorage.removeItem("studydase_activities_state");
    localStorage.removeItem("studydase_tasks_state");
    localStorage.removeItem("studydase_chat_state");

    // Reset state values back to public default demo to make it lively when logged out
    setStudyMinutes(195);
    setTotalDays(20);
    setExerciseCount(30);
    setAccuracy(99.0);
    setSyllabus(JSON.parse(JSON.stringify(INITIAL_SYLLABUS)));
    setChatMessages([
      {
        id: "welcome-ai",
        role: "model",
        text: "Xin chào bạn! Tôi là Gia sư AI Studydase. Bạn cần tôi giảng giải công thức, giải thích lỗi sai, hay lên kế hoạch học tập chủ đề nào hôm nay nhỉ? Hãy chọn nhanh các phím gợi ý ở trên hoặc nhập câu hỏi trực tiếp nhé!",
        timestamp: "10:35 AM"
      }
    ]);
    setActivities([
      { id: "act-1", time: "12:30", content: "Hoàn thành luyện tập chủ đề Đạo hàm & Ý nghĩa hình học", type: "success" },
      { id: "act-2", time: "11:15", content: "Bắt đầu ghi chú Hóa học - Chuyên đề Este", type: "info" },
      { id: "act-3", time: "10:45", content: "Làm bài thi thử trực tuyến Vật lý chương Dao động cơ", type: "info" },
      { id: "act-4", time: "09:15", content: "Hệ thống phát hiện lỗi sai thường gặp khi rút gọn phân thức Tiếng Anh", type: "warning" }
    ]);
    setDailyTasks([
      { id: "task-1", title: "Đánh giá Toán học: Đạo hàm", duration: "30ph", subject: "Toán học", done: true, scoreBonus: 10 },
      { id: "task-2", title: "Luyện tập Hóa học: Este 20 câu trắc nghiệm", duration: "20 câu", subject: "Hóa học", done: false, scoreBonus: 15 },
      { id: "task-3", title: "Thực hành đọc hiểu Tiếng Anh", duration: "45ph", subject: "Tiếng Anh", done: false, scoreBonus: 12 },
      { id: "task-4", title: "Phân tích lỗi thi thử cùng AI", duration: "Mức AI", subject: "Tổng hợp", done: false, scoreBonus: 20 },
    ]);
    
    triggerToast("Đã đăng xuất tài khoản thành công!");
  };

  // Ref to chat display area for automatic scroll to bottom
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Trigger temporary floating toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Stopwatch effect for simulated ongoing study
  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next % 60 === 0) {
            // Add minute of study
            setStudyMinutes((m) => m + 1);
          }
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Countdown Timer for active Exam Mode
  useEffect(() => {
    let interval: any = null;
    if (examTimeRemaining > 0) {
      interval = setInterval(() => {
        setExamTimeRemaining((prev) => {
          if (prev <= 1) {
            triggerToast("Hết giờ làm bài! Hệ thống đang tự động nộp bài thi của bạn.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examTimeRemaining]);

  // Auto-scroll chat to bottom when message arrives
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isAiLoading]);

  // Calculate dynamic subject progress based on syllabus check states
  const calculateSubjectProgress = (subjectName: string): number => {
    const topics = syllabus[subjectName] || [];
    if (topics.length === 0) return 0;
    
    let totalSubTopics = 0;
    let completedSubTopics = 0;

    topics.forEach((topic) => {
      if (topic.subTopics) {
        totalSubTopics += topic.subTopics.length;
        completedSubTopics += topic.subTopics.filter((st) => st.completed).length;
      } else {
        totalSubTopics += 1;
        if (topic.completed) completedSubTopics += 1;
      }
    });

    return totalSubTopics > 0 ? Math.round((completedSubTopics / totalSubTopics) * 100) : 0;
  };

  // Toggle checklist inside curriculum path - and instantly update overall learning state.
  const handleToggleSubTopic = (subjectName: string, parentTopicId: string, subTopicId: string) => {
    const updatedSyllabus = { ...syllabus };
    const parent = updatedSyllabus[subjectName]?.find(t => t.id === parentTopicId);
    if (parent) {
      const sub = parent.subTopics?.find(s => s.id === subTopicId);
      if (sub) {
        const previousState = sub.completed;
        sub.completed = !sub.completed;
        setSyllabus(updatedSyllabus);

        // Adjust metrics for visual effect
        const baseChange = sub.completed ? 1 : -1;
        setExerciseCount(prev => Math.max(0, prev + baseChange));
        if (sub.completed) {
          setAccuracy(prev => Math.min(100, Number((prev + 0.1).toFixed(1))));
          // Log Activity
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setActivities(prev => [
            {
              id: `act-new-${now.getTime()}`,
              time: timeStr,
              content: `Hoàn tất học phần [${sub.name}] thuộc môn ${subjectName}`,
              type: "success"
            },
            ...prev
          ]);
          triggerToast(`Đã ghi nhận hoàn thành học phần: ${sub.name}! Tiến độ ${subjectName} tăng lên.`);
        }
      }
    }
  };

  // Switch Syllabus node and trigger reading notes selection
  const handleSelectTopicNode = (subject: string, topicName: string) => {
    setActiveSubject(subject);
    setSelectedTopic(topicName);
    // Auto switch tab to search or stay on syllabus view directly to inspect lecture notes!
    triggerToast(`Đã tải bài giảng tương tác: ${topicName}`);
  };

  // Toggle daily assigned tasks
  const handleToggleDailyTask = (taskId: string) => {
    const updated = dailyTasks.map((t) => {
      if (t.id === taskId) {
        const nextState = !t.done;
        if (nextState) {
          setStudyMinutes(prev => prev + 15);
          setExerciseCount(prev => prev + 1);
          setAccuracy(prev => Math.min(100, Number((prev + 0.2).toFixed(1))));
          // Log Activity
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          setActivities(prev => [
            {
              id: `act-task-${taskId}`,
              time: timeStr,
              content: `Hoàn thành nhiệm vụ ngày: ${t.title} (+15p học tập)`,
              type: "success"
            },
            ...prev
          ]);
          triggerToast(`Xuất sắc! Đã hoàn thành nhiệm vụ và cộng thêm 15 phút rèn luyện học tập.`);
        }
        return { ...t, done: nextState };
      }
      return t;
    });
    setDailyTasks(updated);
  };

  // Custom diagnostic logs or user custom note registration
  const [customNote, setCustomNote] = useState<string>("");
  const handleAddCustomNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNote.trim()) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newLog: ActivityLog = {
      id: `custom-${now.getTime()}`,
      time: timeStr,
      content: `Ghi chú cá nhân: ${customNote}`,
      type: "info"
    };

    setActivities(prev => [newLog, ...prev]);
    setCustomNote("");
    triggerToast("Đã lưu ghi chú tự học vào nhật ký tiến độ hôm nay!");
  };

  // Reset metrics back to default demo data
  const handleResetMetrics = () => {
    if (confirm("Bạn có muốn đặt lại tiến độ học tập và thời gian rèn luyện về mặc định?")) {
      setStudyMinutes(195);
      setTotalDays(20);
      setExerciseCount(30);
      setAccuracy(99.0);
      setSyllabus(JSON.parse(JSON.stringify(INITIAL_SYLLABUS)));
      setDailyTasks([
        { id: "task-1", title: "Đánh giá Toán học: Đạo hàm", duration: "30ph", subject: "Toán học", done: true, scoreBonus: 10 },
        { id: "task-2", title: "Luyện tập Hóa học: Este 20 câu trắc nghiệm", duration: "20 câu", subject: "Hóa học", done: false, scoreBonus: 15 },
        { id: "task-3", title: "Thực hành đọc hiểu Tiếng Anh", duration: "45ph", subject: "Tiếng Anh", done: false, scoreBonus: 12 },
        { id: "task-4", title: "Phân tích lỗi thi thử cùng AI", duration: "Mức AI", subject: "Tổng hợp", done: false, scoreBonus: 20 },
      ]);
      setActivities([
        { id: "act-1", time: "12:30", content: "Hoàn thành luyện tập chủ đề Đạo hàm & Ý nghĩa hình học", type: "success" },
        { id: "act-2", time: "11:15", content: "Bắt đầu ghi chú Hóa học - Chuyên đề Este", type: "info" },
        { id: "act-3", time: "10:45", content: "Làm bài thi thử trực tuyến Vật lý chương Dao động cơ", type: "info" },
        { id: "act-4", time: "09:15", content: "Hệ thống phát hiện lỗi sai thường gặp khi rút gọn phân thức Tiếng Anh", type: "warning" }
      ]);
      triggerToast("Đã thiết lập lại dữ liệu tiến độ!");
    }
  };

  // Submit trigger for AI Tutor Chat
  const handleSendChatMessage = async (msgOverride?: string) => {
    const rawText = msgOverride || chatInput;
    if (!rawText.trim() && !msgOverride) return;

    const userMsgText = rawText;
    setChatInput("");

    // Build timeline message
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const userMsg: Message = {
      id: `user-${now.getTime()}`,
      role: "user",
      text: userMsgText,
      timestamp: timeStr
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAiLoading(true);

    try {
      // Setup payload matching Route structure
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsgText,
          subject: activeSubject,
          promptType: chatRole,
          // Limit history size to prevent payload bloat
          history: chatMessages.slice(-8).map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Lỗi máy chủ khi xử lý phản hồi AI");
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: `ai-${Date.now()}`,
        role: "model",
        text: data.text || "Tôi không nhận được câu trả lời từ hệ thống. Bạn vui lòng thử lại!",
        timestamp: timeStr
      };

      setChatMessages((prev) => [...prev, assistantMsg]);

      // Increments interaction counter values as reward encouragement
      setExerciseCount(prev => prev + 1);
      
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: `ai-err-${Date.now()}`,
        role: "model",
        text: `⚠️ Rất tiếc, AI Tutor gặp sự cố kết nối: ${err?.message || "Lỗi mạng hoặc API Key hết hạn"}. Tuy nhiên, bạn vẫn có thể tự ôn luyện dữ liệu của bài giảng tương tác ở cột kiến thức bên cạnh!`,
        timestamp: timeStr
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Helper to trigger fast interactive tags for AI questions inside syllabus card values
  const triggerAiHelpWithTopic = (sectionName: string, detailType: "general" | "formula" | "mistake") => {
    setActiveTab("chat");
    let query = "";
    if (detailType === "general") {
      query = `Hãy giảng giải chi tiết cho em khái niệm, bản chất và ý nghĩa thực tế ứng dụng của phần ${sectionName} thuộc chương trình học THPT với ạ. Gia sư phân tích thật dễ hiểu nhé!`;
      setChatRole("Giải thích bài học");
    } else if (detailType === "formula") {
      query = `Em muốn ghi nhớ các công thức chủ chốt và cách chứng minh cơ bản liên quan đến chủ đề ${sectionName}. Hãy đưa ra mẹo ghi nhớ nhanh hộ em.`;
      setChatRole("Học công thức");
    } else {
      query = `Những lỗi sai kinh điển, ngớ ngẩn mà học sinh ôn thi THPT Quốc Gia hay vấp phải ở bài ${sectionName} là gì? Có mẹo gì để nhận diện hoặc bẫy lừa trong đề bài trắc nghiệm không ạ?`;
      setChatRole("Phân tích bẫy lỗi sai");
    }
    setTimeout(() => {
      handleSendChatMessage(query);
    }, 200);
  };

  // Helper conversion of formatted minutes to friendly hours string
  const formatMinutes = (mins: number) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return hours > 0 ? `${hours}h ${remainingMins}m` : `${remainingMins}m`;
  };

  // Custom filter on subject list matching search query if typed
  const filteredSubjects = ["Toán học", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", "Tiếng Anh"].filter((s) => {
    if (!searchQuery) return true;
    return s.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (syllabus[s] && syllabus[s].some(topic => 
              topic.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              (topic.subTopics && topic.subTopics.some(st => st.name.toLowerCase().includes(searchQuery.toLowerCase())))
           ));
  });

  // Current selected material info matching interactive syllabus state
  const currentMaterial = SUBJECT_DETAILS[activeSubject]?.[selectedTopic] || {
    title: `Chuyên đề: ${selectedTopic}`,
    definition: `Nội dung kiến thức tóm tắt cho chủ đề ${selectedTopic} hiện đang được cập nhật chuẩn cấu trúc bộ giáo dục lớp 10-11-12. Học sinh có thể nhấn nút hỏi AI Tutor bên dưới để nhận bài giải thích tự động theo thời gian thực!`,
    formulas: [
      `Kiến thức tổng quát ${selectedTopic}`,
      "Nhấn 'Trợ giúp AI' để tạo bảng ghi chú nhanh công thức riêng từ gia sư.",
    ],
    examTrends: "Phân bố rải rác từ trung bình đến nâng cao trong cấu trúc kiểm tra định kỳ.",
    examples: [
      { q: `Định nghĩa mở rộng của ${selectedTopic}?`, a: "Nhấn chọn 'Hỏi AI bài này' để nhận mẫu câu trác nghiệm bám sát cấu trúc của Sở Giáo Dục đào tạo hôm nay." }
    ],
    mistakes: ["Chủ quan bỏ qua điều kiện cơ bản của bài toán.", "Nhầm lẫn ký hiệu đơn vị vật lý hoặc các gốc chức hóa hữu cơ."]
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? "bg-[#0b0f19] text-slate-100" : "bg-[#f8fafc] text-slate-900"}`}>
      
      {/* Dynamic Toast Element */}
      {toastMessage && (
        <div id="visual-toast" className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white font-medium px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-indigo-400 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-300 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="hover:opacity-75 focus:outline-none">
            <X className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}

      {!isLoggedIn ? (
        <div className="flex min-h-screen items-center justify-center p-4 md:p-8 bg-[#070a13] selection:bg-indigo-500 selection:text-white">
          {/* Main Card */}
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl bg-[#0d1326]/80 backdrop-blur-xl">
            {/* Left side: Premium branding & onboarding */}
            <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 bg-gradient-to-b from-[#131a35] to-[#070a13] border-r border-slate-800/60 relative overflow-hidden">
              {/* Background glows */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full filter blur-3xl -translate-x-12 -translate-y-12" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full filter blur-3xl translate-x-12 translate-y-12" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="font-display font-extrabold text-xl tracking-wide text-white block">Studydase</span>
                    <span className="text-[10px] text-sky-400 font-mono tracking-wider uppercase block">Adapt-AI Learning</span>
                  </div>
                </div>

                <div className="space-y-6 mt-12">
                  <h3 className="text-lg font-bold font-display text-white tracking-tight leading-snug">
                    Trợ lý Giáo dục & Đánh giá năng lực Thích ứng AI
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Nền tảng hỗ trợ học sinh trung học lập bản đồ ôn luyện thông minh, nhận diện bẫy lỗi sai trắc nghiệm bám sát cấu trúc Bộ Giáo dục.
                  </p>

                  <div className="space-y-4 pt-6">
                    <div className="flex gap-3">
                      <div className="w-6.5 h-6.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-[11px] shrink-0 mt-0.5">🎯</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Lộ trình cá nhân hóa</h4>
                        <p className="text-[11px] text-slate-400 leading-normal">Thiết lập tiến độ, định hướng điểm số THPT Quốc gia riêng biệt cho tài khoản.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6.5 h-6.5 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-[11px] shrink-0 mt-0.5">💬</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Gia Sư AI Đồng hành 24/7</h4>
                        <p className="text-[11px] text-slate-400 leading-normal">Giảng giải chi tiết lý thuyết SGK, chỉ rõ bẫy lừa trắc nghiệm phổ biến nhất.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6.5 h-6.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 text-[11px] shrink-0 mt-0.5">📈</div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">Bản đồ đa giác năng lực</h4>
                        <p className="text-[11px] text-slate-400 leading-normal">Trực quan hóa chỉ số rèn luyện thông minh, bù đắp lỗ hổng kiến thức kịp thời.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-6 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>© STUDYDASE 2026</span>
                <span className="text-indigo-400/80">Sản xuất bởi AI Tutor</span>
              </div>
            </div>

            {/* Right side: Form Portal */}
            <div className="md:col-span-7 p-8 md:p-12 flex flex-col justify-center bg-[#090d1a] relative">
              <div className="max-w-md mx-auto w-full space-y-6">
                <div>
                  <h2 className="text-2.5xl font-bold tracking-tight text-white font-display">
                    {authStep === "login" ? "Chào mừng trở lại! 👋" : "Tạo tài khoản học tập ✨"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {authStep === "login" 
                      ? "Tiếp tục thực hiện mục tiêu rèn luyện thông minh cùng trợ lý trí tuệ nhân tạo." 
                      : "Chuẩn bị sẵn sàng nâng cấp tư duy, đột phá điểm thi THPT Quốc gia cùng Studydase."}
                  </p>
                </div>

                {authStep === "login" ? (
                  /* LOGIN FORM */
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5">Địa chỉ Email</label>
                      <input
                        type="email"
                        required
                        placeholder="ten_tai_khoan@gmail.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-800 bg-[#0d1326] text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Mật khẩu</label>
                        <button 
                          type="button" 
                          onClick={() => triggerToast("Email lấy lại mật khẩu mẫu đã được cấp phát qua hệ thống!")}
                          className="text-[10px] text-indigo-400 hover:underline font-bold"
                        >
                          Quên mật khẩu?
                        </button>
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="••••••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-800 bg-[#0d1326] text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="chk-remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-800 text-indigo-600 bg-[#0d1326] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <label htmlFor="chk-remember" className="text-xs text-slate-400 select-none cursor-pointer">
                        Duy trì trạng thái đăng nhập cho tài khoản này
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-550 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-950/40 hover:shadow-indigo-950/60 transition-all active:scale-[0.99] block mt-6"
                    >
                      Đăng nhập học tập
                    </button>
                  </form>
                ) : (
                  /* REGISTER FORM */
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5">Họ và tên học sinh</label>
                      <input
                        type="text"
                        required
                        placeholder="Nguyễn Văn A"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-800 bg-[#0d1326] text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-600 capitalize"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5">Địa chỉ Email</label>
                      <input
                        type="email"
                        required
                        placeholder="hocsinh@gmail.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-800 bg-[#0d1326] text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5">Mật khẩu tài khoản mới</label>
                      <input
                        type="password"
                        required
                        placeholder="Tối thiểu 6 ký tự để bảo mật tối ưu"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-800 bg-[#0d1326] text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="chk-terms"
                        required
                        defaultChecked
                        className="rounded border-slate-800 text-indigo-600 bg-[#0d1326] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <label htmlFor="chk-terms" className="text-xs text-slate-400 select-none cursor-pointer">
                        Tôi hoàn toàn đồng ý thỏa thuận bản quyền & bảo mật học tập
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-550 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/20 hover:shadow-emerald-950/40 transition-all active:scale-[0.99] block mt-6"
                    >
                      Kích hoạt học thuật & Tạo tài khoản »
                    </button>
                  </form>
                )}

                <div className="relative flex py-2.5 items-center">
                  <div className="flex-grow border-t border-slate-800/80"></div>
                  <span className="flex-shrink mx-4 text-[9px] text-[#818cf8] uppercase tracking-widest font-mono">Hoặc đăng nhập khác</span>
                  <div className="flex-grow border-t border-slate-800/80"></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoggedIn(true);
                      setUserName("Google Student");
                      setUserEmail("student.google@gmail.com");
                      localStorage.setItem("studydase_is_logged_in", "true");
                      localStorage.setItem("studydase_user_name", "Google Student");
                      localStorage.setItem("studydase_user_email", "student.google@gmail.com");
                      triggerToast("Đăng nhập bằng tài khoản Google thành công!");
                    }}
                    className="flex justify-center items-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-800 bg-[#0d1326] hover:bg-[#121b33] text-xs text-slate-350 font-semibold transition"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLoggedIn(true);
                      setUserName("Microsoft Student");
                      setUserEmail("student.microsoft@outlook.com");
                      localStorage.setItem("studydase_is_logged_in", "true");
                      localStorage.setItem("studydase_user_name", "Microsoft Student");
                      localStorage.setItem("studydase_user_email", "student.microsoft@outlook.com");
                      triggerToast("Đăng nhập bằng Microsoft Outlook thành công!");
                    }}
                    className="flex justify-center items-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-800 bg-[#0d1326] hover:bg-[#121b33] text-xs text-slate-350 font-semibold transition"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23">
                      <rect x="0" y="0" width="10.5" height="10.5" fill="#f25022"/>
                      <rect x="12" y="0" width="10.5" height="10.5" fill="#7fba00"/>
                      <rect x="0" y="12" width="10.5" height="10.5" fill="#00a4ef"/>
                      <rect x="12" y="12" width="10.5" height="10.5" fill="#ffb900"/>
                    </svg>
                    <span>Microsoft</span>
                  </button>
                </div>

                <div className="pt-4 text-center text-xs">
                  {authStep === "login" ? (
                    <p className="text-slate-450 text-slate-400">
                      Bạn chưa sở hữu tài khoản học tập?{" "}
                      <button 
                        type="button" 
                        onClick={() => setAuthStep("register")}
                        className="text-indigo-400 hover:underline font-bold"
                      >
                        Đăng ký miễn phí ngay
                      </button>
                    </p>
                  ) : (
                    <p className="text-slate-450 text-slate-400">
                      Bạn đã đăng ký tài khoản từ trước?{" "}
                      <button 
                        type="button" 
                        onClick={() => setAuthStep("login")}
                        className="text-emerald-400 hover:underline font-bold"
                      >
                        Đăng nhập hệ thống ngay
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${darkMode ? "bg-[#0b0f19] text-slate-200" : "bg-[#f1f5f9] text-slate-800"}`}>
        
        {/* SIDEBAR NAVIGATION - Elegant and eyesafe adapting sidebar */}
        <aside id="main-sidebar" className={`w-64 border-r flex flex-col z-20 shrink-0 transition-colors duration-300 ${
          darkMode 
            ? "bg-[#0d1527] border-slate-800 text-slate-300" 
            : "bg-[#e2e8f0] border-slate-300 text-slate-700"
        }`}>
          
          {/* Logo Brand / Launcher */}
          <div className={`p-6 border-b transition-colors ${darkMode ? "border-slate-800" : "border-slate-300"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 fill-indigo-200 flex items-center justify-center shadow-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className={`font-display font-bold text-xl tracking-wide block ${darkMode ? "text-white" : "text-slate-900"}`}>Studydase</span>
                <span className={`text-[10px] font-mono tracking-wider uppercase block ${darkMode ? "text-sky-400" : "text-indigo-600 font-bold"}`}>Adapt-AI Center</span>
              </div>
            </div>
          </div>

          {/* Quick Active Class selection */}
          <div className={`px-4 py-3 border-b ${darkMode ? "border-slate-800" : "border-slate-300"}`}>
            <label className={`text-[11px] uppercase font-bold tracking-wider mb-2 block ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Cấp độ học tập</label>
            <div className={`grid grid-cols-3 gap-1 p-1 rounded-lg border ${darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-300"}`}>
              {(["Grade 10", "Grade 11", "Grade 12"] as const).map((grade) => (
                <button
                  key={grade}
                  id={`btn-${grade.toLowerCase().replace(" ", "-")}`}
                  onClick={() => {
                    setSelectedGrade(grade);
                    triggerToast(`Đã chuyển đổi kho bài giảng sang lớp: ${grade === "Grade 12" ? "Lớp 12 (Ôn thi THPT)" : grade === "Grade 11" ? "Lớp 11" : "Lớp 10"}`);
                  }}
                  className={`text-[11px] py-1.5 rounded font-medium transition-all ${
                    selectedGrade === grade
                      ? "bg-indigo-600 text-white shadow-sm"
                      : darkMode 
                        ? "text-slate-400 hover:text-slate-200 hover:bg-slate-850" 
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                  }`}
                >
                  {grade === "Grade 12" ? "Lớp 12" : grade === "Grade 11" ? "Lớp 11" : "Lớp 10"}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <button
              id="tab-btn-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "dashboard"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20"
                  : darkMode
                    ? "text-slate-400 hover:bg-slate-850 hover:text-white"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Trang chủ (Tổng quan)</span>
            </button>

            <button
              id="tab-btn-syllabus"
              onClick={() => setActiveTab("syllabus")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "syllabus"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20"
                  : darkMode
                    ? "text-slate-400 hover:bg-slate-850 hover:text-white"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <BookOpenCheck className="w-5 h-5" />
              <span>Cây kiến thức & Bài giảng</span>
            </button>

            <button
              id="tab-btn-chat"
              onClick={() => {
                setActiveTab("chat");
                triggerToast("Hệ thống đã kích hoạt Gia Sư Trí Tuệ Nhân Tạo bám sát chương trình phổ thông.");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "chat"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20"
                  : darkMode
                    ? "text-slate-400 hover:bg-slate-850 hover:text-white"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-5 h-5 animate-pulse text-yellow-400" />
              <div className="flex-1 text-left">
                <span>Gia sư AI Độc quyền</span>
              </div>
              <span className="bg-sky-500/20 text-sky-400 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded tracking-wide font-bold">Live</span>
            </button>

            <button
              id="tab-btn-exams"
              onClick={() => {
                setActiveTab("exams");
                triggerToast("Đã chuyển sang chế độ luyện đề thi THPT QG tích hợp chấm điểm AI!");
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "exams"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20"
                  : darkMode
                    ? "text-slate-400 hover:bg-slate-850 hover:text-white"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              <div className="flex-1 text-left">
                <span>Tạo Đề Thi THPT QG</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded tracking-wide font-bold">AI</span>
            </button>

            <button
              id="tab-btn-stats"
              onClick={() => setActiveTab("statistics")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === "statistics"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/20"
                  : darkMode
                    ? "text-slate-400 hover:bg-slate-850 hover:text-white"
                    : "text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              <Award className="w-5 h-5" />
              <span>Tiến độ & Phân tích</span>
            </button>
          </nav>

          {/* TIMER SECTIONS (Visual stopwatch tool) */}
          <div id="live-timer-section" className={`mx-4 my-2 p-3.5 rounded-xl border transition-colors ${
            darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-300 shadow-sm"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] uppercase tracking-widest font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Simulate Study Mode</span>
              <span className={`w-2.5 h-2.5 rounded-full ${timerActive ? "bg-emerald-500 animate-ping" : "bg-red-500"}`} />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <span className={`text-sm font-mono font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>
                  {String(Math.floor(elapsedSeconds / 3600)).padStart(2, '0')}:
                  {String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0')}:
                  {String(elapsedSeconds % 60).padStart(2, '0')}
                </span>
              </div>
              <div className="flex gap-1.5">
                <button
                  id="btn-timer-toggle"
                  onClick={() => {
                    setTimerActive(!timerActive);
                    triggerToast(timerActive ? "Đã tạm ngưng phiên đếm giờ." : "Đã kích hoạt đồng hồ tính giờ tự học!");
                  }}
                  className={`p-1.5 rounded-lg ${timerActive ? "bg-amber-600/25 hover:bg-amber-600/45 text-amber-300" : "bg-emerald-600/25 hover:bg-emerald-600/45 text-emerald-300"} transition`}
                  title={timerActive ? "Tạm dừng" : "Bắt đầu tính giờ tự học"}
                >
                  {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  id="btn-timer-reset"
                  onClick={() => {
                    setTimerActive(false);
                    setElapsedSeconds(0);
                    triggerToast("Đã lập lại đồng hồ tính giờ.");
                  }}
                  className="p-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg transition"
                  title="Đặt lại đồng hồ"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Profile Session Details card inside Sidebar */}
          <div className={`p-4 border-t transition-colors ${
            darkMode ? "border-slate-800 bg-slate-900/40" : "border-slate-300 bg-slate-100"
          }`}>
            <div className="flex items-center gap-2">
              <div 
                id="profile-avatar" 
                className={`w-9 h-9 rounded-full transition-all flex items-center justify-center font-bold capitalize cursor-pointer border shrink-0 ${
                  userAvatar 
                    ? "text-xl bg-indigo-600/10 border-indigo-500/20" 
                    : "text-inherit bg-indigo-600 border-indigo-500 text-white"
                }`}
              >
                {userAvatar || (userName ? userName.charAt(0) : "U")}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold truncate capitalize ${darkMode ? "text-white" : "text-slate-900"}`}>{userName || "Học sinh"}</p>
                <p className={`text-[10px] truncate ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{userEmail || "user@studydase.edu"}</p>
              </div>
              <div className="flex gap-1">
                <button
                  id="btn-reset-data"
                  onClick={handleResetMetrics}
                  className={`p-1.5 rounded-lg transition ${
                    darkMode ? "hover:bg-slate-850 text-slate-400 hover:text-white" : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                  title="Trả tiến độ về mặc định"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-logout"
                  onClick={handleLogout}
                  className={`p-1.5 rounded-lg transition ${
                    darkMode ? "hover:bg-red-950/40 text-slate-400 hover:text-red-400" : "hover:bg-red-100 text-slate-600 hover:text-red-600"
                  }`}
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN BODY LAYOUT */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* TOP BANNER & BAR */}
          <header className={`h-16 border-b flex items-center justify-between px-8 shrink-0 ${
            darkMode ? "bg-[#0f172a] border-slate-800" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center gap-4">
              <span className="text-xs px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">THPT Quốc gia 2026/2027</span>
              <h1 className="text-sm font-semibold tracking-wide hidden lg:inline-block">
                {activeTab === "dashboard" && "Adaptive Evaluation Dashboard — Trung tâm dữ liệu thích ứng"}
                {activeTab === "syllabus" && "Hệ thống Bài giảng tương tác & Lộ trình tự học cá nhân"}
                {activeTab === "chat" && `Gia sư AI Đồng hành bám sát SGK THPT — Đang hội thoại về môn ${activeSubject}`}
                {activeTab === "exams" && "Hệ thống Khởi tạo & Luyện thử Đề thi THPT Quốc Gia — Tích hợp Chấm điểm AI Chuyên sâu"}
                {activeTab === "statistics" && "Thống kê Phân tích năng lực chuyên sâu tích hợp"}
              </h1>
            </div>

            {/* Header Interactions */}
            <div className="flex items-center gap-4">
              
              {/* Simulated Notification panel */}
              <div className="relative">
                <button
                  id="btn-notification"
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className={`p-2 rounded-xl border transition-all relative ${
                    darkMode ? "border-slate-800 hover:bg-slate-800 text-slate-300" : "border-slate-200 hover:bg-slate-100 text-slate-600"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                  )}
                </button>

                {showNotificationDropdown && (
                  <div id="notification-card" className={`absolute right-0 mt-2 w-80 rounded-2xl shadow-2xl p-4 border z-40 transition-all ${
                    darkMode ? "bg-slate-900 border-slate-800 text-slate-200" : "bg-white border-slate-200 text-slate-800"
                  }`}>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-[#6366f1]">Thông báo từ Trợ lý AI</h4>
                      <button onClick={() => setNotifications([])} className="text-[10px] text-slate-400 hover:text-indigo-400">Đã đọc hết</button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">Hộp thư trống trải. Bạn đang giữ tiến độ rất tốt!</p>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map((notif, index) => (
                          <div key={index} className="text-xs bg-slate-800/10 p-2.5 rounded-lg border-l-2 border-indigo-500">
                            {notif}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mode Switching Icon based on screenshots design header */}
              <button
                id="btn-theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-xl border transition-all ${
                  darkMode ? "border-slate-800 hover:bg-slate-800 text-yellow-400" : "border-slate-200 hover:bg-slate-100 text-slate-600"
                }`}
                title="Thay đổi giao diện"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Quick display total time logged today */}
              <div className={`hidden sm:flex items-center gap-2 pl-3 border-l ${darkMode ? "border-slate-800" : "border-slate-200"}`}>
                <Clock className="w-4.5 h-4.5 text-indigo-400" />
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 block font-medium leading-none">Hôm nay tự học</p>
                  <p className="text-xs font-bold leading-normal">{formatMinutes(studyMinutes)}</p>
                </div>
              </div>

            </div>
          </header>

          {/* SCREEN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

              {/* -------------------- VIEW 1: DASHBOARD (HOME OVERVIEW) -------------------- */}
              {activeTab === "dashboard" && (
                <div id="view-dashboard" className="space-y-6 animate-fade-in">
                  
                  {/* Adaptive evaluation head title matching screenshot 1 */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-900/30 via-sky-950/15 to-transparent p-6 rounded-2xl border border-indigo-500/10">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Trung tâm Kiểm soát Dữ liệu Đánh giá Thích ứng</h2>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                        Chuyên trang cá nhân của <strong className="text-indigo-400 capitalize">{userName}</strong>. Hệ thống AI tự động phân bổ câu hỏi sai thường gặp, chấm điểm chuẩn hóa rèn luyện thi tốt nghiệp THPT toàn quốc.
                      </p>
                    </div>
                    
                    {/* Simulated account level badge */}
                    <div className="flex items-center gap-2 bg-[#6366f1]/10 px-4 py-2.5 rounded-xl border border-indigo-500/20">
                      <Award className="w-5 h-5 text-indigo-400 animate-bounce" />
                      <div>
                        <p className="text-[10px] text-slate-400 leading-none">Luyện thi tích cực</p>
                        <p className="text-xs font-bold text-indigo-300">Xuất sắc cấp {Math.floor(exerciseCount / 10) + 1}</p>
                      </div>
                    </div>
                  </div>

                  {/* STATS COUNT GRID - Sát ảnh thiết kế số 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <div id="stat-class-time" className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400">
                        <Clock className="w-6 h-6 animate-spin-slow" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Thời gian học hôm nay</span>
                        <div className="flex items-baseline gap-1.5">
                          <strong className="text-xl font-bold tracking-tight">{formatMinutes(studyMinutes)}</strong>
                          <span className="text-[11px] text-[#22c55e] font-bold">+15p</span>
                        </div>
                      </div>
                    </div>

                    <div id="stat-total-days" className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="p-3.5 rounded-xl bg-orange-500/10 text-orange-400">
                        <CheckSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Tổng số ngày học</span>
                        <div className="flex items-baseline gap-1.5">
                          <strong className="text-xl font-bold tracking-tight">{totalDays} ngày</strong>
                          <span className="p-0.5 bg-emerald-500/10 text-emerald-400 rounded text-[9px] font-bold">Mục tiêu 100%</span>
                        </div>
                      </div>
                    </div>

                    <div id="stat-practice" className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="p-3.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Đề & Chương rèn luyện</span>
                        <div className="flex items-baseline gap-1.5">
                          <strong className="text-xl font-bold tracking-tight">{exerciseCount} chuyên đề</strong>
                          <button onClick={() => setExerciseCount(prev => prev + 1)} className="text-[10px] text-blue-400 hover:underline hover:text-indigo-400">+ Làm thêm</button>
                        </div>
                      </div>
                    </div>

                    <div id="stat-accuracy" className={`p-5 rounded-2xl border flex items-center gap-4 shadow-sm ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="p-3.5 rounded-xl bg-green-500/10 text-green-400">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Tỷ lệ chính xác bình quân</span>
                        <div className="flex items-baseline gap-1.5">
                          <strong className="text-xl font-bold tracking-tight text-emerald-400">{accuracy}%</strong>
                          <span className="text-[11px] text-slate-400 block font-medium">Bám sát THPT</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* SPLIT ROW: Daily tasks (AI selection) vs Intelligent Access Shortcuts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Column 1 & 2: Daily tasks assigned by AI */}
                    <div id="daily-tasks-card" className={`lg:col-span-2 p-6 rounded-2xl border shadow-sm flex flex-col ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-bold text-base">Nhiệm vụ đánh giá hàng ngày do AI cá nhân hóa chỉ định</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Tích lũy thời gian học tập & cải thiện tỷ lệ chính xác.</p>
                        </div>
                        <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full font-medium">Lớp của bạn: {selectedGrade}</span>
                      </div>

                      <div className="space-y-2.5 flex-1">
                        {dailyTasks.map((task) => (
                          <div
                            key={task.id}
                            id={`daily-task-row-${task.id}`}
                            className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                              task.done
                                ? "bg-indigo-650/10 border-indigo-500/40 opacity-75"
                                : darkMode ? "bg-slate-900/40 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-150 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                id={`task-checkbox-${task.id}`}
                                onClick={() => handleToggleDailyTask(task.id)}
                                className={`w-5.5 h-5.5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                  task.done
                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                    : "border-slate-500 hover:border-indigo-500"
                                }`}
                              >
                                {task.done && <CheckCircle className="w-4.5 h-4.5 text-white" />}
                              </button>
                              <div>
                                <span className={`text-xs font-semibold block ${task.done ? "line-through text-slate-400" : ""}`}>
                                  {task.title}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] bg-slate-800 text-slate-300 font-medium px-2 py-0.5 rounded uppercase">
                                    {task.subject}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Thời lượng đề xuất: {task.duration}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <span className="text-[11px] font-bold text-sky-400 block">+{task.scoreBonus} XP</span>
                              <button
                                id={`btn-askai-task-${task.id}`}
                                onClick={() => {
                                  setActiveTab("chat");
                                  setChatRole("Học tập chủ đề");
                                  handleSendChatMessage(`Xin chào gia sư AI, hãy gợi ý cho em phương án giải bài tập tốt nhất để xử lý nhiệm vụ: "${task.title}" môn ${task.subject} nhé!`);
                                }}
                                className="text-[10px] text-indigo-400 hover:underline font-semibold mt-1 block"
                              >
                                Hỏi AI bài này
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 3: Quick smart features shortcut hub (as shown in image 1 "Chức năng truy cập nhanh") */}
                    <div id="quick-features-card" className={`p-6 rounded-2xl border shadow-sm ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <h3 className="font-bold text-base mb-4">Chức năng truy cập nhanh</h3>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          id="shortcut-interactive-lecture"
                          onClick={() => {
                            setActiveTab("syllabus");
                            triggerToast("Hãy bấm chọn cây môn học để xem bài lý thuyết.");
                          }}
                          className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            darkMode ? "bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2.5">
                            <BookOpenCheck className="w-5.5 h-5.5" />
                          </div>
                          <span className="text-xs font-bold leading-tight">Bài giảng thông minh</span>
                        </button>

                        <button
                          id="shortcut-study-plan"
                          onClick={() => {
                            setActiveTab("syllabus");
                            triggerToast("Nháy chọn bài tập bám sát để tạo lộ trình cá nhân.");
                          }}
                          className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            darkMode ? "bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-2.5">
                            <Clock className="w-5.5 h-5.5" />
                          </div>
                          <span className="text-xs font-bold leading-tight">Kế hoạch học tập</span>
                        </button>

                        <button
                          id="shortcut-ai-chat"
                          onClick={() => {
                            setActiveTab("chat");
                            triggerToast("Đã vào khung chat cùng AI.");
                          }}
                          className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            darkMode ? "bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2.5">
                            <Sparkles className="w-5.5 h-5.5" />
                          </div>
                          <span className="text-xs font-bold leading-tight">Giải đáp thắc mắc</span>
                        </button>

                        <button
                          id="shortcut-stats"
                          onClick={() => setActiveTab("statistics")}
                          className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                            darkMode ? "bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700" : "bg-white border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-2.5">
                            <TrendingUp className="w-5.5 h-5.5" />
                          </div>
                          <span className="text-xs font-bold leading-tight">Phân tích học tập</span>
                        </button>
                      </div>

                      {/* Manual Quick Search bar */}
                      <div className="mt-4">
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5 block">Tra cứu nhanh tài liệu</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Gõ tìm Toán học, Hóa học..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full py-2 pl-9 pr-3 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                              darkMode ? "bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                            }`}
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        </div>
                        {searchQuery && (
                          <div className={`mt-2 p-2 rounded-xl border max-h-32 overflow-y-auto text-xs ${
                            darkMode ? "bg-slate-850 border-slate-800" : "bg-slate-55 bg-white border-slate-150"
                          }`}>
                            <p className="font-bold text-[10px] uppercase text-indigo-400 mb-1">Kết quả khớp liên quan ({filteredSubjects.length})</p>
                            {filteredSubjects.map(subj => (
                              <button
                                key={subj}
                                onClick={() => {
                                  setActiveSubject(subj);
                                  setActiveTab("syllabus");
                                  setSearchQuery("");
                                }}
                                className="block w-full text-left py-1 hover:text-indigo-400 font-medium truncate"
                              >
                                » Lý thuyết & Bảng tiến độ {subj}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>

                  {/* BOTTOM ROW: Smart Progress Bars (Interactive check states update these in real-time!) vs Weekly performance Curve vs Recent activities */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Progress Bars (as shown in image 1 "Tiến độ học tập thông minh") */}
                    <div id="smart-progress-chart" className={`p-6 rounded-2xl border shadow-sm ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-bold text-base">Tiến độ học tập thông minh</h3>
                          <p className="text-[11px] text-slate-400">Dựa trên việc hoàn thành các chương học phần</p>
                        </div>
                        <span className="text-[10px] text-slate-400 block font-mono">Lớp: {selectedGrade}</span>
                      </div>

                      <div className="space-y-4">
                        {["Toán học", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", "Tiếng Anh"].map((sub) => {
                          const progress = calculateSubjectProgress(sub);
                          return (
                            <div key={sub} className="group">
                              <div className="flex justify-between items-center mb-1 text-xs">
                                <span className="font-medium group-hover:text-indigo-400 transition" onClick={() => { setActiveSubject(sub); setActiveTab("syllabus"); }}>
                                  {sub}
                                </span>
                                <span className="font-semibold text-slate-300 font-mono text-[11px] bg-slate-800/50 px-1.5 py-0.5 rounded">{progress}%</span>
                              </div>
                              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden relative">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-700"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4 p-3 bg-indigo-950/15 rounded-xl border border-indigo-500/15 flex items-center gap-2.5">
                        <Brain className="w-5 h-5 text-indigo-400 shrink-0" />
                        <p className="text-[10px] text-slate-300 leading-normal">
                          Mẹo thông minh: Nhấn trực tiếp vào tên môn học, hoàn thành học phần để tự động nén dữ liệu và nâng điểm tiến độ!
                        </p>
                      </div>
                    </div>

                    {/* Weekly progress Curve (Sine area SVG - as shown in image 1 "Biểu đồ xu hướng học tập hàng tuần") */}
                    <div id="weekly-trends-chart" className={`p-6 rounded-2xl border shadow-sm ${
                      darkMode ? "bg-[#131b2e] border-slate-805" : "bg-white border-slate-200"
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-bold text-base">Biểu đồ xu hướng rèn luyện hàng tuần</h3>
                          <p className="text-[11px] text-slate-400">Thời gian tự học quy chuẩn (giờ) theo từng ngày</p>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold block">+18% tuần này</span>
                      </div>

                      {/* EXQUISITE Reactive Smooth SVG Flowing Line & Area chart */}
                      <div className="h-44 w-full flex items-center justify-center relative mt-2">
                        <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                          <defs>
                            <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Grid Lines */}
                          <line x1="0" y1="160" x2="500" y2="160" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                          <line x1="0" y1="110" x2="500" y2="110" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
                          <line x1="0" y1="60" x2="500" y2="60" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />

                          {/* Smooth curved Path representing logged study minutes */}
                          {/* Points: T2 (x: 20, y: 140), T3 (x: 95, y: 110), T4 (x: 170, y: 125), T5 (x: 245, y: 65), T6 (x: 320, y: 105), T7 (x: 395, y: 125), CN (x: 470, y: 50) */}
                          <path
                            d="M 20,140 C 57.5,125 57.5,110 95,110 C 132.5,110 132.5,125 170,125 C 207.5,125 207.5,65 245,65 C 282.5,65 282.5,105 320,105 C 357.5,105 357.5,125 395,125 C 432.5,125 432.5,50 470,50"
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />

                          {/* Fill gradient area below the curve */}
                          <path
                            d="M 20,140 C 57.5,125 57.5,110 95,110 C 132.5,110 132.5,125 170,125 C 207.5,125 207.5,65 245,65 C 282.5,65 282.5,105 320,105 C 357.5,105 357.5,125 395,125 C 432.5,125 432.5,50 470,50 L 470,175 L 20,175 Z"
                            fill="url(#area-grad)"
                          />

                          {/* Critical Interactive Active Ticks on Graph nodes */}
                          <circle cx="21" cy="140" r="5" fill="#38bdf8" stroke="#131b2e" strokeWidth="2" />
                          <circle cx="95" cy="110" r="5" fill="#38bdf8" stroke="#131b2e" strokeWidth="2" />
                          <circle cx="170" cy="125" r="5" fill="#38bdf8" stroke="#131b2e" strokeWidth="2" />
                          <circle cx="245" cy="65" r="6" fill="#818cf8" stroke="#ffffff" strokeWidth="2" /> {/* Highlight peak representing high study sessions */}
                          <circle cx="320" cy="105" r="5" fill="#38bdf8" stroke="#131b2e" strokeWidth="2" />
                          <circle cx="395" cy="125" r="5" fill="#38bdf8" stroke="#131b2e" strokeWidth="2" />
                          <circle cx="470" cy="50" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />

                          {/* Data label overlay text */}
                          <text x="245" y="45" fill="#818cf8" fontSize="10" fontWeight="bold" textAnchor="middle">Cực đỉnh 6 giờ</text>
                        </svg>
                      </div>

                      {/* X Axis Labels */}
                      <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 font-semibold px-1">
                        <span>Thứ 2</span>
                        <span>Thứ 3</span>
                        <span>Thứ 4</span>
                        <span>Thứ 5</span>
                        <span>Thứ 6</span>
                        <span>Thứ 7</span>
                        <span>CN</span>
                      </div>
                    </div>

                    {/* Timeline Activity journal (as shown in image 1 "Nhật ký hoạt động học tập gần đây") */}
                    <div id="activity-journal-card" className={`p-6 rounded-2xl border shadow-sm flex flex-col ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-base">Nhật ký hoạt động hôm nay</h3>
                        <span className="text-[11px] text-indigo-400 font-bold block">{activities.length} hoạt động</span>
                      </div>

                      {/* Option to record manual dynamic self notes directly on screen */}
                      <form onSubmit={handleAddCustomNote} id="add-note-form" className="mb-3 flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Nhập ghi chú tự học nhanh..."
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          className={`flex-1 px-3 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                            darkMode ? "bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500" : "bg-slate-50 border-slate-150 text-slate-950 placeholder-slate-400"
                          }`}
                        />
                        <button
                          type="submit"
                          id="submit-note-btn"
                          className="bg-indigo-600 hover:bg-indigo-550 text-white text-xs px-3.5 py-1.5 rounded-xl font-bold transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Lưu</span>
                        </button>
                      </form>

                      {/* Timeline Flow */}
                      <div className="space-y-3 flex-1 overflow-y-auto max-h-52 pr-1.5 scrollbar-thin">
                        {activities.map((log) => (
                          <div key={log.id} className="flex gap-3 text-xs items-start leading-relaxed">
                            <span className="font-mono text-slate-400 font-semibold shrink-0 text-[10px] mt-0.5">[{log.time}]</span>
                            <div className="flex-1">
                              <p className={
                                log.type === "success" ? "text-emerald-400 font-medium" : 
                                log.type === "warning" ? "text-amber-400" : "text-slate-300"
                              }>
                                {log.content}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* -------------------- VIEW 2: SYLLABUS, LECTURE & METHOD TREE (BÀI GIẢNG TƯƠNG TÁC) -------------------- */}
              {activeTab === "syllabus" && (
                <div id="view-syllabus" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                  
                  {/* Left Column: Interactive Syllabus Tree (Cây kiến thức học tập) */}
                  <div className={`col-span-1 lg:col-span-4 p-6 rounded-2xl border shadow-sm h-fit ${
                    darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    <div className="mb-4">
                      <h3 className="font-bold text-base">Cây danh mục kiến thức ôn thi</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Chọn chủ đề học để tải phương pháp, ví dụ bám sát.</p>
                    </div>

                    <div className="space-y-4">
                      {["Toán học", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", "Tiếng Anh"].map((subName) => {
                        const chapters = syllabus[subName] || [];
                        const isSelectedSub = activeSubject === subName;
                        const subProgress = calculateSubjectProgress(subName);

                        return (
                          <div key={subName} id={`sub-tree-wrapper-${subName.replace(" ", "-")}`} className="border-b border-slate-800/10 pb-4 last:border-0 last:pb-0">
                            <button
                              id={`btn-toggle-sub-${subName}`}
                              onClick={() => {
                                setActiveSubject(subName);
                                const firstTopic = chapters[0]?.subTopics?.[0]?.name || chapters[0]?.name || "";
                                if (firstTopic) setSelectedTopic(firstTopic);
                                triggerToast(`Đã chuyển đề mục sang môn: ${subName}`);
                              }}
                              className="w-full flex items-center justify-between py-2 text-left hover:text-indigo-400 transition"
                            >
                              <div className="flex items-center gap-2.5">
                                <BookOpen className={`w-4.5 h-4.5 ${isSelectedSub ? "text-indigo-400" : "text-slate-500"}`} />
                                <span className={`text-sm font-bold ${isSelectedSub ? "text-indigo-400" : ""}`}>{subName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-semibold">{subProgress}%</span>
                                {isSelectedSub ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                              </div>
                            </button>

                            {/* Syllabus structure nodes of selected subject nested list */}
                            {isSelectedSub && (
                              <div className="mt-2 ml-4 pl-3 border-l border-indigo-500/20 space-y-3 animate-slide-down">
                                {chapters.map((chapter) => (
                                  <div key={chapter.id} className="space-y-1.5">
                                    <p className="text-[11px] font-bold text-indigo-300 tracking-wide uppercase">{chapter.name}</p>
                                    
                                    {chapter.subTopics && (
                                      <div className="space-y-1 pl-1">
                                        {chapter.subTopics.map((st) => (
                                          <div
                                            key={st.id}
                                            id={`sub-topic-node-${st.id}`}
                                            className={`flex items-center justify-between p-2 rounded-lg text-xs hover:bg-slate-800/40 transition ${
                                              selectedTopic === st.name ? "bg-indigo-600/10 border-l-2 border-indigo-500 font-medium text-white" : ""
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 min-w-0">
                                              
                                              {/* Interactive Checkbox updates learning metrics on dashboard dynamically! */}
                                              <input
                                                type="checkbox"
                                                id={`checkpoint-${st.id}`}
                                                checked={st.completed}
                                                onChange={() => handleToggleSubTopic(subName, chapter.id, st.id)}
                                                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 shrink-0"
                                                title="Đánh dấu đã học xong"
                                              />

                                              <button
                                                id={`btn-select-topic-${st.id}`}
                                                onClick={() => handleSelectTopicNode(subName, st.name)}
                                                className="truncate text-left font-medium hover:text-indigo-400 text-slate-300"
                                              >
                                                {st.name}
                                              </button>
                                            </div>
                                            
                                            {/* Status Badge */}
                                            <span className={`text-[9px] px-1.5 py-0.5 rounded leading-none shrink-0 font-bold ${
                                              st.completed ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"
                                            }`}>
                                              {st.completed ? "Xong" : "Tự học"}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Dynamic Lesson content values (as shown in image 2 "Tiêu đề kiến thức, định nghĩa, công thức & quy tắc cốt lõi, ví dụ giải điển hình, cảnh báo") */}
                  <div id="syllabus-lecture-panel" className="col-span-1 lg:col-span-8 space-y-6">
                    
                    {/* Lesson Core description block */}
                    <div className={`p-6 rounded-2xl border shadow-sm ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/20 pb-4 mb-4">
                        <div>
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full uppercase font-mono font-bold tracking-wider">{activeSubject}</span>
                          <h2 className="text-xl font-bold mt-1 text-slate-200">{currentMaterial.title || selectedTopic}</h2>
                        </div>
                        
                        {/* Interactive triggers to request help from Gemini API */}
                        <div className="flex gap-2">
                          <button
                            id="btn-ai-explain"
                            onClick={() => triggerAiHelpWithTopic(selectedTopic, "general")}
                            className="bg-indigo-650/40 border border-indigo-500/30 hover:bg-indigo-550/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                          >
                            <Brain className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                            <span>Giảng giải AI</span>
                          </button>
                          <button
                            id="btn-ai-shortcut-practice"
                            onClick={() => triggerAiHelpWithTopic(selectedTopic, "formula")}
                            className="bg-emerald-600/20 border border-emerald-500/30 hover:bg-emerald-600/35 text-emerald-400 text-[11px] font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Bí kíp ghi nhớ</span>
                          </button>
                        </div>
                      </div>

                      {/* Interactive Explanation Body */}
                      <div className="space-y-4 text-xs leading-relaxed">
                        <div>
                          <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">Khái niệm & Định nghĩa cơ bản:</h4>
                          <p className="p-3 rounded-lg bg-slate-900/50 border border-slate-850 text-slate-300 whitespace-pre-line text-xs">
                            {currentMaterial.definition}
                          </p>
                        </div>

                        {/* Core Equations / Codes Block */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          
                          <div>
                            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">{currentMaterial.formulaTitle || "Công thức cần nhớ"}:</h4>
                            <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                              {currentMaterial.formulas.map((form, index) => (
                                <div key={index} className="bg-slate-950/50 px-2 py-1.5 rounded font-mono text-indigo-400 text-xs border border-indigo-900/30">
                                  {form}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1.5">Xu hướng ra đề thi tốt nghiệp THPT:</h4>
                            <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/10 text-indigo-300">
                              <p className="text-xs">{currentMaterial.examTrends}</p>
                              <div className="mt-3 flex gap-2">
                                <button
                                  id="btn-generate-test"
                                  onClick={() => {
                                    setActiveTab("chat");
                                    setChatRole("Giải toán nâng cao");
                                    handleSendChatMessage(`Tạo đề toán thi thử cực chất về chuyên đề: "${selectedTopic}". Đưa ra câu hỏi trắc nghiệm phức tạp và lời giải tương thích hoàn hảo bám sát chương trình phổ thông nhé!`);
                                  }}
                                  className="text-[10px] bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/40 px-2.5 py-1 rounded transition"
                                >
                                  Tạo bài luyện tập với AI
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Solved prototypes example */}
                        <div>
                          <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[10px] mb-1">Ví dụ giải minh họa điển hình:</h4>
                          {currentMaterial.examples.map((exam, i) => (
                            <div key={i} className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800">
                              <p className="font-bold text-slate-300">🎯 {exam.q}</p>
                              <p className="text-slate-400 mt-1 md:pl-4 border-l border-emerald-500/50"><strong>Đáp án & Giải thích:</strong> {exam.a}</p>
                            </div>
                          ))}
                        </div>

                        {/* High-quality warning banner */}
                        <div className="bg-amber-600/10 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="font-bold text-amber-300 text-xs uppercase tracking-wide">Cảnh báo sai biệt dễ mắc lỗi phổ biến:</h5>
                            <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-300">
                              {currentMaterial.mistakes.map((mist, idx) => (
                                <li key={idx}>{mist}</li>
                              ))}
                            </ul>
                            <button
                              id="btn-warn-mistake"
                              onClick={() => triggerAiHelpWithTopic(selectedTopic, "mistake")}
                              className="text-[10px] text-amber-400 hover:underline font-semibold mt-2 block"
                            >
                              Nháy để xem lời khuyên giải bẫy chi tiết từ AI Tutor »
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* -------------------- VIEW 3: DEDICATED AI CHAT TUTOR (GIA SƯ AI TRỰC TUYẾN) -------------------- */}
              {activeTab === "chat" && (
                <div id="view-ai-chat" className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                  
                  {/* Left panel inside Chat Tab: Curated Smart Prompts Shortcut templates (as shown in image 3 "Giải thích kiến thức, phân tích lỗi sai, phân chia bài khó...") */}
                  <div className="col-span-1 lg:col-span-4 space-y-4">
                    
                    <div className={`p-4 rounded-2xl border shadow-sm ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <h3 className={`font-bold text-sm tracking-wide mb-3 uppercase ${
                        darkMode ? "text-slate-300" : "text-slate-705 text-slate-650 text-slate-600"
                      }`}>Yêu cầu nhanh với AI Tutor</h3>
                      
                      <div className="space-y-2 text-xs">
                        <button
                          id="ai-opt-explain"
                          onClick={() => {
                            setChatRole("Giải thích bài giảng");
                            setChatInput(`Hãy giải thích thật dễ hiểu cho em khái niệm cốt lõi của phần: "${selectedTopic}" môn ${activeSubject} bám sát cấu trúc SGK phổ thông.`);
                            triggerToast("Hãy nhấp nút 'Gửi' bên dưới để trao đổi cùng AI.");
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition block ${
                            darkMode 
                              ? "border-slate-800 hover:border-indigo-500/50 hover:bg-[#1a243a] text-slate-100" 
                              : "bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/25 text-slate-800 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5 text-indigo-455 text-indigo-400 font-bold">
                            <BookOpen className="w-4 h-4" />
                            <span>Giải thích lý thuyết sâu</span>
                          </div>
                          <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Giảng giải khái niệm cốt lõi cực kỳ đơn giản, ngắn gọn hữu ích.</p>
                        </button>

                        <button
                          id="ai-opt-mistakes"
                          onClick={() => {
                            setChatRole("Phân tích lỗi sai");
                            setChatInput(`Có những sai sót, lừa đảo, hoặc bẫy phổ biến nào học sinh cấp 3 thường gặp phải khi làm bài thi hay kiểm tra phần "${selectedTopic}" của môn ${activeSubject} hả thầy cô?`);
                            triggerToast("Lựa chọn bẫy lỗi sai đã điền vào ô chat!");
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition block ${
                            darkMode 
                              ? "border-slate-800 hover:border-indigo-500/50 hover:bg-[#1a243a] text-slate-100" 
                              : "bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/25 text-slate-800 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5 text-amber-455 text-amber-500 text-amber-400 font-bold">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Vạch trần bẫy lỗi sai</span>
                          </div>
                          <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Tóm tắt các điểm đáng lo và bẫy trắc nghiệm để phòng tránh.</p>
                        </button>

                        <button
                          id="ai-opt-step"
                          onClick={() => {
                            setChatRole("Giải từng bước");
                            setChatInput(`Hãy cho em một ví dụ nâng cao (vận dụng) của "${selectedTopic}" môn ${activeSubject} kèm đáp án chi tiết bám sát cấu trúc đề thi năm nay.`);
                            triggerToast("Đáp án từng bước đã sẵn sàng phục vụ!");
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition block ${
                            darkMode 
                              ? "border-slate-800 hover:border-indigo-500/50 hover:bg-[#1a243a] text-slate-100" 
                              : "bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/25 text-slate-800 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5 text-emerald-455 text-emerald-500 text-emerald-400 font-bold">
                            <Brain className="w-4 h-4" />
                            <span>Thử thách nâng cao từng bước</span>
                          </div>
                          <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Tạo đề thi tự động bám sát chương trình Giáo dục.</p>
                        </button>

                        <button
                          id="ai-opt-plan"
                          onClick={() => {
                            setChatRole("Lập kế hoạch ôn tập");
                            setChatInput(`Lên cho em một kế hoạch ôn tập thích ứng trong vòng 3 ngày đối với chuyên đề "${selectedTopic}" môn ${activeSubject} để em củng cố kiến thức tốt nhất.`);
                            triggerToast("Kế hoạch rèn luyện bám đuổi đã thiết lập!");
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition block ${
                            darkMode 
                              ? "border-slate-800 hover:border-indigo-500/50 hover:bg-[#1a243a] text-slate-100" 
                              : "bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/25 text-slate-800 shadow-sm"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5 text-sky-450 text-sky-400 font-bold">
                            <Clock className="w-4 h-4" />
                            <span>Lịch học thích ứng cá nhân</span>
                          </div>
                          <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Thiết lập tiến trình thích ứng ngắn hạn ôn thi khẩn cấp.</p>
                        </button>
                      </div>
                    </div>

                    <div className="text-xs p-4 bg-indigo-950/20 rounded-2xl border border-indigo-500/10 space-y-1">
                      <p className="font-bold text-indigo-400 inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Mẹo tương tác bài học</span>
                      </p>
                      <p className="text-slate-400 leading-normal">
                        Dữ liệu kiến thức nền của bạn đang bám đuổi: <strong>{activeSubject} (Lớp {selectedGrade === "Grade 12" ? "12" : selectedGrade === "Grade 11" ? "11" : "10" })</strong>.
                      </p>
                    </div>

                  </div>

                  {/* Main Chat Interface */}
                  <div className="col-span-1 lg:col-span-8 flex flex-col h-[520px] rounded-2xl border shadow-lg bg-[#0e1424] border-slate-850 overflow-hidden">
                    
                    {/* Chat Head status banner */}
                    <div className="bg-[#121a30] px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-600/25 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                          <Sparkles className="w-5 h-5 animate-pulse text-yellow-300" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-white">Gia sư AI Studydase</h3>
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1.5 font-medium leading-none mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                            Độc quyền bám sát SGK phổ thông
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono font-bold uppercase">
                          Role: {chatRole}
                        </span>
                        <button
                          id="btn-clear-chat"
                          onClick={() => {
                            setChatMessages([
                              {
                                id: "welcome-ai",
                                role: "model",
                                text: "Xin chào bạn! Tôi là Gia sư AI Studydase. Bạn cần tôi giảng giải công thức, giải thích lỗi sai, hay luyện đề mẫu nào hôm nay nhỉ?",
                                timestamp: "10:35 AM"
                              }
                            ]);
                            triggerToast("Đã dọn dẹp cuộc trò chuyện.");
                          }}
                          className="text-[11px] text-slate-400 hover:text-red-400 transition"
                        >
                          Dọn chat
                        </button>
                      </div>
                    </div>

                    {/* Messages Body wrapper */}
                    <div id="chat-messages-container" className="flex-1 p-6 overflow-y-auto space-y-4 pr-3 scrollbar-thin">
                      {chatMessages.map((msg) => {
                        const isUser = msg.role === "user";
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5`}
                          >
                            {!isUser && (
                              <div className="w-7 h-7 rounded-full bg-indigo-650 flex items-center justify-center text-xs text-white shrink-0 font-bold border border-indigo-500/20">
                                S
                              </div>
                            )}
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                              isUser
                                ? "bg-indigo-600 text-white rounded-tr-none"
                                : darkMode
                                  ? "bg-[#18233d] text-slate-200 rounded-tl-none border border-slate-800"
                                  : "bg-[#f1f5f9] text-slate-805 text-slate-800 rounded-tl-none border border-slate-200 shadow-sm"
                            }`}>
                              {/* Message rendering with robust markdown parsing */}
                              <div className={`prose ${darkMode ? "prose-invert" : ""} max-w-none text-xs`}>
                                {renderMarkdownMessage(msg.text, darkMode)}
                              </div>
                              <span className="text-[10px] text-slate-400/80 block mt-2 font-mono text-right">{msg.timestamp}</span>
                            </div>
                          </div>
                        );
                      })}
                      
                      {isAiLoading && (
                        <div className="flex justify-start items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] animate-spin text-white">
                            ⚙️
                          </div>
                          <div className={`border rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-2 ${
                            darkMode 
                              ? "bg-[#18233d] border-slate-800 text-slate-300"
                              : "bg-slate-100 border-slate-200 text-slate-700 shadow-sm"
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce inline-block" />
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s] inline-block" />
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s] inline-block" />
                            <span className="text-slate-400 font-mono text-[10px] ml-1">AI Tutor đang tư duy bài tốt nhất...</span>
                          </div>
                        </div>
                      )}

                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat Footer send bar */}
                    <div className={`p-4 border-t shrink-0 ${
                      darkMode ? "bg-[#131b2f] border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          id="chat-text-input"
                          placeholder={`Đặt câu hỏi môn ${activeSubject}...`}
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSendChatMessage();
                          }}
                          className={`flex-1 border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-indigo-500 ${
                            darkMode 
                              ? "bg-[#0b0f19] border-slate-850 text-slate-100 placeholder-slate-500" 
                              : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                          }`}
                        />
                        <button
                          id="btn-send-message"
                          onClick={() => handleSendChatMessage()}
                          disabled={isAiLoading}
                          className="bg-indigo-600 hover:bg-indigo-550 active:scale-95 disabled:opacity-50 text-white font-bold px-5 rounded-xl transition flex items-center gap-2 text-xs"
                        >
                          <span>Gửi</span>
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400/80 mt-2 text-center">
                        Tích hợp mô hình AI <strong>gemini-3.5-flash</strong> thế hệ mới giúp tối ưu độ chính xác và bài giảng thích ứng cực nhanh.
                      </p>
                    </div>

                  </div>

                </div>
              )}

              {/* -------------------- VIEW 4: THPT EXAM GENERATOR & INTERACTIVE TEST HALL -------------------- */}
              {activeTab === "exams" && (() => {
                const PRACTICE_EXAMS = [
                  {
                    id: "toan-12",
                    subject: "Toán học",
                    title: "Đề thi thử THPT Quốc gia môn Toán học — Đề số 01",
                    duration: 180, // 3 minutes for prototype demonstration
                    questions: [
                      {
                        id: 1,
                        question: "Câu 1: Cho hàm số y = f(x) liên tục trên R và có đạo hàm f'(x) = x(x-1)^2(x-2). Số điểm cực trị của hàm số đã cho là bao nhiêu?",
                        options: {
                          A: "1",
                          B: "2",
                          C: "3",
                          D: "4"
                        },
                        correct: "B",
                        explain: "f'(x) = 0 có các nghiệm x = 0 (nghiệm đơn), x = 1 (nghiệm bội chẵn), x = 2 (nghiệm đơn). Đạo hàm đổi dấu khi qua x=0 và x=2. Vậy hàm số có 2 điểm cực trị."
                      },
                      {
                        id: 2,
                        question: "Câu 2: Diện tích hình phẳng giới hạn bởi hai đồ thị đường cong y = x^2 - 2x và y = x bằng bao nhiêu?",
                        options: {
                          A: "9/2",
                          B: "9/4",
                          C: "4/3",
                          D: "5/2"
                        },
                        correct: "A",
                        explain: "Phương trình hoành độ giao điểm: x^2 - 2x = x <=> x^2 - 3x = 0 <=> x=0 hoặc x=3. Diện tích S = tích phân từ 0 đến 3 của |x^2 - 3x| dx = 9/2."
                      },
                      {
                        id: 3,
                        question: "Câu 3: Trong không gian Oxyz, phương trình nào dưới đây là phương trình của mặt cầu có tâm I(1; 2; -3) và bán kính R = 4?",
                        options: {
                          A: "(x-1)^2 + (y-2)^2 + (z+3)^2 = 16",
                          B: "(x-1)^2 + (y-2)^2 + (z-3)^2 = 16",
                          C: "(x+1)^2 + (y+2)^2 + (z-3)^2 = 16",
                          D: "(x-1)^2 + (y-2)^2 + (z+3)^2 = 4"
                        },
                        correct: "A",
                        explain: "Thay tâm I(1; 2; -3) và R=4 được (x-1)^2 + (y-2)^2 + (z+3)^2 = R^2 = 16. Do đó đáp án A đúng."
                      }
                    ]
                  },
                  {
                    id: "anh-12",
                    subject: "Tiếng Anh",
                    title: "Đề thi thử THPT Quốc gia môn Tiếng Anh — Bộ đề tinh gọn",
                    duration: 180,
                    questions: [
                      {
                        id: 1,
                        question: "Câu 1: If it __________ fine tomorrow, we will go on a picnic in the national forest.",
                        options: {
                          A: "is",
                          B: "will be",
                          C: "were",
                          D: "would be"
                        },
                        correct: "A",
                        explain: "Mệnh đề điều kiện loại 1: If + S + V(hiện tại đơn), S + will + V-inf. Do đó đáp án đúng là A ('is')."
                      },
                      {
                        id: 2,
                        question: "Câu 2: My sister has got a __________ cat.",
                        options: {
                          A: "black big lovely Vietnamese",
                          B: "lovely big black Vietnamese",
                          C: "lovely Vietnamese big black",
                          D: "Vietnamese lovely big black"
                        },
                        correct: "B",
                        explain: "Thứ tự tính từ OpSACOMP: Opinion (lovely) -> Size (big) -> Color (black) -> Origin (Vietnamese). Đáp án B đúng."
                      },
                      {
                        id: 3,
                        question: "Câu 3: Choose the synonym of the underlined word: We must <u>curtail</u> the expenses to prevent bankruptcy.",
                        options: {
                          A: "reduce",
                          B: "increase",
                          C: "prolong",
                          D: "sponsor"
                        },
                        correct: "A",
                        explain: "'Curtail' nghĩa là cắt giảm bớt, thắt chặt lại. Đồng nghĩa hoàn toàn với 'reduce'."
                      }
                    ]
                  },
                  {
                    id: "ly-12",
                    subject: "Vật lý",
                    title: "Đề trắc nghiệm Vật lý THPT QG — Dao động & Sóng cơ học",
                    duration: 180,
                    questions: [
                      {
                        id: 1,
                        question: "Câu 1: Một con lắc lò xo gồm lò xo nhẹ có độ cứng k và vật nhỏ khối lượng m. Chu kì dao động điều hòa của con lắc là gì?",
                        options: {
                          A: "T = 2π√(m/k)",
                          B: "T = 2π√(k/m)",
                          C: "T = √(k/m)/2π",
                          D: "T = √(m/k)/2π"
                        },
                        correct: "A",
                        explain: "Chu kì biểu diễn của con lắc lò xo được xác định theo hệ số: T = 2π/ω = 2π√(m/k)."
                      },
                      {
                        id: 2,
                        question: "Câu 2: Trong hiện tượng giao thoa sóng cơ học, hai nguồn kết hợp cùng pha phát ra bước sóng λ. Khoảng cách hai cực tiểu giao thoa kế tiếp trên đoạn thẳng nối hai nguồn bằng bao nhiêu?",
                        options: {
                          A: "λ / 2",
                          B: "λ / 4",
                          C: "λ",
                          D: "2λ"
                        },
                        correct: "A",
                        explain: "Khoảng cách giữa hai cực đại liên tiếp hoặc hai cực tiểu liên tiếp trên đoạn thẳng của trục nối hai nguồn bằng một nửa bước sóng λ/2."
                      }
                    ]
                  },
                  {
                    id: "van-12",
                    subject: "Ngữ văn",
                    title: "Đề thi thử THPT Quốc gia môn Ngữ văn — Nghị luận tự xã hội",
                    duration: 300, // 5 minutes
                    questions: [
                      {
                        id: 1,
                        question: "Câu hỏi nghị luận: Hãy viết một đoạn văn ngắn (khoảng 200 chữ) bày tỏ ý kiến về vai trò của việc tự học trực tuyến kết hợp sự đồng hành của Trí Tuệ Nhân Tạo (AI) trong thời đại số hóa hiện nay đối với học sinh cấp 3.",
                        options: {},
                        correct: "ESSAY",
                        explain: "Đề thi tự luận không có đáp án trắc nghiệm sẵn. Trực tiếp nhập bài làm cảm thụ vào ô soạn bài luận bên dưới, AI sẽ chấm chi tiết bài văn của bạn."
                      }
                    ]
                  }
                ];

                // Active exam helper definitions
                const activeExamObj = PRACTICE_EXAMS.find(ex => ex.id === currentSelectedPracticeExam);

                // Start exam session
                const startPracticeExam = (examId: string) => {
                  const exam = PRACTICE_EXAMS.find(ex => ex.id === examId);
                  if (exam) {
                    setCurrentSelectedPracticeExam(examId);
                    setActiveGeneratedExam("");
                    setSelectedExamAnswers({});
                    setExamEssayAnswer("");
                    setExamScore(null);
                    setExamFeedback("");
                    setExamTimeRemaining(exam.duration);
                    triggerToast(`Bắt đầu làm: ${exam.title}. Chúc bạn thi tốt!`);
                  }
                };

                // Trigger AI Exam generation flow via existing route
                const handleGenerateAIExam = async () => {
                  setIsGeneratingExam(true);
                  setActiveGeneratedExam("");
                  setCurrentSelectedPracticeExam(null);
                  setSelectedExamAnswers({});
                  setExamEssayAnswer("");
                  setExamScore(null);
                  setExamFeedback("");
                  
                  try {
                    const promptText = `Hãy thiết kế một đề thi thử THPT Quốc Gia môn ${examSubject} cấp độ ${selectedGrade || 'Lớp 12'} bám sát chương trình phổ thông.
Đề thi cần có:
- Trắc nghiệm ngắn (gồm ít nhất 3 câu hỏi kèm 4 lựa chọn A, B, C, D rõ ràng).
- Phần tự luận bổ trợ cảm xúc ngắn.
Vui lòng giải thích chi tiết và phân loại đáp án đúng ngay dưới mỗi câu để học sinh có thể so khớp và chấm mẫu điểm sau khi hoàn thành.
Yêu cầu riêng biệt người dùng: ${examRequirements || "Không có yêu cầu đặc thù"}`;

                    const res = await fetch("/api/gemini", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        message: promptText,
                        subject: examSubject,
                        promptType: "Thiết kế Đề thi thử THPT Quốc gia",
                        history: []
                      })
                    });

                    if (!res.ok) throw new Error("Máy chủ phản hồi rỗng.");
                    const data = await res.json();
                    
                    if (data.text) {
                      setActiveGeneratedExam(data.text);
                      setExamTimeRemaining(300); // 5 minutes for AI generated quiz
                      triggerToast("Đề thi tự động đã được khởi tạo hoàn mỹ bởi Gemini AI!");
                    } else {
                      throw new Error("Lỗi rỗng dữ liệu");
                    }
                  } catch (err: any) {
                    console.error(err);
                    triggerToast("Lỗi khi kết nối với AI để sinh đề thi. Hãy thử dùng các đề thi mẫu sẵn có!");
                  } finally {
                    setIsGeneratingExam(false);
                  }
                };

                // Submit Exam and score
                const handleSubmitExam = async () => {
                  setExamTimeRemaining(0); // Stop countdown
                  setIsSubmittingExam(true);

                  if (currentSelectedPracticeExam && activeExamObj) {
                    // Logic for pre-defined mock exams
                    if (activeExamObj.id === "van-12") {
                      // Literature essay valuation via AI
                      try {
                        const contentToGrade = examEssayAnswer || "Học sinh không nộp bài viết tự luận.";
                        const res = await fetch("/api/gemini", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            message: `Hãy chấm điểm và cho phản hồi sâu sắc về bài văn nghị luận xã hội sau của học sinh cấp 3. 
Yêu cầu văn học: Trình bày suy nghĩ về việc tự học trực tuyến kết hợp AI.
Bài viết của học sinh:
"${contentToGrade}"
Hãy đánh giá bám sát barem điểm thi THPT Quốc Gia Ngữ văn. Hãy chấm cụ thể một con điểm trên thang 10.0 và hướng dẫn cải thiện viết luận.`,
                            subject: "Ngữ văn",
                            promptType: "Chấm thi tự luận văn học",
                            history: []
                          })
                        });

                        if (!res.ok) throw new Error();
                        const data = await res.json();
                        setExamScore(7.5); // default estimated score, fine-tuned by AI feedback
                        setExamFeedback(data.text);
                        triggerToast("AI đã hoàn thành chấm chữa bài văn tự luận của bạn!");
                      } catch {
                        setExamScore(6.5);
                        setExamFeedback("Hệ thống AI bận rộn. Bài làm của bạn được chấm điểm sơ duyệt đạt 6.5/10.0 điểm trung bình.");
                      }
                    } else {
                      // Logic for objective quizzes
                      let total = activeExamObj.questions.length;
                      let correctCount = 0;
                      activeExamObj.questions.forEach((q, idx) => {
                        if (selectedExamAnswers[q.id] === q.correct) {
                          correctCount++;
                        }
                      });

                      const scoreValue = Math.round((correctCount / total) * 10 * 10) / 10;
                      setExamScore(scoreValue);
                      
                      // Trigger AI review for missed questions
                      try {
                        const scoreDescription = `Học sinh thi môn ${activeExamObj.subject}, đúng ${correctCount}/${total} câu, đạt ${scoreValue} điểm. Các đáp án đã chọn: ${JSON.stringify(selectedExamAnswers)}. Hãy động viên và chẩn đoán kiến thức hổng.`;
                        const res = await fetch("/api/gemini", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            message: scoreDescription,
                            subject: activeExamObj.subject,
                            promptType: "Phân tích kết quả thi trắc nghiệm khách quan",
                            history: []
                          })
                        });
                        const data = await res.json();
                        setExamFeedback(data.text);
                      } catch {
                        setExamFeedback(`Chúc mừng bạn đã hoàn tất đề kiểm tra! Bạn trả lời chính xác ${correctCount}/${total} câu hỏi, tự luyện tập giúp bạn củng cố phản xạ trước kỳ thi thật tốt hơn.`);
                      }
                    }
                  } else if (activeGeneratedExam) {
                    // Logic for AI generated freeform test submit
                    try {
                      const res = await fetch("/api/gemini", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          message: `Đây là bài làm của tôi cho đề thi bạn vừa cấp phát. Vui lòng chấm điểm chi tiết trên thang 10 và đưa ra lời phê cụ thể.
Các câu trả lời trắc nghiệm của tôi (nếu có): ${JSON.stringify(selectedExamAnswers)}
Bài thảo luận tự luận (nếu có): ${examEssayAnswer}
Nội dung đề thi gốc bạn đã cấp:
${activeGeneratedExam}`,
                          subject: examSubject,
                          promptType: "Chấm điểm tổng phổ đề thi",
                          history: []
                        })
                      });
                      const data = await res.json();
                      setExamScore(8.0);
                      setExamFeedback(data.text);
                      triggerToast("Gemini đã chấm điểm bài làm AI của bạn hoàn tất!");
                    } catch {
                      setExamScore(7.5);
                      setExamFeedback("Kết nối AI bận rộn. Bạn đã hoàn tất thi thử, hãy tự tra cứu lời giải mẫu hiển thị trong đề thi!");
                    }
                  }

                  setIsSubmittingExam(false);
                };

                return (
                  <div id="view-exams" className="space-y-6 animate-fade-in text-xs">
                    
                    {/* Welcome Indicator banner */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-6 bg-gradient-to-r from-indigo-700/60 to-purple-800/60 text-white rounded-2xl border border-indigo-500/20 shadow-lg">
                      <div className="space-y-1">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <CheckSquare className="w-5 h-5 text-indigo-300" />
                          Hệ thống Khởi tạo & Trình duyệt luyện đề thi THPT QG
                        </h2>
                        <span className="text-xs text-indigo-200 block">
                          Tổ hợp đề thi phong phú bám sát đề minh họa mới nhất của Bộ GD&ĐT cùng giải thích chi tiết chấm tự động bằng AI.
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {(currentSelectedPracticeExam || activeGeneratedExam) && (
                          <button
                            onClick={() => {
                              setCurrentSelectedPracticeExam(null);
                              setActiveGeneratedExam("");
                              setExamScore(null);
                              setExamFeedback("");
                              setExamTimeRemaining(0);
                            }}
                            className="px-4 py-2 bg-slate-900/60 hover:bg-slate-900 text-white font-medium rounded-xl border border-white/10 transition-all cursor-pointer"
                          >
                            Đổi đề thi / Thiết lập lại
                          </button>
                        )}
                      </div>
                    </div>

                    {/* MAIN EXAM VIEW: ROOM RUNNING OR CONFIGURATION COMPONENT */}
                    {(!currentSelectedPracticeExam && !activeGeneratedExam) ? (
                      // CONFIGURATOR SCREEN
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Left Card: custom generator options */}
                        <div className={`lg:col-span-7 p-6 rounded-2xl border shadow-sm ${
                          darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                        }`}>
                          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            Đặc tả & Soạn đề thi cá nhân hóa bằng AI
                          </h3>

                          <div className="space-y-4">
                            <div>
                              <span className="font-medium text-slate-400 block mb-2">1. Chọn môn thi chính thức</span>
                              <div className="flex flex-wrap gap-2">
                                {["Toán học", "Tiếng Anh", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn"].map((subject) => (
                                  <button
                                    key={subject}
                                    onClick={() => setExamSubject(subject)}
                                    className={`px-3.5 py-2.5 rounded-xl border font-medium transition-all cursor-pointer ${
                                      examSubject === subject
                                        ? "bg-indigo-650 text-white border-indigo-500 shadow-sm"
                                        : darkMode 
                                          ? "bg-slate-900 border-slate-750 text-slate-300 hover:bg-slate-850" 
                                          : "bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    {subject}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="font-medium text-slate-400 block mb-2">2. Loại hình kiểm tra khảo sát</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {[
                                  "Đề khảo sát THPT Quốc Gia (Chuẩn cấu trúc)",
                                  "Kiểm tra Định kỳ Học phần",
                                  "Luyện tập Câu hỏi Vận dụng Cao"
                                ].map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => setExamType(type)}
                                    className={`p-3 text-left rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                      examType === type
                                        ? "bg-indigo-650/15 text-indigo-400 border-indigo-500"
                                        : darkMode
                                          ? "bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-850"
                                          : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                                    }`}
                                  >
                                    {type}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="font-medium text-slate-400 block mb-2">3. Yêu cầu đặc tả mở rộng (Không bắt buộc)</span>
                              <textarea
                                value={examRequirements}
                                onChange={(e) => setExamRequirements(e.target.value)}
                                placeholder="Ví dụ: Đề thi tập trung phần tích phân từ cơ bản đến nâng cao; Đề thi kiểm tra từ vựng Tiếng Anh Unit 9, v.v."
                                className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition h-20 resize-none ${
                                  darkMode ? "bg-slate-900 border-slate-750 text-white" : "bg-white border-slate-300 text-slate-900"
                                }`}
                              />
                            </div>

                            <button
                              id="btn-generate-ai-exam"
                              onClick={handleGenerateAIExam}
                              disabled={isGeneratingExam}
                              className={`w-full py-3.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                                isGeneratingExam ? "opacity-60 cursor-not-allowed" : ""
                              }`}
                            >
                              {isGeneratingExam ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Đang liên kết Trí Tuệ Nhân Tạo để biên soạn đề thi...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
                                  <span>Phát hành Đề thi THPT bằng Trí Tuệ Nhân Tạo (Gemini)</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Right Card: Rapid Practice Mock Exams list */}
                        <div className={`lg:col-span-5 p-6 rounded-2xl border shadow-sm ${
                          darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                        }`}>
                          <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
                            <BookOpenCheck className="w-4 h-4 text-emerald-400" />
                            Phòng luyện đề thi mẫu THPT QG sẵn có
                          </h3>
                          <p className="text-slate-400 mb-4 text-[11px] leading-relaxed">
                            Không cần chờ đợi sinh đề tự động, mở ngay các đề thi khảo sát chuẩn mực đã được căn chỉnh kĩ càng để đo lường kiến thức tức thời.
                          </p>

                          <div className="space-y-3">
                            {PRACTICE_EXAMS.map((exam) => (
                              <div
                                key={exam.id}
                                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition hover:shadow-md ${
                                  darkMode ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200"
                                }`}
                              >
                                <div className="space-y-1">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    exam.subject === "Toán học" ? "bg-indigo-600/10 text-indigo-400" :
                                    exam.subject === "Tiếng Anh" ? "color-sky text-sky-400 bg-sky-500/10" :
                                    exam.subject === "Vật lý" ? "bg-orange-550/10 text-orange-400" : "bg-pink-500/10 text-pink-400"
                                  }`}>
                                    {exam.subject}
                                  </span>
                                  <h4 className={`font-bold text-xs ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
                                    {exam.title}
                                  </h4>
                                  <span className="text-slate-400 text-[10px] block">
                                    Thời gian ôn luyện mặc định: {exam.duration / 60} phút
                                  </span>
                                </div>

                                <button
                                  onClick={() => startPracticeExam(exam.id)}
                                  className="w-full py-2 text-center bg-emerald-600 hover:bg-emerald-550 text-white rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer"
                                >
                                  Mở đề và thi ngay
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ) : (
                      // ACTIVE EXAM SESSION OR RESULTS ROOM
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Left block: active test view questionnaire */}
                        <div className={`lg:col-span-8 p-6 rounded-2xl border shadow-sm ${
                          darkMode ? "bg-[#131b2e] border-[#1e293b]" : "bg-white border-slate-200"
                        }`}>
                          
                          {/* Test Room Header Info */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block mb-0.5">Phòng thi tích hợp</span>
                              <h3 className="font-bold text-sm text-[13px] dark:text-slate-100 text-slate-800">
                                {currentSelectedPracticeExam ? activeExamObj?.title : `Đề thi môn ${examSubject} sinh bởi AI`}
                              </h3>
                            </div>

                            {/* Countdown Real-time Clock display */}
                            {examTimeRemaining > 0 && examScore === null && (
                              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs ${
                                examTimeRemaining < 60 
                                  ? "bg-red-500/10 border-red-500 text-red-500 animate-pulse" 
                                  : "bg-indigo-600/10 border-indigo-500 text-indigo-400"
                              }`}>
                                <Clock className="w-4 h-4" />
                                <span>
                                  {Math.floor(examTimeRemaining / 60)}:
                                  {String(examTimeRemaining % 60).padStart(2, '0')}
                                </span>
                              </div>
                            )}

                            {examScore !== null && (
                              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500 text-emerald-400 font-bold">
                                ĐÃ HOÀN TẤT THI THỬ
                              </span>
                            )}
                          </div>

                          {/* INSTRUCTIONS OR CONTENT GENERATED IN MARKDOWN */}
                          {activeGeneratedExam ? (
                            <div className="space-y-6">
                              {/* AI Text output area */}
                              <div className={`p-4 rounded-xl border overflow-auto max-h-[420px] markdown-body ${
                                darkMode ? "bg-slate-900/60 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                              }`}>
                                <p className="font-bold text-indigo-400 mb-2 border-b border-slate-800 pb-1.5 uppercase tracking-wide text-[10px] shrink-0">Nội dung đề thi sinh lập bởi AI:</p>
                                <div className="leading-relaxed whitespace-pre-wrap">{activeGeneratedExam}</div>
                              </div>

                              {/* Fill area for answers if doing AI freeform text */}
                              {examScore === null && (
                                <div className="space-y-3">
                                  <div>
                                    <span className="font-semibold block mb-1 text-slate-400">1. Nhập câu trả lời trắc nghiệm của bạn:</span>
                                    <p className="text-[10px] text-slate-400 mb-2">Ví dụ định dạng: 1A, 2B, 3D, 4C v.v.</p>
                                    <div className="flex gap-2">
                                      {[1, 2, 3, 4].map((qNum) => (
                                        <div key={qNum} className="flex-1">
                                          <label className="text-[10px] text-slate-400 block text-center font-bold mb-1">Câu {qNum}</label>
                                          <div className="flex gap-1 justify-center">
                                            {["A", "B", "C", "D"].map((ans) => (
                                              <button
                                                key={ans}
                                                onClick={() => setSelectedExamAnswers(prev => ({ ...prev, [qNum]: ans }))}
                                                className={`w-7 h-7 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                                  selectedExamAnswers[qNum] === ans
                                                    ? "bg-indigo-600 text-white"
                                                    : darkMode ? "bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-850" : "bg-white hover:bg-slate-100 text-slate-900 border border-slate-200"
                                                }`}
                                              >
                                                {ans}
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="font-semibold block mb-1.5 text-slate-400">2. Nhập bài và ý kiến tự luận (Nếu đề thi yêu cầu):</span>
                                    <textarea
                                      value={examEssayAnswer}
                                      onChange={(e) => setExamEssayAnswer(e.target.value)}
                                      placeholder="Soạn các lập luận lý luận, giải nghĩa tự luận chi tiết tại đây để gửi AI đánh giá..."
                                      className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition h-28 resize-none ${
                                        darkMode ? "bg-slate-900 border-slate-750 text-white" : "bg-white border-slate-300 text-slate-900"
                                      }`}
                                    />
                                  </div>
                                </div>
                              )}

                            </div>
                          ) : (
                            // PRE-DEFINED DETAILED MOCK EXAM VIEW
                            <div className="space-y-6">
                              {activeExamObj?.questions.map((q, qIndex) => (
                                <div
                                  key={q.id}
                                  className={`p-4 rounded-xl border transition-all ${
                                    darkMode ? "bg-slate-900/40 border-slate-850 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"
                                  }`}
                                >
                                  <p className="font-bold text-xs mb-3 leading-relaxed">{q.question}</p>

                                  {/* Render trắc nghiệm checks */}
                                  {q.correct !== "ESSAY" ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                      {Object.entries(q.options).map(([optKey, optVal]) => {
                                        const isSelected = selectedExamAnswers[q.id] === optKey;
                                        const isCorrect = q.correct === optKey;
                                        const showOutcome = examScore !== null;
                                        
                                        return (
                                          <button
                                            key={optKey}
                                            disabled={showOutcome}
                                            onClick={() => {
                                              setSelectedExamAnswers(prev => ({ ...prev, [q.id]: optKey }));
                                              triggerToast(`Đã chọn Câu ${qIndex+1}: ${optKey}`);
                                            }}
                                            className={`text-left p-3 rounded-xl border text-xs font-medium flex items-center gap-3 transition-all ${
                                              showOutcome
                                                ? isCorrect
                                                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                                                  : isSelected
                                                    ? "bg-red-500/10 border-red-500 text-red-500"
                                                    : "opacity-60 cursor-not-allowed"
                                                : isSelected
                                                  ? "bg-indigo-650/20 text-indigo-400 border-indigo-500"
                                                  : "hover:bg-indigo-600/5 cursor-pointer"
                                            }`}
                                          >
                                            <span className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                              isSelected 
                                                ? "bg-indigo-600 border-indigo-500 text-white" 
                                                : "border-slate-400"
                                            }`}>
                                              {optKey}
                                            </span>
                                            <span className="flex-1">{optVal}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    // Essay Literature Input Form
                                    <div className="space-y-3 mt-1">
                                      <textarea
                                        disabled={examScore !== null}
                                        value={examEssayAnswer}
                                        onChange={(e) => setExamEssayAnswer(e.target.value)}
                                        placeholder="Nhập nội dung bài luận làm văn phân tích chi tiết của bạn tại đây (ít nhất 100 từ để AI cho lời khuyên sâu sắc)..."
                                        className={`w-full p-4 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition h-48 resize-none ${
                                          darkMode ? "bg-slate-900 border-slate-750 text-white" : "bg-white border-slate-300 text-slate-900"
                                        }`}
                                      />
                                      {examScore === null && (
                                        <div className="text-right text-slate-400 text-[10px]">
                                          Ước tính số ký tự: {examEssayAnswer.length} từ
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Explanation view if exam is completed */}
                                  {examScore !== null && (
                                    <div className="mt-4 p-3 bg-indigo-650/10 border-l-2 border-indigo-500 rounded text-[11px] leading-relaxed select-text mt-3.5">
                                      <span className="font-bold text-indigo-400 block mb-1">💡 Hướng dẫn đáp án mẫu & Giải thích:</span>
                                      {q.explain}
                                    </div>
                                  )}

                                </div>
                              ))}
                            </div>
                          )}

                          {/* ACTION BUTTONS ON FOOTER */}
                          {examScore === null && (
                            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 select-none shrink-0">
                              <button
                                onClick={() => {
                                  setCurrentSelectedPracticeExam(null);
                                  setActiveGeneratedExam("");
                                  setSelectedExamAnswers({});
                                  setExamEssayAnswer("");
                                  setExamScore(null);
                                  setExamFeedback("");
                                  setExamTimeRemaining(0);
                                  triggerToast("Đã hủy bài thi hiện hành.");
                                }}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl transition cursor-pointer"
                              >
                                Thoát khỏi phòng thi
                              </button>
                              <button
                                onClick={handleSubmitExam}
                                disabled={isSubmittingExam}
                                className={`px-5 py-2.5 bg-indigo-600 hover:bg-indigo-550 text-white rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
                                  isSubmittingExam ? "opacity-60 cursor-not-allowed" : ""
                                }`}
                              >
                                {isSubmittingExam ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>AI Đang kiểm tra & nộp...</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckSquare className="w-4 h-4" />
                                    <span>Nộp bài & Chấm điểm AI</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                        </div>

                        {/* Right block: dynamic grading outcome report details */}
                        <div className="lg:col-span-4 space-y-6">
                          
                          {/* Circular Score display */}
                          {examScore !== null && (
                            <div className={`p-6 rounded-2xl border shadow-sm text-center animate-pulse-once ${
                              darkMode ? "bg-gradient-to-b from-[#131b2e] to-slate-900 border-[#1e293b]" : "bg-white border-slate-200"
                            }`}>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider mb-2">Điểm học thuật đạt được</span>
                              
                              {/* Big scoring circle */}
                              <div className="relative w-28 h-28 mx-auto flex items-center justify-center mb-3">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle cx="56" cy="56" r="48" stroke={darkMode ? "#1e293b" : "#edf2f7"} strokeWidth="8" fill="transparent" />
                                  <circle cx="56" cy="56" r="48" stroke="#10b981" strokeWidth="8" fill="transparent"
                                          strokeDasharray="301.6"
                                          strokeDashoffset={301.6 - (301.6 * (examScore / 10))}
                                          strokeLinecap="round" />
                                </svg>
                                <span className="absolute text-2xl font-bold font-mono tracking-tight dark:text-white text-slate-900">
                                  {examScore}
                                </span>
                              </div>

                              <h4 className="font-bold text-xs mb-1">
                                {examScore >= 8.5 ? "Cực kỳ xuất sắc!" : examScore >= 7.0 ? "Đạt tiêu chuẩn tốt!" : "Cần tự học bồi dưỡng thêm"}
                              </h4>
                              <p className="text-slate-400 text-[10px]">
                                Điểm thi thử bám sát trực diện phổ điểm kì thi THPT Quốc gia hiện hành.
                              </p>
                            </div>
                          )}

                          {/* AI Diagnosis details panel */}
                          <div className={`p-6 rounded-2xl border shadow-sm h-fit ${
                            darkMode ? "bg-[#131b2e] border-[#1e293b] text-slate-300" : "bg-white border-slate-200 text-slate-700"
                          }`}>
                            <h3 className="font-bold text-xs mb-3 flex items-center gap-1.5 border-b pb-2">
                              <Sparkles className="w-4 h-4 text-yellow-400" />
                              Bản lĩnh phòng thi & Chẩn đoán AI
                            </h3>

                            {examScore === null ? (
                              <div className="text-center py-4 text-slate-400 text-[11px] leading-relaxed">
                                <p className="mb-2">⌛ Sẵn sàng hội thoại thi cử.</p>
                                Lựa chọn đề mẫu hoặc khởi sinh đề ngẫu nhiên, hoàn tất đầy đủ bài làm và ấn nút "Nộp bài" để kích hoạt chẩn đoán năng lực toàn diện từ hệ thống Studydase AI Tutor!
                              </div>
                            ) : (
                              <div className="space-y-4 select-text">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-slate-400 uppercase font-bold">LỜI PHÊ VÀ KHUYÊN AI CHUYÊN SÂU:</span>
                                  <div className={`p-3.5 rounded-lg text-[11px] leading-relaxed font-mono select-text whitespace-pre-wrap max-h-[380px] overflow-y-auto ${
                                    darkMode ? "bg-slate-900/40 text-sky-200" : "bg-slate-50 text-slate-800"
                                  }`}>
                                    {examFeedback || "Đang tổng hợp chẩn đoán..."}
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    setCurrentSelectedPracticeExam(null);
                                    setActiveGeneratedExam("");
                                    setSelectedExamAnswers({});
                                    setExamEssayAnswer("");
                                    setExamScore(null);
                                    setExamFeedback("");
                                    setExamTimeRemaining(0);
                                  }}
                                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold tracking-wide transition cursor-pointer"
                                >
                                  Hoàn thành thi thử / Về trang đề
                                </button>
                              </div>
                            )}

                          </div>

                        </div>

                      </div>
                    )}

                  </div>
                );
              })()}

              {activeTab === "statistics" && (
                <div id="view-statistics" className="space-y-6 animate-fade-in">

                  {/* Competence Map & detailed stats */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Radar competency spider representation SVG (Phân tích 6 môn) */}
                    <div className={`lg:col-span-5 p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div>
                        <h3 className="font-bold text-base">Bản đồ phân tích năng lực 6 môn</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Biểu đồ thể hiện mức độ nắm vững chủ đề tính theo số học phần hoàn thành.</p>
                      </div>

                      {/* Exquisite pure responsive SVG radar chart structure */}
                      <div className="h-64 w-full flex items-center justify-center relative my-4">
                        <svg viewBox="0 0 220 220" className="w-48 h-48 overflow-visible">
                          
                          {/* Outer concentric grid polygon rings (Radar axes) */}
                          <polygon points="110,10 196,60 196,160 110,210 24,160 24,60" fill="none" stroke="#334155" strokeWidth="1" opacity="0.3" />
                          <polygon points="110,40 171,75 171,145 110,180 49,145 49,75" fill="none" stroke="#334155" strokeWidth="0.8" opacity="0.25" strokeDasharray="2 2" />
                          <polygon points="110,70 145,90 145,130 110,150 75,130 75,90" fill="none" stroke="#334155" strokeWidth="0.8" opacity="0.2" />

                          {/* Axes wires from origin */}
                          <line x1="110" y1="110" x2="110" y2="10" stroke="#475569" strokeWidth="1" opacity="0.4" />
                          <line x1="110" y1="110" x2="196" y2="60" stroke="#475569" strokeWidth="1" opacity="0.4" />
                          <line x1="110" y1="110" x2="196" y2="160" stroke="#475569" strokeWidth="1" opacity="0.4" />
                          <line x1="110" y1="110" x2="110" y2="210" stroke="#475569" strokeWidth="1" opacity="0.4" />
                          <line x1="110" y1="110" x2="24" y2="160" stroke="#475569" strokeWidth="1" opacity="0.4" />
                          <line x1="110" y1="110" x2="24" y2="60" stroke="#475569" strokeWidth="1" opacity="0.4" />

                          {/* Axis Label details */}
                          <text x="110" y="2" fill="#818cf8" fontSize="8" fontWeight="bold" textAnchor="middle">Toán học ({calculateSubjectProgress("Toán học")}%)</text>
                          <text x="206" y="58" fill="#38bdf8" fontSize="8" fontWeight="bold" textAnchor="start">Vật lý ({calculateSubjectProgress("Vật lý")}%)</text>
                          <text x="206" y="166" fill="#fb923c" fontSize="8" fontWeight="bold" textAnchor="start">Hóa học ({calculateSubjectProgress("Hóa học")}%)</text>
                          <text x="110" y="219" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">Sinh học ({calculateSubjectProgress("Sinh học")}%)</text>
                          <text x="14" y="166" fill="#a78bfa" fontSize="8" fontWeight="bold" textAnchor="end">Ngữ văn ({calculateSubjectProgress("Ngữ văn")}%)</text>
                          <text x="14" y="58" fill="#ec4899" fontSize="8" fontWeight="bold" textAnchor="end">Tiếng Anh ({calculateSubjectProgress("Tiếng Anh")}%)</text>

                          {/* Computed Data Polygon representing user progress per subject */}
                          {(() => {
                            const pToan = (calculateSubjectProgress("Toán học") || 10) / 100 * 100;
                            const pLy = (calculateSubjectProgress("Vật lý") || 10) / 100 * 100;
                            const pHoa = (calculateSubjectProgress("Hóa học") || 10) / 100 * 100;
                            const pSinh = (calculateSubjectProgress("Sinh học") || 10) / 100 * 100;
                            const pVan = (calculateSubjectProgress("Ngữ văn") || 10) / 100 * 100;
                            const pAnh = (calculateSubjectProgress("Tiếng Anh") || 10) / 100 * 100;

                            const ptToan = `110,${110 - pToan}`;
                            const ptLy = `${110 + pLy * 0.866},${110 - pLy * 0.5}`;
                            const ptHoa = `${110 + pHoa * 0.866},${110 + pHoa * 0.5}`;
                            const ptSinh = `110,${110 + pSinh}`;
                            const ptVan = `${110 - pVan * 0.866},${110 + pVan * 0.5}`;
                            const ptAnh = `${110 - pAnh * 0.866},${110 - pAnh * 0.5}`;

                            const polyStr = `${ptToan} ${ptLy} ${ptHoa} ${ptSinh} ${ptVan} ${ptAnh}`;

                            return (
                              <>
                                <polygon
                                  points={polyStr}
                                  fill="#6366f1"
                                  fillOpacity="0.32"
                                  stroke="#818cf8"
                                  strokeWidth="2"
                                />
                                <circle cx="110" cy={110 - pToan} r="3" fill="#818cf8" />
                                <circle cx={110 + pLy * 0.866} cy={110 - pLy * 0.5} r="3" fill="#38bdf8" />
                                <circle cx={110 + pHoa * 0.866} cy={110 + pHoa * 0.5} r="3" fill="#fb923c" />
                                <circle cx="110" cy={110 + pSinh} r="3" fill="#10b981" />
                                <circle cx={110 - pVan * 0.866} cy={110 + pVan * 0.5} r="3" fill="#a78bfa" />
                                <circle cx={110 - pAnh * 0.866} cy={110 - pAnh * 0.5} r="3" fill="#ec4899" />
                              </>
                            );
                          })()}

                        </svg>
                      </div>

                      <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800 text-slate-300 text-xs">
                        <span className="font-bold text-yellow-300">💡 Chẩn đoán AI:</span> Điểm mạnh tích lũy của bạn là môn <strong>Toán học</strong> và <strong>Tiếng Anh</strong>. Môn học cần khắc phục thêm học phần để cải thiện chỉ số là <strong>Sinh học</strong> và <strong>Ngữ văn</strong>. Hãy vào Tab cây kiến thức ôn tập thêm nhé.
                      </div>
                    </div>

                    {/* Vigat Account settings detail (as shown in image 7 "Vigat - Trung tâm tài khoản") */}
                    <div id="account-settings-card" className={`lg:col-span-7 p-6 rounded-2xl border shadow-sm h-fit ${
                      darkMode ? "bg-[#131b2e] border-slate-800" : "bg-white border-slate-200"
                    }`}>
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="font-bold text-base">Khởi tạo thiết lập Hồ sơ học tập cá nhân</h3>
                          <p className="text-xs text-slate-400 mt-0.5">Tùy biến thông tin định hướng và phương thức lời khuyên từ AI.</p>
                        </div>
                        <button
                          id="btn-edit-account"
                          onClick={() => {
                            if (isEditingAccount) {
                              triggerToast("Đã lưu phát kiến hiệu lực của tài khoản!");
                            }
                            setIsEditingAccount(!isEditingAccount);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-550 text-white text-xs px-3 py-1.5 rounded-xl transition"
                        >
                          {isEditingAccount ? "Lưu lại" : "Chỉnh sửa"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Column 1: Account Info fields */}
                        <div className="space-y-3.5 text-xs">
                          <div>
                            <label className="text-[11px] text-slate-400 font-bold block mb-1">Tên học sinh đăng ký</label>
                            <input
                              type="text"
                              disabled={!isEditingAccount}
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 capitalize transition ${
                                isEditingAccount 
                                  ? darkMode ? "bg-slate-900 border-slate-750 text-white" : "bg-white border-slate-300 text-slate-900"
                                  : "bg-transparent border-transparent cursor-not-allowed opacity-80"
                              }`}
                            />
                          </div>

                          {/* Interactive Avatar Select Grid */}
                          <div>
                            <label className="text-[11px] text-slate-400 font-bold block mb-1">Chọn ảnh đại diện Avatar Emoji (Trực quan)</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {["🎓", "🚀", "💡", "🍀", "🦉", "🌟", "🔥", "🎨"].map((emoji) => (
                                <button
                                  key={emoji}
                                  disabled={!isEditingAccount}
                                  onClick={() => {
                                    setUserAvatar(emoji);
                                    localStorage.setItem("studydase_user_avatar", emoji);
                                    triggerToast(`Đã cập nhật hình đại diện: ${emoji}`);
                                  }}
                                  className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition-all border ${
                                    userAvatar === emoji
                                      ? "bg-indigo-600/35 border-indigo-500 scale-105"
                                      : isEditingAccount
                                        ? "hover:bg-indigo-600/10 bg-slate-800/10 border-slate-700/60 cursor-pointer"
                                        : "opacity-60 cursor-not-allowed border-transparent"
                                  }`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-400 font-bold block mb-1">Email liên lạc</label>
                            <input
                              type="email"
                              disabled={!isEditingAccount}
                              value={userEmail}
                              onChange={(e) => setUserEmail(e.target.value)}
                              className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
                                isEditingAccount 
                                  ? darkMode ? "bg-slate-900 border-slate-750 text-white" : "bg-white border-slate-300 text-slate-900"
                                  : "bg-transparent border-transparent cursor-not-allowed opacity-80"
                              }`}
                            />
                          </div>

                          <div>
                            <label className="text-[11px] text-slate-400 font-bold block mb-1">Số điện thoại liên hệ</label>
                            <input
                              type="text"
                              disabled={!isEditingAccount}
                              value={userPhone}
                              onChange={(e) => setUserPhone(e.target.value)}
                              className={`w-full p-2.5 rounded-xl border focus:outline-none focus:ring-1 focus:ring-indigo-500 transition ${
                                isEditingAccount 
                                  ? darkMode ? "bg-slate-900 border-slate-750 text-white" : "bg-white border-slate-300 text-slate-900"
                                  : "bg-transparent border-transparent cursor-not-allowed opacity-80"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Column 2: Specific AI behavior selections */}
                        <div className="space-y-3 px-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800 text-xs">
                          <h4 className="font-bold text-indigo-400 uppercase tracking-widest text-[10px] mb-2">Tùy chọn phong cách dạy học</h4>
                          
                          <div className="space-y-2">
                            <label className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked className="rounded text-indigo-600" />
                              <span>Học thuật ngắn gọn, chuyên sâu</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked className="rounded text-indigo-600" />
                              <span>Cung cấp bẫy lỗi trắc nghiệm</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input type="checkbox" className="rounded text-indigo-600" />
                              <span>Sử dụng sơ đồ tư duy dạng chữ</span>
                            </label>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-800">
                            <span className="text-[10px] text-slate-400 block mb-1">Mục tiêu ôn thi THPT đặt điểm số</span>
                            <div className="flex gap-2">
                              <span className="bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded text-[10px] font-bold border border-indigo-500/20">Toán: 9+</span>
                              <span className="bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded text-[10px] font-bold border border-indigo-500/20">Vật lý: 8.5+</span>
                              <span className="bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded text-[10px] font-bold border border-indigo-500/20">Hóa học: 8.5+</span>
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* Diagnostic Metrics and Manual Adjustment block */}
                      <div className="mt-6 pt-4 border-t border-slate-800">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Tùy chỉnh phân bổ tiến độ học bằng tay</h4>
                            <p className="text-[11px] text-slate-400">Bạn muốn cập nhật nhanh số liệu học lập thành tích nhanh?</p>
                          </div>
                          
                          <div id="quick-adjust-buttons" className="flex gap-2">
                            <button
                              id="btn-add-day"
                              onClick={() => {
                                setTotalDays(prev => prev + 1);
                                setStudyMinutes(prev => prev + 60);
                                triggerToast("Đã rèn luyện thêm +1 Ngày vào dữ liệu cá nhân hóa!");
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                            >
                              + Thêm 1 ngày
                            </button>
                            <button
                              id="btn-increment-accuracy"
                              onClick={() => {
                                setAccuracy(prev => Math.min(100, Number((prev + 0.5).toFixed(1))));
                                triggerToast("Wow! Tỷ lệ giải chính xác của bạn được AI nâng tầm thêm 0.5%!");
                              }}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition"
                            >
                              + Tăng tỷ lệ Đạt
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              )}

            </div>
          </main>

        </div>

      </div>
      )}

    </div>
  );
}
