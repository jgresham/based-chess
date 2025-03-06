import { useEnsName, useEnsAvatar } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { mainnetConfig } from './wagmiconfig';
import { normalize } from 'viem/ens';
import { EmojiAvatar } from '../util/EmojiAvatar';

// Displays an ethereum address in a truncated format by showing the first 6 and last 4 characters
const truncateAddress = (address: `0x${string}` | undefined) => {
  if (!address) {
    return "";
  }
  return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
}

export default function DisplayAddress({ address, showAddress = false, emphasize = false }: { address: `0x${string}` | undefined, showAddress?: boolean, emphasize?: boolean }) {
  const { data: ensName } = useEnsName({ config: mainnetConfig, address, chainId: mainnet.id, })
  const { data: avatarURL } = useEnsAvatar({
    name: normalize(ensName ?? ''),
    config: mainnetConfig,
    chainId: mainnet.id,
  })
  return (<div className="flex flex-row items-center gap-2">
    <EmojiAvatar address={address || ""} ensImage={avatarURL || ""} size={24} />
    {/* <img className={`w-6 h-6 rounded-full ${avatarURL ? 'visible' : 'invisible'}`} src={avatarURL} alt="avatar" /> */}
    {(showAddress || !ensName) ? <span className={`${emphasize ? 'font-bold' : ''}`}>{truncateAddress(address)}</span> : <span className={`${emphasize ? 'font-bold' : ''}`}>{ensName}</span>}
  </div>)
}


