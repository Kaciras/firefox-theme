import xIcon from "@assets/Close.svg";
import styles from "./DialogBase.css";

/*
 * 不能将自定义元素作为遮罩层，然后对话框放在内部，虽然这样能省个元素，
 * 但 ShadowDOM 会屏蔽细节，将内部元素事件的 target 属性全改为自定义元素自身，
 * 这会导致无法判断点击的是对话框还是遮罩层。
 */
const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>

	<div id="backdrop"></div>

	<div id="dialog">
		<h1></h1>
		<button
			class="plain"
			title="关闭"
			type="button"
		 >
			${xIcon}
		</button>
		<slot></slot>
	</div>
`;

/**
 * 因为 Firefox 不支持 dialog 元素，所以自己搞了，顺便加个关闭按钮。
 */
export class DialogBaseElement extends HTMLElement {

	static get observedAttributes() {
		return ["name"];
	}

	private readonly titleEl: HTMLElement;

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.titleEl = root.querySelector("h1") as HTMLElement;

		root.querySelector("button")!.onclick = this.hide.bind(this);
		root.getElementById("dialog")!.onkeyup = event => {
			event.key === "Escape" && this.hide();
		};
		root.getElementById("backdrop")!.onclick = this.handleBackdropClick.bind(this);
	}

	get name() {
		return this.getAttribute("aria-labelledby")!;
	}

	set name(value: string) {
		this.titleEl.textContent = value;
		this.setAttribute("aria-labelledby", value);
	}

	attributeChangedCallback(name: string, old: any, value: any) {
		this.name = value;
	}

	// 在构造方法里设置 DOM 属性会报错。
	connectedCallback() {
		this.setAttribute("role", "dialog");
	}

	showModal() {
		this.classList.add("open");
	}

	hide() {
		this.dispatchEvent(new CustomEvent("close"));
		this.classList.remove("open");
	}

	handleBackdropClick() {
		this.dispatchEvent(new CustomEvent("backdrop-click"));
	}
}

customElements.define("dialog-base", DialogBaseElement);
