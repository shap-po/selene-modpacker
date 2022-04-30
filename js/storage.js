/*
This script helps to manage the modpacks.
*/

/**
 * empty callback function
 */
const callback_null = () => {};

/**
 * Add new modpack to storage
 * @param {object} modpack - The modpack to add, must look like this:
 *
 * {name: "", version: "", modloader: "", mods: []}
 */
function addModpack(modpack, callback = callback_null) {
	chrome.storage.local.get(["modpacks"], function (result) {
		if (result["modpacks"] === undefined) {
			var modpacks = [];
		} else {
			var modpacks = result["modpacks"];
		}
		modpacks.push(modpack);
		chrome.storage.local.set({ modpacks: modpacks }, () => {
			callback();
		});
	});
}
/**
 * Delete a modpack from storage
 */
function removeModpack(callback = callback_null) {
	chrome.storage.local.get(["modpacks", "current"], function (result) {
		if (
			result["modpacks"] === undefined ||
			result["current"] === undefined
		) {
			return;
		}
		var modpacks = result["modpacks"];
		var current = result["current"];
		modpacks.splice(current, 1);
		chrome.storage.local.set({ modpacks: modpacks }, () => {
			callback();
		});
	});
}
/**
 * Get list of modpacks
 */
function getModpacks(callback) {
	chrome.storage.local.get(["modpacks"], function (result) {
		if (result["modpacks"] === undefined) {
			return;
		}
		callback(result["modpacks"]);
	});
}

/**
 * A helper function to get all the data from the storage. Should be used only in storage.js
 */
function _get(callback) {
	chrome.storage.local.get(["modpacks", "current"], function (result) {
		var modpacks = result["modpacks"];
		var current = result["current"];
		if (
			current === undefined &&
			modpacks !== undefined &&
			modpacks.length > 0
		) {
			current = 0;
			setCurrent(current);
		} else if (modpacks === undefined || modpacks.length === 0) {
			return;
		}
		var modpack = modpacks[current];
		if (modpack === undefined) {
			return;
		}
		callback({ current, modpacks, modpack });
	});
}

/**
 * Get current modpack
 */
function getCurrentModpack(callback) {
	_get((result) => {
		callback(result.modpack);
	});
}

/**
 * Set index of current modpack
 */
function setCurrent(current, callback = callback_null) {
	chrome.storage.local.set({ current: current }, () => {
		callback();
	});
}
/**
 * Get index of current modpack
 */
function getCurrent(callback) {
	_get((result) => {
		callback(result.current);
	});
}
/**
 * Set current modpack index to the last one
 */
function setCurrentToLast(callback = callback_null) {
	chrome.storage.local.get(["modpacks"], function (result) {
		if (result["modpacks"] === undefined) {
			return;
		}
		var modpacks = result["modpacks"];
		var current = modpacks.length - 1;
		chrome.storage.local.set({ current: current }, () => {
			callback();
		});
	});
}

/**
 * Add a mod to the current modpack
 * @param {object} mod - The mod to add, must look like this:
 *
 * {id: "", provider: "", enabled: true}
 */
function addMod(mod, callback = callback_null) {
	if (mod === undefined || mod.id === undefined) {
		return;
	}
	_get((result) => {
		var mods = result.modpack.mods;
		//check if mod already exists
		var index = mods.findIndex((_mod) => _mod.id === mod.id);
		if (index === -1) {
			result.modpack.mods.push(mod);
		}
		chrome.storage.local.set({ modpacks: result.modpacks }, () => {
			callback();
		});
	});
}
/**
 * Remove a mod from the current modpack
 * @param {int} id - The id of the mod to remove
 */
function removeMod(id, callback = callback_null) {
	_get((result) => {
		var mods = result.modpack.mods;
		var index = mods.findIndex((_mod) => _mod.id === id);
		if (index === -1) {
			return;
		}
		mods.splice(index, 1);
		chrome.storage.local.set({ modpacks: result.modpacks }, () => {
			callback();
		});
	});
}
/**
 * Get list of mods in the current modpack
 */
function getMods(callback) {
	_get((result) => {
		callback(result.modpack.mods);
	});
}
/**
 * Set list of mods in the current modpack
 * @param {object} mods - The mods to set
 */
function setMods(mods, callback = callback_null) {
	_get((result) => {
		result.modpack.mods = mods;
		chrome.storage.local.set({ modpacks: result.modpacks }, () => {
			callback();
		});
	});
}
/**
 * Switch a state of a mod in the current modpack
 * @param {int} id - The id of the mod to enable/disable
 */
function switchModState(id, callback = callback_null) {
	_get((result) => {
		var mods = result.modpack.mods;
		var index = mods.findIndex((_mod) => _mod.id === id);
		if (index === -1) {
			return;
		}
		var mod = mods[index];
		if (mod.enabled === undefined) {
			mod.enabled = true;
		}
		mod.enabled = !mod.enabled;

		chrome.storage.local.set({ modpacks: result.modpacks }, () => {
			callback(id, mod.enabled);
		});
	});
}

/**
 * Set a version of the current modpack
 * @param {string} version - The version to set
 */
function setModpackVersion(version, callback = callback_null) {
	_get((result) => {
		result.modpack.version = version;
		chrome.storage.local.set({ modpacks: result.modpacks }, () => {
			callback();
		});
	});
}
/**
 * Get the version of the current modpack
 */
function getModpackVersion(callback) {
	_get((result) => {
		callback(result.modpack.version);
	});
}

/**
 * Set a modloader of the current modpack
 * @param {string} modloader - The modloader to set
 */
function setModpackModloader(modloader, callback = callback_null) {
	_get((result) => {
		result.modpack.modloader = modloader;
		chrome.storage.local.set({ modpacks: result.modpacks }, () => {
			callback();
		});
	});
}
/**
 * Get the modloader of the current modpack
 */
function getModpackModloader(callback) {
	_get((result) => {
		callback(result.modpack.modloader);
	});
}

/**
 * A function to clear storage to migrate versions. Should be used only for development/testing
 */
function clearMemory() {
	if (!confirm("Are you sure you want to clear the storage?")) {
		chrome.storage.local.remove(["modpacks", "current"], () => {});
	}
}

/**
 * A function to add mod in modpack. It exists because the way mods are added can be changed in the future.
 * Should be called only by injected button.
 * @param {object} mod - The mod to add, must look like this:
 *
 * {id: "", provider: ""}
 */
function addModToModpack(mod, callback = callback_null) {
	if (mod.enabled === undefined) {
		mod.enabled = true;
	}
	try {
		addMod(mod, callback);
		addModToCache(mod); //automatically add mod information to cache
	} catch (error) {
		alert(
			"Mod was not added to modpack. Try to reload the page and try again."
		);
	}
}

/**
 * A function to load theme from storage.
 */
function loadTheme(callback) {
	chrome.storage.local.get(["theme"], (result) => {
		if (result.theme === undefined) {
			return;
		}
		callback(result.theme);
	});
}
