/*
A main script for the modpack manager.
*/

// sync page theme with modrinth theme
loadTheme(function (theme) {
	document.documentElement.classList = theme;
});

function updateModpackList() {
	var modpackList = document.getElementById("modpack-list");
	//clear list
	modpackList.innerHTML = "";
	getModpacks(function (modpacks) {
		//add modpacks to list
		for (var i = 0; i < modpacks.length; i++) {
			var option = `<option value="${i}">${modpacks[i].name}</option>`;
			modpackList.innerHTML += option;
		}
		updateSelectOptions(modpackList);
		//set current modpack to selected
		getCurrent(function (current) {
			if (current === undefined) {
				return;
			}
			modpackList.selectedIndex = current;
			setSelectSelected(modpackList);
		});
	});
}
function updateModpackInfo() {
	var modList = document.getElementById("mod-list");
	modList.innerHTML = `<div><div class="drop-area"></div></div>`;
	getModsInformation(function (mods) {
		//add mods to list
		for (var i = 0; i < mods.length; i++) {
			var mod = mods[i];
			var enabled = "enabled";
			if (mod.enabled === false) {
				enabled = "disabled";
			}
			var mod_element = `
			<article data-mod-id="${mod.id}" ${enabled} class="${mod.provider}" draggable="true">
			<div class="mod-info">
				<a href="${mod.url}">
					<img src="${mod.icon_url}">
				</a>
				<div class="mod-content">
					<div class="top-side">
						<div class="left-side">
							<h2>
								<a href="${mod.url}">${mod.title}</a>
							</h2>
						</div>
						<div class="right-side">
							<button class="disable-mod" data-id="${mod.id}"><svg><path></path></svg></button>
							<button class="remove-mod" data-id="${mod.id}"><svg><path></path></svg></button>
						</div>
					</div>
					<div class="bottom-side">
						<p>${mod.description}</p>
					</div>
				</div>
			</div>
			<div class="drop-area"</div>
			</article>
			`;
			modList.innerHTML += mod_element;
		}
		addModsListeners(modList);
		// add drag & drop listeners
		document.querySelectorAll("article").forEach((item) => {
			item.addEventListener("dragstart", dragStart);
		});
		document.querySelectorAll(".drop-area").forEach((item) => {
			item.addEventListener("dragover", dragOver);
			item.addEventListener("drop", dragDrop);
			item.addEventListener("dragenter", dragEnter);
			item.addEventListener("dragleave", dragLeave);
		});
	});
	getModpackVersion(function (version) {
		var versionSelect = document.getElementById("modpack-version");
		versionSelect.value = version;
	});
	getModpackModloader(function (modloader) {
		var modloaderSelect = document.getElementById("modpack-modloader");
		modloaderSelect.value = modloader;
		setSelectSelected(modloaderSelect);
	});
}

//assign event listeners

/**
 * This function returns the mod elements by mod id. First element is an actual element, second is
 * @param {string} id - The id of the mod
 * @returns {NodeList} - The mod elements
 */
function getModElements(id) {
	return document.querySelectorAll(`article[data-mod-id="${id}"]`);
}
function addModsListeners(modList) {
	//force links open in new tab
	var links = modList.getElementsByTagName("a");
	for (var i = 0; i < links.length; i++) {
		links[i].addEventListener("click", function (e) {
			e.preventDefault();
			window.open(this.href, "_blank");
		});
	}
	//remove mod button
	var buttons = modList.getElementsByClassName("remove-mod");
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener("click", function () {
			if (confirm("Are you sure you want to remove this mod?")) {
				var id = this.dataset.id;
				removeMod(id, () => {
					getModElements(id).forEach((item) => {
						item.remove();
					});
				});
			}
		});
	}
	//disable mod button
	var buttons = modList.getElementsByClassName("disable-mod");
	for (var i = 0; i < buttons.length; i++) {
		buttons[i].addEventListener("click", function () {
			switchModState(this.dataset.id, function (id, state) {
				getModElements(id).forEach((item) => {
					if (state === true) {
						item.setAttribute("enabled", "");
						item.removeAttribute("disabled");
					} else {
						item.setAttribute("disabled", "");
						item.removeAttribute("enabled");
					}
				});
			});
		});
	}
}

document.getElementById("modpack-list").addEventListener("change", function () {
	setCurrent(+this.value, () => {
		updateModpackInfo();
	});
});
document.getElementById("new-modpack").addEventListener("click", function () {
	var name = prompt("Enter the name of the modpack");
	addModpack({ name: name, version: "", modloader: "", mods: [] }, () => {
		setCurrentToLast(() => {
			updateModpackList();
			updateModpackInfo();
		});
	});
});

