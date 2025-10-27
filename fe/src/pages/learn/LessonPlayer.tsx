// src/pages/learn/LessonPlayer.tsx
import { useEffect, useRef, useState } from "react";
import axios from "../../api/axios";
// import Hls from "hls.js"; // chỉ dùng nếu bạn sẽ có m3u8 sau này

export default function LessonPlayer({ lessonId }: { lessonId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await axios.get(`/api/lessons/${lessonId}/playback`);
      setUrl(data.playbackUrl);
    })();
  }, [lessonId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    if (url.endsWith(".m3u8") && Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else {
      video.src = url; // mp4
    }
  }, [url]);

  return <video ref={videoRef} controls className="w-full rounded-lg bg-black" />;
}
