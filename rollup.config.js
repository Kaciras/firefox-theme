const { resolve } = require("path");
const { readFileSync } = require("fs");
const htmlPlugin = require("@rollup/plugin-html");
const urlPlugin = require("@rollup/plugin-url");
const aliasPlugin = require("@rollup/plugin-alias");
const { minify } = require("html-minifier-terser");
const copyPlugin = require("./rollup/copy");
const { terser: terserPlugin } = require("rollup-plugin-terser");
const postcssPlugin = require("./rollup/postcss");
const svgPlugin = require("./rollup/svg");
const inlinePlugin = require("./rollup/inline");

const isProduction = process.env.NODE_ENV === "production";

function generateHtml({ attributes, files, meta, publicPath }) {
	const { js = [], css = [] } = files;

	const replacements = {
		scripts: js.map(file => {
			const attrs = htmlPlugin.makeHtmlAttributes(attributes.script);
			return `<script src="${publicPath}${file.fileName}" ${attrs}></script>`;
		}),
		links: css.map(file => {
			const attrs = htmlPlugin.makeHtmlAttributes(attributes.link);
			return `<link href="${publicPath}${file.fileName}" rel="stylesheet" ${attrs}>`;
		}),
		metas: meta.map(input => `<meta${htmlPlugin.makeHtmlAttributes(input)}>`),
	};

	let content = readFileSync("new-tab/index.html", "utf8");
	content = content.replaceAll(/\${([a-z]+)}/g, (_, v) => replacements[v]);

	return !isProduction ? content : minify(content, {
		removeComments: true,
		collapseWhitespace: true,
		collapseBooleanAttributes: true,
		removeAttributeQuotes: true,
	});
}

module.exports = {
	input: "new-tab/index.js",
	output: {
		format: "esm",
		dir: "dist",
	},
	plugins: [
		aliasPlugin({
			entries: [
				{ find: "@assets", replacement: resolve(__dirname, "assets") },
			],
		}),
		isProduction && terserPlugin(),
		svgPlugin(),
		postcssPlugin(),
		inlinePlugin({
			include: ["components/**/*.css", "**/*.svg"],
		}),
		urlPlugin({
			include: ["**/*.ico"],
			limit: 4096,
		}),
		htmlPlugin({
			attributes: { script: { defer: "defer" } },
			template: generateHtml,
		}),
		copyPlugin([
			{ from: "new-tab/index.css" },
			{ from: "manifest.json" },
			{
				from: "browser-polyfill.min.js",
				to: "browser-polyfill.js",
				context: "node_modules/webextension-polyfill/dist",
			},
		]),
	],
};
