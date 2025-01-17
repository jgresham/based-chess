"use client";
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { Session, WsMessage } from "../../../worker/src/index";

const INTERVAL = 55;

export function ChessSocket(props: { id: string }) {
  const wsRef = useRef<WebSocket | null>(null);
  const [cursors, setCursors] = useState<Map<string, Session>>(new Map());
  const lastSentTimestamp = useRef(0);
  const [messageState, dispatchMessage] = useReducer(messageReducer, {
    in: "",
    out: "",
  });
  const [highlightedIn, highlightIn] = useHighlight();
  const [highlightedOut, highlightOut] = useHighlight();

  function startWebSocket() {
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(
      `${wsProtocol}://localhost:8787/ws?id=${props.id}`,
    //   `${wsProtocol}://${process.env.REACT_APP_PUBLIC_WS_HOST}/ws?id=${props.id}`,
    );
    ws.onopen = () => {
      highlightOut();
      dispatchMessage({ type: "out", message: "get-cursors" });
      const message: WsMessage = { type: "get-cursors" };
      ws.send(JSON.stringify(message));
    };
    ws.onmessage = (message) => {
      const messageData: WsMessage = JSON.parse(message.data);
      highlightIn();
      dispatchMessage({ type: "in", message: messageData.type });
      switch (messageData.type) {
        // case "quit":
        //   setCursors((prev) => {
        //     const updated = new Map(prev);
        //     updated.delete(messageData.id);
        //     return updated;
        //   });
        //   break;
        // case "join":
        //   setCursors((prev) => {
        //     const updated = new Map(prev);
        //     if (!updated.has(messageData.id)) {
        //       updated.set(messageData.id, { id: messageData.id, x: -1, y: -1 });
        //     }
        //     return updated;
        //   });
        //   break;
        case "move":
          setCursors((prev) => {
            const updated = new Map(prev);
            const session = updated.get(messageData.id);
            if (session) {
              session.x = messageData.x;
              session.y = messageData.y;
            } else {
              updated.set(messageData.id, messageData);
            }
            return updated;
          });
          break;
        // case "get-cursors-response":
        //   setCursors(
        //     new Map(
        //       messageData.sessions.map((session) => [session.id, session]),
        //     ),
        //   );
        //   break;
        default:
          break;
      }
    };
    ws.onclose = () => setCursors(new Map());
    return ws;
  }

  useEffect(() => {
    const abortController = new AbortController();
    document.addEventListener(
      "mousemove",
      (ev) => {
        const x = ev.pageX / window.innerWidth,
          y = ev.pageY / window.innerHeight;
        const now = Date.now();
        if (
          now - lastSentTimestamp.current > INTERVAL &&
          wsRef.current?.readyState === WebSocket.OPEN
        ) {
          const message: WsMessage = { type: "move", id: props.id, x, y };
          wsRef.current.send(JSON.stringify(message));
          lastSentTimestamp.current = now;
          highlightOut();
          dispatchMessage({ type: "out", message: "move" });
        }
      },
      {
        signal: abortController.signal,
      },
    );
    return () => abortController.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    wsRef.current = startWebSocket();
    return () => wsRef.current?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);

  function sendMessage() {
    highlightOut();
    dispatchMessage({ type: "out", message: "message" });
    wsRef.current?.send(
      JSON.stringify({ type: "message", data: "Ping" } satisfies WsMessage),
    );
  }

  const otherCursors = Array.from(cursors.values()).filter(
    ({ id, x, y }) => id !== props.id && x !== -1 && y !== -1,
  );

  return (
    <>
      <div className="flex border">
        <div className="px-2 py-1 border-r">WebSocket Connections</div>
        <div className="px-2 py-1"> {cursors.size} </div>
      </div>
      <div className="flex border">
        <div className="px-2 py-1 border-r">Messages</div>
        <div className="flex flex-1">
          <div className="px-2 py-1 border-r">↓</div>
          <div
            className="w-full px-2 py-1 [word-break:break-word] transition-colors duration-500"
            style={{
              backgroundColor: highlightedIn ? "#ef4444" : "transparent",
            }}
          >
            {messageState.in}
          </div>
        </div>
        <div className="flex flex-1">
          <div className="px-2 py-1 border-x">↑</div>
          <div
            className="w-full px-2 py-1 [word-break:break-word] transition-colors duration-500"
            style={{
              backgroundColor: highlightedOut ? "#60a5fa" : "transparent",
            }}
          >
            {messageState.out}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={sendMessage} className="border px-2 py-1">
          ws message
        </button>
        <button
          className="border px-2 py-1 disabled:opacity-80"
          onClick={() => {
            wsRef.current?.close();
            wsRef.current = startWebSocket();
          }}
        >
          ws reconnect
        </button>
        <button
          className="border px-2 py-1"
          onClick={() => wsRef.current?.close()}
        >
          ws close
        </button>
      </div>
      <div>
        {otherCursors.map((session) => (
          <SvgCursor
            key={session.id}
            point={[
              session.x * window.innerWidth,
              session.y * window.innerHeight,
            ]}
          />
        ))}
      </div>
    </>
  );
}

function SvgCursor({ point }: { point: number[] }) {
  const refSvg = useRef<SVGSVGElement>(null);
  const animateCursor = useCallback((point: number[]) => {
    refSvg.current?.style.setProperty(
      "transform",
      `translate(${point[0]}px, ${point[1]}px)`,
    );
  }, []);
//   const onPointMove = usePerfectCursor(animateCursor);
//   useLayoutEffect(() => onPointMove(point), [onPointMove, point]);
  const [randomColor] = useState(
    `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`,
  );
  return (
    <svg
      ref={refSvg}
      height="32"
      width="32"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={"absolute -top-[12px] -left-[12px] pointer-events-none"}
    >
      <defs>
        <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="1" dy="1" stdDeviation="1.2" floodOpacity="0.5" />
        </filter>
      </defs>
      <g fill="none" transform="rotate(0 16 16)" filter="url(#shadow)">
        <path
          d="M12 24.4219V8.4069L23.591 20.0259H16.81l-.411.124z"
          fill="white"
        />
        <path
          d="M21.0845 25.0962L17.4795 26.6312L12.7975 15.5422L16.4835 13.9892z"
          fill="white"
        />
        <path
          d="M19.751 24.4155L17.907 25.1895L14.807 17.8155L16.648 17.04z"
          fill={randomColor}
        />
        <path
          d="M13 10.814V22.002L15.969 19.136l.428-.139h4.768z"
          fill={randomColor}
        />
      </g>
    </svg>
  );
}

function usePerfectCursor(cb: (point: number[]) => void, point?: number[]) {
//   const [pc] = useState(() => new PerfectCursor(cb));

//   useLayoutEffect(() => {
//     if (point) pc.addPoint(point);
//     return () => pc.dispose();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [pc]);

//   useLayoutEffect(() => {
//     PerfectCursor.MAX_INTERVAL = 58;
//   }, []);

  const onPointChange = () => {};
//   useCallback(
    // (point: number[]) => pc.addPoint(point),
    // [pc],
//   );

  return onPointChange;
}

type MessageState = { in: string; out: string };
type MessageAction = { type: "in" | "out"; message: string };
function messageReducer(state: MessageState, action: MessageAction) {
  switch (action.type) {
    case "in":
      return { ...state, in: action.message };
    case "out":
      return { ...state, out: action.message };
    default:
      return state;
  }
}

function useHighlight(duration = 250) {
  const timestampRef = useRef(0);
  const [highlighted, setHighlighted] = useState(false);
  function highlight() {
    timestampRef.current = Date.now();
    setHighlighted(true);
    setTimeout(() => {
      const now = Date.now();
      if (now - timestampRef.current >= duration) {
        setHighlighted(false);
      }
    }, duration);
  }
  return [highlighted, highlight] as const;
}