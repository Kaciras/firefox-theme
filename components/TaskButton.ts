import styles from "./TaskButton.css";

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<slot></slot>
	<div class='dot-flashing'>
		<div class='middle'></div>
	</div>
`;

type TaskFn =(signal: AbortSignal) => Promise<any>;

/**
 * 拥有繁忙状态的按钮，点击时启动任务并转为繁忙状态，完成后变为原样。
 * 繁忙状态保持原来的大小，内容变为加载指示器，点击繁忙状态的按钮会取消当前任务。
 *
 * 【实现注意】
 * Custom Element v1 不支持继承其他元素，如果这么做会显示不出 ShadowDOM。
 */
export class TaskButtonElement extends HTMLElement {

	taskFn: TaskFn = Promise.resolve;

	private readonly slotEl: HTMLSlotElement;
	private readonly loadingEl: HTMLElement;

	private running = false;
	private controller = new AbortController();

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.slotEl = root.querySelector("slot") as HTMLSlotElement;
		this.loadingEl = root.querySelector(".dot-flashing") as HTMLElement;
		this.loadingEl.remove();

		/*
		 * ShadowRoot 是包裹内部元素的大小，小于整个按钮，所以要监听外层。
		 * 宿主元素和 ShadowRoot 的关系就像 html 与 body 一样。
		 */
		this.addEventListener("click", this.handleClick);
	}

	connectedCallback() {
		this.classList.add("button");
	}

	async handleClick() {
		const { running, taskFn } = this;

		// 没有设置任务回调则与普通按钮一样
		if (!taskFn) return;

		if (!running) {
			this.startTask();
		} else {
			this.controller.abort();
			this.switchToNormal();
		}
	}

	startTask() {
		const { slotEl, loadingEl, taskFn, style } = this;
		this.running = true;

		const { width, height } = this.getBoundingClientRect();
		style.width = width + "px";
		style.height = height + "px";

		const { signal } = this.controller = new AbortController();
		slotEl.replaceWith(loadingEl);
		taskFn(signal).finally(this.switchToNormal.bind(this));
	}

	switchToNormal() {
		this.removeAttribute("style");
		this.running = false;
		this.loadingEl.replaceWith(this.slotEl);
	}
}

customElements.define("task-button", TaskButtonElement);
