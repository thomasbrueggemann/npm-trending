import React from "react";
import TrendsActions from "../actions/TrendsActions";
import TrendsStore from "../stores/TrendsStore";
import TrendItem from "./TrendItem";

class Trends extends React.Component {
	// CONSTRUCTOR
	constructor(props) {
		super(props);
		this.state = TrendsStore.getState();
		this.onChange = this.onChange.bind(this);
	}

	// COMPONENT DID MOUNT
	componentDidMount() {
		TrendsStore.listen(this.onChange);
		TrendsActions.loadTrends();
	}

	// COMPONENT WILL UNMOUNT
	componentWillUnmount() {
		TrendsStore.unlisten(this.onChange);
	}

	// ON CHANGE
	onChange(state) {
		this.setState(state);
	}

	// RENDER
	render() {
		if (!this.state.trends) return null;

		return (
			<div>
				{this.state.trends.map(t => {
					return <TrendItem key={t._id} item={t} />;
				})}
			</div>
		);
	}
}

export default Trends;
