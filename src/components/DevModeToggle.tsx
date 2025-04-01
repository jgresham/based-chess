"use client";

import { Toggle } from "@/components/ui/toggle";
import { Braces } from "lucide-react";
import {
	useDevMode,
	useSetDevMode,
} from "./hooks/useLocalSettings";

export const DevModeToggle = () => {
	const { data: devMode } =
		useDevMode();
	const { mutate: setDevMode } =
		useSetDevMode();

	console.log(
		"DevModeToggle devMode",
		devMode,
	);
	return (
		<Toggle
			// className={`w-8 h-8 ${devMode ? "bg-accent text-accent-foreground" : ""}`}
			aria-label="Toggle dev mode"
			variant="outline"
			// variant="outline"
			pressed={devMode}
			onClick={() => {
				const newValue = !devMode;
				console.log(
					"pressed",
					newValue,
				);
				setDevMode(newValue);
			}}
		>
			<Braces />
		</Toggle>
	);
};
