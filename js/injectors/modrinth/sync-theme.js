function saveTheme() {
	var theme = [...document.documentElement.classList];
	chrome.storage.local.set({ theme: theme }, () => {});
}

var themeSwitcher = document.querySelector(
	'button[title="Switch theme"][class="control-button"]'
);
if (themeSwitcher) {
	themeSwitcher.addEventListener("click", saveTheme);
	saveTheme();
}
