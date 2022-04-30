/*
This script will be injected in the https://modrinth/mods* page to add the download buttons.
*/
setInterval(function () {
	var mods = document.querySelectorAll(
		'article[role="listitem"][class="project-card card"] > div[class="columns"]'
	);
	for (var i = 0; i < mods.length; i++) {
		var right = mods[i].querySelector(
			'div[class="card-content"] > div[class="right-side"]'
		);
		var left = mods[i].querySelector('div[class="icon"]');
		var add_button = right.querySelector(
			'button[class="selena-add-button"]'
		);
		if (!add_button) {
			var modId = left
				.querySelector("a[href] > img[src]")
				?.src?.split("/")
				?.slice(-2)[0];
			add_button = document.createElement("button");
			add_button.className = "selena-add-button";
			if (modId) {
				add_button.innerHTML = "+";
			}
			add_button.dataset.modId = modId;

			add_button.addEventListener("click", function () {
				addModToModpack({
					id: this.dataset.modId,
					provider: "modrinth",
				});
			});
			right.appendChild(add_button);
		}
	}
}, 200);
