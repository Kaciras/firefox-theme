/**
 * 定义环境变量的插件，跟 webpack 的 EnvironmentPlugin 相似。
 * 不同的是所有的变量通过 import.meta.* 对象访问。
 *
 * 【注意】
 * 本插件使用的 Hook 处于打包阶段，像 Vite 开发模式只使用构建阶段的话是无法工作的。
 * 但使用这个钩子很容易实现该功能，而且本项目并不使用构建阶段的结果，所以 OK。
 *
 * @param table 一个对象，包含环境变量的定义，值会自动转换无需 JSON 化。
 * @see https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/define.ts
 */
export default function metaPlugin(table: Record<string, any>) {

	// 复制一份，保证不变性
	const map = new Map(Object.entries(table));

	return {
		name: "define-import-meta",

		resolveImportMeta(property: string) {
			if (!map.has(property)) {
				return null;
			}
			const value = map.get(property);
			return JSON.stringify(value);
		},
	};
}
