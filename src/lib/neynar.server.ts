if (process.env.NEYNAR_API_KEY) {
  console.log('NEYNAR_API_KEY is set');
} else {
  console.error('NEYNAR_API_KEY is not set');
  process.exit(1);
}

export type FarcasterUser = {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
}

export const getFarcasterUserByAddress = async (address: string): Promise<FarcasterUser | null> => {
  const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`, {
    headers: {
      'accept': 'application/json',
      'x-api-key': process.env.NEYNAR_API_KEY,
      'x-neynar-experimental': 'false'
    }
  });

  const data = await response.json();
  console.log(data);
  const lowerCaseAddress = address.toLowerCase();
  if (data && data[lowerCaseAddress] && data[lowerCaseAddress].length > 0) {
    const { fid, username, display_name, pfp_url } = data[lowerCaseAddress][0];
    console.log(`For address ${address}, found user ${username}, ${fid}, ${display_name}, ${pfp_url}`);
    return { fid, username, display_name, pfp_url };
  } else {
    console.log(`For address ${address}, no user found`);
  }
  return null;
};

// const test = async () => {
//   const user = await getFarcasterUserByAddress('0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64');
//   console.log(user);
// };

// test();
