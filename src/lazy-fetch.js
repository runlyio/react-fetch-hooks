import { useState, useEffect } from "react";
import { isString } from "lodash";

import checkStatus from "./check-status";

const useLazyFetch = itemToFetch => {
	const [isFetching, setIsFetching] = useState(false);
	const [isFetched, setIsFetched] = useState(false);
	const [data, setData] = useState(null);
	const [error, setError] = useState(null);

	const [resetTimerSignal, resetTimer] = useState(0);

	let { url, bearerToken, reset, ...opts } = itemToFetch || {};

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

	useEffect(() => {
		let timer;
		if (resetTimerSignal && reset) {
			timer = setTimeout(() => {
				// reset the state
				setData(null);
				setIsFetching(false);
				setIsFetched(false);
				setError(null);
			}, reset);
		}

		return () => timer && clearTimeout(timer);
	}, [reset, resetTimerSignal]);

	return {
		isFetching,
		isFetched,
		data,
		error,
		fetch: () => {
			resetTimer(0);

			if (url) {
				setIsFetching(true);
				setError(null);
				doFetch();
			}

			async function doFetch() {
				try {
					let response = await fetch(url, { ...otherOpts, headers });

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

					if (reset) {
						resetTimer(s => s + 1);
					}
				} catch (ex) {
					setIsFetching(false);
					setError(ex);
				}
			}
		}
	};
};

export default useLazyFetch;
