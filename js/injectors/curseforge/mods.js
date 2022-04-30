/*
This script will be injected in the https://www.curseforge.com/minecraft/mc-mods* page to add the download button.
*/
setInterval(function () {
	var mods = document.querySelectorAll(
		'div[class="project-listing-row box py-3 px-4 flex flex-col lg:flex-row lg:items-center"]'
	);
	for (var i = 0; i < mods.length; i++) {
		var container = mods[i].querySelector(
			'div[class="w-full lg:w-unset justify-between lg:min-w-40 ml-auto flex flex-row-reverse lg:flex-col items-end"] > div[class="flex mb-2 -mx-1"]'
		);
		var add_button = container.querySelector("button.selena-add-button");
		if (!add_button) {
			var modId =
				container.querySelector("a[data-project-id]")?.dataset
					.projectId;
			var add_button = document.createElement("button");
			add_button.style.width = "30px";
			add_button.className = "button selena-add-button";
			if (modId) {
				add_button.innerHTML = "+";
			}
			add_button.dataset.modId = modId;
			add_button.addEventListener("click", function () {
				addModToModpack({
					id: this.dataset.modId,
					provider: "curseforge",
				});
			});
			container.appendChild(add_button);
		}
	}
}, 200);
