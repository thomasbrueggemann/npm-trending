const cheerio = require("cheerio");
const request = require("request");
const MongoClient = require("mongodb").MongoClient;
const moment = require("moment");
const async = require("async");

const mongodbUrl = "mongodb://localhost:27017/npm";

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
        // open mongodb connection
        MongoClient.connect(mongodbUrl, (err, db) => {
            var collection = db.collection("packages");

            // insert each package
            async.each(
                packages,
                (p, done) => {
                    // download package config
                    request(
                        "https://unpkg.com/" + p + "/package.json",
                        (error, response, body) => {
                            var pkg = null;
                            if (!error && response.statusCode === 200 && body) {
                                pkg = JSON.parse(body);
                            }

                            collection.insert(
                                {
                                    _id: p,
                                    upt: new Date(),
                                    pkg: pkg
                                },
                                (err, result) => {
                                    return done();
                                }
                            );
                        }
                    );
                },
                err => {
                    db.close();
                }
            );
        });
    });
}

// download newly updated packages every minute
setInterval(storeRecentlyUpdated, 60000);
storeRecentlyUpdated();

// CHECK NEXT PACKAGE
function checkNextPackage(callback) {
    MongoClient.connect(mongodbUrl, (err, db) => {
        var downloadsCol = db.collection("downloads");
        var packagesCol = db.collection("packages");

        // find some packages
        packagesCol
            .find({
                upt: {
                    $lt: moment().utc().subtract(1, "h").toDate()
                }
            })
            .sort(["upt", 1])
            .limit(1)
            .toArray(function(err, packages) {
                if (err) return callback(err);

                var pkg = packages[0];

                // download the npm download counts for today
                request(
                    "https://www.npmjs.com/package/" + pkg._id,
                    (error, response, body) => {
                        console.log(error, response.statusCode);

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
                                        date: moment().startOf("day").toDate()
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

                            console.log(
                                new Date(),
                                "checkNextPackage(" + pkg._id + ") -> ",
                                parseInt(count)
                            );
                        } else if (response.statusCode === 404) {
                            // remove the package, because it apparently does not exist anymore
                            packagesCol.deleteOne({
                                _id: pkg._id
                            });
                        }

                        return callback();
                    }
                );
            });
    });
}

function downloadMissingPackageFiles(callback) {
    MongoClient.connect(mongodbUrl, (err, db) => {
        var collection = db.collection("packages");

        collection
            .find({ pkg: { $exists: false } })
            .limit(10)
            .toArray((err, packages) => {
                async.each(
                    packages,
                    (p, done) => {
                        // download package config
                        request(
                            "https://unpkg.com/" + p._id + "/package.json",
                            (error, response, body) => {
                                console.log(err, response.statusCode);

                                var pkg = null;
                                if (
                                    !error &&
                                    response.statusCode === 200 &&
                                    body
                                ) {
                                    pkg = JSON.parse(body);
                                }

                                collection.updateOne(
                                    {
                                        _id: p._id
                                    },
                                    {
                                        $set: {
                                            pkg: pkg
                                        }
                                    },
                                    (err, result) => {
                                        return done();
                                    }
                                );
                            }
                        );
                    },
                    err => {
                        db.close();
                        return callback();
                    }
                );
            });
    });
}

async.forever(checkNextPackage, err => {
    console.error(err);
});

async.forever(downloadMissingPackageFiles, err => {
    console.error(err);
});
