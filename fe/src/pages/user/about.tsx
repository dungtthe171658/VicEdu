import React from "react";

export default function About() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">About Page Demo</h1>
      <p className="mb-6">
        Đây là trang About để demo video.
      </p>

      <div className="rounded-lg overflow-hidden shadow-lg bg-black">
        <video
          controls
          width="100%"
          className="w-full h-auto"
          src=""
        />
      </div>
    </div>
  );
}
