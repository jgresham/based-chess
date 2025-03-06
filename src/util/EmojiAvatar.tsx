//  To match Rainbowkit ConnectButton's emoji avatar
//  src https://github.com/rainbow-me/rainbowkit/blob/main/packages/rainbowkit/src/components/Avatar/EmojiAvatar.tsx

import React, { useEffect, useMemo, useState } from 'react';
import { emojiAvatarForAddress } from './emojiAvatarForAddress';

export const EmojiAvatar = ({ address, ensImage, size }: { address: string, ensImage: string, size: number }) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (ensImage) {
      const img = new Image();
      img.src = ensImage;
      img.onload = () => setLoaded(true);
    }
  }, [ensImage]);

  const { color: backgroundColor, emoji } = useMemo(
    () => emojiAvatarForAddress(address),
    [address],
  );

  if (!address) {
    return <div style={{
      borderRadius: size,
      height: size,
      width: size,
    }} />
  }

  return ensImage ? (
    loaded ? (
      <div
        style={{
          backgroundSize: 'cover',
          borderRadius: size,
          backgroundImage: `url(${ensImage})`,
          backgroundPosition: 'center',
          height: size,
          width: size,
        }}
      />
    ) : (
      <div
        style={{
          alignItems: 'center',
          backgroundSize: 'cover',
          borderRadius: size,
          color: 'modalText',
          display: 'flex',
          justifyContent: 'center',
          height: size,
          width: size,
        }}
        className='bg-gray-200 dark:bg-gray-800'
      >
      </div>
    )
  ) : (
    <div
      style={{
        borderRadius: size,
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        overflow: 'hidden',
        ...(!ensImage && { backgroundColor }),
        height: size,
        width: size,
      }}
    >
      {emoji}
    </div>
  );
};