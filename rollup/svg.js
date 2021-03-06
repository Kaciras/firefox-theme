import { optimize } from "svgo";
import { AssetType } from "./asset.js";

/**
 * 调整 SVG 的属性，使其能够用容器元素的 CSS 控制：
 * 1）宽高设为 1em 以便外层用 font-size 控制。
 * 2）将 fill 和 stroke 改为 currentColor 以便用 color 控制。
 */
function reactive(ast, params) {
	const { type, name, attributes } = ast;

	if (type === "element" && name === "svg") {
		const { color, size, overrides } = params;
		const { fill, stroke } = attributes;

		if (color) {
			if (stroke && stroke !== "none") {
				attributes.stroke = "currentColor";
			}
			if (fill !== "none") {
				attributes.fill = "currentColor";
			}
		}
		if (size) {
			attributes.width = attributes.height = "1em";
		}
		Object.assign(attributes, overrides);
	}
}

function reactivePlugin(options) {
	return {
		name: "reactiveSVGAttribute",
		type: "perItem",
		fn: reactive,
		params: { color: true, size: true, ...options },
	};
}

/*
 * 用两种不同的配置，对非内联的 SVG 不修改 width 和 height 属性。
 * 另外必须禁用内置插件中的 removeViewBox 不然布局会出错。
 */

const builtInPlugins = {
	name: "preset-default",
	params: {
		overrides: {
			removeViewBox: false,
		},
	},
};

const inlineConfig = {
	plugins: [
		{
			name: "removeAttrs",
			params: {
				attrs: "class",
			},
		},
		builtInPlugins,
		reactivePlugin(),
	],
};

const resourceConfig = {
	plugins: [builtInPlugins],
};

export default function (source, info) {
	if (!/\.svg(\?|$)/.test(info.id)) {
		return;
	}
	const config = info.type === AssetType.Source
		? inlineConfig : resourceConfig;
	const result = optimize(source.string, config);

	if ("error" in result) {
		throw result.modernError;
	}
	return result.data.replaceAll('"', "'");
}
