import React from "react";
import Trend from "react-trend";
import TrendsActions from "../actions/TrendsActions";
import TrendsStore from "../stores/TrendsStore";

class TrendGraph extends React.Component {
	// CONSTRUCTOR
	constructor(props) {
		super(props);
		this.state = TrendsStore.getState();
		this.onChange = this.onChange.bind(this);
	}

	// COMPONENT DID MOUNT
	componentDidMount() {
		TrendsStore.listen(this.onChange);
		TrendsActions.loadHistory(this.props.id, 31);
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
		if (!this.state.history[this.props.id]) return null;

		return (
			<Trend
				data={this.state.history[this.props.id]}
				gradient={["#c9de96", "#8ab66b", "#398235"]}
				radius={5}
				strokeWidth={3}
				strokeLinecap={"round"}
			/>
		);
	}
}

export default TrendGraph;
