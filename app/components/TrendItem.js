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
			<div>
				<TrendGraph id={this.props.item._id} />
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
		);
	}
}

export default TrendItem;
