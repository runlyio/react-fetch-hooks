import { JSDOM } from "jsdom";

export default function() {
	// inspired by https://semaphoreci.com/community/tutorials/testing-react-components-with-enzyme-and-mocha

	beforeEach(function() {
		this.exposedProperties = ["document", "window", "navigator"];

		const dom = new JSDOM("<!DOCTYPE html><p>Hello world</p>");
		global.document = dom.window.document;

		global.window = dom.window;

		global.navigator = {
			userAgent: "node.js"
		};

		this.requests = [];

		global.fetch = (url, opts) =>
			new Promise((resolve, reject) => {
				this.requests.push({ ...opts, url, resolve, reject });
			});
	});

	afterEach(function() {
		this.exposedProperties.forEach(property => {
			delete global[property];
		});
	});
}
