import AddIcon from "@assets/Add.svg";
import CheckIcon from "@assets/Check.svg";
import { DialogBaseElement } from "./DialogBase";
import styles from "./TopSiteDialog.css";

/**
 * 如果 TopSite 没有自带标题则尝试使用域名。
 *
 * @param url TopSite 的 URL
 * @return {string} 用作标题的域名
 */
function adviceTitle(url: string) {
	const { hostname } = new URL(url);
	const parts = hostname.split(".");
	const top = parts.pop();
	return parts.length ? parts.pop() : top;
}

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name="导入常用网站">
		<ul id="top-sites"></ul>
	</dialog-base>
`;

const itemTemplate = document.createElement("template");
itemTemplate.innerHTML = `
	<li>
		<img alt="favicon">
		<span></span>
		<span class="url"></span>
		<button title="添加该网站" class="icon">${AddIcon}</button>
	</li>
`;

/**
 * 导入对话框，能够读取浏览器原生的新标签页里的快捷方式，并将其添加到本插件中。
 *
 * 【获取数据的 API】
 * browser.topSites 仅支持读取，而新标签页却需要自定义快捷方式，
 * 所以只能从 topSites 导入然后保存到本插件的存储。
 */
export class TopSiteDialogElement extends HTMLElement {

	private readonly dialogEl: DialogBaseElement;
	private readonly listEl: HTMLUListElement;

	private resolve = () => {};

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.dialogEl = root.querySelector("dialog-base") as DialogBaseElement;
		this.listEl = root.getElementById("top-sites") as HTMLUListElement;

		// 自定义的事件没法用 onXXX 啊……
		this.dialogEl.addEventListener("backdrop-click", () => {
			this.resolve();
			this.dialogEl.hide();
		});
		this.dialogEl.addEventListener("close", () => this.resolve());
	}

	async show() {
		const sites = await browser.topSites.get({
			newtab: true,
			includeFavicon: true,
		});
		const listItems = new Array(sites.length);

		for (let i = 0; i < sites.length; i++) {
			let { title, url, favicon } = sites[i];

			// 标题可能为空字符串，所以不能用 ??=
			url = decodeURI(url);
			title ||= adviceTitle(url);

			const fragment = itemTemplate.content.cloneNode(true);
			const item = listItems[i] = fragment.firstChild as any;

			item.children[0].src = favicon;
			item.children[1].textContent = title;
			item.children[2].textContent = url;
			item.children[3].onclick = () => {
				item.classList.add("added");
				item.children[3].innerHTML = CheckIcon;

				const init = {
					bubbles: true,
					detail: {
						url,
						label: title,
						favicon,
					},
				};
				this.dispatchEvent(new CustomEvent("add", init));
			};
		}

		this.listEl.replaceChildren(...listItems);
		this.dialogEl.showModal();
		return new Promise<void>(resolve => this.resolve = resolve);
	}
}

customElements.define("top-site-dialog", TopSiteDialogElement);
