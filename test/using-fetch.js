import { expect } from "chai";
import behavesLikeBrowser from "./behaves-like-browser";

import React from "react";
import { configure, mount } from "enzyme";
import Adapter from "enzyme-adapter-react-16";

import { useFetch, useLazyFetch } from "../src";

configure({ adapter: new Adapter() });

describe("Using fetch hook", function() {
	behavesLikeBrowser();

	describe("when rendering a component with just a URL", function() {
		beforeEach(function(done) {
			const Hooked = () => {
				this.result = useFetch("http://example.com/api/bananas/");
				return <span>Hello</span>;
			};

			this.wrapper = mount(<Hooked />);

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

		it("should indicate the data is fetching", function() {
			expect(this.result).to.be.ok;

			const { isFetching, isFetched, error, data } = this.result;

			expect(isFetching).to.be.true;
			expect(isFetched).to.be.false;
			expect(error).to.not.be.ok;

			expect(data).to.not.be.ok;
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

			it("should return results as loaded", function() {
				expect(this.result).to.be.ok;

				const { isFetching, isFetched, error, data } = this.result;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.true;
				expect(error).to.not.be.ok;

				expect(data).to.be.ok;
				expect(data).to.have.lengthOf(2);
				expect(data[0]).to.equal("ripe banana");
				expect(data[1]).to.equal("green banana");
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function(done) {
					this.wrapper.setProps({ hello: "world" });

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
				expect(this.result).to.be.ok;

				const { isFetching, isFetched, error, data } = this.result;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.false;

				expect(error).to.be.ok;
				expect(error).to.be.an("error");

				expect(error.message).to.equal("Not today, buddy");
				expect(error.response).to.be.ok;
				expect(error.response.status).to.equal(500);

				expect(data).to.not.be.ok;
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function(done) {
					this.wrapper.setProps({ hello: "world" });

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
			const Hooked = ({ id, name }) => {
				this.result = useFetch({
					url: `http://example.com/api/bananas/${id}`
				});
				return (
					<span>
						{id}:{name}
					</span>
				);
			};

			this.wrapper = mount(<Hooked id={4} />);

			setTimeout(done, 10);
		});

		it("should make a fetch API request", function() {
			expect(this.requests.length).to.equal(1);
			expect(this.requests[0].url).to.equal("http://example.com/api/bananas/4");
		});

		it("should return results as fetching", function() {
			expect(this.result).to.be.ok;

			const { isFetching, isFetched, error, data } = this.result;

			expect(isFetching).to.be.true;
			expect(isFetched).to.be.false;
			expect(error).to.not.be.ok;

			expect(data).to.not.be.ok;
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
				expect(this.result).to.be.ok;

				const { isFetching, isFetched, error, data } = this.result;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.true;
				expect(error).to.not.be.ok;

				expect(data).to.be.ok;
				expect(data).to.have.lengthOf(2);
				expect(data[0]).to.equal("ripe banana");
				expect(data[1]).to.equal("green banana");
			});

			describe("and then setting a keyed prop on the component", function() {
				beforeEach(function(done) {
					this.wrapper.setProps({ id: 69 });

					setTimeout(done, 10);
				});

				it("should make another fetch API request", function() {
					expect(this.requests.length).to.equal(1);
					expect(this.requests[0].url).to.equal(
						"http://example.com/api/bananas/69"
					);
				});

				it("should return results as fetching and still pass previously loaded data", function() {
					expect(this.result).to.be.ok;

					const { isFetching, isFetched, error, data } = this.result;

					expect(isFetching).to.be.true;
					expect(isFetched).to.be.true;
					expect(error).to.not.be.ok;

					expect(data).to.be.ok;
					expect(data).to.have.lengthOf(2);
					expect(data[0]).to.equal("ripe banana");
					expect(data[1]).to.equal("green banana");
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

					it("should return newly loaded data", function() {
						expect(this.result).to.be.ok;

						const { isFetching, isFetched, error, data } = this.result;

						expect(isFetching).to.be.false;
						expect(isFetched).to.be.true;
						expect(error).to.not.be.ok;

						expect(data).to.be.ok;
						expect(data).to.have.lengthOf(2);
						expect(data[0]).to.equal("purple banana");
						expect(data[1]).to.equal("orange banana");
					});
				});
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function(done) {
					this.wrapper.setProps({ name: "James Bond" });

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
				expect(this.result).to.be.ok;

				const { isFetching, isFetched, error, data } = this.result;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.false;

				expect(error).to.be.ok;
				expect(error).to.be.an("error");

				expect(error.message).to.equal("Not today, buddy");
				expect(error.response).to.be.ok;
				expect(error.response.status).to.equal(500);

				expect(data).to.not.be.ok;
			});

			describe("and then setting a keyed prop on the component", function() {
				beforeEach(function(done) {
					this.wrapper.setProps({ id: 420 });

					setTimeout(done, 10);
				});

				it("should make another fetch API request", function() {
					expect(this.requests.length).to.equal(1);
					expect(this.requests[0].url).to.equal(
						"http://example.com/api/bananas/420"
					);
				});

				it("should return result as fetching and no longer errored", function() {
					expect(this.result).to.be.ok;

					const { isFetching, isFetched, error, data } = this.result;

					expect(isFetching).to.be.true;
					expect(isFetched).to.be.false;
					expect(error).to.not.be.ok;

					expect(data).to.not.be.ok;
				});
			});

			describe("and then setting setting arbitrary props on the component", function() {
				beforeEach(function(done) {
					this.wrapper.setProps({ name: "Homer Simpson" });

					setTimeout(done, 10);
				});

				it("should not make another fetch API request", function() {
					expect(this.requests.length).to.equal(0);
				});
			});
		});
	});

	describe("when rendering a component with a bearer token", function() {
		beforeEach(function(done) {
			const Hooked = () => {
				this.result = useFetch({
					url: `http://example.com/api/bananas/`,
					bearerToken: `poop`
				});

				return <span>ohhai</span>;
			};

			this.wrapper = mount(<Hooked />);

			setTimeout(done, 10);
		});

		it("should set authorization header", function() {
			const req = this.requests[0];

			expect(req.headers).to.be.ok;
			expect(req.headers["Authorization"]).to.equal("Bearer poop");
		});
	});

	describe("when rendering a component with specific headers", function() {
		beforeEach(function(done) {
			const Hooked = () => {
				this.result = useFetch({
					url: `http://example.com/api/bananas/`,
					headers: {
						Authorization: "wha",
						Accept: "text/plain",
						"Content-Type": "text/plain"
					}
				});

				return <span>ohhai</span>;
			};

			this.wrapper = mount(<Hooked />);

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
			const Hooked = () => {
				this.result = useFetch(`http://example.com/api/bananas/`);
				return <span>ohhai</span>;
			};

			this.wrapper = mount(<Hooked />);

			setTimeout(done, 10);
		});

		beforeEach(function(done) {
			this.requests.pop().resolve({
				status: 204,
				statusText: "No Content"
			});

			setTimeout(done, 10);
		});

		it("should return null data", function() {
			expect(this.result).to.be.ok;

			const { isFetching, isFetched, error, data } = this.result;

			expect(isFetching).to.be.false;
			expect(isFetched).to.be.true;
			expect(error).to.not.be.ok;
			expect(data).to.not.be.ok;
		});
	});

	describe("when rendering a component with a lazy function", function() {
		beforeEach(function(done) {
			const Hooked = ({ name }) => {
				this.result = useLazyFetch({
					url: `http://example.com/api/bananas/`,
					method: "POST",
					body: JSON.stringify({ name })
				});
				return <span>{name}</span>;
			};

			this.wrapper = mount(<Hooked name="Homer" />);

			setTimeout(done, 10);
		});

		it("should not make a fetch API request", function() {
			expect(this.requests.length).to.equal(0);
		});

		it("should return lazy function and fetch results", function() {
			expect(this.result).to.be.ok;

			const { fetch, isFetching, isFetched, error, data } = this.result;

			expect(fetch).to.be.ok;
			expect(fetch).to.be.a("function");

			expect(isFetching).to.be.false;
			expect(isFetched).to.be.false;
			expect(error).to.not.be.ok;

			expect(data).to.not.be.ok;
		});

		describe("and then invoking the lazy function", function() {
			beforeEach(function(done) {
				this.result.fetch();

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
				expect(this.result).to.be.ok;

				const { isFetching, isFetched, error, data } = this.result;

				expect(isFetching).to.be.true;
				expect(isFetched).to.be.false;
				expect(error).to.not.be.ok;

				expect(data).to.not.be.ok;
			});
		});
	});

	describe("when rendering a component with a reset", function() {
		function behavesLikeTestingReset(useHook, triggerFetch) {
			beforeEach(function(done) {
				const Hooked = props => {
					this.result = useHook(props);
					return <span>{props.id}</span>;
				};

				this.wrapper = mount(<Hooked id={69} />);

				if (this.result.fetch) this.result.fetch();

				setTimeout(done, 10);
			});

			beforeEach(function(done) {
				this.requests.pop().resolve({
					status: 200,
					statusText: "OK",
					json: async () => ({ name: "Bob" })
				});

				setTimeout(done, 10);
			});

			it("should return result", function() {
				expect(this.result).to.be.ok;

				const { isFetching, isFetched, error, data } = this.result;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.true;
				expect(error).to.not.be.ok;

				expect(data).to.deep.equal({ name: "Bob" });
			});

			describe("and then waiting the reset threshold time", function() {
				beforeEach(function(done) {
					setTimeout(done, 110);
				});

				it("should clear result data", function() {
					expect(this.result).to.be.ok;

					const { isFetching, isFetched, error, data } = this.result;

					expect(isFetching).to.be.false;
					expect(isFetched).to.be.false;
					expect(error).to.not.be.ok;

					expect(data).to.not.be.ok;
				});
			});

			describe("and then triggering another fetch before the reset threshold time", function() {
				beforeEach(function(done) {
					setTimeout(() => {
						triggerFetch(this.wrapper, this.result);
						setTimeout(done, 10);
					}, 30);
				});

				it("should mark status as refetching", function() {
					expect(this.result).to.be.ok;

					const { isFetching, isFetched, error, data } = this.result;

					expect(isFetching).to.be.true;
					expect(isFetched).to.be.true;
					expect(error).to.not.be.ok;

					expect(data).to.deep.equal({ name: "Bob" });
				});

				describe("and then waiting enough time for the original reset", function() {
					beforeEach(function(done) {
						setTimeout(done, 60);
					});

					it("should not reset data", function() {
						expect(this.result).to.be.ok;

						const { isFetching, isFetched, error, data } = this.result;

						expect(isFetching).to.be.true;
						expect(isFetched).to.be.true;
						expect(error).to.not.be.ok;

						expect(data).to.deep.equal({ name: "Bob" });
					});
				});

				describe("and then receiving data and waiting past the original reset time", function() {
					beforeEach(function(done) {
						this.requests.pop().resolve({
							status: 200,
							statusText: "OK",
							json: async () => ({ name: "Homer" })
						});

						setTimeout(done, 60);
					});

					it("should not reset data", function() {
						expect(this.result).to.be.ok;

						const { isFetching, isFetched, error, data } = this.result;

						expect(isFetching).to.be.false;
						expect(isFetched).to.be.true;
						expect(error).to.not.be.ok;

						expect(data).to.deep.equal({ name: "Homer" });
					});

					describe("and then waiting for the next reset threshold time", function() {
						beforeEach(function(done) {
							setTimeout(done, 110);
						});

						it("should clear the result data", function() {
							expect(this.result).to.be.ok;

							const { isFetching, isFetched, error, data } = this.result;

							expect(isFetching).to.be.false;
							expect(isFetched).to.be.false;
							expect(error).to.not.be.ok;

							expect(data).to.not.be.ok;
						});
					});
				});
			});
		}

		behavesLikeTestingReset(
			({ id }) =>
				useFetch({
					url: `http://example.com/api/bananas/${id}`,
					reset: 100
				}),
			wrapper => wrapper.setProps({ id: 420 })
		);

		describe("and a lazy function", function() {
			behavesLikeTestingReset(
				({ id }) =>
					useLazyFetch({
						url: `http://example.com/api/bananas/`,
						method: "POST",
						body: JSON.stringify({ id }),
						reset: 100
					}),
				(wrapper, { fetch }) => fetch()
			);
		});
	});

	describe("when rendering a component with nothing to fetch", function() {
		function behavesLikeNothingToFetch(itemToFetch) {
			beforeEach(function(done) {
				const Hooked = ({ id }) => {
					this.result = useFetch(itemToFetch);
					return <span>{id}</span>;
				};

				this.wrapper = mount(<Hooked id={69} />);

				setTimeout(done, 10);
			});

			it("should not make a fetch API request", function() {
				expect(this.requests.length).to.equal(0);
			});

			it("should return empty result data", function() {
				expect(this.result).to.be.ok;

				const { isFetching, isFetched, error, data } = this.result;

				expect(isFetching).to.be.false;
				expect(isFetched).to.be.false;
				expect(error).to.not.be.ok;

				expect(data).to.not.be.ok;
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
	});
});
