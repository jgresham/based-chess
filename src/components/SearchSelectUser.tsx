// create a search and select for a user using shadcn's Combobox and neynar's search
//  users api. So, when the user types (a ratelimited) an api call is made to neynar
//  which is then parsed to create the available CommandItems for the user to select
"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@uidotdev/usehooks";
import { useFarcasterContext } from "./hooks/useFarcasterContext";

export type User = {
	fid: string;
	username: string;
	displayName: string;
	pfp: string;
	preferredEthAddress: string;
};

interface SearchSelectUserProps {
	onSelect: (user: User) => void;
	placeholder?: string;
	buttonClassName?: string;
}

export default function SearchSelectUser({
	onSelect,
	placeholder = "Search by username...",
	buttonClassName,
}: SearchSelectUserProps) {
	const [open, setOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedUser, setSelectedUser] = useState<User | null>(null);
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);
	const { data: farcasterContext } = useFarcasterContext();

	const debouncedSearchQuery = useDebounce(searchQuery, 500);

	const searchUsers = useCallback(
		async (query: string) => {
			if (!query || query.length < 2) {
				setUsers([]);
				return;
			}

			setLoading(true);
			let queryUrl = `https://api.neynar.com/v2/farcaster/user/search?q=${encodeURIComponent(query)}`;
			if (farcasterContext) {
				queryUrl = `${queryUrl}&viewer_fid=${farcasterContext.user.fid}`;
			}
			try {
				const response = await fetch(queryUrl, {
					headers: {
						Accept: "application/json",
						api_key: process.env.NEXT_PUBLIC_NEYNAR_API_KEY_FRNT || "",
					},
				});

				if (!response.ok) {
					throw new Error("Failed to fetch users");
				}

				const data = await response.json();
				const formattedUsers = data.result.users.map((user: any) => ({
					fid: user.fid,
					username: user.username,
					displayName: user.display_name || user.username,
					pfp: user.pfp_url,
					preferredEthAddress: user.verified_addresses.primary.eth_address,
				}));

				setUsers(formattedUsers);
			} catch (error) {
				console.error("Error searching users:", error);
				setUsers([]);
			} finally {
				setLoading(false);
			}
		},
		[farcasterContext],
	);

	useEffect(() => {
		if (debouncedSearchQuery) {
			searchUsers(debouncedSearchQuery);
		}
	}, [debouncedSearchQuery, searchUsers]);

	const handleSelectUser = (user: User) => {
		setSelectedUser(user);
		setOpen(false);
		onSelect(user);
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between", buttonClassName)}
				>
					{selectedUser ? (
						<div className="flex flex-row items-center gap-2">
							<img
								src={selectedUser.pfp}
								alt={selectedUser.displayName}
								className="h-6 w-6 rounded-full"
							/>
							<span>{`${selectedUser.displayName} (@${selectedUser.username})`}</span>
						</div>
					) : (
						<span>{placeholder}</span>
					)}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0">
				<Command>
					<CommandInput
						placeholder={placeholder}
						value={searchQuery}
						onValueChange={setSearchQuery}
						className="h-9"
					/>
					{loading && (
						<div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
					)}
					{!loading && (
						<CommandEmpty>
							{searchQuery.length > 0 ? "No users found." : "Type to search users."}
						</CommandEmpty>
					)}
					<CommandGroup>
						{users.map((user) => (
							<CommandItem
								key={user.fid}
								value={user.username}
								onSelect={() => handleSelectUser(user)}
								className="flex items-center gap-2"
							>
								<img src={user.pfp} alt={user.displayName} className="h-6 w-6 rounded-full" />
								<span>{user.displayName}</span>
								<span className="text-muted-foreground text-xs">@{user.username}</span>
								<Check
									className={cn(
										"ml-auto h-4 w-4",
										selectedUser?.fid === user.fid ? "opacity-100" : "opacity-0",
									)}
								/>
							</CommandItem>
						))}
					</CommandGroup>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
