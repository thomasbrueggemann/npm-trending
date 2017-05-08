import alt from "../alt";
import axios from "axios";

class TrendsActions {
	constructor() {
		this.generateActions(
			"getTrendsSuccess",
			"getTrendsFail",
			"getHistorySuccess",
			"getHistoryFail"
		);
	}

	// LOAD TRENDS
	loadTrends() {
		// download trend info
		axios({
			method: "get",
			url: "/trends"
		})
			.then(this.actions.getTrendsSuccess)
			.catch(this.actions.getTrendsFail);
	}

	loadHistory(id, days) {
		// download trend info
		axios({
			method: "get",
			url: "/trends/" + encodeURIComponent(id) + "/days/" + days
		})
			.then(this.actions.getHistorySuccess)
			.catch(this.actions.getHistoryFail);
	}
}

export default alt.createActions(TrendsActions);
