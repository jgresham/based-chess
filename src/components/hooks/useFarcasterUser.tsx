import { useQuery } from "@tanstack/react-query";
import type { FarcasterUser } from "../../lib/neynar.server";

function useFarcasterUser(address?: `0x${string}`) {
	return useQuery({
		queryKey: ["farcasterUser", address],
		queryFn: async (): Promise<FarcasterUser | null> => {
			if (!address) return null;

			try {
				// Fetch user data from Farcaster API using the provided Ethereum address
				const response = await fetch(
					`https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address}`,
					{
						headers: {
							Accept: "application/json",
							api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY_FRNT || "",
						},
					},
				);
				if (!response.ok) {
					console.error(`Failed to fetch Farcaster user: ${response.statusText}`);
					return null;
				}
				const data = (await response.json()) as { [key: string]: FarcasterUser[] };
				console.log(data);
				const lowerCaseAddress = address.toLowerCase();
				if (data?.[lowerCaseAddress] && data[lowerCaseAddress].length > 0) {
					const { fid, username, display_name, pfp_url } = data[lowerCaseAddress][0];
					console.log(
						`For address ${address}, found user ${username}, ${fid}, ${display_name}, ${pfp_url}`,
					);
					return { fid, username, display_name, pfp_url };
				}
				console.log(`For address ${address}, no user found`);
				return null;
			} catch (error) {
				console.error("Error fetching Farcaster user:", error);
				return null;
			}
		},
		enabled: !!address,
	});
}

export { useFarcasterUser };
