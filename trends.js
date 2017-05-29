const MongoClient = require("mongodb").MongoClient;
const moment = require("moment");
const async = require("async");

const mongodbUrl = "mongodb://localhost:27017/npm";

// CALC PACKAGE TREND
var calcPackageTrend = function(id) {
	downloadsCol
		.find(
			{
				"_id.pkg": id,
				"_id.date": {
					$lte: moment()
						.utc()
						.subtract(31, "days")
						.startOf("day")
						.toDate()
				}
			},
			{ sort: [["_id.date", 1]] }
		)
		.toArray((err, downloads_daysago) => {
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
						trend: growth
					},
					$unset: {
						trnd_3: true
					}
				}
			);
		});
};

// open mongodb connection
MongoClient.connect(mongodbUrl, (err, db) => {
	// init collections
	global.downloadsCol = db.collection("downloads");
	global.packagesCol = db.collection("packages");

	packagesCol
		.find(
			{},
			{
				_id: true
			}
		)
		.toArray((err, pkgs) => {
			pkgs.map(p => {
				calcPackageTrend(p._id);
			});
		});
});
