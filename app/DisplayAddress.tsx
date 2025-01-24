import { useEnsName, useEnsAvatar } from 'wagmi'
import { truncateAddress } from './routes/home'
import { mainnet } from 'wagmi/chains'
import { mainnetConfig } from './wagmiconfig';
import { normalize } from 'viem/ens';

export default function DisplayAddress({ address }: { address: `0x${string}` | undefined }) {
  const { data: ensName } = useEnsName({ config: mainnetConfig, address, chainId: mainnet.id, })
  const { data: avatarURL } = useEnsAvatar({
    name: normalize(ensName ?? ''),
    config: mainnetConfig,
    chainId: mainnet.id,
  })
  return (<div className="flex flex-row items-center gap-2">
    <img className={`w-6 h-6 rounded-full ${avatarURL ? 'visible' : 'invisible'}`} src={avatarURL} alt="avatar" />
    <span>{ensName || truncateAddress(address)}
    </span>
  </div>)
}


