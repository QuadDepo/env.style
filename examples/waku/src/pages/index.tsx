export default async function HomePage() {
	return (
		<main>
			<h1>Waku + env.style</h1>
			<p>The tab favicon is tinted green in development.</p>
		</main>
	);
}

export const getConfig = async () => ({ render: "static" }) as const;