document
	.getElementById("delete-modpack")
	.addEventListener("click", function () {
		if (confirm("Are you sure you want to delete selected modpack?")) {
			removeModpack(() => {
				setCurrent(0, () => {
					updateModpackList();
					updateModpackInfo();
				});
			});
		}
	});

document.getElementById("modpack-version").onchange = function () {
	setModpackVersion(this.value);
};
document.getElementById("modpack-modloader").onchange = function () {
	setModpackModloader(this.value);
};

document.getElementById("download-modpack").onclick = function () {
	getCurrentModpack(function (modpack) {
		var statusBar = document.getElementById("download-status");
		if (modpack === undefined) {
			statusBar.innerText = "No modpack selected";
			return;
		}
		if (modpack.version === undefined || modpack.version === "") {
			statusBar.innerText = "No version selected";
			return;
		}
		if (modpack.modloader === undefined || modpack.modloader === "") {
			statusBar.innerText = "No modloader selected";
			return;
		}
		downloadModpack(modpack);
	});
};

/**
 * Select file(s).
 * @param {String} contentType The content type of files you wish to select. For instance, use "image/*" to select all types of images.
 * @param {Boolean} multiple Indicates if the user can select multiple files.
 * @returns {Promise<File|File[]>} A promise of a file or array of files in case the multiple parameter is true.
 * Function is taken from https://stackoverflow.com/a/52757538
 */
function selectFile(contentType, multiple) {
	return new Promise((resolve) => {
		let input = document.createElement("input");
		input.type = "file";
		input.multiple = multiple;
		input.accept = contentType;

		input.onchange = () => {
			let files = Array.from(input.files);
			if (multiple) resolve(files);
			else resolve(files[0]);
		};

		input.click();
	});
}

