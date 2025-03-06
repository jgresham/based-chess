export const playSound = (soundName: string) => {
  const audio = new Audio(`/sounds/${soundName}.mp3`);
  audio.play().catch(error => {
    console.error('Error playing sound:', error);
  });
};

// Predefined sound effects
export const SOUNDS = {
  MOVE: 'move',
  CAPTURE: 'capture',
  CHECK: 'check',
  GAME_END: 'game-end',
} as const;

// Type for the sound names
export type SoundName = typeof SOUNDS[keyof typeof SOUNDS]; 