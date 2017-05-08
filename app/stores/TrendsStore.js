import alt from "../alt";
import TrendsActions from "../actions/TrendsActions";

class TrendsStore {
	constructor() {
		this.bindActions(TrendsActions);
		this.trends = [];
		this.history = {};
	}

	// GET TRENDS SUCCESS
	getTrendsSuccess(result) {
		console.log(result);
		this.trends = result.data;
	}

	// GET TRENDS FAIL
	getTrendsFail(err) {
		console.error(err);
	}

	// GET HISTORY SUCCESS
	getHistorySuccess(result) {
		console.log(result);
		this.history[result.data._id] = result.data.values;
	}

	// GET HISTORY FAIL
	getHistoryFail(err) {
		console.error(err);
	}
}

export default alt.createStore(TrendsStore);
