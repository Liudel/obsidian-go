import { request } from "http";
import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	MarkdownPostProcessorContext,
	MarkdownRenderer,
	View,
} from "obsidian";

let id = 0;

function getId() {
	return id++;
}

function createRespText(el: HTMLElement, id: string, text: string) {
	let pre = el.createEl("pre", {
		cls: "language-text",
		attr: {
			id: id,
			tabindex: "0",
		},
	});

	pre.append(
		el.createEl("code", {
			cls: "language-text is-loaded",
			text: text,
		})
	);

	let del = el.createEl("button", {
		cls: "copy-code-button",
		text: "删除",
	});

	del.addEventListener("click", function (e: Event) {
		let output = el.querySelectorAll("#" + id);
		if (output != null) {
			output.forEach(function (
				v: Element,
				k: number,
				parent: NodeListOf<Element>
			) {
				pre.parentElement?.removeChild(v);
			});
		}
	});

	pre.append(del);

	el.append(pre);
}

interface GolangPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: GolangPluginSettings = {
	mySetting: "default",
};

export default class GolangPlugin extends Plugin {
	settings: GolangPluginSettings;

	async onload() {
		console.log("Loading Run go");
		await this.loadSettings();
		this.registerMarkdownPostProcessor(this.postprocessor.bind(this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async postprocessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		let pres = Array.from(el.querySelectorAll("pre"));

		for (const pre of pres) {
			let section = ctx.getSectionInfo(pre);
			if (section == null) {
				continue;
			}

			let sectionArr = section?.text.split("\n");
			if (sectionArr?.at(section.lineStart) != "```go") {
				console.log(sectionArr?.at(section.lineStart));
				continue;
			}

			// console.log(.join('\n'))

			let button = el.createEl("button", {
				text: "Run",
				cls: "copy-code-button",
			});

			function addResp(pre: HTMLPreElement) {
				let id = "ob-go" + getId();
				let time: NodeJS.Timeout;
				return function (e: Event) {
					clearTimeout(time);

					time = setTimeout(function () {
						if (section == null) {
							console.log("section is null");
							return;
						}

						var myHeaders = new Headers();
						myHeaders.append(
							"content-type",
							"application/x-www-form-urlencoded; charset=UTF-8"
						);

						var raw =
							"version=2&body=" +
							encodeURIComponent(
								sectionArr
									.slice(
										section.lineStart + 1,
										section.lineEnd
									)
									.join("\n")
							) +
							"&withVet=true";
						let output = el.querySelectorAll("#" + id);
						if (output != null) {
							output.forEach(function (
								v: Element,
								k: number,
								parent: NodeListOf<Element>
							) {
								pre.parentElement?.removeChild(v);
							});
						}
						var requestOptions: RequestInit = {
							method: "POST",
							headers: myHeaders,
							body: raw,
							redirect: "follow",
						};

						console.log("111111111111111");
						fetch(
							"http://www.liudel.top/compile?backend=",
							requestOptions
						)
							.then((response) => response.text())
							.then((result) => {
								let res = JSON.parse(result);

								let text = res.Errors;
								if (text == "") {
									text = "程序无输出";
									if (res.Events != null) {
										text = res.Events[0].Message;
									}
								}

								if (pre.parentElement == null) {
									return
								}

								createRespText(
									pre.parentElement,
									id,
									"** OUTPUT **\n\n" + text + "\n"
								);
							})
							.catch((error) => console.log("error", error));
					}, 500);
				};
			}

			button.addEventListener("click", addResp(pre));
			pre.append(button);
		}
	}
}

class GolangSettingTab extends PluginSettingTab {
	plugin: GolangPlugin;

	constructor(app: App, plugin: GolangPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
	}
}
