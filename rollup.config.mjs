import typescript from '@rollup/plugin-typescript';
import alias from "@rollup/plugin-alias";
import { visualizer } from "rollup-plugin-visualizer";
import { terser } from "rollup-plugin-terser";
import webpackConfig from "./alias.idea.cjs";
import htmlEntry from "./rollup/html.js";
import copy from "./rollup/copy.js";
import postcss from "./rollup/postcss.js";
import svg from "./rollup/svg.js";
import asset from "./rollup/asset.js";
import template from "./rollup/template.js";
import importMeta from "./rollup/meta.js";

const isProduction = process.env.NODE_ENV === "production";

function webpackAliasToRollup() {
	const { alias } = webpackConfig.resolve;
	return Object.entries(alias).map(e => ({ find: e[0], replacement: e[1] }));
}

export default {
	input: "new-tab/index.html",
	output: {
		format: "esm",
		dir: "dist",
		sourcemap: true,

		// 新选项能提升输出代码的性能，但我没怎么感觉到。
		generatedCode: "es2015",
	},
	plugins: [
		alias({ entries: webpackAliasToRollup() }),
		asset({
			loaders: [postcss, svg],
			source: { include: ["components/**/*.css", "**/*.svg"] },
			url: { include: ["**/*.ico"] },
		}),
		copy([
			{ from: "new-tab/global.css" },
			{ from: "manifest.json" },
			{ from: "assets/Star.svg" },
			{
				from: "browser-polyfill.min.js",
				to: "browser-polyfill.js",
				context: "node_modules/webextension-polyfill/dist",
			},
		]),
		htmlEntry(),
		template(),
		typescript(),
		importMeta({ dev: !isProduction }),
		isProduction && terser(),
		isProduction && visualizer(),
	],
};
