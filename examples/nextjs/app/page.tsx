export default function Home() {
	return (
		<main style={{ fontFamily: "sans-serif", padding: 40 }}>
			<h1>env.style example</h1>
			<p>
				Look at the tab: in <code>next dev</code> the favicon (a white triangle
				on black) is tinted blue. Production builds serve it untouched.
			</p>
		</main>
	);
}
