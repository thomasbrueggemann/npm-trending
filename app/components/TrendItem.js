import React from "react";
import TrendItemGraph from "./TrendItemGraph";

class TrendItem extends React.Component {
	// CONSTRUCTOR
	constructor(props) {
		super(props);

		this.state = {
			downloads: 0
		};
	}

	// COMPONENT DID MOUNT
	componentDidMount() {}

	// COMPONENT WILL UNMOUNT
	componentWillUnmount() {}

	// SET DOWNLOADS
	setDownloads(d) {
		this.setState({
			downloads: parseInt(d)
		});
	}

	// RENDER
	render() {
		return (
			<div className="row trend-row">
				<div className="col-md-2" />
				<div className="col-md-8">

					<div className="row inner-trend-row">
						<div className="col-md-4">
							<TrendItemGraph
								id={this.props.item._id}
								setDownloads={this.setDownloads.bind(this)}
							/>
						</div>
						<div className="col-md-8">
							<h2>
								<a
									href={
										"https://npmjs.com/" +
										this.props.item._id
									}
									target="_blank"
								>
									{this.props.item._id}
								</a>
							</h2>
							<p>{this.props.item.desc}</p>
							<small>
								<i className="fa fa-code-fork" />
								{" "}{this.props.item.ver}
								<span className="distancer" />
								<i className="fa fa-download" />
								{" "}{this.state.downloads}
							</small>
						</div>
					</div>
				</div>
				<div className="col-md-2" />
			</div>
		);
	}
}

export default TrendItem;
