import React from "react";
import { Route } from "react-router";
import App from "./components/App";
import Trends from "./components/Trends";

export default (
	<Route component={App}>
		<Route path="/" component={Trends} />
	</Route>
);
