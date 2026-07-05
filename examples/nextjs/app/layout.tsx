import type { ReactNode } from "react";

export const metadata = { title: "env.style example" };

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
