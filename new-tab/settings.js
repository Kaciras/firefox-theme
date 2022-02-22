import "../components/DialogBase.js";
import "../components/CheckBox.js";
import "../components/EditDialog.js";
import "../components/TopSiteDialog.js";
import CheckIcon from "@assets/Check.svg";
import { bindInput, indexInParent } from "@share";
import { clearAllData, exportSettings, importSettings, saveConfig } from "./storage.js";
import { add, remove, setShortcutEditable, update } from "./shortcuts.js";

const left = document.getElementById("setting-left");
const right = document.getElementById("setting-right");

const importDialog = document.createElement("top-site-dialog");
const editDialog = document.createElement("edit-dialog");
document.body.append(importDialog, editDialog);

const container = document.getElementById("shortcuts");
container.addEventListener("edit", handleEdit);
container.addEventListener("remove", remove);

/**
 * 快捷方式右上角的编辑按钮被点击时调用。
 *
 * 【注意】
 * 这里用索引来记录当前编辑的对象，需要保证编辑时 shortcuts 里的顺序不变。
 *
 * @param event BookMark 元素的 edit 事件
 */
function handleEdit(event) {
	const el = event.target;
	editDialog.index = indexInParent(el);
	editDialog.show(el);
}

editDialog.addEventListener("change", event => {
	const { target, detail } = event;
	const { index } = target;

	if (index === undefined) {
		return add(detail);
	} else {
		return update(index, detail);
	}
});

importDialog.addEventListener("add", event => add(event.detail));

export function startAddShortcut() {
	editDialog.show();
	editDialog.index = undefined;
}

export function startImportTopSites() {
	importDialog.show();
}

function requestClearData() {
	const message = "确定要清空本插件保存的所有数据？\n该过程不可撤销，并且会同步到所有设备";
	window.confirm(message) && clearAllData();
}

// 因为有内联 SVG 所以没法写在 index.html 里。
const rightTemplate = document.createElement("template");
rightTemplate.innerHTML = `
	<button class="primary">
		${CheckIcon}
		<span>确定</span>
	</button>
	<button>添加网站</button>
	<button>导入常用网站</button>
	<button>导入数据</button>
	<button>导出数据</button>
	<button class="warning">清空存储</button>
`;

const leftTemplate = document.createElement("template");
leftTemplate.innerHTML = `
	<label>
		最大建议数量
		<input name="limit" type="number" min="0">
	</label>
	<label>
		建议防抖（毫秒）
		<input name="threshold" type="number" min="0">
	</label>
	<check-box title="未上屏字符不触发建议" name="waitIME">输入法防抖</check-box>
`;

export function switchToSettingMode() {
	// template 中从 HTML 解析的自定义元素没有关联到实现，必须先挂载。
	left.replaceChildren(leftTemplate.content.cloneNode(true));
	right.replaceChildren(rightTemplate.content.cloneNode(true));

	setShortcutEditable(true);
	document.body.classList.add("editing");

	const searchBox = document.querySelector("search-box");
	bindInput(left.querySelector("input[name='threshold']"), searchBox);
	bindInput(left.querySelector("input[name='limit']"), searchBox);
	bindInput(left.querySelector("check-box[name='waitIME']"), searchBox);

	right.children[1].onclick = startAddShortcut;
	right.children[2].onclick = startImportTopSites;
	right.children[3].onclick = importSettings;
	right.children[4].onclick = exportSettings;
	right.children[5].onclick = requestClearData;

	/**
	 * 退出设置模式时除了切换到通常模式，还要把设置保存下来。
	 */
	return new Promise(resolve => {
		right.children[0].onclick = () => {
			const searchBox = document.querySelector("search-box");
			resolve();
			return saveConfig(searchBox, ["threshold", "waitIME", "limit"]);
		};
	});
}
