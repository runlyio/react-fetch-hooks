import { expect } from "chai";

import { extractErrorMessage } from "../src";

// see the parsing-response test cases for more in-depth testing of this function

describe("Extracting Error Messages", function() {
	it("should extract the error message from data", function() {
		const msg = extractErrorMessage({
			message: "woah"
		});

		expect(msg).to.equal("woah");
	});

	it("should not extract the error message from nothing", function() {
		const msg = extractErrorMessage();
		expect(msg).to.not.be.ok;
	});

	it("should not extract the error message from null", function() {
		const msg = extractErrorMessage(null);
		expect(msg).to.not.be.ok;
	});

	it("should not extract the error message from empty string", function() {
		const msg = extractErrorMessage("");
		expect(msg).to.equal("");
	});

	it("should just return string as the error message", function() {
		const msg = extractErrorMessage("oh, hai");
		expect(msg).to.equal("oh, hai");
	});

	it("should not extract the error message from empty object", function() {
		const msg = extractErrorMessage({});
		expect(msg).to.not.be.ok;
	});
});
