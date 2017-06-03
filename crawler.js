const cheerio = require("cheerio");
const request = require("request");
const MongoClient = require("mongodb").MongoClient;
const moment = require("moment");
const async = require("async");

const mongodbUrl = "mongodb://localhost:27017/npm";
MongoClient.connect(mongodbUrl, (err, db) => {
	var downloadsCol = db.collection("downloads");
	var packagesCol = db.collection("packages");

	// CALC PACKAGE TREND
	var calcPackageTrend = function(id, days, done) {
		downloadsCol
			.find(
				{
					"_id.pkg": id,
					"_id.date": {
						$lte: moment()
							.utc()
							.subtract(days, "days")
							.startOf("day")
							.toDate()
					}
				},
				{ sort: [["_id.date", 1]] }
			)
			.toArray((err, downloads_daysago) => {
				if (err || !downloads_daysago || downloads_daysago.length < 2) {
					return done(err, null);
				}

				// download history available
				var present = downloads_daysago[0].dl;
				var past = downloads_daysago[downloads_daysago.length - 1].dl;

				var growth =
					Math.pow(present / past, 1 / downloads_daysago.length) - 1;

				console.log(id, growth);

				packagesCol.updateOne(
					{
						_id: id
					},
					{
						$set: {
							trend: parseFloat(growth)
						},
						$unset: {
							trnd_3: true
						}
					},
					{ upsert: true },
					(err, results) => {
						return done(err, results);
					}
				);
			});
	};

	// STORE RECENTLY UPDATED
	function storeRecentlyUpdated() {
		console.log(new Date(), "storeRecentlyUpdated()");
		var packages = [];

		// fetch recently updated
		request(
			"https://www.npmjs.com/browse/updated",
			(error, response, body) => {
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
						packagesCol.insert(
							{
								_id: p,
								upt: new Date()
							},
							(err, result) => {
								return done();
							}
						);
					},
					err => {}
				);
			}
		);
	}

	// download newly updated packages every minute
	setInterval(storeRecentlyUpdated, 60000);
	storeRecentlyUpdated();

	// CHECK NEXT PACKAGE
	function checkNextPackage(callback) {
		// find some packages
		packagesCol
			.find({
				upt: {
					$lt: moment().utc().subtract(1, "h").toDate()
				}
			})
			.sort(["upt", 1])
			.limit(10)
			.toArray(function(err, packages) {
				if (err) return callback(err);

				async.each(
					packages,
					(pkg, ready) => {
						// download the npm download counts for today
						request(
							"https://www.npmjs.com/package/" + pkg._id,
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
									downloadsCol.updateOne(
										{
											_id: {
												pkg: pkg._id,
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
												packagejson = JSON.parse(body);
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
			});
	}

	async.forever(checkNextPackage, err => {
		console.error(err);
	});
});
