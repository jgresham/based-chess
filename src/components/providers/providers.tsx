"use client";
import FrameProvider from "./wagmiWithFrameProvider";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import sdk, { type Context } from "@farcaster/frame-sdk";
import { useState, useEffect } from "react";
import { darkTheme } from "@rainbow-me/rainbowkit";

export default function Providers({ children }: { children: React.ReactNode }) {

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [_context, setContext] = useState<Context.FrameContext>();

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      console.log("Calling sdk.actions.ready()");
      sdk.actions.ready();
    }
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  return (
    <FrameProvider>
      <RainbowKitProvider theme={darkTheme()}>
        {children}
      </RainbowKitProvider>
    </FrameProvider>
  );
}