"use client";

import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { sdk, type Context } from "@farcaster/frame-sdk"

import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import * as Sentry from "@sentry/react";
import { lazy, useState } from 'react';
import { useEffect } from 'react';
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";

const FrameProvider = lazy(() => import('./lib/frameProvider'));

Sentry.init({
  dsn: "https://d3bfdc63e77374adb6a25040a7482472@o4508756937670656.ingest.us.sentry.io/4508756939767808",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
  // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/basedchess\.xyz/],
  // Session Replay
  replaysSessionSampleRate: 1.0, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
});

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* prod */}
        <meta name="fc:frame" content='{"version":"next","imageUrl":"https://basedchess.xyz/based-chess-logo-3-2-2.png","button":{"title":"Play Chess","action":{"type":"launch_frame","name":"Based Chess","url":"https://based-chess-frame.pages.dev/","splashImageUrl":"https://basedchess.xyz/based-chess-logo-200.jpg","splashBackgroundColor":"#ffffff"}}}' />
        {/* dev */}
        {/* <meta name="fc:frame" content='{"version":"next","imageUrl":"https://basedchess.xyz/based-chess-logo-3-2-2.png","button":{"title":"Play Chess","action":{"type":"launch_frame","name":"Based Chess","url":"https://6701-52-119-126-16.ngrok-free.app/","splashImageUrl":"https://basedchess.xyz/based-chess-logo-200.jpg","splashBackgroundColor":"#ffffff"}}}' /> */}

        <meta property="og:title" content="Based Chess" />
        <meta property="og:url" content="https://basedchess.xyz" />
        <meta property="og:image" content="https://basedchess.xyz/based-chess-logo.jpg" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="basedchess.xyz" />
        <meta property="twitter:url" content="https://basedchess.xyz" />
        <meta name="twitter:title" content="Based Chess" />
        <meta name="twitter:description" content="Welcome to Based Chess" />
        <meta name="twitter:image" content="https://basedchess.xyz/based-chess-logo.jpg" />

        <Meta />
        <Links />
      </head>
      <body >
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

// const queryClient = new QueryClient()

export default function App() {

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

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
        <Outlet />
      </RainbowKitProvider>
    </FrameProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
