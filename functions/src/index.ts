import { onRequest } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
dotenv.config();

function stripMarkdownJson(text: string): string {
  return text.replace(/```json\s*|```/gi, "").trim();
}

const weights: Record<string, number> = {
  focus: 0.25,
  exposure: 0.15,
  color: 0.15,
  composition: 0.20,
  resolution: 0.10,
  face_detection: 0.15
};

const computeFinalScore = (scores: Record<string, number>) => {
  let total = 0;
  for (const key in weights) {
    total += (scores[key] ?? 0) * weights[key];
  }
  return Math.round(total * 20 * 10) / 10;
};

exports.evaluatePhoto = onRequest({ cors: ["http://localhost:3000", "https://photo-quality-880b6.web.app"] }, async (req: any, res: any) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Image is required." });

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.2
      }
    });

    const prompt = `
    You are a professional photo quality evaluator.
    
    Evaluate the image using the 6 criteria below. For each, score from 0 to 5 (steps of 0.5 allowed) and explain briefly in Korean.
    Do NOT hesitate to assign very low scores (even 0 or 1) if the quality is clearly poor.
    Avoid assigning 4 or 5 to all items unless the image is truly outstanding.

    📎 Scoring Guidelines:
    - 5: Excellent
    - 4: Good
    - 3: Average
    - 2: Needs improvement
    - 1: Poor
    - 0: Unacceptable

    Do NOT calculate the final_score.
    Only return the 6 category scores (0~5) with short Korean explanations, and one overall comment.

    Respond with raw JSON only. No markdown, no extra text.
    
    {
      "focus": { "score": <0-5>, "reason": "..." },
      "exposure": { "score": <0-5>, "reason": "..." },
      "color": { "score": <0-5>, "reason": "..." },
      "composition": { "score": <0-5>, "reason": "..." },
      "resolution": { "score": <0-5>, "reason": "..." },
      "face_detection": { "score": <0-5>, "reason": "..." },
      "comment": ""
    }
    `;
    

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: image.split(",")[1],
        },
      },
    ]);

    const text = await result.response.text();
    console.log("🧠 Gemini Response:", text);

    const clean = stripMarkdownJson(text);
    const parsed = JSON.parse(clean);

    const final_score = computeFinalScore({
      focus: parsed.focus.score,
      exposure: parsed.exposure.score,
      color: parsed.color.score,
      composition: parsed.composition.score,
      resolution: parsed.resolution.score,
      face_detection: parsed.face_detection.score
    });

    res.status(200).json({
      ...parsed,
      final_score
    });

  } catch (err: any) {
    console.error("Photo evaluation failed:", err.message);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});
