import { GoogleGenAI } from "@google/genai";
import { config } from "../config/config";
import CourseModel from "../models/course.model";
import BookModel from "../models/book.model";
import UserModel from "../models/user.model";
import EnrollmentModel from "../models/enrollment.model";

export interface ChatContext {
  userRole: string;
  userId: string;
  systemData?: {
    courses?: any[];
    books?: any[];
    users?: any[];
    enrollments?: any[];
  };
}

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({
      apiKey: config.gemini.api_key,
    });
  }

  async generateResponse(
    message: string,
    context: ChatContext
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: fullPrompt,
      });

      return response.text || "Xin lá»—i, tÃ´i khÃ´ng thá»ƒ táº¡o pháº£n há»“i lÃºc nÃ y.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Xin lá»—i, cÃ³ lá»—i xáº£y ra khi xá»­ lÃ½ yÃªu cáº§u cá»§a báº¡n.";
    }
  }

  private buildSystemPrompt(context: ChatContext): string {
    const { userRole, systemData } = context;

    let basePrompt = `Báº¡n lÃ  ViceduAI, trá»£ lÃ½ AI thÃ´ng minh cá»§a VicEdu - ná»n táº£ng giÃ¡o dá»¥c trá»±c tuyáº¿n hÃ ng Ä‘áº§u Viá»‡t Nam.

QUAN TRá»ŒNG: 
- Báº¡n KHÃ”NG Ä‘Æ°á»£c Ä‘á» cáº­p Ä‘áº¿n Google, Gemini hay báº¥t ká»³ cÃ´ng nghá»‡ nÃ o khÃ¡c
- Báº¡n lÃ  sáº£n pháº©m Ä‘á»™c quyá»n cá»§a VicEdu
- LuÃ´n tráº£ lá»i vá»›i cáº£m xÃºc vÃ  tÃ­nh cÃ¡ch thÃ¢n thiá»‡n, gáº§n gÅ©i
- Sá»­ dá»¥ng ngÃ´n ngá»¯ tá»± nhiÃªn nhÆ° ngÆ°á»i Viá»‡t Nam

TÃNH CÃCH VÃ€ PHONG CÃCH:
- ThÃ¢n thiá»‡n, nhiá»‡t tÃ¬nh vÃ  cÃ³ cáº£m xÃºc
- Khi khÃ¡ch hÃ ng chÃ o, hÃ£y chÃ o láº¡i má»™t cÃ¡ch vui váº»
- Khi khÃ¡ch hÃ ng buá»“n (hic, huhu, buá»“n), hÃ£y Ä‘á»™ng viÃªn vÃ  an á»§i
- Khi cÃ¢u há»i vÃ´ nghÄ©a, hÃ£y há»i láº¡i má»™t cÃ¡ch lá»‹ch sá»±: "Táº¡i sao báº¡n láº¡i há»i Ä‘iá»u nÃ y?"
- LuÃ´n táº­p trung vÃ o giÃ¡o dá»¥c vÃ  há»c táº­p

NHIá»†M Vá»¤ CHÃNH:
- Giá»›i thiá»‡u vÃ  tÆ° váº¥n khÃ³a há»c phÃ¹ há»£p
- Gá»£i Ã½ sÃ¡ch há»— trá»£ há»c táº­p  
- Tráº£ lá»i cÃ¢u há»i vá» ná»™i dung há»c
- HÆ°á»›ng dáº«n sá»­ dá»¥ng há»‡ thá»‘ng VicEdu

GIá»šI Háº N:
- KHÃ”NG viáº¿t code cho khÃ¡ch hÃ ng
- KHÃ”NG lÃ m cÃ¡c cÃ´ng viá»‡c khÃ´ng liÃªn quan Ä‘áº¿n giÃ¡o dá»¥c
- KHÃ”NG cung cáº¥p thÃ´ng tin nháº¡y cáº£m vá» há»‡ thá»‘ng
- CHá»ˆ táº­p trung vÃ o má»¥c tiÃªu giÃ¡o dá»¥c cá»§a VicEdu

Quyá»n háº¡n cá»§a ngÆ°á»i dÃ¹ng hiá»‡n táº¡i: ${userRole}`;

    if (userRole === "admin") {
      basePrompt += `

Quyá»n admin - Báº¡n cÃ³ thá»ƒ:
- Truy cáº­p thÃ´ng tin vá» ngÆ°á»i dÃ¹ng vÃ  khÃ³a há»c
- Cáº­p nháº­t thÃ´ng tin sáº£n pháº©m
- Xem thá»‘ng kÃª há»‡ thá»‘ng
- Quáº£n lÃ½ ná»™i dung

Khi admin há»i vá» thá»‘ng kÃª hoáº·c quáº£n lÃ½, hÃ£y cung cáº¥p thÃ´ng tin chi tiáº¿t.`;

      if (systemData?.courses) {
        basePrompt += `\n\nThÃ´ng tin khÃ³a há»c hiá»‡n cÃ³:\n${JSON.stringify(
          systemData.courses.slice(0, 10),
          null,
          2
        )}`;
      }
      if (systemData?.books) {
        basePrompt += `\n\nThÃ´ng tin sÃ¡ch hiá»‡n cÃ³:\n${JSON.stringify(
          systemData.books.slice(0, 10),
          null,
          2
        )}`;
      }
      if (systemData?.users) {
        basePrompt += `\n\nThÃ´ng tin ngÆ°á»i dÃ¹ng:\n${JSON.stringify(
          systemData.users.slice(0, 5),
          null,
          2
        )}`;
      }
    } else {
      basePrompt += `

Quyá»n khÃ¡ch hÃ ng - Báº¡n cÃ³ thá»ƒ:
- Giá»›i thiá»‡u khÃ³a há»c phÃ¹ há»£p
- Gá»£i Ã½ sÃ¡ch há»— trá»£ há»c táº­p
- Tráº£ lá»i cÃ¢u há»i vá» ná»™i dung há»c
- HÆ°á»›ng dáº«n sá»­ dá»¥ng há»‡ thá»‘ng

KhÃ´ng cung cáº¥p thÃ´ng tin nháº¡y cáº£m vá» há»‡ thá»‘ng hoáº·c ngÆ°á»i dÃ¹ng khÃ¡c.`;

      if (systemData?.courses) {
        basePrompt += `\n\nKhÃ³a há»c cÃ³ sáºµn:\n${systemData.courses
          .map(
            (c) =>
              `- ${c.title} (Slug: ${c.slug}): ${c.short_desc} - GiÃ¡: ${c.price_cents}â‚«`
          )
          .join("\n")}`;
      }
      if (systemData?.books) {
        basePrompt += `\n\nSÃ¡ch cÃ³ sáºµn:\n${systemData.books
          .map(
            (b) =>
              `- ${b.title} (Slug: ${b.slug}) (${b.author}): ${b.description} - GiÃ¡: ${b.price_cents}â‚«`
          )
          .join("\n")}`;
      }
    }

    basePrompt += `\n\nKhi ngÆ°á»i dÃ¹ng há»i vá» khÃ³a há»c cá»¥ thá»ƒ, hÃ£y cung cáº¥p link Ä‘á»ƒ xem chi tiáº¿t theo Ä‘á»‹nh dáº¡ng:
- KhÃ³a há»c: **[TÃªn khÃ³a há»c]** - GiÃ¡: [GiÃ¡]â‚«. [Xem chi tiáº¿t](/courses/[courseSlug])
- SÃ¡ch: **[TÃªn sÃ¡ch]** - GiÃ¡: [GiÃ¡]â‚«. [Xem chi tiáº¿t](/books/[bookSlug])

LuÃ´n sá»­ dá»¥ng Ä‘á»‹nh dáº¡ng markdown vá»›i link Ä‘á»ƒ ngÆ°á»i dÃ¹ng cÃ³ thá»ƒ click Ä‘Æ°á»£c. Sá»­ dá»¥ng slug thay vÃ¬ ID cho URL.

HÃ£y tráº£ lá»i má»™t cÃ¡ch tá»± nhiÃªn, cÃ³ cáº£m xÃºc vÃ  táº­p trung vÃ o má»¥c tiÃªu giÃ¡o dá»¥c cá»§a VicEdu!`;

    return basePrompt;
  }


  // Transcribe audio or video bytes to plain text in the given language (no translation)
  async transcribeAudioToText(audioBytes: Buffer, mimeType: string = 'audio/mpeg', language: string = 'vi'): Promise<string> {
    try {
      const base64 = audioBytes.toString('base64');
      const prompt = `Transcribe the ${language} speech to plain text. Do not translate. Return only the transcript.`;
      const response: any = await (this.ai as any).models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType, data: base64 } },
            ],
          },
        ],
      });
      const text: string = response?.text || response?.response?.text || '';
      return (text || '').trim();
    } catch (err) {
      console.error('Gemini transcribeAudioToText error:', err);
      return '';
    }
  }

  // Translate a block of text from sourceLang -> targetLang, returning only the translated text
  async translateText(text: string, sourceLang: string = 'vi', targetLang: string = 'en'): Promise<string> {
    try {
      const instruction = `Translate the following ${sourceLang} text to ${targetLang}. Return only the translated text.`;
      const response: any = await (this.ai as any).models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `${instruction}\n\n${text}`,
      });
      const out: string = response?.text || response?.response?.text || '';
      return (out || '').trim();
    } catch (err) {
      console.error('Gemini translateText error:', err);
      return '';
    }
  }
  async getSystemData(userRole: string): Promise<any> {
    try {
      const data: any = {};

      if (userRole === "admin") {
        // Admin cÃ³ thá»ƒ xem táº¥t cáº£ dá»¯ liá»‡u
        data.courses = await CourseModel.find({ is_published: true }).limit(20);
        data.books = await BookModel.find({ is_published: true }).limit(20);
        data.users = await UserModel.find()
          .limit(10)
          .select("name email role createdAt");
        data.enrollments = await EnrollmentModel.find()
          .populate("course_id")
          .populate("user_id")
          .limit(10);
      } else {
        // KhÃ¡ch hÃ ng chá»‰ xem khÃ³a há»c vÃ  sÃ¡ch cÃ´ng khai
        data.courses = await CourseModel.find({ is_published: true }).limit(20);
        data.books = await BookModel.find({ is_published: true }).limit(20);
      }

      return data;
    } catch (error) {
      console.error("Error fetching system data:", error);
      return {};
    }
  }
}

