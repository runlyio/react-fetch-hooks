import { useCallback } from "react";
import { isFunction } from "lodash";
import pojoHeaders from "./pojo-headers";
import extractErrorMessage from "./extract-error-message";

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
				let response, headers, body, status, statusText;

				try {
					const parsedOpts = await prepareHeaders(opts, reqBody);

					response = await fetch(url, parsedOpts);

					headers = pojoHeaders(response.headers);
					status = response.status;
					statusText = response.statusText;

					const isSuccessful = response.status >= 200 && response.status < 300;

					if (isSuccessful) {
						if (status != 204) {
							body = await response.json();
						} else {
							// for 204 No Content, just return null data
							body = null;
						}

						onFetchResults({
							body: body,
							headers: headers,
							status: status,
							statusText: statusText,
							timer: resetDelay || refreshInterval
						});
					} else {
						const parsedResult = await parseJSONError(response);
						onFetchFail({ ...parsedResult, headers, status, statusText });
					}
				} catch (ex) {
					onFetchFail({ error: ex, body, headers, status, statusText });
				}
			}
		},
		// JSON.stringify: just relax, it's fine
		// https://github.com/facebook/react/issues/14476#issuecomment-471199055
		[refreshInterval, resetDelay, url, JSON.stringify(opts)] // eslint-disable-line react-hooks/exhaustive-deps
	);

async function parseJSONError(response) {
	let body;

	try {
		body = await response.json();
	} catch {
		// there was an error trying to parse the JSON body (maybe it's not JSON?)
		// just ignore it and return an error with the original response without a parsed body
		let error = new Error(
			response.statusText ||
				`Request failed with status code ${response.status}`
		);

		error.response = response;
		return { error };
	}

	let msg = extractErrorMessage(body);
	if (!msg) msg = response.statusText;

	let error = new Error(msg);
	error.response = response;

	return { error, body };
}

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
