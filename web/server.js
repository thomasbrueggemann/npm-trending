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
const moment = require("moment");
const cache = require("apicache").middleware;
const mysql = require("mysql");
const fs = require("fs");

// open mysql connection pool
var pool = mysql.createPool({
	host: "mysql",
	user: "root",
	port: 3306,
	password: "npm2017",
	database: "npm-trending",
	connectionLimit: 100
});

// read queries
var trendingQuery = fs.readFileSync("./queries/trending.sql", "utf8");
var historyQuery = fs.readFileSync("./queries/history.sql", "utf8");

// config express
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
app.get("/trends", cache("5 minutes"), (req, res) => {
	// get mysql connection
	pool.getConnection((err, conn) => {
		// query for trends
		conn.query(trendingQuery, (error, results, fields) => {
			return res.send(results);
		});
	});
});

// TRENDS / :ID / DAYS / :DAYS
app.get("/trends/:id/days/:days", cache("1 hour"), (req, res) => {
	// get mysql connection
	pool.getConnection((err, conn) => {
		// query for history of a package
		conn.query(
			historyQuery,
			[parseInt(req.params.id), parseInt(req.params.days) * -1],
			(error, results, fields) => {
				// return the package id and download values
				return res.send({
					id: req.params.id,
					values: results.map(d => {
						return d.downloads;
					})
				});
			}
		);
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

// EXPRESS.JS
server.listen(app.get("port"), () => {
	console.log("NPM Trending server listening on port " + app.get("port"));
});
