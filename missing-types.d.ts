declare module "*.css" {
	const url: string;

	export default url;
}

declare module "*.svg" {
	const contentOrUrl: string;

	export default contentOrUrl;
}

declare module "postcss-csso" {
	import { AcceptedPlugin } from "postcss";

	const createPlugin: () => AcceptedPlugin;

	export default createPlugin;
}
