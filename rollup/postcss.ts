import postcss from "postcss";
import nested from "postcss-nested";
import csso from "postcss-csso";
import vars from "postcss-simple-vars";
import { Info, Source } from "./asset.js";

const cssLangRE = /\.(css|less|sass|scss|styl|pcss)($|\?)/;

const convertor = postcss([
	nested(),						// 支持嵌套语法
	csso(),							// 压缩结果
	vars({ variables: {} }),	// 局部变量还是预处理方便些
]);

export default function (source: Source, info: Info) {
	if (!cssLangRE.test(info.id)) {
		return;
	}
	return convertor.process(source.string).css;
}
