import React, { useState, useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { LoaderCircle } from "lucide-react";

const WEIGHTS = {
  focus: 25,
  exposure: 15,
  color: 15,
  composition: 20,
  resolution: 10,
  face_detection: 15,
};

const LABEL_MAP = {
  focus: "초점 정확도",
  exposure: "노출 적정성",
  color: "색감 밸런스",
  composition: "구도 안정성",
  resolution: "해상도/노이즈",
  face_detection: "얼굴 인식 정확도",
};

const NICKNAME_LABELS = [
  { min: 96, label: "🎨 사진 예술의 거장" },
  { min: 86, label: "📷 감각이 뛰어난 전문가" },
  { min: 71, label: "📸 감성을 아는 실력자" },
  { min: 51, label: "🔍 성장 중인 사진가" },
  { min: 26, label: "🤳 아직은 미숙한 도전자" },
  { min: 0, label: "💩 기준 미달의 똥손" },
];

const App = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const resultRef = useRef<HTMLDivElement | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setResult(null);
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
      const response = await fetch(import.meta.env.VITE_API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: preview }),
      });
      const data = await response.json();
      const nickname = NICKNAME_LABELS.find(
        (n) => data.final_score >= n.min
      )?.label;
      setResult({ ...data, nickname });
    } catch (error) {
      console.error("Error submitting image:", error);
      alert("이미지 평가 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

const handleDownload = () => {
    if (captureRef.current === null) {
      return
    }

    setDownloading(true);

    toPng(captureRef.current, { cacheBust: true, })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = 'result.png'
        link.href = dataUrl
        link.click()
        setDownloading(false)
      })
      .catch((err) => {
        console.log(err)
         setDownloading(false)
      })
};

const handleShare = async() => {
  const shareData = {
    title: "사진 품질 측정기",
    text: "취미로 찍은 사진, 혹시 작품일지도 몰라요!",
    url: window.location.href,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      console.error("공유 취소 또는 오류:", err);
    }
  } else {
    alert("이 브라우저는 공유 기능을 지원하지 않습니다.");
  }
};


  useEffect(() => {
    if (resultRef.current && result) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="flex py-3 px-4 text-center font-semibold gap-3">
        <div className="cursor-pointer flex gap-3 select-none">
          <img src="/chevron-left.svg" alt="chevron-left" />
          <div>나의 사진 점수 테스트</div>
        </div>
      </header>
      <main className="flex-grow w-full max-w-3xl mx-auto p-4">
        <div className="flex justify-center select-none">
          <div className="bg-[#414651] text-white text-sm w-fit py-1 px-2 rounded-lg flex flex-col items-center">
            <p>🔒 걱정 마세요!</p>
            <p>사진은 저장되지 않고, 분석 후 바로 사라져요.</p>
          </div>
        </div>
        <section id="download-section" ref={captureRef}>
        <div className="bg-white shadow rounded-lg p-4 mt-5">
          <div className="text-left ">
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
                className="max-h-[calc(100vh-500px)] w-auto max-w-full object-contain mx-auto rounded-lg shadow mb-6 mt-5"
              />
            )}

            <div className="flex justify-center mt-5 gap-4">
              <div>
                <label
                  htmlFor="file-upload"
                  className={`inline-block cursor-pointer ${
                    preview ? "bg-white border" : "bg-[#181d27] text-white"
                  }  font-semibold py-3 px-4 rounded-lg whitespace-nowrap`}
                >
                  <span>{preview ? "사진 변경하기" : "사진 업로드"}</span>
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <div>
                {preview && (
                  <button
                    onClick={handleSubmit}
                    disabled={!imageFile || loading || !!result}
                    className="bg-[#181d27] text-white font-semibold py-3 px-4 rounded-lg disabled:opacity-50 w-full cursor-pointer"
                  >
                    {loading ? "평가 중..." : "사진 분석하기"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        {result && (
          <div
            ref={resultRef}
            className="mt-5 bg-white shadow-lg rounded-lg p-4"
          >
            <h2 className="text-2xl font-bold mb-5">분석 결과</h2>

            <div className="flex flex-col gap-2">
              <p className="text-lg font-bold">{result.nickname}</p>
              <div className="flex items-center gap-2">
                <div>
                  <img src="/activity.svg" alt="activity" />
                </div>
                <div>
                  <span className="text-[#939ad4]">{result.final_score}</span>점
                </div>
                <div className="flex-1 h-[4px] bg-[#FAFAFA] rounded">
                  <div
                    className={`h-full rounded bg-[#6172F3]`}
                    style={{ width: `${result.final_score}%` }}
                  />
                </div>
                <div>100점</div>
              </div>

              <div className="flex gap-1">
                <div className="min-w-[16px]">
                  <img src="/bling-black.svg" alt="bling-black" />
                </div>
                <div className="text-[#414651]">{result.comment}</div>
              </div>
            </div>

            <div className="flex gap-4 justify-center mt-5">
              <button disabled={downloading} onClick={handleDownload} className="cursor-pointer w-[248px] px-4 py-3 bg-[#9E77ED] font-semibold text-white rounded-lg shadow-lg">
                {downloading ? <LoaderCircle className="animate-spin mx-auto"/> : '결과 저장하기'}
              </button>
              <button onClick={handleShare} className="cursor-pointer p-4 border-1 border-[#9E77ED] rounded-lg text-[#9E77ED] font-semibold">
                <img src="/share.svg" alt="share" />
              </button>
            </div>

            <div className="my-5 h-[1px] border border-[#F5f5F5]" />

            <h2 className="text-xl font-bold mb-4">상세 결과</h2>
            {Object.entries(WEIGHTS).map(([key, weight]) => {
              const score = result[key]?.score ?? 0;
              const reason = result[key]?.reason ?? "";
              const labelKey = key as keyof typeof LABEL_MAP;

              return (
                <div key={key} className="mb-5 flex flex-col gap-2">
                  <div className="font-semibold text-base mb-1 flex justify-between items-center">
                    <div className="flex gap-1">
                      <img src="/check.svg" alt="check" />
                      <span> {LABEL_MAP[labelKey]}</span>
                    </div>
                    <span className="text-sm text-gray-500">{weight}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <img src="/activity.svg" alt="activity" />
                    </div>
                    <div>
                      <span className="font-medium">{score}</span>점
                    </div>
                    <div className="flex-1 h-1 bg-[#FAFAFA] rounded">
                      <div
                        className={`h-full rounded bg-[#181D27]`}
                        style={{ width: `${(score / 5) * 100}%` }}
                      />
                    </div>
                    <div>5점</div>
                  </div>
                  <p className="flex gap-1 text-[#414651]">
                    <img src="/bling-black.svg" alt="bling-black" />
                    <span>{reason}</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
        </section>
      </main>
    </div>
  );
};

export default App;
