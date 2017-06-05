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
		TrendsActions.loadTrends(7);
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
			<div className="container">

				<div className="row logo-row">
					<div className="col-md-2" />
					<div className="col-md-8">
						<img src="/img/logo.png" width="100%" />
					</div>
					<div className="col-md-2" />
				</div>

				{this.state.trends.map(t => {
					return <TrendItem key={t._id} item={t} />;
				})}
			</div>
		);
	}
}

export default Trends;
