import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const description =
	"Style your favicon with colors or custom icons, so every tab shows where you are.";

export const metadata: Metadata = {
	metadataBase: new URL("https://env.style"),
	title: "env.style | Environment favicons",
	description,
	icons: {
		icon: "/favicon.svg",
	},
	openGraph: {
		title: "env.style",
		description,
		url: "https://env.style",
		siteName: "env.style",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang="en"
			className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}
		>
			{/* the browser mock intentionally bleeds past the container to the viewport edge */}
			<body className="overflow-x-clip">{children}</body>
		</html>
	);
}
