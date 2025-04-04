"use client";

import { useEffect, useState } from "react";
import { useDevMode } from "../hooks/useLocalSettings";
import eruda from "eruda";

export const ErudaEnabler = () => {
	const [isMounted, setIsMounted] = useState(false);
	const [isInitialized, setIsInitialized] = useState(false);
	const { data: isDevMode } = useDevMode();

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		// if (isDevMode || process.env.NODE_ENV !== "production") {
		if (isDevMode && isMounted) {
			console.log("initializing eruda");
			import("eruda").then((eruda) => {
				setIsInitialized(true);
				eruda.default.init();
			});
		} else {
			if (isInitialized) {
				console.log("destroying eruda");
				try {
					if (eruda !== undefined) {
						eruda.destroy();
					}
				} catch (error) {
					console.error("error destroying eruda", error);
				}
			}
		}
	}, [isDevMode, isMounted, isInitialized]);

	return <></>;
};
