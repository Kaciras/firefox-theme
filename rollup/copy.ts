import { OutputBundle, PluginContext } from "rollup";
import { basename, join } from "path";
import glob from "fast-glob";
import { chunkImport } from "./html.js";

export interface CopyEntry {
	from: string;
	to: string;
	context?: string;
	toDirectory?: boolean;
}

const hostId = "COPY_IMPORTER";

/**
 * 复制资源的插件，该插件需要搭配 asset 插件使用。
 *
 * 与 rollup-plugin-copy 相比有些区别：
 * 1）将复制的文件加入监视。
 * 2）复制的文件将作为资源由 asset 插件处理。
 *
 * @param list 复制项列表，格式参考了 copy-webpack-plugin。
 */
export default function copyPlugin(list: CopyEntry[]) {
	const ids = new Set<string>();

	return {
		name: "copy",

		/**
		 * 在构建开始时找到所有要复制的文件，将它们加入 ID 集合。
		 * 然后插入一个虚拟模块用于引用被复制的文件。
		 *
		 * 所有资源的 ID 中会加入 resource 参数，使其能够被 asset 插件处理。
		 */
		async buildStart(this: PluginContext) {
			const groups = await Promise.all(list.map(entry => {
				const { from, context } = entry;
				return glob(context ? `${context}/${from}` : from);
			}));
			for (let i = 0; i < list.length; i++) {
				const { to, toDirectory } = list[i];
				const files = groups[i];

				for (const file of files) {
					let fileName = basename(file);
					if (toDirectory) {
						fileName = join(to, fileName);
					} else if (to) {
						fileName = to;
					}
					ids.add(file + "?resource&filename=" + fileName);
				}
			}
			this.emitFile({ type: "chunk", fileName: hostId, id: hostId });
		},

		/**
		 * 虚拟模块无法被默认的解析器解析，需要自己处理下。
		 */
		async resolveId(this: PluginContext, source: string, importer: string) {
			if (source === hostId) {
				return hostId;
			}
			if (importer !== hostId) {
				return null;
			}
			return this.resolve(source, undefined, { skipSelf: true });
		},

		/**
		 * 将待复制的文件的 ID 转换为虚拟模块里的 import 语句。
		 * 同时还禁止了 TreeShake 以避免空模块警告。
		 */
		load(id: string) {
			if (id !== hostId) {
				return null;
			}
			return {
				code: chunkImport(ids),
				moduleSideEffects: "no-treeshake",
			};
		},

		/**
		 * 默认每个 chunk 都生成一个文件，所以要从构建的输出中删除虚拟模块。
		 *
		 * @param _ 没用的参数
		 * @param bundle 输出的入口文件
		 */
		generateBundle: (_: unknown, bundle: OutputBundle) => delete bundle[hostId],
	};
}
