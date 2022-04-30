/*
This script helps to cache the modpacks from the modrinth so that they can be loaded faster and don't overload the server with requests.
*/

const errorMod = {
	id: "error",
	title: "Error",
	description: "An error occurred while loading the modpack",
	icon_url: "https://www.iconfinder.com/icons/4781855/download/png/128",
	url: "https://modrinth.com",
};

/**
 * Save mods information to cache
 * @param {object} mods - The array of mods to save
 */
function saveToCache(mods) {
	chrome.storage.local.get(["cache"], function (result) {
		if (result["cache"] === undefined) {
			var cache = {};
		} else {
			var cache = result["cache"];
		}
		//merge mods with cache
		cache = { ...cache, ...mods };
		chrome.storage.local.set({ cache: cache }, () => {});
	});
}
/**
 * Get mods information from cache
 */
function loadCache(callback) {
	chrome.storage.local.get(["cache"], function (result) {
		if (result["cache"] === undefined) {
			callback({});
			return;
		}
		callback(result["cache"]);
	});
}
/**
 * Save the mod information to the cache
 * @param {object} mod - The mod to save
 */
function addModToCache(mod) {
	loadCache((cache) => {
		if (cache[mod.id] === undefined) {
			requestMod(mod).then((mod) => {
				if (mod.id === undefined) {
					return;
				}
				var mods = {};
				mods[mod.id] = mod;
				saveToCache(mods);
			});
		}
	});
}
/**
 * Remove a mod from cache
 */
function removeModFromCache(modId) {
	loadCache((cache) => {
		delete cache[modId];
		saveToCache(cache);
	});
}
/**
 * Completely clear the cache
 */
function clearCache() {
	chrome.storage.local.remove(["cache"], () => {});
}

/**
 * Request information about a mod from the modrinth or curseforge
 * @param {object} mod - The mod to request information for
 * @returns {Promise} - A promise that resolves to the mod information
 */
async function requestMod(mod) {
	var promise;
	if (mod.provider === "modrinth") {
		promise = fetch(`https://api.modrinth.com/v2/project/${mod.id}`)
			.then((response) => response.json())
			.then((data) => {
				data.provider = "modrinth";
				data.url = `https://modrinth.com/mod/${data.slug}`;
				return data;
			})
			.catch((error) => {
				console.log(error);
				return errorMod;
			});
	} else if (mod.provider === "curseforge") {
		promise = fetch(`https://curse.nikky.moe/api/addon/${mod.id}`)
			.then((response) => response.json())
			.then((data) => {
				data.provider = "curseforge";
				data.title = data.name;
				data.description = data.summary;
				data.icon_url = data.attachments[0]?.url;
				data.url = data.websiteUrl;
				return data;
			})
			.catch((error) => {
				console.log(error);
				return errorMod;
			});
	}
	return promise;
}

/**
 * Request information about mods from the modrinth
 * @param {array} modIds - The array of mod ids to request information for
 */
function requestInformation(mods, callback) {
	var promises = [];
	for (var i = 0; i < mods.length; i++) {
		var mod = mods[i];
		promises.push(requestMod(mod));
	}
	Promise.all(promises).then((values) => {
		var mods_information = {};
		for (var i = 0; i < values.length; i++) {
			var mod = values[i];
			if (mod.id === undefined) {
				continue;
			}
			mods_information[mod.id] = mod;
		}
		saveToCache(mods_information);
		callback(mods_information);
	});
}

/**
 * Get mods from the cache
 * @param {array} mods - The array of mods to request information for
 */
function getModsFromCache(mods, callback) {
	loadCache((cache) => {
		var mods_to_cache = [];
		var mods_information = {};
		for (var i = 0; i < mods.length; i++) {
			var mod = mods[i];
			if (cache[mod.id] === undefined) {
				mods_to_cache.push(mod);
			} else {
				mods_information[mod.id] = { ...cache[mod.id], ...mod };
			}
		}
		if (mods_to_cache.length > 0) {
			requestInformation(mods_to_cache, (new_information) => {
				var new_mods = [];
				for (var i = 0; i < mods.length; i++) {
					var mod = mods[i];
					if (new_information[mod.id] !== undefined) {
						new_mods.push({
							...new_information[mod.id],
							...mod,
						});
					} else new_mods.push(mods_information[mod.id]);
				}
				callback(new_mods);
			});
		} else {
			var new_mods = [];
			for (var i = 0; i < mods.length; i++) {
				var mod = mods[i];
				new_mods.push(mods_information[mod.id]);
			}
			callback(new_mods);
		}
	});
}

/**
 * Get information about a mods in a current modpack from the cache or request it from the modrinth
 */
function getModsInformation(callback) {
	getMods((mods) => {
		getModsFromCache(mods, callback);
	});
}
