/*
 * Field Notes visual system: Space Grotesk headings, DM Sans body copy, paper-white
 * surfaces, ink navy structure, and signal saffron for active listening. This component
 * keeps recording state explicit and never lets an external library mutate React-owned DOM.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  FileText,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Square,
  Waves,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

export type RecorderStatus =
  | "idle"
  | "requesting"
  | "recording"
  | "paused"
  | "ready"
  | "error";

type TranscriptionReady = {
  text: string;
  language: string;
  duration: number;
};

type RecorderProps = {
  onRecordingReady?: (recording: { blob: Blob; url: string; mimeType: string }) => void;
  onTranscriptionReady?: (transcription: TranscriptionReady) => void;
  mode?: "standalone" | "dialogue";
  showHeader?: boolean;
  showFootnote?: boolean;
};

type ErrorCopy = {
  title: string;
  detail: string;
};

type TranscriptionState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "ready"; text: string; language: string; duration: number }
  | { status: "error"; error: string };

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

function pickMimeType() {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") {
    return "";
  }

  return MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
}

function describeRecordingError(error: unknown): ErrorCopy {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return {
        title: "麦克风权限没有打开",
        detail: "请在浏览器地址栏的权限设置中允许麦克风，然后再试一次。",
      };
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return {
        title: "没有找到麦克风",
        detail: "请连接麦克风，或确认系统没有把它禁用。",
      };
    }

    if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      return {
        title: "麦克风正在被占用",
        detail: "请关闭其他正在使用麦克风的标签页或应用，然后重新录音。",
      };
    }

    if (error.name === "SecurityError") {
      return {
        title: "当前页面无法访问麦克风",
        detail: "请使用 HTTPS 页面，并确认浏览器允许此站点访问麦克风。",
      };
    }
  }

  if (error instanceof Error && error.message.toLowerCase().includes("mediarecorder")) {
    return {
      title: "当前浏览器不支持录音格式",
      detail: "请更新浏览器，或换用最新版 Chrome、Safari 或 Edge。",
    };
  }

  return {
    title: "录音没有开始",
    detail: "浏览器暂时无法建立录音，请检查麦克风后重试。",
  };
}

function formatTime(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function SignalWave({ active, paused }: { active: boolean; paused: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let animationFrame = 0;

    const draw = () => {
      if (!canvas.isConnected) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(canvas.clientWidth, 1);
      const height = Math.max(canvas.clientHeight, 1);
      const targetWidth = Math.floor(width * pixelRatio);
      const targetHeight = Math.floor(height * pixelRatio);

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);
      context.lineWidth = 1.5;
      context.lineCap = "round";
      context.strokeStyle = active ? "#E9A23B" : "#A4B0B6";
      context.beginPath();

      const bars = Math.max(28, Math.floor(width / 9));
      const center = height / 2;
      const motion = active && !paused ? frame * 0.055 : 0;

      for (let index = 0; index < bars; index += 1) {
        const x = (index / (bars - 1)) * width;
        const envelope = 0.18 + 0.82 * Math.sin((index / (bars - 1)) * Math.PI);
        const pulse = active && !paused
          ? 0.36 + 0.64 * Math.abs(Math.sin(motion + index * 0.72))
          : 0.33 + 0.12 * Math.sin(index * 0.48);
        const amplitude = Math.max(3, height * 0.42 * envelope * pulse);
        const y = center - amplitude;
        const bottom = center + amplitude;
        context.moveTo(x, y);
        context.lineTo(x, bottom);
      }

      context.stroke();
      frame += 1;
      if (active && !paused) {
        animationFrame = window.requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [active, paused]);

  return (
    <canvas
      ref={canvasRef}
      className="signal-wave"
      aria-hidden="true"
      data-active={active}
      data-paused={paused}
    />
  );
}

export default function Recorder({
  onRecordingReady,
  onTranscriptionReady,
  mode = "standalone",
  showHeader = true,
  showFootnote = true,
}: RecorderProps) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("");
  const [errorCopy, setErrorCopy] = useState<ErrorCopy | null>(null);
  const [transcription, setTranscription] = useState<TranscriptionState>({ status: "idle" });
  const transcribeMutation = trpc.voice.transcribe.useMutation();

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const statusRef = useRef<RecorderStatus>("idle");
  const requestIdRef = useRef(0);
  const recordingStartedAtRef = useRef(0);
  const elapsedBeforeCurrentRunRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const lastBlobRef = useRef<{ blob: Blob; mimeType: string } | null>(null);
  const transcriptionRequestRef = useRef(0);

  const updateStatus = useCallback((nextStatus: RecorderStatus) => {
    statusRef.current = nextStatus;
    if (mountedRef.current) setStatus(nextStatus);
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const revokeAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    if (mountedRef.current) setAudioUrl(null);
  }, []);

  const stopRecorderWithoutCallbacks = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    recorder.ondataavailable = null;
    recorder.onstop = null;
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch {
      // The stream is still released below; stopping an already-closing recorder is safe to ignore.
    }
    recorderRef.current = null;
  }, []);

  const resetForNewTake = useCallback(() => {
    requestIdRef.current += 1;
    clearTimer();
    stopRecorderWithoutCallbacks();
    releaseStream();
    elapsedBeforeCurrentRunRef.current = 0;
    recordingStartedAtRef.current = 0;
    setElapsedMs(0);
    setErrorCopy(null);
    setTranscription({ status: "idle" });
    lastBlobRef.current = null;
    transcriptionRequestRef.current += 1;
    revokeAudioUrl();
    updateStatus("idle");
  }, [clearTimer, releaseStream, revokeAudioUrl, stopRecorderWithoutCallbacks, updateStatus]);

  const finishTimer = useCallback(() => {
    clearTimer();
    const activeDuration = statusRef.current === "recording"
      ? Date.now() - recordingStartedAtRef.current
      : 0;
    if (mountedRef.current) {
      setElapsedMs(elapsedBeforeCurrentRunRef.current + Math.max(0, activeDuration));
    }
  }, [clearTimer]);

  const startTimer = useCallback(() => {
    clearTimer();

    const tick = () => {
      if (!mountedRef.current || statusRef.current !== "recording") return;
      const nextElapsed = elapsedBeforeCurrentRunRef.current + (Date.now() - recordingStartedAtRef.current);
      setElapsedMs(nextElapsed);
      timerRef.current = window.setTimeout(tick, 100);
    };

    timerRef.current = window.setTimeout(tick, 100);
  }, [clearTimer]);

  const transcribeRecording = useCallback(async (recording: { blob: Blob; mimeType: string }) => {
    const requestId = ++transcriptionRequestRef.current;
    setTranscription({ status: "processing" });

    try {
      if (recording.blob.size > 16 * 1024 * 1024) {
        throw new Error("录音超过 16MB，暂时无法转写。");
      }

      const audioBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("无法读取录音文件。"));
        };
        reader.onerror = () => reject(new Error("无法读取录音文件。"));
        reader.readAsDataURL(recording.blob);
      });

      const result = await transcribeMutation.mutateAsync({
        audioBase64,
        mimeType: recording.mimeType,
        language: "en",
        prompt: "Transcribe this English pronunciation practice sentence accurately.",
      });

      if (requestId !== transcriptionRequestRef.current) return;
      if (!result.text.trim()) {
        setTranscription({ status: "error", error: "没有识别到清晰的语音内容，请再录一次。" });
        return;
      }

      const readyTranscription = {
        text: result.text.trim(),
        language: result.language,
        duration: result.duration,
      };
      setTranscription({ status: "ready", ...readyTranscription });
      onTranscriptionReady?.(readyTranscription);
    } catch (error) {
      if (requestId !== transcriptionRequestRef.current) return;
      setTranscription({
        status: "error",
        error: error instanceof Error ? error.message : "语音转文字失败，请稍后重试。",
      });
    }
  }, [onTranscriptionReady, transcribeMutation]);

  const startRecording = useCallback(async () => {
    if (statusRef.current === "requesting" || statusRef.current === "recording" || statusRef.current === "paused") {
      return;
    }

    resetForNewTake();
    const requestId = requestIdRef.current;
    updateStatus("requesting");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("mediarecorder is unavailable");
      }
      if (typeof MediaRecorder === "undefined") {
        throw new Error("mediarecorder is unavailable");
      }

      const nextStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        nextStream.getTracks().forEach((track) => track.stop());
        return;
      }

      const nextMimeType = pickMimeType();
      const nextRecorder = nextMimeType
        ? new MediaRecorder(nextStream, { mimeType: nextMimeType })
        : new MediaRecorder(nextStream);
      const actualMimeType = nextRecorder.mimeType || nextMimeType || "audio/webm";

      streamRef.current = nextStream;
      recorderRef.current = nextRecorder;
      const recordingChunks: Blob[] = [];
      setMimeType(actualMimeType);

      nextRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunks.push(event.data);
      };

      nextRecorder.onerror = () => {
        if (!mountedRef.current) return;
        setErrorCopy({
          title: "录音过程中出现问题",
          detail: "这段录音没有被保存，请重新开始一次。",
        });
        updateStatus("error");
        clearTimer();
        releaseStream();
      };

      nextRecorder.onstop = () => {
        if (!mountedRef.current || recorderRef.current !== nextRecorder) return;

        const blob = new Blob(recordingChunks, { type: actualMimeType });
        const completedDuration = elapsedBeforeCurrentRunRef.current
          + (statusRef.current === "recording" ? Date.now() - recordingStartedAtRef.current : 0);
        finishTimer();
        releaseStream();
        recorderRef.current = null;

        if (!mountedRef.current) return;

        if (blob.size === 0) {
          setErrorCopy({
            title: "没有捕捉到声音",
            detail: "请确认麦克风没有静音，然后再录一次。",
          });
          setElapsedMs(completedDuration);
          updateStatus("error");
          return;
        }

        const nextUrl = URL.createObjectURL(blob);
        audioUrlRef.current = nextUrl;
        setAudioUrl(nextUrl);
        setElapsedMs(completedDuration);
        updateStatus("ready");
        lastBlobRef.current = { blob, mimeType: actualMimeType };
        onRecordingReady?.({ blob, url: nextUrl, mimeType: actualMimeType });
        void transcribeRecording({ blob, mimeType: actualMimeType });
      };

      nextRecorder.start(250);
      recordingStartedAtRef.current = Date.now();
      elapsedBeforeCurrentRunRef.current = 0;
      setElapsedMs(0);
      setErrorCopy(null);
      updateStatus("recording");
      startTimer();
    } catch (error) {
      releaseStream();
      recorderRef.current = null;
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setErrorCopy(describeRecordingError(error));
      updateStatus("error");
    }
  }, [clearTimer, finishTimer, onRecordingReady, releaseStream, resetForNewTake, startTimer, transcribeRecording, updateStatus]);

  const pauseRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    try {
      recorder.pause();
      elapsedBeforeCurrentRunRef.current += Date.now() - recordingStartedAtRef.current;
      recordingStartedAtRef.current = 0;
      clearTimer();
      setElapsedMs(elapsedBeforeCurrentRunRef.current);
      updateStatus("paused");
    } catch {
      setErrorCopy({ title: "暂时无法暂停", detail: "请结束当前录音并重新开始。" });
      updateStatus("error");
    }
  }, [clearTimer, updateStatus]);

  const resumeRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "paused") return;

    try {
      recorder.resume();
      recordingStartedAtRef.current = Date.now();
      updateStatus("recording");
      startTimer();
    } catch {
      setErrorCopy({ title: "暂时无法继续录音", detail: "请结束当前录音并重新开始。" });
      updateStatus("error");
    }
  }, [startTimer, updateStatus]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    if (statusRef.current === "recording") {
      elapsedBeforeCurrentRunRef.current += Date.now() - recordingStartedAtRef.current;
      recordingStartedAtRef.current = 0;
    }
    clearTimer();
    // Mark the recorder as closing before the async onstop callback runs.
    // This prevents the callback from treating the cleared start time as an active run.
    updateStatus("paused");

    try {
      recorder.requestData();
    } catch {
      // Some Safari versions do not allow requestData immediately before stop.
    }

    try {
      recorder.stop();
    } catch {
      releaseStream();
      setErrorCopy({ title: "录音没有保存", detail: "请重新开始一段录音。" });
      updateStatus("error");
    }
  }, [clearTimer, releaseStream, updateStatus]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      clearTimer();
      stopRecorderWithoutCallbacks();
      releaseStream();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      transcriptionRequestRef.current += 1;
    };
  }, [clearTimer, releaseStream, stopRecorderWithoutCallbacks]);

  const isCapturing = status === "recording" || status === "paused";
  const isBusy = status === "requesting";
  const isDialogueMode = mode === "dialogue";

  return (
    <section
      className={cn("recorder-card", { "recorder-card--dialogue": isDialogueMode })}
      aria-labelledby={showHeader ? "recorder-heading" : undefined}
      aria-label={!showHeader ? "AI 口语对话录音" : undefined}
    >
      {showHeader && (
        <div className="recorder-card__header">
          <div>
            <p className="eyebrow">{isDialogueMode ? "AI 口语对话" : <><span className="index-mark">01</span> 录音练习</>}</p>
            <h2 id="recorder-heading">{isDialogueMode ? "和 AI 说一句英语。" : "开始一段清晰的录音。"}</h2>
            <p className="recorder-card__intro">{isDialogueMode ? "先听 AI 的问题，再用英文回答。你可以输入文字，也可以直接录音。" : "请自然地朗读这句话。录音会保存在本次练习中。"}</p>
          </div>
          <div className={cn("status-chip", status)} role="status" aria-live="polite">
            <span className="status-chip__dot" />
            {status === "requesting" && "正在检查麦克风"}
            {status === "recording" && "正在录音"}
            {status === "paused" && "已暂停"}
            {status === "ready" && "录音已就绪"}
            {status === "error" && "需要注意"}
            {status === "idle" && "准备就绪"}
          </div>
        </div>
      )}

      <div className={cn("recording-stage", { "is-active": isCapturing, "is-paused": status === "paused" })}>
        <div className="recording-stage__meta">
          <span>{status === "recording" ? "正在收音" : status === "paused" ? "已暂停收音" : "波形信号"}</span>
          <strong>{formatTime(elapsedMs)}</strong>
        </div>
        <SignalWave active={isCapturing} paused={status === "paused"} />
        <div className="recording-stage__footer">
          <span className="recording-stage__hint">
            <Waves size={15} strokeWidth={1.7} />
            {status === "recording" ? "请用平时的语速说话" : "未连接外部音频库"}
          </span>
          <span className="recording-stage__format">{mimeType ? mimeType.replace(";codecs=opus", "") : "自动格式"}</span>
        </div>
      </div>

      {errorCopy && (
        <div className="recording-error" role="alert">
          <AlertCircle size={20} strokeWidth={1.8} />
          <div>
            <strong>{errorCopy.title}</strong>
            <p>{errorCopy.detail}</p>
          </div>
        </div>
      )}

      {audioUrl && status === "ready" && (
        <div className="take-preview">
          <div className="take-preview__label"><Check size={15} /> 已保存录音</div>
          <audio controls src={audioUrl} preload="metadata" />
        </div>
      )}

      {transcription.status === "processing" && (
        <div className="transcription-panel transcription-panel--processing" role="status" aria-live="polite">
          <span className="transcription-panel__icon"><span className="mini-spinner" /></span>
          <div>
            <strong>正在生成文字记录</strong>
            <p>正在将录音转换为文字，通常需要几秒钟。</p>
          </div>
        </div>
      )}

      {transcription.status === "ready" && (
        <div className="transcription-panel transcription-panel--ready" aria-live="polite">
          <div className="transcription-panel__heading">
            <span className="transcription-panel__icon"><FileText size={16} /></span>
            <div>
              <strong>文字记录</strong>
              <span>{transcription.language.toUpperCase()} · {formatTime(transcription.duration * 1000)}</span>
            </div>
          </div>
          <p className="transcription-text">{transcription.text}</p>
        </div>
      )}

      {transcription.status === "error" && (
        <div className="transcription-panel transcription-panel--error" role="alert">
          <div>
            <strong>文字记录需要重试</strong>
            <p>{transcription.error}</p>
          </div>
          <button
            className="transcription-retry"
            type="button"
            onClick={() => {
              if (lastBlobRef.current) void transcribeRecording(lastBlobRef.current);
            }}
            disabled={!lastBlobRef.current || transcribeMutation.isPending}
          >
            重新识别
          </button>
        </div>
      )}

      <div className="recorder-actions">
        {status === "idle" || status === "error" || status === "ready" ? (
          <button className="record-button" type="button" onClick={startRecording} disabled={isBusy}>
            {status === "ready" ? <RotateCcw size={18} /> : <Mic size={19} />}
            {status === "ready" ? "重新录音" : "开始录音"}
          </button>
        ) : (
          <button className="record-button record-button--stop" type="button" onClick={stopRecording} disabled={!isCapturing}>
            <Square size={17} fill="currentColor" />
            停止并保存
          </button>
        )}

        {isCapturing && (
          <button className="secondary-action" type="button" onClick={status === "paused" ? resumeRecording : pauseRecording}>
            {status === "paused" ? <Play size={16} /> : <Pause size={16} />}
            {status === "paused" ? "继续" : "暂停"}
          </button>
        )}

        {isBusy && <span className="requesting-label"><span className="mini-spinner" /> 正在请求麦克风权限…</span>}
      </div>

      {showFootnote && (
        <p className="recorder-footnote">
          <span>{isDialogueMode ? "AI 对话练习" : "默认私密"}</span>
          <span className="footnote-divider" />
          {isDialogueMode ? "录音转写后会自动交给 AI 教练回应。" : "麦克风权限由浏览器控制。"}
        </p>
      )}
    </section>
  );
}
