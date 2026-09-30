import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mic, RotateCcw, Sparkles, Square } from "lucide-react";

import { trpc } from "@/lib/trpc";

export type EvaluationResult = {
  transcript: string;
  duration: number;
  overallScore: number;
  pronunciationScore: number;
  fluencyScore: number;
  accuracyScore: number;
  summary: string;
  issues: string[];
  suggestions: string[];
};

type EvaluationState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "recording" }
  | { status: "processing" }
  | { status: "ready"; result: EvaluationResult }
  | { status: "error"; message: string };

type InlineRecorderProps = {
  targetSentence: string;
  onEvaluationReady?: (result: EvaluationResult) => void;
};

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

function pickMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return "";
  return MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function describeError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "请在浏览器中允许麦克风权限后重试。";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "没有找到麦克风，请连接设备后重试。";
    }
    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return "麦克风正在被其他应用占用，请关闭后重试。";
    }
  }
  if (error instanceof Error && error.message) return error.message;
  return "录音暂时无法完成，请稍后重试。";
}

function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("无法读取录音文件。"));
    };
    reader.onerror = () => reject(new Error("无法读取录音文件。"));
    reader.readAsDataURL(blob);
  });
}

function scoreTone(score: number) {
  if (score >= 85) return "优秀";
  if (score >= 70) return "不错";
  if (score >= 55) return "继续练习";
  return "需要加强";
}

export default function InlineRecorder({ targetSentence, onEvaluationReady }: InlineRecorderProps) {
  const [state, setState] = useState<EvaluationState>({ status: "idle" });
  const [isScoreVisible, setIsScoreVisible] = useState(true);
  const evaluateMutation = trpc.voice.evaluate.useMutation();
  const mountedRef = useRef(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef(0);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const invalidateCurrentRecording = useCallback(() => {
    sessionRef.current += 1;
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        // A closing recorder can be safely ignored; the stream is released below.
      }
      recorderRef.current = null;
    }
    releaseStream();
  }, [releaseStream]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      invalidateCurrentRecording();
    };
  }, [invalidateCurrentRecording]);

  const evaluateRecording = useCallback(async (blob: Blob, mimeType: string, sessionId: number) => {
    if (!mountedRef.current || sessionId !== sessionRef.current) return;
    setState({ status: "processing" });

    try {
      if (blob.size > 16 * 1024 * 1024) {
        throw new Error("录音超过 16MB，暂时无法评分。请录制更短的句子。");
      }
      const audioBase64 = await readBlobAsDataUrl(blob);
      const result = await evaluateMutation.mutateAsync({
        audioBase64,
        mimeType,
        targetSentence,
        language: "en",
      });

      if (!mountedRef.current || sessionId !== sessionRef.current) return;
      setIsScoreVisible(true);
      setState({ status: "ready", result });
      onEvaluationReady?.(result);
    } catch (error) {
      if (!mountedRef.current || sessionId !== sessionRef.current) return;
      setState({ status: "error", message: describeError(error) });
    }
  }, [evaluateMutation, onEvaluationReady, targetSentence]);

  const startRecording = useCallback(async () => {
    if (["requesting", "recording", "processing"].includes(state.status)) return;

    invalidateCurrentRecording();
    const sessionId = sessionRef.current;
    setIsScoreVisible(false);
    setState({ status: "requesting" });

    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error("当前浏览器不支持录音功能。请使用最新版 Chrome、Safari 或 Edge。");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!mountedRef.current || sessionId !== sessionRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const preferredMimeType = pickMimeType();
      const recorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream);
      const actualMimeType = recorder.mimeType || preferredMimeType || "audio/webm";
      const chunks: Blob[] = [];

      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder.onerror = () => {
        if (sessionId !== sessionRef.current) return;
        releaseStream();
        recorderRef.current = null;
        if (mountedRef.current) setState({ status: "error", message: "录音过程中出现问题，请重新录制。" });
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: actualMimeType });
        recorderRef.current = null;
        releaseStream();
        if (!mountedRef.current || sessionId !== sessionRef.current) return;
        if (blob.size === 0) {
          setState({ status: "error", message: "没有捕捉到清晰的声音，请再录一次。" });
          return;
        }
        void evaluateRecording(blob, actualMimeType, sessionId);
      };

      recorder.start(250);
      setState({ status: "recording" });
    } catch (error) {
      releaseStream();
      recorderRef.current = null;
      if (mountedRef.current && sessionId === sessionRef.current) {
        setState({ status: "error", message: describeError(error) });
      }
    }
  }, [evaluateRecording, invalidateCurrentRecording, releaseStream, state.status]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch {
      setState({ status: "error", message: "录音停止失败，请重新录制。" });
    }
  }, []);

  const isRecording = state.status === "recording";
  const isBusy = state.status === "requesting" || state.status === "processing";
  const result = state.status === "ready" ? state.result : null;

  const hideScoreCard = () => setIsScoreVisible(false);

  return (
    <div className="inline-recorder">
      <button
        className={`dialogue-action-button inline-recorder__button ${isRecording ? "dialogue-action-button--active" : ""}`}
        type="button"
        onClick={isRecording ? stopRecording : () => void startRecording()}
        disabled={isBusy}
        aria-label={isRecording ? "停止逐句录音" : "录制这句英语并获取 AI 评分"}
      >
        {isBusy ? <Loader2 size={14} className="inline-recorder__spin" /> : isRecording ? <Square size={14} /> : result ? <RotateCcw size={14} /> : <Mic size={14} />}
        {state.status === "requesting" ? "准备中…" : state.status === "processing" ? "AI评分中…" : isRecording ? "停止" : result ? "再录一次" : "录音"}
      </button>

      {state.status === "error" && (
        <p className="dialogue-line__error inline-recorder__error" role="alert">{state.message}</p>
      )}

      {result && isScoreVisible && (
        <section
          className="inline-score-card"
          aria-label="AI 跟读评分，点击隐藏"
          role="button"
          tabIndex={0}
          title="点击隐藏 AI 评分"
          onClick={hideScoreCard}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              hideScoreCard();
            }
          }}
        >
          <div className="inline-score-card__header">
            <div>
              <span className="inline-score-card__eyebrow"><Sparkles size={13} /> AI 跟读评分</span>
              <strong>{scoreTone(result.overallScore)}</strong>
            </div>
            <div
              className="inline-score-card__ring"
              style={{ background: `conic-gradient(#1f68d5 ${result.overallScore}%, rgba(31, 104, 213, 0.14) 0)` }}
              aria-label={`总分 ${result.overallScore} 分`}
            >
              <div className="inline-score-card__ring-inner"><b>{result.overallScore}</b><span>/100</span></div>
            </div>
          </div>
          <div className="inline-score-card__metrics">
            <div><span>发音</span><b>{result.pronunciationScore}</b></div>
            <div><span>流利度</span><b>{result.fluencyScore}</b></div>
            <div><span>准确度</span><b>{result.accuracyScore}</b></div>
          </div>
          <p className="inline-score-card__transcript"><span>识别内容</span>“{result.transcript}”</p>
          <p className="inline-score-card__summary">{result.summary}</p>
          {result.issues.length > 0 && (
            <div className="inline-score-card__issues">
              <span>问题指出</span>
              <ul>
                {result.issues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}
              </ul>
            </div>
          )}
          {result.suggestions.length > 0 && (
            <div className="inline-score-card__suggestions">
              <span>改进建议</span>
              <ul>
                {result.suggestions.map((suggestion, index) => <li key={`${suggestion}-${index}`}>{suggestion}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
