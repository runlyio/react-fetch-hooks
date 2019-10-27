import { expect } from "chai";
import behavesLikeBrowser from "./behaves-like-browser";

import { renderHook } from "@testing-library/react-hooks";

import { useFetch, useLazyFetch } from "../src";

describe("Using fetch hook", function() {
	behavesLikeBrowser();

	describe("when rendering a component with just a URL", function() {
		beforeEach(function(done) {
			const r = renderHook(() => useFetch("http://example.com/api/bananas/"));
			this.result = r.result;
			this.rerender = r.rerender;

			setTimeout(done, 10);
		});

		it("should make a fetch API request", function() {
			expect(this.requests.length).to.equal(1);
			expect(this.requests[0].url).to.equal("http://example.com/api/bananas/");
		});

		it("should set default accept & content headers", function() {
			const req = this.requests[0];

			expect(req.headers).to.be.ok;
			expect(Object.keys(req.headers)).to.have.lengthOf(2);

			expect(req.headers["Accept"]).to.equal("application/json");
			expect(req.headers["Content-Type"]).to.equal("application/json");
		});

		it("should indicate the body is fetching", function() {
			expect(this.result.current).to.be.ok;

			const { isFetching, isFetched, error, body } = this.result.current;

			expect(isFetching).to.be.true;
			expect(isFetched).to.be.false;
			expect(error).to.not.be.ok;

			expect(body).to.not.be.ok;
		});

		describe("with a successful server response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					headers: {
						"Content-Type": "application/json"
					},
					json: async () => ["ripe banana", "green banana"]
				});

				setTimeout(done, 10);
			});

			it("should return results as loaded", function() {
				expect(this.result.current).to.be.ok;

				const { isFetching, isFetched, error, body } = this.result.current;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.true;
				expect(error).to.not.be.ok;

				expect(body).to.be.ok;
				expect(body).to.have.lengthOf(2);
				expect(body[0]).to.equal("ripe banana");
				expect(body[1]).to.equal("green banana");
			});

			it("should return with headers and body", function() {
				const current = this.result.current;

				expect(current.headers).to.exist;
				expect(current.body).to.exist;
				expect(current.headers).to.deep.equal({
					"Content-Type": "application/json"
				});
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function(done) {
					this.rerender({ hello: "world" });

					setTimeout(done, 10);
				});

				it("should not make another fetch API request", function() {
					expect(this.requests.length).to.equal(0);
				});
			});
		});

		describe("with a failure server response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 500,
					statusText: "OK",
					json: async () => ({
						message: "Not today, buddy"
					})
				});

				setTimeout(done, 10);
			});

			it("should return results as errored", function() {
				expect(this.result.current).to.be.ok;

				const { isFetching, isFetched, error, body } = this.result.current;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.false;

				expect(error).to.be.ok;
				expect(error).to.be.an("error");

				expect(error.message).to.equal("Not today, buddy");
				expect(error.response).to.be.ok;
				expect(error.response.status).to.equal(500);

				expect(body).to.not.be.ok;
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function(done) {
					this.rerender({ hello: "world" });

					setTimeout(done, 10);
				});

				it("should not make another fetch API request", function() {
					expect(this.requests.length).to.equal(0);
				});
			});
		});
	});

	describe("when rendering a component with a parameterized URL", function() {
		beforeEach(function(done) {
			const r = renderHook(
				({ id }) =>
					useFetch({
						url: `http://example.com/api/bananas/${id}`
					}),
				{ initialProps: { id: 4 } }
			);
			this.result = r.result;
			this.rerender = r.rerender;

			setTimeout(done, 10);
		});

		it("should make a fetch API request", function() {
			expect(this.requests.length).to.equal(1);
			expect(this.requests[0].url).to.equal("http://example.com/api/bananas/4");
		});

		it("should return results as fetching", function() {
			expect(this.result.current).to.be.ok;

			const { isFetching, isFetched, error, body } = this.result.current;

			expect(isFetching).to.be.true;
			expect(isFetched).to.be.false;
			expect(error).to.not.be.ok;

			expect(body).to.not.be.ok;
		});

		describe("with a successful server response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: async () => ["ripe banana", "green banana"]
				});

				setTimeout(done, 10);
			});

			it("should return results as fetched", function() {
				expect(this.result.current).to.be.ok;

				const { isFetching, isFetched, error, body } = this.result.current;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.true;
				expect(error).to.not.be.ok;

				expect(body).to.be.ok;
				expect(body).to.have.lengthOf(2);
				expect(body[0]).to.equal("ripe banana");
				expect(body[1]).to.equal("green banana");
			});

			describe("and then setting a keyed prop on the component", function() {
				beforeEach(function(done) {
					this.rerender({ id: 69 });

					setTimeout(done, 10);
				});

				it("should make another fetch API request", function() {
					expect(this.requests.length).to.equal(1);
					expect(this.requests[0].url).to.equal(
						"http://example.com/api/bananas/69"
					);
				});

				it("should return results as fetching and still pass previously loaded body", function() {
					expect(this.result.current).to.be.ok;

					const { isFetching, isFetched, error, body } = this.result.current;

					expect(isFetching).to.be.true;
					expect(isFetched).to.be.true;
					expect(error).to.not.be.ok;

					expect(body).to.be.ok;
					expect(body).to.have.lengthOf(2);
					expect(body[0]).to.equal("ripe banana");
					expect(body[1]).to.equal("green banana");
				});

				describe("with another successful server response", function() {
					beforeEach(function(done) {
						this.requests.pop().resolve({
							status: 200,
							statusText: "OK",
							json: async () => ["purple banana", "orange banana"]
						});

						setTimeout(done, 10);
					});

					it("should return newly loaded body", function() {
						expect(this.result.current).to.be.ok;

						const { isFetching, isFetched, error, body } = this.result.current;

						expect(isFetching).to.be.false;
						expect(isFetched).to.be.true;
						expect(error).to.not.be.ok;

						expect(body).to.be.ok;
						expect(body).to.have.lengthOf(2);
						expect(body[0]).to.equal("purple banana");
						expect(body[1]).to.equal("orange banana");
					});
				});
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function(done) {
					this.rerender({ id: 4, name: "James Bond" });

					setTimeout(done, 10);
				});

				it("should not make another fetch API request", function() {
					expect(this.requests.length).to.equal(0);
				});
			});
		});

		describe("with a failure server response", function() {
			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 500,
					statusText: "OK",
					json: async () => ({
						message: "Not today, buddy"
					})
				});

				setTimeout(done, 10);
			});

			it("should return result as errored", function() {
				expect(this.result.current).to.be.ok;

				const { isFetching, isFetched, error, body } = this.result.current;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.false;

				expect(error).to.be.ok;
				expect(error).to.be.an("error");

				expect(error.message).to.equal("Not today, buddy");
				expect(error.response).to.be.ok;
				expect(error.response.status).to.equal(500);

				expect(body).to.not.be.ok;
			});

			describe("and then setting a keyed prop on the component", function() {
				beforeEach(function(done) {
					this.rerender({ id: 420 });

					setTimeout(done, 10);
				});

				it("should make another fetch API request", function() {
					expect(this.requests.length).to.equal(1);
					expect(this.requests[0].url).to.equal(
						"http://example.com/api/bananas/420"
					);
				});

				it("should return result as fetching and no longer errored", function() {
					expect(this.result.current).to.be.ok;

					const { isFetching, isFetched, error, body } = this.result.current;

					expect(isFetching).to.be.true;
					expect(isFetched).to.be.false;
					expect(error).to.not.be.ok;

					expect(body).to.not.be.ok;
				});
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function(done) {
					this.rerender({ id: 4, name: "Homer Simpson" });

					setTimeout(done, 10);
				});

				it("should not make another fetch API request", function() {
					expect(this.requests.length).to.equal(0);
				});
			});
		});
	});

	describe("when rendering a component with a bearer token", function() {
		function behavesLikeRenderingComponentWithBearerToken(doTheThing) {
			beforeEach(function(done) {
				renderHook(doTheThing);
				setTimeout(done, 10);
			});

			it("should set authorization header", function() {
				const req = this.requests[0];

				expect(req.headers).to.be.ok;
				expect(req.headers["Authorization"]).to.equal("Bearer poop");
			});
		}

		describe("using options syntax", function() {
			behavesLikeRenderingComponentWithBearerToken(() =>
				useFetch({
					url: `http://example.com/api/bananas/`,
					bearerToken: `poop`
				})
			);
		});

		describe("using URL & options syntax", function() {
			behavesLikeRenderingComponentWithBearerToken(() =>
				useFetch(`http://example.com/api/bananas/`, {
					bearerToken: `poop`
				})
			);
		});
	});

	describe("when rendering a component with an async bearer token", function() {
		beforeEach(function(done) {
			const promise = new Promise((resolve, reject) => {
				this.resolve = resolve;
				this.reject = reject;
			});

			const r = renderHook(() =>
				useFetch({
					url: `http://example.com/api/bananas/`,
					bearerToken: promise
				})
			);
			this.result = r.result;

			setTimeout(done, 10);
		});

		it("should not make a request", function() {
			expect(this.requests).to.be.empty;
		});

		describe("and then resolving the promise", function() {
			beforeEach(function(done) {
				this.resolve("poop");
				setTimeout(done, 10);
			});

			it("should make the request and set authorization header", function() {
				expect(this.requests).to.have.lengthOf(1);

				const req = this.requests[0];

				expect(req.headers).to.be.ok;
				expect(req.headers["Authorization"]).to.equal("Bearer poop");
			});
		});

		describe("and then rejecting the promise", function() {
			beforeEach(function(done) {
				this.err = new Error("some shit broke");
				this.reject(this.err);
				setTimeout(done, 10);
			});

			it("should not make the request", function() {
				expect(this.requests).to.be.empty;
			});

			it("should mark the fetch as errored", function() {
				expect(this.result.current).to.be.ok;

				const { isFetching, isFetched, error } = this.result.current;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.false;
				expect(error).to.equal(this.err);
			});
		});
	});

	describe("when rendering a component with a functional bearer token", function() {
		beforeEach(function(done) {
			renderHook(() =>
				useFetch({
					url: `http://example.com/api/bananas/`,
					bearerToken: () => "poop"
				})
			);

			setTimeout(done, 10);
		});

		it("should make the request and set authorization header", function() {
			expect(this.requests).to.have.lengthOf(1);

			const req = this.requests[0];

			expect(req.headers).to.be.ok;
			expect(req.headers["Authorization"]).to.equal("Bearer poop");
		});
	});

	describe("when rendering a component with an async functional bearer token", function() {
		beforeEach(function(done) {
			const promise = new Promise((resolve, reject) => {
				this.resolve = resolve;
				this.reject = reject;
			});

			renderHook(() =>
				useFetch({
					url: `http://example.com/api/bananas/`,
					bearerToken: () => promise
				})
			);

			setTimeout(done, 10);
		});

		it("should not make a request", function() {
			expect(this.requests).to.be.empty;
		});

		describe("and then resolving the promise", function() {
			beforeEach(function(done) {
				this.resolve("poop");
				setTimeout(done, 10);
			});

			it("should make the request and set authorization header", function() {
				expect(this.requests).to.have.lengthOf(1);

				const req = this.requests[0];

				expect(req.headers).to.be.ok;
				expect(req.headers["Authorization"]).to.equal("Bearer poop");
			});
		});
	});

	describe("when rendering a component with specific headers", function() {
		beforeEach(function(done) {
			renderHook(() =>
				useFetch(`http://example.com/api/bananas/`, {
					headers: {
						Authorization: "wha",
						Accept: "text/plain",
						"Content-Type": "text/plain"
					}
				})
			);

			setTimeout(done, 10);
		});

		it("should set headers on the request", function() {
			const req = this.requests[0];

			expect(req.headers).to.be.ok;
			expect(Object.keys(req.headers)).to.have.lengthOf(3);

			expect(req.headers["Authorization"]).to.equal("wha");
			expect(req.headers["Accept"]).to.equal("text/plain");
			expect(req.headers["Content-Type"]).to.equal("text/plain");
		});
	});

	describe("when rendering a component that returns a 204", function() {
		beforeEach(function(done) {
			const r = renderHook(() => useFetch(`http://example.com/api/bananas/`));
			this.result = r.result;

			setTimeout(done, 10);
		});

		beforeEach(function(done) {
			this.requests.pop().resolve({
				status: 204,
				statusText: "No Content"
			});

			setTimeout(done, 10);
		});

		it("should return null body", function() {
			expect(this.result.current).to.be.ok;

			const { isFetching, isFetched, error, body } = this.result.current;

			expect(isFetching).to.be.false;
			expect(isFetched).to.be.true;
			expect(error).to.not.be.ok;
			expect(body).to.not.be.ok;
		});
	});

	describe("when rendering a component with a lazy function", function() {
		beforeEach(function(done) {
			const r = renderHook(
				({ name }) =>
					useLazyFetch(`http://example.com/api/bananas/`, {
						method: "POST",
						body: JSON.stringify({ name })
					}),
				{ initialProps: { name: "Homer" } }
			);
			this.result = r.result;
			this.rerender = r.rerender;

			setTimeout(done, 10);
		});

		it("should not make a fetch API request", function() {
			expect(this.requests.length).to.equal(0);
		});

		it("should return lazy function and fetch results", function() {
			expect(this.result.current).to.be.ok;

			const { fetch, isFetching, isFetched, error, body } = this.result.current;

			expect(fetch).to.be.ok;
			expect(fetch).to.be.a("function");

			expect(isFetching).to.be.false;
			expect(isFetched).to.be.false;
			expect(error).to.not.be.ok;

			expect(body).to.not.be.ok;
		});

		describe("and then invoking the lazy function", function() {
			beforeEach(function(done) {
				this.result.current.fetch();

				setTimeout(done, 10);
			});

			it("should make a fetch API request", function() {
				expect(this.requests.length).to.equal(1);

				const req = this.requests[0];

				expect(req.url).to.equal("http://example.com/api/bananas/");
				expect(req.method).to.equal("POST");
				expect(req.body).to.equal('{"name":"Homer"}');
			});

			it("should return fetch results", function() {
				expect(this.result.current).to.be.ok;

				const { isFetching, isFetched, error, body } = this.result.current;

				expect(isFetching).to.be.true;
				expect(isFetched).to.be.false;
				expect(error).to.not.be.ok;

				expect(body).to.not.be.ok;
			});
		});

		describe("and then changing props that are part of the request body", function() {
			beforeEach(function(done) {
				this.rerender({ name: "Bart" });

				setTimeout(done, 10);
			});

			describe("and then invoking the lazy function", function() {
				beforeEach(function(done) {
					this.result.current.fetch();

					setTimeout(done, 10);
				});

				it("should make a fetch API request with new body body", function() {
					expect(this.requests.length).to.equal(1);

					const req = this.requests[0];

					expect(req.url).to.equal("http://example.com/api/bananas/");
					expect(req.method).to.equal("POST");
					expect(req.body).to.equal('{"name":"Bart"}');
				});
			});
		});
	});

	describe("when rendering a component with a lazy function and passing the body as a parameter", function() {
		beforeEach(function(done) {
			const r = renderHook(() =>
				useLazyFetch(`http://example.com/api/bananas/`, {
					method: "POST"
				})
			);
			this.result = r.result;
			this.rerender = r.rerender;

			setTimeout(done, 10);
		});

		it("should not make a fetch API request", function() {
			expect(this.requests.length).to.equal(0);
		});

		describe("and then invoking the lazy function with a parameter", function() {
			beforeEach(function(done) {
				this.result.current.fetch({ name: "Homer" });

				setTimeout(done, 10);
			});

			it("should make a fetch API request", function() {
				expect(this.requests.length).to.equal(1);

				const req = this.requests[0];

				expect(req.url).to.equal("http://example.com/api/bananas/");
				expect(req.method).to.equal("POST");
				expect(req.body).to.equal('{"name":"Homer"}');
			});
		});
	});

	describe("when rendering a component with a reset", function() {
		function behavesLikeTestingReset(useHook, triggerFetch) {
			beforeEach(function(done) {
				const r = renderHook(useHook, { initialProps: { id: 69 } });
				this.result = r.result;
				this.rerender = r.rerender;

				if (this.result.current.fetch) this.result.current.fetch();

				setTimeout(done, 10);
			});

			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					headers: {
						"Content-Type": "application/json"
					},
					json: async () => ({ name: "Bob" })
				});

				setTimeout(done, 10);
			});

			it("should return result", function() {
				expect(this.result.current).to.be.ok;

				const { isFetching, isFetched, error, body } = this.result.current;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.true;
				expect(error).to.not.be.ok;

				expect(body).to.deep.equal({ name: "Bob" });
			});

			describe("and then waiting the reset threshold time", function() {
				beforeEach(function(done) {
					setTimeout(done, 110);
				});

				it("should clear result body and headers", function() {
					expect(this.result.current).to.be.ok;

					const {
						isFetching,
						isFetched,
						error,
						body,
						headers
					} = this.result.current;

					expect(isFetching).to.be.false;
					expect(isFetched).to.be.false;
					expect(error).to.not.be.ok;

					expect(body).to.not.be.ok;
					expect(headers).to.not.be.ok;
				});
			});

			describe("and then triggering another fetch before the reset threshold time", function() {
				beforeEach(function(done) {
					setTimeout(() => {
						triggerFetch(this.rerender, this.result.current);
						setTimeout(done, 10);
					}, 30);
				});

				it("should mark status as refetching", function() {
					expect(this.result.current).to.be.ok;

					const { isFetching, isFetched, error, body } = this.result.current;

					expect(isFetching).to.be.true;
					expect(isFetched).to.be.true;
					expect(error).to.not.be.ok;

					expect(body).to.deep.equal({ name: "Bob" });
				});

				describe("and then waiting enough time for the original reset", function() {
					beforeEach(function(done) {
						setTimeout(done, 60);
					});

					it("should not reset body", function() {
						expect(this.result.current).to.be.ok;

						const { isFetching, isFetched, error, body } = this.result.current;

						expect(isFetching).to.be.true;
						expect(isFetched).to.be.true;
						expect(error).to.not.be.ok;

						expect(body).to.deep.equal({ name: "Bob" });
					});
				});

				describe("and then receiving body and waiting past the original reset time", function() {
					beforeEach(function(done) {
						this.requests.pop().resolve({
							status: 200,
							statusText: "OK",
							json: async () => ({ name: "Homer" })
						});

						setTimeout(done, 60);
					});

					it("should not reset body", function() {
						expect(this.result.current).to.be.ok;

						const { isFetching, isFetched, error, body } = this.result.current;

						expect(isFetching).to.be.false;
						expect(isFetched).to.be.true;
						expect(error).to.not.be.ok;

						expect(body).to.deep.equal({ name: "Homer" });
					});

					describe("and then waiting for the next reset threshold time", function() {
						beforeEach(function(done) {
							setTimeout(done, 110);
						});

						it("should clear the result body", function() {
							expect(this.result.current).to.be.ok;

							const {
								isFetching,
								isFetched,
								error,
								body
							} = this.result.current;

							expect(isFetching).to.be.false;
							expect(isFetched).to.be.false;
							expect(error).to.not.be.ok;

							expect(body).to.not.be.ok;
						});
					});
				});
			});
		}

		behavesLikeTestingReset(
			({ id }) =>
				useFetch({
					url: `http://example.com/api/bananas/${id}`,
					resetDelay: 100
				}),
			rerender => rerender({ id: 420 })
		);

		describe("and a lazy function", function() {
			behavesLikeTestingReset(
				({ id }) =>
					useLazyFetch({
						url: `http://example.com/api/bananas/`,
						method: "POST",
						body: JSON.stringify({ id }),
						resetDelay: 100
					}),
				(_, { fetch }) => fetch()
			);
		});
	});

	describe("when rendering a component with a refresh interval", function() {
		function behavesLikeTestingRefresh(useHook, triggerFetch) {
			beforeEach(function(done) {
				const r = renderHook(useHook, { initialProps: { id: 69 } });
				this.result = r.result;
				this.rerender = r.rerender;

				if (this.result.current.fetch) this.result.current.fetch();

				setTimeout(done, 10);
			});

			describe("with a successful server response", function() {
				beforeEach(function(done) {
					this.requests.pop().resolve({
						status: 200,
						statusText: "OK",
						json: async () => ({ color: "Yellow" })
					});

					setTimeout(done, 10);
				});

				it("should return result", function() {
					expect(this.result.current).to.be.ok;

					const { isFetching, isFetched, error, body } = this.result.current;

					expect(isFetching).to.be.false;
					expect(isFetched).to.be.true;
					expect(error).to.not.be.ok;

					expect(body).to.deep.equal({ color: "Yellow" });
				});

				describe("and then waiting the refresh threshold time", function() {
					beforeEach(function(done) {
						setTimeout(done, 100);
					});

					it("should mark body as loading without clearing body", function() {
						expect(this.result.current).to.be.ok;

						const { isFetching, isFetched, error, body } = this.result.current;

						expect(isFetching).to.be.true;
						expect(isFetched).to.be.true;
						expect(error).to.not.be.ok;

						expect(body).to.deep.equal({ color: "Yellow" });
					});
				});

				describe("and then triggering another fetch before the refresh threshold time", function() {
					beforeEach(function(done) {
						setTimeout(() => {
							triggerFetch(this.rerender, this.result.current);
							setTimeout(done, 10);
						}, 30);
					});

					it("should mark status as refetching", function() {
						expect(this.result.current).to.be.ok;

						const { isFetching, isFetched, error, body } = this.result.current;

						expect(isFetching).to.be.true;
						expect(isFetched).to.be.true;
						expect(error).to.not.be.ok;

						expect(body).to.deep.equal({ color: "Yellow" });
					});

					describe("and then waiting enough time for the original refresh", function() {
						beforeEach(function(done) {
							this.requests.pop().resolve({
								status: 200,
								statusText: "OK",
								json: async () => ({ color: "Brown" })
							});

							setTimeout(done, 80);
						});

						it("should not refresh body", function() {
							expect(this.result.current).to.be.ok;

							const {
								isFetching,
								isFetched,
								error,
								body
							} = this.result.current;

							expect(isFetching).to.be.false;
							expect(isFetched).to.be.true;
							expect(error).to.not.be.ok;

							expect(body).to.deep.equal({ color: "Brown" });
						});

						describe("and then waiting for the next refresh time", function() {
							beforeEach(function(done) {
								setTimeout(done, 110);
							});

							it("should refresh the body", function() {
								expect(this.result.current).to.be.ok;

								const {
									isFetching,
									isFetched,
									error,
									body
								} = this.result.current;

								expect(isFetching).to.be.true;
								expect(isFetched).to.be.true;
								expect(error).to.not.be.ok;

								expect(body).to.deep.equal({ color: "Brown" });
							});
						});
					});
				});
			});
		}

		behavesLikeTestingRefresh(
			({ id }) =>
				useFetch({
					url: `http://example.com/api/bananas/${id}`,
					refreshInterval: 100
				}),
			rerender => rerender({ id: 420 })
		);

		describe("and a lazy function", function() {
			behavesLikeTestingRefresh(
				({ id }) =>
					useLazyFetch({
						url: `http://example.com/api/bananas/`,
						method: "POST",
						body: JSON.stringify({ id }),
						refreshInterval: 100
					}),
				(_, { fetch }) => fetch()
			);
		});
	});

	describe("when rendering a component with a refresh interval and a reset delay", function() {
		it("should throw an error", function() {
			const {
				result: { error }
			} = renderHook(() =>
				useFetch({
					url: "https://api.example.com/bananas/",
					refreshInterval: 10,
					resetDelay: 30
				})
			);

			expect(error).to.be.ok;
			expect(error.message).to.contain("resetDelay");
			expect(error.message).to.contain("refreshInterval");
		});
	});

	describe("when rendering a component with nothing to fetch", function() {
		function behavesLikeNothingToFetch(itemToFetch) {
			beforeEach(function(done) {
				const r = renderHook(() => useFetch(itemToFetch));
				this.result = r.result;

				setTimeout(done, 10);
			});

			it("should not make a fetch API request", function() {
				expect(this.requests.length).to.equal(0);
			});

			it("should return empty result body", function() {
				expect(this.result.current).to.be.ok;

				const { isFetching, isFetched, error, body } = this.result.current;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.false;
				expect(error).to.not.be.ok;

				expect(body).to.not.be.ok;
			});
		}

		describe("implicitly", function() {
			behavesLikeNothingToFetch(undefined);
		});

		describe("explicitly", function() {
			behavesLikeNothingToFetch(null);
		});

		describe("with missing URL", function() {
			behavesLikeNothingToFetch({
				url: "",
				headers: {
					Accept: "text/plain"
				}
			});
		});

		describe("with missing URL with different syntax", function() {
			behavesLikeNothingToFetch("", {
				headers: {
					Accept: "text/plain"
				}
			});
		});
	});

	describe("when rendering a component with invalid arguments", function() {
		function shouldThrowAnError(doTheThing) {
			it("should throw an error", function() {
				const {
					result: { error }
				} = renderHook(doTheThing);

				expect(error).to.be.ok;
				expect(error.message).to.contain("argument");
			});
		}

		describe("with 3 parameters", function() {
			shouldThrowAnError(() => useFetch("https://api.example.com/", {}, {}));
		});

		describe("with 2 parameters but the second parameter is a string", function() {
			shouldThrowAnError(() =>
				useFetch("https://api.example.com/", "https://api.example.com/")
			);
		});
	});
});
