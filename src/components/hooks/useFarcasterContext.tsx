import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Context } from "@farcaster/frame-sdk";

function useFarcasterContext() {
	return useQuery({
		queryKey: ["farcasterContext"],
		queryFn: async (): Promise<Context.FrameContext | undefined> => {
			return undefined; // Initial state is undefined until set
		},
	});
}

function useSetFarcasterContext() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (context: Context.FrameContext) => {
			console.log("useSetFarcasterContext() useMutation() context", context);
			// Store the context in the query client cache
			queryClient.setQueryData(["farcasterContext"], context);
		},
		onSuccess: () => {
			// Invalidate and refetch the context query to update components using it
			queryClient.invalidateQueries({
				queryKey: ["farcasterContext"],
			});
		},
	});
}

export { useFarcasterContext, useSetFarcasterContext };
