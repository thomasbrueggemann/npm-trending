const express = require("express");
const app = express();
const server = require("http").Server(app);
const path = require("path");
const bodyParser = require("body-parser");
const swig = require("swig");
const React = require("react");
const ReactDOM = require("react-dom/server");
const Router = require("react-router");
const RoutingContext = Router.RoutingContext;
const routes = require("./app/routes");
const mongodb = require("mongodb");
const moment = require("moment");

app.set("port", process.env.PORT || 3000);
app.use(
	bodyParser.json({
		limit: "20mb"
	})
);
app.use(
	bodyParser.urlencoded({
		extended: false
	})
);
app.use(express.static(path.join(__dirname, "public")));

// TRENDS
app.get("/trends", (req, res) => {
	// find trending packages
	packagesCol.find({}).sort({ trnd_3: -1 }).limit(25).toArray((err, pkgs) => {
		return res.send(pkgs);
	});
});

// TRENDS / :ID / DAYS / :DAYS
app.get("/trends/:id/days/:days", (req, res) => {
	var id = decodeURIComponent(req.params.id);

	downloadsCol
		.find({
			"_id.pkg": id,
			"_id.date": {
				$gte: moment()
					.utc()
					.subtract(parseInt(req.params.days), "days")
					.startOf("day")
					.toDate(),
				$lt: moment().utc().startOf("day").toDate()
			}
		})
		.sort({ "_id.date": 1 })
		.toArray((err, downloads) => {
			return res.send({
				_id: id,
				values: downloads.map(d => {
					return d.dl;
				})
			});
		});
});

// REACT.JS
app.use((req, res) => {
	Router.match(
		{ routes: routes, location: req.url },
		(err, redirectLocation, renderProps) => {
			// error
			if (err) {
				return res.status(500).send(err.message);
			} else if (redirectLocation) {
				// redirect
				return res
					.status(302)
					.redirect(
						redirectLocation.pathname + redirectLocation.search
					);
			} else if (renderProps) {
				// render
				var html = ReactDOM.renderToString(
					<RoutingContext {...renderProps} />
				);
				var page = swig.renderFile("views/index.html", { html: html });
				return res.status(200).send(page);
			} else {
				// not found
				return res.status(404).send("Page Not Found");
			}
		}
	);
});

// mongodb connect
mongodb.connect("mongodb://localhost:27017/npm", (err, db) => {
	if (err) throw err;

	global.downloadsCol = db.collection("downloads");
	global.packagesCol = db.collection("packages");

	// EXPRESS.JS
	server.listen(app.get("port"), () => {
		console.log("NPM Trending server listening on port " + app.get("port"));
	});
});
