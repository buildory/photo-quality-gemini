import React, { useState, useRef, useEffect } from "react";

const WEIGHTS = {
  focus: 25,
  exposure: 15,
  color: 15,
  composition: 20,
  resolution: 10,
  face_detection: 15
};

const LABEL_MAP = {
  focus: "초점 정확도",
  exposure: "노출 적정성",
  color: "색감 밸런스",
  composition: "구도 안정성",
  resolution: "해상도/노이즈",
  face_detection: "얼굴 인식 정확도"
};

const NICKNAME_LABELS = [
  { min: 96, label: "🎨 사진 예술의 거장" },
  { min: 86, label: "📷 감각이 뛰어난 전문가" },
  { min: 71, label: "📸 감성을 아는 실력자" },
  { min: 51, label: "🔍 성장 중인 사진가" },
  { min: 26, label: "🤳 아직은 미숙한 도전자" },
  { min: 0,  label: "💩 기준 미달의 똥손" }
];

const getBarColor = (score: number) => {
  if (score >= 4.5) return "bg-green-500";
  if (score >= 3.5) return "bg-yellow-400";
  if (score >= 2.5) return "bg-orange-400";
  return "bg-red-500";
};

const App = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const resultRef = useRef<HTMLDivElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!preview) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(import.meta.env.VITE_API_ENDPOINT , {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview })
      });
      const data = await response.json();
      const nickname = NICKNAME_LABELS.find(n => data.final_score >= n.min)?.label;
      setResult({ ...data, nickname });
    } catch (error) {
      console.error("Error submitting image:", error);
      alert("이미지 평가 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resultRef.current && result) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6 text-center">
        <h1 className="text-3xl font-extrabold text-gray-800">📸 사진 품질 측정기</h1>
        <p className="text-sm text-gray-500 mt-1">AI로 사진의 품질을 평가해드립니다</p>
      </header>

      {/* Main */}
      <main className="flex-grow w-full max-w-3xl mx-auto p-4">
        <div className="flex justify-center select-none">
          <div className="bg-[#414651] text-white text-sm w-fit py-1 px-2 rounded-lg flex flex-col items-center">
            <p>🔒 걱정 마세요!</p>
            <p>사진은 저장되지 않고, 분석 후 바로 사라져요.</p>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 mt-5">
          <div className="text-left ">
            {/* 이미 */}

            <div className="flex flex-col gap-2">
              <p className="text-2xl font-bold">
                AI가 말해주는 내 사진의 점수는?
              </p>
              <p className="flex text-[#6172F3] font-medium">
                <img src="/bling.svg" alt="bling" />
                <span>취미로 찍은 사진, 혹시 작품일지도 몰라요!</span>
              </p>
              <p className="text-[#414651] text-sm">
                초첨부터 감성까지, 6가지 기준으로 사진의 가치를 정밀하게
                분석해드려요.
              </p>
            </div>

            {preview && (
              <img
                src={preview}
                alt="preview"
                className="max-h-[calc(100vh-400px)] w-auto max-w-full object-contain mx-auto rounded-lg shadow mb-6 mt-5"
              />
            )}

            <div className="flex justify-center mt-5 gap-4">
              <div>
  <label
    htmlFor="file-upload"
    className="inline-block cursor-pointer bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded"
  >
    📁 이미지 선택
  </label>
  <input
    id="file-upload"
    type="file"
    accept="image/*"
    onChange={handleFileChange}
    className="hidden"
  />
  {imageFile && (
    <p className="text-sm text-gray-600 mt-2">
      선택된 파일: <span className="font-medium">{imageFile.name}</span>
    </p>
  )}
</div>

          {preview && (
            <img src={preview} alt="preview" className="w-full rounded-lg shadow mb-6" />
          )}

          <button
            onClick={handleSubmit}
            disabled={!imageFile || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50 w-full cursor-pointer"
          >
            {loading ? "평가 중..." : "사진 평가하기"}
          </button>
        </div>

        {result && (
          <div
            ref={resultRef}
className="mt-10 bg-white shadow-lg rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">✨ 평가 결과</h2>

            {Object.entries(WEIGHTS).map(([key, weight]) => {
              const score = result[key]?.score ?? 0;
              const reason = result[key]?.reason ?? "";
              const labelKey = key as keyof typeof LABEL_MAP;

              return (
                <div key={key} className="mb-5">
                  <p className="font-semibold text-base mb-1">
                    🔹 {LABEL_MAP[labelKey]} <span className="text-sm text-gray-500">(가중치 {weight}%)</span>
                  </p>
                  <div className="w-full h-4 bg-gray-200 rounded">
                    <div
                      className={`h-full rounded ${getBarColor(score)}`}
                      style={{ width: `${(score / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-sm mt-1 text-gray-700">📝 {reason}</p>
                  <p className="text-sm">점수: <strong>{score}</strong> / 5</p>
                </div>
              );
            })}

            <hr className="my-4" />

            <p className="text-xl py-6"><strong>{result.nickname}</strong></p>
            <p className="font-semibold">📊 최종 점수: <strong>{result.final_score}</strong></p>
            <p className="mt-2 text-gray-700">💬 종합 코멘트: {result.comment}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 text-center text-sm text-gray-500 py-4 mt-10">
        ⓒ {new Date().getFullYear()} 사진 품질 측정기 | Copyright © phodo. All rights reserved.
      </footer>
    </div>
  );
};

export default App;
