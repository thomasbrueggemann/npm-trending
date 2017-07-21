const cheerio = require("cheerio");
const request = require("request");
const mysql = require("mysql");
const moment = require("moment");
const async = require("async");
const fs = require("fs");

// open mysql connection
var connection = mysql.createConnection({
	host: "mysql",
	user: "root",
	port: 3306,
	password: "npm2017",
	database: "npm-trending",
	multipleStatements: true
});
connection.connect();

// read init.sql
fs.readFile("init.sql", "utf8", function(err, data) {
	if (!err) {
		connection.query(data, function(err, results) {
			if (!err) {
				startCrawling();
			} else {
				throw err;
			}
		});
	}
});

// STORE RECENTLY UPDATED
function storeRecentlyUpdated() {
	console.log(new Date(), "storeRecentlyUpdated()");
	var packages = [];

	// fetch recently updated
	request("https://www.npmjs.com/browse/updated", (error, response, body) => {
		// the request has a valid response
		if (response && response.statusCode === 200 && response.body) {
			// parse html with cheerio
			var $ = cheerio.load(response.body);

			$("a[class='name']").each((i, a) => {
				var href = $(a).attr("href");
				if (href.indexOf("/package/") === 0) {
					packages.push(href.replace("/package/", ""));
				}
			});
		}

		// insert each package
		async.each(
			packages,
			(p, done) => {
				// insert new package
				connection.query(
					"INSERT IGNORE INTO packages SET ?",
					{
						name: p,
						lastUpdate: null
					},
					function(error, results, fields) {
						return done();
					}
				);
			},
			err => {}
		);
	});
}

// CHECK NEXT PACKAGE
function checkNextPackage(callback) {
	// find some packages that have not been updated in 1 hour ordered by their update time
	connection.query(
		"SELECT id, name FROM packages WHERE lastUpdate + INTERVAL 1 HOUR <= NOW() OR lastUpdate IS NULL ORDER BY lastUpdate ASC LIMIT 10",
		function(err, packages, fields) {
			if (err) return callback(err);

			async.each(
				packages,
				(pkg, ready) => {
					// download the npm download counts for today
					request(
						"https://www.npmjs.com/package/" + pkg.name,
						(error, response, body) => {
							// the request has a valid response
							if (
								response &&
								response.statusCode === 200 &&
								response.body
							) {
								// parse html with cheerio
								var $ = cheerio.load(response.body);

								var count = $(".daily-downloads")
									.text()
									.replace(/[^\d]/g, "");

								// store download count
								if (count && count.length > 0) {
									connection.query(
										"INSERT INTO downloads (package, downloads, day) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE downloads=?",
										[
											pkg.id,
											parseInt(count),
											moment()
												.utc()
												.startOf("day")
												.toDate(),
											parseInt(count)
										]
									);

									// update the update date on the package
									connection.query(
										"UPDATE packages SET lastUpdate=? WHERE id=?",
										[moment().utc().toDate(), pkg.id]
									);
								}

								// download package config
								request(
									"https://unpkg.com/" +
										pkg.name +
										"/package.json",
									(error, response, body) => {
										var packagejson = null;
										if (
											!error &&
											response.statusCode === 200
										) {
											try {
												packagejson = JSON.parse(body);
											} catch (e) {}
										}

										if (packagejson !== null) {
											connection.query(
												"UPDATE packages SET description=?, version=?, keywords=? WHERE id=?",
												[
													packagejson.description,
													packagejson.version,
													packagejson.keywords
														? Array.isArray(
																packagejson.keywords
															)
															? packagejson.keywords.join(
																	","
																)
															: packagejson.keywords
														: null,
													pkg.id
												]
											);

											// store dependencies
											if ("dependencies" in packagejson) {
												for (var d in Object.keys(
													packagejson.dependencies
												)) {
													connection.query(
														"INSERT IGNORE INTO packages SET ?",
														{
															name: Object.keys(
																packagejson.dependencies
															)[d],
															lastUpdate: null
														}
													);
												}
											}
										}
									}
								);

								console.log(
									new Date(),
									"checkNextPackage(" + pkg.name + ") -> ",
									parseInt(count)
								);
							} else if (
								!response ||
								response.statusCode === 404 ||
								response.statusCode === 400
							) {
								// remove the package, because it apparently does not exist anymore
								connection.query(
									"DELETE FROM packages WHERE id=?",
									[pkg.id]
								);
							}

							return ready();
						}
					);
				},
				err => {
					return callback();
				}
			);
		}
	);
}

function startCrawling() {
	// download newly updated packages every minute
	setInterval(storeRecentlyUpdated, 60000);
	storeRecentlyUpdated();

	async.forever(checkNextPackage, err => {
		console.error(err);
	});
}
