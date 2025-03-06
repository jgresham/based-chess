import React, { useRef, useImperativeHandle, forwardRef } from 'react';

export interface AudioPlayerHandle {
  playSound: () => void;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, { src: string }>(({ src }, ref) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  useImperativeHandle(ref, () => ({
    playSound
  }));

  return (
    <div>
      <audio ref={audioRef} src={src}>
        <track kind="captions" label="drop chess piece" />
      </audio>
    </div>
  );
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;