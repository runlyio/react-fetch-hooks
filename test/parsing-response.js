import { expect } from "chai";
import behavesLikeBrowser from "./behaves-like-browser";

import { renderHook } from "@testing-library/react-hooks";

import { useFetch } from "../src";

describe("Parsing Responses", function() {
	behavesLikeBrowser();

	beforeEach(function(done) {
		const r = renderHook(() => useFetch("https://example.com/"));
		this.result = r.result;
		this.rerender = r.rerender;

		setTimeout(done, 10);
	});

	describe("when parsing a 200-level response", function() {
		beforeEach(function(done) {
			this.requests.pop().resolve({
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

			setTimeout(done, 10);
		});

		it("should parse the response json as a successful result", function() {
			const { body } = this.result.current;

			expect(body).to.be.ok;
			expect(body.username).to.equal("homer.simpson");
			expect(body.age).to.equal(42);
		});
	});

	describe("when parsing a non-200-level response", function() {
		function shouldRejectWithError() {
			it("should return an error", function() {
				const { error } = this.result.current;
				expect(error).to.be.ok;
				expect(error).to.be.an("error");
			});

			it("should include the original response with the error", function() {
				const { error } = this.result.current;
				expect(error.response).to.equal(this.response);
			});
		}

		describe("with no error message or status text", function() {
			beforeEach(function(done) {
				this.response = { status: 404 };
				this.requests.pop().resolve(this.response);
				setTimeout(done, 10);
			});

			shouldRejectWithError();

			it("should use a generic error message", function() {
				const { error } = this.result.current;
				expect(error.message).to.equal("Request failed with status code 404");
			});
		});

		describe("with an error message", function() {
			beforeEach(function(done) {
				this.response = {
					status: 404,
					statusText: "Not Found",
					json: () =>
						new Promise(resolve =>
							resolve({
								message: "Couldn't find the dude, man"
							})
						)
				};
				this.requests.pop().resolve(this.response);

				setTimeout(done, 10);
			});

			shouldRejectWithError();

			it("should parse the error message from the response", function() {
				const { error } = this.result.current;
				expect(error.message).to.equal("Couldn't find the dude, man");
			});
		});

		describe("with a pascal-cased error message", function() {
			beforeEach(function(done) {
				this.response = {
					status: 400,
					statusText: "Bad Request",
					json: () =>
						new Promise(resolve =>
							resolve({
								Message: "shiitake mushrooms"
							})
						)
				};
				this.requests.pop().resolve(this.response);

				setTimeout(done, 10);
			});

			shouldRejectWithError();

			it("should parse the error message from the response", function() {
				const { error } = this.result.current;
				expect(error.message).to.equal("shiitake mushrooms");
			});
		});

		describe("without an error message", function() {
			beforeEach(function(done) {
				this.response = {
					status: 301,
					statusText: "Moved Permanently",
					json: () => new Promise(resolve => resolve({}))
				};
				this.requests.pop().resolve(this.response);

				setTimeout(done, 10);
			});

			shouldRejectWithError();

			it("should use the status text as the error message", function() {
				const { error } = this.result.current;
				expect(error.message).to.equal("Moved Permanently");
			});
		});

		describe("with a .net exception message", function() {
			beforeEach(function(done) {
				this.response = {
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
				};
				this.requests.pop().resolve(this.response);

				setTimeout(done, 10);
			});

			shouldRejectWithError();

			it("should use the exception message as the error message", function() {
				const { error } = this.result.current;
				expect(error.message).to.equal(
					"Cannot do the thing you wanted to do because of some important reason."
				);
			});
		});

		describe("with a pascal-cased .net exception message", function() {
			beforeEach(function(done) {
				this.response = {
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
				};
				this.requests.pop().resolve(this.response);

				setTimeout(done, 10);
			});

			shouldRejectWithError();

			it("should use the exception message as the error message", function() {
				const { error } = this.result.current;
				expect(error.message).to.equal(
					"Cannot do the thing you wanted to do because of some important reason."
				);
			});
		});

		describe("with a nested .net exception message", function() {
			beforeEach(function(done) {
				this.response = {
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
				};
				this.requests.pop().resolve(this.response);

				setTimeout(done, 10);
			});

			shouldRejectWithError();

			it("should use the inner-most exception message as the error message", function() {
				const { error } = this.result.current;
				expect(error.message).to.equal(
					"Cannot do the thing you wanted to do because of some important reason."
				);
			});
		});

		describe("with a nested .net exception message with varying detail", function() {
			beforeEach(function(done) {
				this.response = {
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
				};
				this.requests.pop().resolve(this.response);

				setTimeout(done, 10);
			});

			shouldRejectWithError();

			it("should use the inner-most exception message as the error message", function() {
				const { error } = this.result.current;
				expect(error.message).to.equal("Cannot do the thing");
			});
		});

		describe("with a nested malformed .net exception message", function() {
			beforeEach(function(done) {
				this.response = {
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
				};
				this.requests.pop().resolve(this.response);

				setTimeout(done, 10);
			});

			shouldRejectWithError();

			it("should use the inner-most exception message as the error message", function() {
				const { error } = this.result.current;
				expect(error.message).to.equal("Not a useless message");
			});
		});
	});
});
