const escapes: Record<string, string> = {
	'"': "'",
	"%": "%25",
	"#": "%23",
	"{": "%7B",
	"}": "%7D",
	"<": "%3C",
	">": "%3E",
};

/**
 * SVG 可以使用比 Base64 更高效的 URL 编码。
 *
 * @see https://www.zhangxinxu.com/wordpress/2018/08/css-svg-background-image-base64-encode/
 */
export function encodeSVG(code: string) {
	return code.replaceAll(/["%#{}<>]/g, v => escapes[v]);
}

/**
 * 将 Blob 对象转为 base64 编码的 Data-URL 字符串。
 *
 * 【其他方案】
 * 如果可能，使用 URL.createObjectURL + URL.revokeObjectURL 性能更好。
 *
 * @param blob Blob对象
 * @return Data-URL 字符串
 */
export function blobToBase64URL(blob: Blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onerror = reject;
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(blob);
	});
}
