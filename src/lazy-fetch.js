import { isString } from "lodash";

import useRequestInitialState from "./request-initial-state";
import useFetchFn from "./fetch-fn";
import useRefreshInterval from "./refresh-interval";
import useResetDelay from "./reset-delay";

const useLazyFetch = itemToFetch => {
	const {
		isFetching,
		setIsFetching,
		isFetched,
		setIsFetched,
		data,
		setData,
		error,
		setError,
		timerSignal,
		resetTimer
	} = useRequestInitialState();

	let { url, resetDelay, refreshInterval, ...opts } = prepareHeaders(
		itemToFetch
	);

	if (resetDelay && refreshInterval) {
		throw new Error(
			"Only one of resetDelay or refreshInterval is allowed to be used at once."
		);
	}

	const fetchFn = useFetchFn({
		refreshInterval,
		resetDelay,
		url,
		opts,
		resetTimer,
		setIsFetching,
		setIsFetched,
		setError,
		setData
	});

	useResetDelay({
		resetDelay,
		setData,
		setError,
		setIsFetched,
		setIsFetching,
		timerSignal
	});

	useRefreshInterval({ timerSignal, refreshInterval, fetchFn });

	return {
		isFetching,
		isFetched,
		data,
		error,
		fetch: fetchFn
	};
};

function prepareHeaders(itemToFetch) {
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
