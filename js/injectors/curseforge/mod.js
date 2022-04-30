/*
This script will be injected in the https://www.curseforge.com/minecraft/mc-mods/* page to add the download button.
*/
var finder = setInterval(function () {
	var container = document.querySelector(
		'header.game-header > div.container div[class="flex mb-2"]'
	);
	if (container) {
		clearInterval(finder);
		//get mod id using Xpath
		var modId = document.evaluate(
			"/html/body/div[1]/main/div[1]/div[2]/section/aside/div[2]/div/div[1]/div[2]/div[1]/span[2]",
			document,
			null,
			XPathResult.STRING_TYPE,
			null
		).stringValue;

		var add_button = document.createElement("button");
		add_button.innerHTML = "+ Add mod to modpack";
		add_button.className = "button selene-add-button";
		add_button.dataset.modId = modId;
		add_button.style = `top: 4px;`;
		add_button.addEventListener("click", function () {
			addModToModpack({
				id: this.dataset.modId,
				provider: "curseforge",
			});
		});
		container.appendChild(add_button);
		container.style += `
        display: flex;
        flex-direction: column;`;
	}
}, 200);
