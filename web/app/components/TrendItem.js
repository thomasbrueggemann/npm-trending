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
								id={this.props.item.id}
								setDownloads={this.setDownloads.bind(this)}
							/>
						</div>
						<div className="col-md-1">
							<span className="counter">
								#{this.props.idx + 1}
							</span>
						</div>
						<div className="col-md-7">
							<h2>
								<a
									href={
										"https://npmjs.com/" +
										this.props.item.name
									}
									target="_blank"
								>
									{this.props.item.name}
								</a>
							</h2>
							<p>
								{this.props.item.description}
							</p>
							<small>
								<i className="fa fa-code-fork" />{" "}
								{this.props.item.version}
								<span className="distancer" />
								<i className="fa fa-download" />{" "}
								{this.state.downloads}
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
