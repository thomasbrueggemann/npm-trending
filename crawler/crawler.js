const cheerio = require("cheerio");
const request = require("request");
const mysql = require("mysql");
const moment = require("moment");
const async = require("async");

// open mysql connection
var connection = mysql.createConnection({
	host: "localhost",
	user: "root",
	port: 8889,
	password: "root",
	database: "npm-trending"
});
connection.connect();

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

		// store in mongodb

		// insert each package
		async.each(
			packages,
			(p, done) => {
				// insert new package
				var query = connection.query(
					"INSERT INTO packages SET ?",
					{
						name: p,
						lastUpdate: new Date()
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

// download newly updated packages every minute
setInterval(storeRecentlyUpdated, 60000);
storeRecentlyUpdated();

// CHECK NEXT PACKAGE
function checkNextPackage(callback) {
	// find some packages
	connection.query(
		"SELECT name FROM packages WHERE lastUpdate + INTERVAL 1 HOUR <= NOW() LIMIT 10;",
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
								// https://stackoverflow.com/a/4205207/874508
								var query = connection.query(
									"UPDATE downloads SET ?",
									{
										package: pkg.id,
										downloads: parseInt(count),
										day: new Date()
									}
								);

								downloadsCol.updateOne(
									{
										_id: {
											pkg: pkg.name,
											date: moment()
												.utc()
												.startOf("day")
												.toDate()
										}
									},
									{
										$set: {
											dl: parseInt(count)
										}
									},
									{
										upsert: true
									}
								);

								// update the update date on the package
								packagesCol.updateOne(
									{
										_id: pkg._id
									},
									{
										$set: {
											upt: new Date()
										}
									}
								);

								// download package config
								request(
									"https://unpkg.com/" +
										pkg._id +
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
											packagesCol.updateOne(
												{
													_id: pkg._id
												},
												{
													$set: {
														desc:
															packagejson.description,
														ver:
															packagejson.version,
														keys:
															packagejson.keywords
													},
													$unset: {
														pkg: true
													}
												},
												(err, result) => {
													// store dependencies
													if (
														"dependencies" in
														packagejson
													) {
														for (var d in Object.keys(
															packagejson.dependencies
														)) {
															packagesCol.insert(
																{
																	_id: Object.keys(
																		packagejson.dependencies
																	)[d],
																	upt: new Date()
																},
																(
																	err,
																	result
																) => {}
															);
														}
													}
												}
											);
										}
									}
								);

								console.log(
									new Date(),
									"checkNextPackage(" + pkg._id + ") -> ",
									parseInt(count)
								);

								// calculate the "trend" of the last 3 days
								calcPackageTrend(pkg._id, 3, () => {
									return ready();
								});
							} else if (
								!response ||
								response.statusCode === 404 ||
								response.statusCode === 400
							) {
								// remove the package, because it apparently does not exist anymore
								packagesCol.deleteOne({
									_id: pkg._id
								});

								return ready();
							}
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

/*async.forever(checkNextPackage, err => {
	console.error(err);
});*/
