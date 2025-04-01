import { LoaderCircle } from "lucide-react";

// slowly rotating loading icon
export default function LoadingIcon() {
	return (
		// the icon rotates slowly with css animation
		<div className="flex flex-row items-center justify-center">
			<LoaderCircle className="size-6 animate-[spin_3s_linear_infinite]" />
		</div>
	);
}
