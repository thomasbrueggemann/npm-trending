import React from "react";
import TrendGraph from "./TrendGraph";

class TrendItem extends React.Component {
	// CONSTRUCTOR
	constructor(props) {
		super(props);
	}

	// COMPONENT DID MOUNT
	componentDidMount() {}

	// COMPONENT WILL UNMOUNT
	componentWillUnmount() {}

	// RENDER
	render() {
		return (
			<div className="columns">

				<div className="column">
					<TrendGraph id={this.props.item._id} />
				</div>
				<div className="column">
					<h2>
						<a
							href={"https://npmjs.com/" + this.props.item._id}
							target="_blank"
						>
							{this.props.item._id}
						</a>
					</h2>
					<p>{this.props.item.desc}</p>
					<small>
						<i className="fa fa-code-fork" /> {this.props.item.ver}
					</small>
				</div>
			</div>
		);
	}
}

export default TrendItem;
