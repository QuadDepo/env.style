import { EnvStyle } from "env.style/waku";
import type { ReactNode } from "react";
import "../styles.css";

export default async function RootLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<>
			<EnvStyle />
			{children}
		</>
	);
}

export const getConfig = async () => ({ render: "static" }) as const;
