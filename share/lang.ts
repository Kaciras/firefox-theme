/**
 * 使用 getter & setter 将 object[name] 绑定到 target[prop]。
 */
export function delegate(
	object: Record<string, unknown>, name: string,
	target: Record<string, unknown>, prop: string,
) {
	Object.defineProperty(object, name, {
		configurable: true,
		enumerable: true,
		get: () => target[prop],
		set: value => { target[prop] = value; },
	});
}

/**
 * 将输入组件的值与另一个对象的属性绑定。
 * 属性名等于输入组件的 name 属性，监听使用 input 事件。
 *
 * @param input 输入组件，必须有 name 和 type 属性。
 * @param receiver 要绑定的对象
 */
export function bindInput(
	input: HTMLInputElement,
	receiver: Record<string, any>,
) {
	const { type, name } = input;

	let prop: keyof HTMLInputElement;
	switch (type) {
		case "checkbox":
			prop = "checked";
			break;
		case "number":
			prop = "valueAsNumber";
			break;
		default:
			prop = "value";
			break;
	}

	// @ts-ignore
	input[prop] = receiver[name];
	input.addEventListener("input", () => {
		receiver[name] = input[prop];
	});
}

/**
 * 虽然 Node 自带 dirname，但在浏览器里用的话还得自己写一个。
 */
export function dirname(path: string) {
	const i = path.lastIndexOf("/");
	return i < 0 ? path : path.slice(0, i);
}

/**
 * 插队，先将数组中的元素移除，然后插入到指定位置。
 *
 * @param array 数组
 * @param i 原位置
 * @param j 新位置
 * @param n 移动的元素个数
 */
export function jump(array: unknown[], i: number, j: number, n = 1) {
	array.splice(j, 0, ...array.splice(i, n));
}

/**
 * 获取元素在其父元素的所有子元素中的位置。
 *
 * @param el DOM 元素
 * @return {number} 位置，如果没有父元素则出错。
 */
export function indexInParent(el: HTMLElement) {
	return Array.prototype.indexOf.call(el.parentNode!.children, el);
}
