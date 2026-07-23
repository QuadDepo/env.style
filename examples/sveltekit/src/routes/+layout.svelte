<script lang="ts">
import { envStyleFavicon } from "env.style/sveltekit";
import { base } from "$app/paths";
import favicon from "$lib/assets/favicon.svg";

let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={envStyleFavicon(favicon, base)} />
</svelte:head>

{@render children()}
