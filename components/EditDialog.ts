import WebsiteIcon from "@assets/Website.svg?url";
import { delegate, getFaviconUrl, imageUrlToLocal } from "@share";
import { DialogBaseElement } from "./DialogBase";
import { TaskButtonElement } from "./TaskButton";
import styles from "./EditDialog.css";

const defaultData = {
	iconUrl: null,
	label: "",
	url: "",
	favicon: WebsiteIcon,
};

const template = document.createElement("template");
template.innerHTML = `
	<style>${styles}</style>
	<dialog-base name="编辑快捷方式">
		<form>
			<div id="icon-group">
				<div id="icon-box">
					<img id="favicon" alt="icon">
				</div>
				<task-button id="fetch">自动获取</task-button>
			</div>
			<div id="field-group">
				<label>
					名字（标题）
					<input name="name" placeholder="某某小站" required>
				</label>
				<label>
					地址（URL）
					<input name="url" type="url" required>
				</label>
			</div>
			<div id="actions">
				<button id="cancel" type="button">取消</button>
				<button id="accept" class="primary" type="button">确定</button>
			</div>
		</form>
	</dialog-base>
`;

const loadingHTML = "<span class='dot-flashing'><div class='middle'></div></span>";

export interface EditDialogElement {
	label: string;
	url: string;
	favicon: string;
}

export class EditDialogElement extends HTMLElement {

	private readonly dialogEl: DialogBaseElement;
	private readonly iconEl: HTMLImageElement;
	private readonly nameInput: HTMLInputElement;
	private readonly urlInput: HTMLInputElement;
	private readonly fetchButton: TaskButtonElement;

	constructor() {
		super();
		const root = this.attachShadow({ mode: "closed" });
		root.append(template.content.cloneNode(true));

		this.dialogEl = root.querySelector("dialog-base") as DialogBaseElement;
		this.iconEl = root.getElementById("favicon") as HTMLImageElement;
		this.nameInput = root.querySelector("input[name='name']") as HTMLInputElement;
		this.urlInput = root.querySelector("input[name='url']") as HTMLInputElement;
		this.fetchButton = root.getElementById("fetch") as TaskButtonElement;

		delegate(this, "label", this.nameInput, "value");
		delegate(this, "url", this.urlInput, "value");
		delegate(this, "favicon", this.iconEl, "src");

		this.fetchButton.taskFn = this.fetchFavicon.bind(this);

		this.handleActionClick = this.handleActionClick.bind(this);
		root.getElementById("cancel")!.onclick = this.handleActionClick;
		root.getElementById("accept")!.onclick = this.handleActionClick;
	}

	// 不要使用 Object.assign 因为参数可能含有额外的字段。
	show(data = defaultData) {
		this.url = data.url;
		this.favicon = data.favicon;
		this.label = data.label;
		this.iconUrl = data.iconUrl;

		this.dialogEl.showModal();
		return new Promise(resolve => this.resolve = resolve);
	}

	// 把要传递的属性挑出来，以便调用方解构。
	handleActionClick(event: MouseEvent) {
		const { resolve, dialogEl, urlInput } = this;

		if (event.target.id !== "accept") {
			dialogEl.hide();
			resolve(null);
		} else if (urlInput.form.reportValidity()) {
			dialogEl.hide();
			resolve({
				label: this.label,
				favicon: this.favicon,
				url: this.url,
				iconUrl: this.iconUrl,
			});
		}
	}

	async fetchFavicon() {
		if (!this.urlInput.reportValidity()) {
			return;
		}
		this.fetchButton.innerHTML = loadingHTML;
		const url = this.urlInput.value;

		try {
			const href = await getFaviconUrl(url);
			this.iconUrl = href;
			this.favicon = await imageUrlToLocal(href);
		} catch (e) {
			alert(e.message);
		} finally {
			this.fetchButton.textContent = "自动获取";
		}
	}
}

customElements.define("edit-dialog", EditDialogElement);
