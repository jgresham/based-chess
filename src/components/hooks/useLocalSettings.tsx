import {
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";

function useDevMode() {
	return useQuery({
		queryKey: ["devMode"],
		queryFn:
			async (): Promise<boolean> => {
				const response =
					await localStorage.getItem(
						"devMode",
					);
				return response === "true";
			},
	});
}

function useSetDevMode() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (
			devMode: boolean,
		) => {
			console.log(
				"useSetDevMode() useMutation() devMode",
				devMode,
			);
			await localStorage.setItem(
				"devMode",
				devMode.toString(),
			);
		},
		onSuccess: () => {
			// Invalidate and refetch the devMode query to update components using it
			queryClient.invalidateQueries({
				queryKey: ["devMode"],
			});
		},
	});
}

export { useDevMode, useSetDevMode };
