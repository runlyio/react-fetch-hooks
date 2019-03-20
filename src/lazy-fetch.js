import { useState, useEffect, useCallback } from "react";
import { isString } from "lodash";

import checkStatus from "./check-status";

const useLazyFetch = itemToFetch => {
	const [isFetching, setIsFetching] = useState(false);
	const [isFetched, setIsFetched] = useState(false);
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);

	const [timerSignal, resetTimer] = useState(0);

	let { url, resetDelay, refreshInterval, ...opts } = parseItemToFetch(
		itemToFetch
	);

	if (resetDelay && refreshInterval) {
		throw new Error(
			"Only one of resetDelay or refreshInterval is allowed to be used at once."
		);
	}

	const fetchFn = useCallback(() => {
		resetTimer(0);

		if (url) {
			setIsFetching(true);
			setError(null);
			doFetch();
		}

		async function doFetch() {
			try {
				let response = await fetch(url, opts);

				response = await checkStatus(response);

				if (response.status != 204) {
					response = await response.json();
				} else {
					// for 204 No Content, just return null data
					response = null;
				}

				setData(response);
				setIsFetching(false);
				setIsFetched(true);
				setError(null);

				if (resetDelay) {
					resetTimer(s => s + 1);
				}

				if (refreshInterval) {
					resetTimer(s => s + 1);
				}
			} catch (ex) {
				setIsFetching(false);
				setError(ex);
			}
		}
		// JSON.stringify: just relax, it's fine
		// https://github.com/facebook/react/issues/14476#issuecomment-471199055
	}, [refreshInterval, resetDelay, url, JSON.stringify(opts)]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		let timer;
		if (timerSignal && resetDelay) {
			timer = setTimeout(() => {
				// reset the state
				setData(null);
				setIsFetching(false);
				setIsFetched(false);
				setError(null);
			}, resetDelay);
		}

		return () => timer && clearTimeout(timer);
	}, [resetDelay, timerSignal]);

	useEffect(() => {
		let timer;
		if (timerSignal && refreshInterval) {
			timer = setTimeout(fetchFn, refreshInterval);
		}

		return () => timer && clearTimeout(timer);
	}, [fetchFn, refreshInterval, timerSignal]);

	return {
		isFetching,
		isFetched,
		data,
		error,
		fetch: fetchFn
	};
};

function parseItemToFetch(itemToFetch) {
	let { url, bearerToken, ...opts } = itemToFetch || {};

	if (!url && isString(itemToFetch)) {
		url = itemToFetch;
	}

	let { headers, ...otherOpts } = opts;
	headers = headers || {};

	if (!headers["Accept"]) {
		headers["Accept"] = "application/json";
	}

	if (!headers["Content-Type"]) {
		headers["Content-Type"] = "application/json";
	}

	if (bearerToken) {
		headers["Authorization"] = `Bearer ${bearerToken}`;
	}

	return {
		url,
		bearerToken,
		headers,
		...otherOpts
	};
}

export default useLazyFetch;
