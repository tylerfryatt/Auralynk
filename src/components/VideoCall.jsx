import React, { useEffect, useRef } from "react";
import DailyIframe from "@daily-co/daily-js";

const VideoCall = ({ roomUrl }) => {
  const callFrame = useRef(null);

  useEffect(() => {
    if (roomUrl && !callFrame.current) {
      callFrame.current = DailyIframe.createFrame({
        showLeaveButton: true,
        iframeStyle: {
          position: "relative",
          width: "100%",
          height: "600px",
          border: "1px solid #ccc",
          borderRadius: "12px",
        },
      });
      callFrame.current.join({ url: roomUrl });
      document.getElementById("video-root").appendChild(callFrame.current.iframe);
    }
  }, [roomUrl]);

  return <div id="video-root" />;
};

export default VideoCall;