document.getElementById("export-modpack").onclick = function () {
	getCurrentModpack(function (modpack) {
		if (modpack === undefined || modpack === "") {
			alert("No modpack selected");
			return;
		}
		if (modpack.version === undefined || modpack.version === "") {
			alert("No version selected");
			return;
		}
		if (modpack.modloader === undefined || modpack.modloader === "") {
			alert("No modloader selected");
			return;
		}
		//remove illegal characters for file names from name
		var name = modpack.name.replace(/[\\\/\:\*\?\"\<\>\|]/g, "");
		saveAs(
			new Blob([JSON.stringify(modpack, null, 4)], {
				type: "application/json",
			}),
			`${name}.json`
		);
	});
};

document.getElementById("import-modpack").onclick = function () {
	selectFile("text/json", false).then((file) => {
		var reader = new FileReader();
		reader.onload = function () {
			try {
				var modpack = JSON.parse(reader.result);
			} catch (e) {
				alert("Invalid JSON file");
				return;
			}
			if (
				modpack.version === undefined ||
				modpack.modloader === undefined ||
				modpack.mods === undefined
			) {
				alert("Invalid modpack file");
				return;
			}
			addModpack(modpack, () => {
				setCurrentToLast(() => {
					updateModpackList();
					updateModpackInfo();
				});
			});
		};
		reader.readAsText(file);
	});
};

//search system
document.getElementById("search").oninput = function () {
	var search = this.value;
	//escape search string and convert it to regex
	var escaped_search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
	var regex_search = new RegExp(`(${escaped_search})`, "gi");

	var modList = document.getElementById("mod-list");
	var searchList = document.getElementById("mod-search-list");
	var clearSearch = document.getElementById("clear-search");
	if (search !== "") {
		modList.style.display = "none";
		clearSearch.style.display = "block";
		searchList.innerHTML = modList.innerHTML;
		/**
		 * A function that finds all matches in an element and highlights them.
		 * @param {HTMLElement} element The element to search in.
		 * @returns {boolean} True if any matches were found, false otherwise.
		 */
		function searchElement(element) {
			var text = element.innerHTML;
			var new_text = text.replace(
				regex_search,
				`<span class="highlight">$1</span>`
			);
			if (text !== new_text) {
				element.innerHTML = new_text;
				return true;
			}
			return false;
		}
		searchList.querySelectorAll("article").forEach((item) => {
			var title = item.querySelector("h2 > a");
			var description = item.querySelector("p");

			if (!searchElement(title) && !searchElement(description)) {
				//if no matches were found, remove the item from the list
				item.remove();
			} else {
				//otherwise make item not draggable
				item.draggable = false;
			}
		});
		addModsListeners(searchList);
	} else {
		searchList.innerHTML = "";
		modList.style.display = "block";
		clearSearch.style.display = "none";
	}
};
document.getElementById("clear-search").onclick = function () {
	document.getElementById("search").value = "";
	document.getElementById("search").oninput();
};

//custom selects
/**
 * A function to close opened selects.
 * @param {HTMLElement} except The only one select that should NOT be deactivated.
 */
function closeSelects(except = null) {
	document.querySelectorAll(".custom-select").forEach((select) => {
		if (select !== except) {
			select.classList.remove("active");
		}
	});
}
/**
 * A function to update option list of a custom select.
 * @param {HTMLSelectElement} select The select element to update (just a regular one, not a custom)
 */
function updateSelectOptions(select) {
	var options = select.parentNode.querySelector(".select-options");
	options.innerHTML = "";
	//create options
	for (var i = 0; i < select.options.length; i++) {
		var option = select.options[i];
		var custom_option = document.createElement("div");
		custom_option.classList.add("custom-option");
		custom_option.innerText = option.text;
		custom_option.dataset.value = option.value;
		custom_option.dataset.index = option.index;
		if (option.disabled) {
			custom_option.classList.add("disabled");
		}
		if (option.selected) {
			custom_option.classList.add("selected");
		}
		options.appendChild(custom_option);
		if (i == select.options.length - 1) {
			custom_option.classList.add("last");
		}
	}
}
/**
 * A function to set the selected option of a custom select.
 * @param {HTMLSelectElement} select The select element to update (just a regular one, not a custom)
 */
function setSelectSelected(select) {
	var label = select.parentNode.querySelector(".select-label");
	var index = select.selectedIndex;
	label.innerText = select.options[index]?.innerText.replace("\n", "") || "";
	var options = select.parentNode.querySelector(".select-options");
	options.querySelectorAll(".custom-option").forEach((option) => {
		if (option.dataset.index == index) {
			option.classList.add("selected");
		} else {
			option.classList.remove("selected");
		}
	});
}

//add listener to close selects when clicking outside of them
document.addEventListener("click", function (e) {
	var target = e.target;
	if (target.classList.contains("custom-select")) {
		closeSelects(target);
	} else if (target.parentNode.classList.contains("custom-select")) {
		closeSelects(target.parentNode);
	} else {
		closeSelects();
	}
});

// replace all selects with custom selects
document.querySelectorAll("select").forEach((select) => {
	//wrap select with div
	var customSelect = document.createElement("div");
	customSelect.classList.add("custom-select");
	select.parentNode.insertBefore(customSelect, select);
	customSelect.appendChild(select);
	//create label
	var label = document.createElement("label");
	label.classList.add("select-label");
	customSelect.appendChild(label);
	//create arrow
	var arrow = document.createElement("div");
	arrow.classList.add("select-arrow");
	customSelect.appendChild(arrow);
	//create options list
	var options = document.createElement("div");
	options.classList.add("select-options");
	customSelect.appendChild(options);

	updateSelectOptions(select);
	setSelectSelected(select);

	//add listeners
	customSelect.addEventListener("click", function () {
		customSelect.classList.toggle("active");
	});
	options.addEventListener("click", function (e) {
		var option = e.target;
		var select = option.parentNode.parentNode.querySelector("select");
		if (
			option.classList.contains("custom-option") &&
			!option.classList.contains("disabled")
		) {
			select.selectedIndex = option.dataset.index;
			label.innerText = option.innerText;
			for (var i = 0; i < option.parentNode.children.length; i++) {
				option.parentNode.children[i].classList.remove("selected");
			}
			option.classList.add("selected");

			select.dispatchEvent(new Event("change"));
		}
	});
});

/// Drag & drop
function dragStart() {
	dragged = this;

	//make all drop areas bigger
	setTimeout(() => {
		document.querySelectorAll(".drop-area").forEach((item) => {
			item.classList.add("element-dragged");
		});
	}, 0);
}
function dragEnter() {
	this.classList.add("drag-over");
}
function dragLeave(e) {
	this.classList.remove("drag-over");
}
function dragOver(e) {
	e.preventDefault();
}
function dragDrop() {
	this.parentNode.after(dragged);
	this.classList.remove("drag-over");

	//swap mods in the modpack and save it to storage
	var modElements = document.querySelectorAll("article");
	getMods(function (mods) {
		var new_mods = [];
		for (var i = 0; i < modElements.length; i++) {
			var id = modElements[i].dataset.modId;
			new_mods.push(mods.find((mod) => mod.id === id));
		}
		setMods(new_mods);
	});
}

document.addEventListener("dragend", function (e) {
	document.querySelectorAll(".drop-area").forEach((item) => {
		item.classList.remove("element-dragged");
	});
});

// load values from storage
updateModpackList();
updateModpackInfo();

// log current modpacks info to console for debugging
_get((result) => {
	console.log("[DEBUG INFO]", result);
});
