import { delegate } from "@share";
import Icon from "@assets/CheckBox.svg";
import IconChecked from "@assets/CheckBoxChecked.svg";
import styles from "./CheckBox.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<input id="input" type="checkbox">
	<div id="icon"></div>
	<span id="label"><slot></slot></span>
`;

export interface CheckBoxElement {
	name: string;
	type: "checkbox";
}

/*
 * 实现自定义的复选框可以参考这个教程：
 * https://developers.google.com/web/fundamentals/web-components/examples/howto-checkbox
 */

export class CheckBoxElement extends HTMLElement {

	static get observedAttributes() {
		return ["checked", "disabled", "name"];
	}

	private readonly inputEl: HTMLInputElement;
	private readonly markEl: HTMLDivElement;

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.inputEl = root.getElementById("input") as HTMLInputElement;
		this.markEl = root.getElementById("icon") as HTMLDivElement;

		delegate(this, "name", this.inputEl, "name");

		this.addEventListener("keyup", this.handleKeyup);
		this.addEventListener("click", this.toggleChecked);
	}

	set checked(value) {
		this.inputEl.checked = Boolean(value);
		this.markEl.innerHTML = value ? IconChecked : Icon;
	}

	get checked() {
		return this.inputEl.checked;
	}

	attributeChangedCallback(name: string, oldValue: any, newValue: any) {
		const { inputEl } = this;
		if (newValue === null) {
			inputEl.removeAttribute(name);
		} else {
			inputEl.setAttribute(name, newValue);
		}
	}

	/**
	 * 即便内部的 input 能捕获焦点，但被聚焦对象仍会变为整个组件。
	 * 所以需要自行处理键盘切换值的问题。
	 */
	handleKeyup(event: KeyboardEvent) {
		if (event.key === " ") {
			event.preventDefault();
			this.toggleChecked();
		}
	}

	/**
	 * 输入组件的 input 事件基本上只用 target 这个属性，
	 * 所以直接分发以 input 为名的 CustomEvent 也是可以的。
	 */
	toggleChecked() {
		if (this.inputEl.disabled) {
			return;
		}
		this.checked = !this.checked;
		this.dispatchEvent(new CustomEvent("input"));
	}
}

// 尽量跟原生的 input 属性保持一致，在一些场合可以减少无聊的判断。
CheckBoxElement.prototype.type = "checkbox";

customElements.define("check-box", CheckBoxElement);
