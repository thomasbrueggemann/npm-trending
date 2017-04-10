var cheerio = require("cheerio");
var request = require("request");
var MongoClient = require("mongodb").MongoClient;

function storeRecentlyUpdated() {
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
        MongoClient.connect("mongodb://localhost:27017/npm", (err, db) => {
            var collection = db.collection("packages");

            // insert each package
            packages.map(p => {
                collection.insert(
                    {
                        _id: p,
                        upt: new Date()
                    },
                    (err, reuslt) => {}
                );

                return;
            });

            db.close();
        });
    });
}

// download newly updated packages every minute
setInterval(storeRecentlyUpdated, 60000);
storeRecentlyUpdated();
