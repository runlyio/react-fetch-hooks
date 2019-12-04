import { useCallback } from "react";
import checkStatus from "./check-status";
import { isFunction } from "lodash";
import pojoHeaders from "./pojo-headers";

const useFetchFn = ({
	refreshInterval,
	resetDelay,
	url,
	opts,
	onTimerReset,
	onStartFetch,
	onFetchResults,
	onFetchFail
}) =>
	useCallback(
		reqBody => {
			if (url) {
				onStartFetch();
				doFetch();
			} else {
				onTimerReset();
			}

			async function doFetch() {
				try {
					const parsedOpts = await prepareHeaders(opts, reqBody);

					let _response = await fetch(url, parsedOpts);

					let _headers;
					let _body;

					_response = await checkStatus(_response);

					_headers = pojoHeaders(_response.headers);

					if (_response.status != 204) {
						_body = await _response.json();
					} else {
						// for 204 No Content, just return null data
						_body = null;
					}

					onFetchResults({
						body: _body,
						headers: _headers,
						timer: resetDelay || refreshInterval
					});
				} catch (ex) {
					onFetchFail(ex);
				}
			}
		},
		// JSON.stringify: just relax, it's fine
		// https://github.com/facebook/react/issues/14476#issuecomment-471199055
		[refreshInterval, resetDelay, url, JSON.stringify(opts)] // eslint-disable-line react-hooks/exhaustive-deps
	);

async function prepareHeaders(itemToFetch, reqBody) {
	let { bearerToken, ...opts } = itemToFetch || {};

	let { headers, ...otherOpts } = opts;
	headers = headers || {};

	if (!headers["Accept"]) {
		headers["Accept"] = "application/json";
	}

	if (!headers["Content-Type"]) {
		headers["Content-Type"] = "application/json";
	}

	if (bearerToken) {
		if (isFunction(bearerToken)) {
			bearerToken = bearerToken();
		}

		bearerToken = await Promise.resolve(bearerToken);
		headers["Authorization"] = `Bearer ${bearerToken}`;
	}

	const result = {
		headers,
		...otherOpts
	};

	if (reqBody) {
		result.body = JSON.stringify(reqBody);
	}

	return result;
}

export default useFetchFn;
