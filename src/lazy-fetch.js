import { isString } from "lodash";

import useRequestState from "./request-state";
import useFetchFn from "./fetch-fn";
import useRefreshInterval from "./refresh-interval";
import useResetDelay from "./reset-delay";

const useLazyFetch = (...args) => {
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
	} = useRequestState();

	let { url, resetDelay, refreshInterval, ...opts } = parseArguments(args);

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

function parseArguments(args) {
	if (args) {
		if (args.length == 1) {
			return prepareHeaders(args[0]);
		}

		if (args.length == 2) {
			if (isString(args[1])) {
				throw new Error(
					"The second argument to the fetch hook should be an options object, not a string."
				);
			}

			return prepareHeaders({ ...args[1], url: args[0] });
		}

		throw new Error(
			"The fetch hook only takes one or two arguments. See usage instructions: https://github.com/civicsource/react-fetch-hooks/blob/master/README.md"
		);
	}

	return {};
}

function prepareHeaders(itemToFetch) {
	let url, bearerToken, opts;

	if (isString(itemToFetch)) {
		url = itemToFetch;
	} else {
		const { url: _url, bearerToken: _bearerToken, ..._opts } = itemToFetch || {};
		url = _url;
		bearerToken = _bearerToken;
		opts = _opts;
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
