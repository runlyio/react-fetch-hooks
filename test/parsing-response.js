import { expect } from "chai";

import { checkStatus } from "../src";

describe("Parsing Responses", function() {
	beforeEach(function() {
		this.result = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		})
			.then(checkStatus)
			.then(r => r.json());
	});

	describe("when parsing a 200-level response", function() {
		beforeEach(function() {
			this.resolve({
				status: 200,
				statusText: "OK",
				json: () =>
					new Promise(resolve =>
						resolve({
							username: "homer.simpson",
							age: 42
						})
					)
			});
		});

		it("should parse the response json as a successful result", function(done) {
			this.result.then(user => {
				expect(user).to.be.ok;
				expect(user.username).to.equal("homer.simpson");
				expect(user.age).to.equal(42);

				done();
			});
		});
	});

	describe("when parsing a non-200-level response", function() {
		function shouldRejectWithError(statusCode) {
			it("should reject the promise with an error", function(done) {
				this.result.catch(err => {
					expect(err).to.be.ok;
					expect(err).to.be.an("error");
					done();
				});
			});

			it("should include the original response with the error", function(done) {
				this.result.catch(err => {
					expect(err.response).to.be.ok;
					expect(err.response.status).to.equal(statusCode);
					done();
				});
			});
		}

		describe("with no error message or status text", function() {
			beforeEach(function() {
				this.resolve({ status: 404 });
			});

			shouldRejectWithError(404);

			it("should use a generic error message", function(done) {
				this.result.catch(err => {
					expect(err.message).to.equal("Request failed with status code 404");
					done();
				});
			});
		});

		describe("with an error message", function() {
			beforeEach(function() {
				this.resolve({
					status: 404,
					statusText: "Not Found",
					json: () =>
						new Promise(resolve =>
							resolve({
								message: "Couldn't find the dude, man"
							})
						)
				});
			});

			shouldRejectWithError(404);

			it("should parse the error message from the response", function(done) {
				this.result.catch(err => {
					expect(err.message).to.equal("Couldn't find the dude, man");
					done();
				});
			});
		});

		describe("with a pascal-cased error message", function() {
			beforeEach(function() {
				this.resolve({
					status: 400,
					statusText: "Bad Request",
					json: () =>
						new Promise(resolve =>
							resolve({
								Message: "shiitake mushrooms"
							})
						)
				});
			});

			shouldRejectWithError(400);

			it("should parse the error message from the response", function(done) {
				this.result.catch(err => {
					expect(err.message).to.equal("shiitake mushrooms");
					done();
				});
			});
		});

		describe("without an error message", function() {
			beforeEach(function() {
				this.resolve({
					status: 301,
					statusText: "Moved Permanently",
					json: () => new Promise(resolve => resolve({}))
				});
			});

			shouldRejectWithError(301);

			it("should use the status text as the error message", function(done) {
				this.result.catch(err => {
					expect(err.message).to.equal("Moved Permanently");
					done();
				});
			});
		});

		describe("with a .net exception message", function() {
			beforeEach(function() {
				this.resolve({
					status: 500,
					statusText: "Server Error",
					json: () =>
						new Promise(resolve =>
							resolve({
								message: "Invalid Operation",
								exceptionMessage:
									"Cannot do the thing you wanted to do because of some important reason.",
								exceptionType: "System.InvalidOperationException",
								stackTrace: "bla bla bla"
							})
						)
				});
			});

			shouldRejectWithError(500);

			it("should use the exception message as the error message", function(done) {
				this.result.catch(err => {
					expect(err.message).to.equal(
						"Cannot do the thing you wanted to do because of some important reason."
					);
					done();
				});
			});
		});

		describe("with a pascal-cased .net exception message", function() {
			beforeEach(function() {
				this.resolve({
					status: 500,
					statusText: "Server Error",
					json: () =>
						new Promise(resolve =>
							resolve({
								Message: "Invalid Operation",
								ExceptionMessage:
									"Cannot do the thing you wanted to do because of some important reason.",
								ExceptionType: "System.InvalidOperationException",
								StackTrace: "bla bla bla"
							})
						)
				});
			});

			shouldRejectWithError(500);

			it("should use the exception message as the error message", function(done) {
				this.result.catch(err => {
					expect(err.message).to.equal(
						"Cannot do the thing you wanted to do because of some important reason."
					);
					done();
				});
			});
		});

		describe("with a nested .net exception message", function() {
			beforeEach(function() {
				this.resolve({
					status: 500,
					statusText: "Server Error",
					json: () =>
						new Promise(resolve =>
							resolve({
								message: "Bad Thing Happened",
								exceptionMessage: "Some useless message",
								exceptionType: "System.InvocationException",
								stackTrace: "bla bla bla",
								innerException: {
									message: "One or more errors occurred",
									exceptionMessage: "Another useless message",
									exceptionType: "System.AggregateException",
									stackTrace: "bla bla bla",
									innerException: {
										message: "Invalid Operation",
										exceptionMessage:
											"Cannot do the thing you wanted to do because of some important reason.",
										exceptionType: "System.InvalidOperationException",
										stackTrace: "bla bla bla"
									}
								}
							})
						)
				});
			});

			shouldRejectWithError(500);

			it("should use the inner-most exception message as the error message", function(done) {
				this.result.catch(err => {
					expect(err.message).to.equal(
						"Cannot do the thing you wanted to do because of some important reason."
					);
					done();
				});
			});
		});

		describe("with a nested .net exception message with varying detail", function() {
			beforeEach(function() {
				this.resolve({
					status: 500,
					statusText: "Server Error",
					json: () =>
						new Promise(resolve =>
							resolve({
								message: "Bad Thing Happened",
								exceptionMessage: "Some useless message",
								exceptionType: "System.InvocationException",
								stackTrace: "bla bla bla",
								innerException: {
									message: "One or more errors occurred",
									exceptionMessage: "Another useless message",
									exceptionType: "System.AggregateException",
									stackTrace: "bla bla bla",
									innerException: {
										message: "Cannot do the thing",
										exceptionType: "System.InvalidOperationException",
										stackTrace: "bla bla bla"
									}
								}
							})
						)
				});
			});

			shouldRejectWithError(500);

			it("should use the inner-most exception message as the error message", function(done) {
				this.result.catch(err => {
					expect(err.message).to.equal("Cannot do the thing");
					done();
				});
			});
		});

		describe("with a nested malformed .net exception message", function() {
			beforeEach(function() {
				this.resolve({
					status: 500,
					statusText: "Server Error",
					json: () =>
						new Promise(resolve =>
							resolve({
								message: "Bad Thing Happened",
								exceptionMessage: "Some useless message",
								exceptionType: "System.InvocationException",
								stackTrace: "bla bla bla",
								innerException: {
									message: "One or more errors occurred",
									exceptionMessage: "Not a useless message",
									exceptionType: "System.AggregateException",
									stackTrace: "bla bla bla",
									innerException: {
										// no messages here
										exceptionType: "System.InvalidOperationException",
										stackTrace: "bla bla bla"
									}
								}
							})
						)
				});
			});

			shouldRejectWithError(500);

			it("should use the inner-most exception message as the error message", function(done) {
				this.result.catch(err => {
					expect(err.message).to.equal("Not a useless message");
					done();
				});
			});
		});
	});
});
