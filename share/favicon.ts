import { dirname } from "./lang";
import { blobToBase64URL, encodeSVG } from "./codec.js";

/**
 * 下载并解析 URL 所指定的网页，从中读取所有的图标信息。
 *
 * 本函数从以下来源获取图标：
 * 1）页面 <head> 中的所有表示图标的 <link> 元素。
 * 2）manifest.json 的 icons 字段。
 *
 * Firefox 的实现挺复杂而且用得 C艹：
 * https://github.com/mozilla/gecko-dev/blob/master/toolkit/components/places/FaviconHelpers.cpp
 *
 * @param url 网页的 URL
 * @param signal 下载过程可以取消
 */
async function* fetchLinks(url: string, signal?: AbortSignal) {
	const response = await fetch(url, { mode: "no-cors", signal });
	if (!response.ok) {
		throw new Error(`Request failed, status = ${response.status}`);
	}
	const parser = new DOMParser();
	const doc = parser.parseFromString(await response.text(), "text/html");
	const links = doc.head.getElementsByTagName("link");

	let manifestURL;

	for (const link of links) {
		// 不能直接 .href 因为它会转成以本页面为基础的 URL。
		const href = link.getAttribute("href");

		if (href === null) {
			continue; // 毕竟是外部数据，有不规范的可能
		}
		switch (link.rel) {
			case "manifest":
				manifestURL = new URL(href, url).toString();
				break;
			case "shortcut icon":
			case "icon":
			case "apple-touch-icon":
				yield {
					sizes: link.sizes,
					type: link.type,
					href: new URL(href, url).toString(),
				};
		}
	}

	if (manifestURL) {
		yield* await fetchManifest(manifestURL, signal);
	}
}

/**
 * 支持 PWA 的网站都有一个清单，里面也有好多图标。
 *
 * @param url Manifest.json 的完整 URL
 * @param signal 取消信号
 * @see https://developer.mozilla.org/zh-CN/docs/Web/Manifest#icons
 */
async function fetchManifest(url: string, signal?: AbortSignal) {
	const response = await fetch(url, { mode: "no-cors", signal });
	if (!response.ok) {
		throw new Error(`Request failed, status = ${response.status}`);
	}
	const { icons = [] } = await response.json();
	const baseURL = dirname(url);

	// 没找到 manifest.json 的类型，我也懒得自己写。
	return icons.map((icon: any) => {
		const sizes = icon.sizes.split(" ");
		const href = new URL(icon.src, baseURL);
		return { href, sizes, type: icon.type };
	});
}

/**
 * 获取 URL 所指定的页面的图标（favicon），自动选择最佳的。
 *
 * 图标链接从页面中提取，或使用通用的约定，本函数没有验证返回的 URL 是否有效。
 *
 * @param url 页面的 URL
 * @param signal AbortSignal 取消加载页面
 * @return {Promise<string>} 图标的 URL。
 */
export async function getFaviconUrl(url: string, signal?: AbortSignal) {
	let best;
	let size = Number.MAX_SAFE_INTEGER;

	for await (const link of fetchLinks(url, signal)) {
		const { sizes, type } = link;

		if (type === "image/svg+xml") {
			best = link;
			break; // 如果有 SVG 格式则选中
		}

		// 有 link 则不使用默认的 /favicon.ico
		if (!best) {
			best = link;
			continue;
		}

		const match = /(\d+)x(\d+)/.exec(sizes[0]);
		if (match === null) {
			continue; // 尺寸未知的不要
		}
		const width = parseInt(match[1]);

		// 尺寸至少为 48 的图中选择最小的
		if (width >= 48 && width < size) {
			best = link;
			size = width;
		}
	}

	// 若是没有在 link 里指定，则尝试默认的 /favicon.ico
	return best?.href || new URL("/favicon.ico", url).toString();
}

/**
 * 将远程的图片 URL 转换为本地的 DataURL。
 *
 * @param url 原始 URL
 * @return {Promise<string>} DataURL
 */
export async function imageUrlToLocal(url: string) {
	const response = await fetch(url, { mode: "no-cors" });
	if (!response.ok) {
		throw new Error(`资源下载失败：${url}`);
	}
	const blob = await response.blob();

	if (blob.type === "image/svg+xml") {
		const code = encodeSVG(await blob.text());
		return `data:image/svg+xml,${code}`;
	} else {
		return await blobToBase64URL(blob);
	}
}
