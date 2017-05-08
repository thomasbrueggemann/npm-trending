var express = require("express");
var app = express();
var server = require("http").Server(app);
var path = require("path");
var bodyParser = require("body-parser");
var swig = require("swig");
var React = require("react");
var ReactDOM = require("react-dom/server");
var Router = require("react-router");
var RoutingContext = Router.RoutingContext;
var routes = require("./app/routes");

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
app.get("/trends", (req, res) => {});

// REACT.JS
app.use(function(req, res) {
	Router.match({ routes: routes, location: req.url }, function(
		err,
		redirectLocation,
		renderProps
	) {
		// error
		if (err) {
			return res.status(500).send(err.message);
		} else if (redirectLocation) {
			// redirect
			return res
				.status(302)
				.redirect(redirectLocation.pathname + redirectLocation.search);
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
	});
});

// EXPRESS.JS
server.listen(app.get("port"), function() {
	console.log("NPM Trending server listening on port " + app.get("port"));
});
