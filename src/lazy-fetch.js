import { isString } from "lodash";

import useRequestState from "./request-state";
import useFetchFn from "./fetch-fn";
import useRefreshInterval from "./refresh-interval";
import useResetDelay from "./reset-delay";

const useLazyFetch = (...args) => {
	const {
		timerSignal,
		onTimerReset,
		onStartFetch,
		onFetchResults,
		onFetchFail,
		onResetResults,
		...reqState
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
		onTimerReset,
		onStartFetch,
		onFetchResults,
		onFetchFail
	});

	useResetDelay({
		resetDelay,
		timerSignal,
		onResetResults
	});

	useRefreshInterval({ timerSignal, refreshInterval, fetchFn });

	return {
		...reqState,
		fetch: fetchFn
	};
};

function parseArguments(args) {
	if (args) {
		if (args.length == 1) {
			if (isString(args[0])) {
				return { url: args[0] };
			}

			return args[0] || {};
		}

		if (args.length == 2) {
			if (isString(args[1])) {
				throw new Error(
					"The second argument to the fetch hook should be an options object, not a string."
				);
			}

			return { ...args[1], url: args[0] };
		}

		throw new Error(
			"The fetch hook only takes one or two arguments. See usage instructions: https://github.com/chadly/react-fetch-hooks/blob/master/README.md"
		);
	}

	return {};
}

export default useLazyFetch;
