/*
This script will be injected in the https://modrinth/mod/* page to add the download button.
*/
var finder = setInterval(function () {
	var header = document.querySelector('div[class="header card"]');
	if (header) {
		clearInterval(finder);
		// mod name can be changed in the future, so we need to get id from the icon url
		var modId = header
			.querySelector("a[href] > img[src]")
			?.src.split("/")
			?.slice(-2)[0];
		var add_button = document.createElement("button");
		add_button.className = "iconified-button";
		if (modId) {
			add_button.innerHTML = "+  Add mod to modpack";
		} else {
			add_button.innerHTML = "Something went wrong :(";
		}
		add_button.dataset.modId = modId;
		add_button.addEventListener("click", function () {
			addModToModpack({
				id: this.dataset.modId,
				provider: "modrinth",
			});
		});

		var width = 4;
		var buttons = header.getElementsByClassName("buttons")[0].children;
		for (var i = 0; i < buttons.length; i++) {
			width += buttons[i].offsetWidth;
		}
		if (width === 4) {
			width = "100%";
		} else {
			width += "px";
		}
		add_button.style = `justify-content: center;
					margin-top: 4px;
					padding: 0.425rem 1rem;
					width: ${width}`;
		header.appendChild(add_button);
	}
}, 200);
