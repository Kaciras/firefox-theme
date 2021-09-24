import { delegate } from "@share";
import EditIcon from "@assets/Edit.svg";
import CloseIcon from "@assets/Close.svg";
import styles from "./BookMark.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	
	<a id="link">
		<div id="icon-box">
			<img id="favicon" alt="favicon" src="#">
		</div>
		<span id="label"></span>
	</a>
	
	<button
		type="button"
		id="edit"
		title="编辑"
	>
		${EditIcon}
	</button>
	<button 
		type="button"
		id="remove"
		title="删除"
	>
		${CloseIcon}
	</button>
`;

export interface BookMarkElement {
	label: string;
	url: string;
	favicon: string;
}

/**
 * 搜索框下面的快捷方式，样式跟 Firefox 的一样除了右上角的修改按钮。
 *
 * 因为该元素仅通过 JS 创建，所以就不写 observedAttributes 了。
 */
export class BookMarkElement extends HTMLElement {

	private readonly labelEl: HTMLLabelElement;
	private readonly iconEl: HTMLImageElement;
	private readonly linkEl: HTMLAnchorElement;

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.labelEl = root.getElementById("label") as HTMLLabelElement;
		this.iconEl = root.getElementById("favicon") as HTMLImageElement;
		this.linkEl = root.getElementById("link") as HTMLAnchorElement;

		delegate(this, "label", this.labelEl, "textContent");
		delegate(this, "url", this.linkEl, "href");
		delegate(this, "favicon", this.iconEl, "src");

		root.getElementById("edit")!.onclick = () => this.dispatchEvent(new CustomEvent("edit"));
		root.getElementById("remove")!.onclick = () => this.dispatchEvent(new CustomEvent("remove"));
	}

	/**
	 * 是否处于被拖动中，为 true 时将隐藏图标和标题。
	 */
	get isDragging() {
		return this.linkEl.className === "blank";
	}

	set isDragging(value) {
		this.linkEl.className = value ? "blank" : "";
	}

	/**
	 * 是否显示右上角的编辑和删除按钮，默认不显示以免误碰。
	 */
	get isEditable() {
		return this.classList.contains("editable");
	}

	set isEditable(value) {
		this.classList.toggle("editable", value);
	}
}

customElements.define("book-mark", BookMarkElement);
