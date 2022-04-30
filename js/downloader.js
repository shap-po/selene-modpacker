/*
This script contains the logic for the downloader.
Used tools:
+ JSZip (https://github.com/Stuk/jszip)
+ JSZipUtils (https://github.com/Stuk/jszip-utils)
+ FileSaver (https://github.com/eligrey/FileSaver.js)
*/

var Promise = window.Promise;
if (!Promise) {
	Promise = JSZip.external.Promise;
}

/**
 * Fetch the content and return the associated promise.
 * @param {String} url the url of the content to fetch.
 * @return {Promise} the promise containing the data.
 */
function urlToPromise(url) {
	return new Promise(function (resolve, reject) {
		JSZipUtils.getBinaryContent(url, function (err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
}

/**
 * Find a valid version of a mod; this function exists to support quilt modloader.
 * @param {object} response - The response from the server where to find the mod
 * @param {string} modpack - The modpack
 * @param {function} versionFinder - The function to find the version
 * @return {int} - Index of the mod in the modpack
 */
function findVersion(response, modpack, versionFinder) {
	var downloadIndex = versionFinder(response, modpack, modpack.modloader);
	if (downloadIndex === -1 && modpack.modloader === "quilt") {
		// quilt has a fabric support so we can try to find a compatible version for it
		return versionFinder(response, modpack, "fabric");
	}
	return downloadIndex;
}
function modrinthVersionFinder(response, modpack, modloader) {
	return response.findIndex((element) => {
		if (
			element.game_versions.includes(modpack.version) &&
			element.loaders.includes(modloader)
		) {
			return true;
		}
	});
}
function curseforgeVersionFinder(response, modpack, modloader) {
	if (modpack.version.split(".").length === 3) {
		var version_major = modpack.version.split(".").splice(0, 2).join(".");
	}
	return response.findIndex((element) => {
		var game_versions = element.gameVersion.map((v) => v.toLowerCase());
		if (
			(game_versions.includes(modpack.version) ||
				(version_major && game_versions.includes(version_major))) &&
			game_versions.includes(modloader) //forge is stupid and stores the version and the modloader in the same field
		) {
			return true;
		}
	});
}

/**
 * Get download urls for a modpack
 * @param {object} modpack - The modpack to get the urls for
 */
function getUrls(modpack, callback) {
	var promises = [];
	var to_request = [];

	for (var i = 0; i < modpack.mods.length; i++) {
		var mod = modpack.mods[i];
		if (mod.enabled === false) {
			continue;
		}
		to_request.push(mod);
		if (mod.provider === "modrinth") {
			promises.push(
				fetch(`https://api.modrinth.com/v2/project/${mod.id}/version`)
					.then((value) => value.json())
					.then((response) => {
						//find valid version
						var downloadIndex = findVersion(
							response,
							modpack,
							modrinthVersionFinder
						);
						if (downloadIndex === -1) {
							return;
						}
						var modFiles = response[downloadIndex].files;
						if (modFiles.length === 0) {
							return;
						}
						var urls = [];
						for (var j = 0; j < modFiles.length; j++) {
							urls.push({
								url: modFiles[j].url,
								filename: modFiles[j].filename,
							});
						}
						return urls;
					})
					.catch((e) => {
						console.log(e);
						return;
					})
			);
		} else if (mod.provider === "curseforge") {
			promises.push(
				fetch(`https://curse.nikky.moe/api/addon/${mod.id}/files`)
					.then((value) => value.json())
					.then((response) => {
						//sort response array by date because curseforge is dumb and doesn't sort it for us
						response.sort(function (a, b) {
							return new Date(b.fileDate) - new Date(a.fileDate);
						});

						var downloadIndex = findVersion(
							response,
							modpack,
							curseforgeVersionFinder
						);
						if (downloadIndex === -1) {
							return;
						}
						var urls = [];
						urls.push({
							url: response[downloadIndex].downloadUrl,
							filename: response[downloadIndex].fileName,
						});
						//here may be added support for dependencies
						return urls;
					})
					.catch((e) => {
						console.log(e);
						return;
					})
			);
		}
	}
	Promise.all(promises).then((values) => {
		var urls = [];
		var errors = [];
		for (var i = 0; i < values.length; i++) {
			if (values[i] !== undefined && values[i].length > 0) {
				urls = urls.concat(values[i]);
			} else {
				errors.push(to_request[i]);
			}
		}
		callback({ urls: urls, errors: errors });
	});
}
/**
 * Download a modpack
 * @param {object} modpack - The modpack to download
 */
function downloadModpack(modpack, callback = () => {}) {
	document.getElementById("download-container").style = `
		opacity: 1;
		height: auto;
		display: block;
	`;
	var progressBar = document.getElementById("download-bar");
	var statusBar = document.getElementById("download-status");
	progressBar.style.width = "0%";
	statusBar.innerHTML = "Getting mods data...";
	getUrls(modpack, function (response) {
		var urls = response.urls;
		var errors = response.errors;
		//get information about failed mods
		getModsFromCache(errors, function (errors_info) {
			console.log(errors_info);
			var errors_info_array = [];
			for (var i = 0; i < errors_info.length; i++) {
				errors_info_array.push(errors_info[i].title);
			}

			if (urls.length === 0) {
				if (errors.length > 0) {
					statusBar.innerHTML = "All mods raised an error";
					return;
				} else {
					statusBar.innerHTML = "There is nothing to download";
					return;
				}
			}
			var zip = new JSZip();
			var fileName = modpack.name.replace(/[\\\/\:\*\?\"\<\>\|]/g, "");
			for (var i = 0; i < urls.length; i++) {
				zip.file(urls[i].filename, urlToPromise(urls[i].url));
			}
			zip.file(
				`${fileName}.json`,
				new Blob([JSON.stringify(modpack, null, 4)], {
					type: "application/json",
				})
			);
			if (errors.length > 0) {
				var error_file_info = [];
				for (var i = 0; i < errors.length; i++) {
					error_file_info.push({
						name: errors_info[i].title,
						url: errors_info[i].url,
					});
				}
				zip.file(
					"errors.json",
					new Blob([JSON.stringify(error_file_info, null, 4)]),
					{ type: "application/json" }
				);
			}
			statusBar.innerHTML = "Downloading mods...";
			zip.generateAsync({ type: "blob" }, (metadata) => {
				progressBar.style.width = `${metadata.percent.toFixed(2)}%`;
			})
				.then((content) => {
					if (errors.length > 0) {
						statusBar.innerHTML = `Download finished; Failed to download: ${errors_info_array.join(
							", "
						)}`;
						//highlight failed mods
						for (var i = 0; i < errors.length; i++) {
							var mod_elements = getModElements(errors[i].id);
							for (var j = 0; j < mod_elements.length; j++) {
								mod_elements[j].classList.add("failed");
							}
						}
					} else {
						statusBar.innerHTML = "Download finished";
					}
					saveAs(content, `${fileName}.zip`);
					callback();
				})
				.catch((e) => {
					console.log(e);
					statusBar.innerHTML = "Download failed";
				});
		});
	});
}
