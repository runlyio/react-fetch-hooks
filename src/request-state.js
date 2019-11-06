import { useReducer, useCallback } from "react";

const useRequestInitialState = () => {
	const [state, dispatch] = useReducer(
		(state, action) => {
			switch (action.type) {
				case "reset-timer":
					return { ...state, timerSignal: 0 };

				case "start-fetch":
					return { ...state, timerSignal: 0, isFetching: true, error: null };

				case "results": {
					const { headers, body, timer } = action.payload;

					let results = {
						...state,
						body,
						headers,
						isFetching: false,
						isFetched: true,
						error: null
					};

					if (timer) {
						results.timerSignal++;
					}

					return results;
				}

				case "fail":
					return { ...state, isFetching: false, error: action.payload };

				case "reset":
					return {
						...state,
						isFetching: false,
						isFetched: false,
						body: null,
						headers: null,
						error: null
					};

				default:
					return state;
			}
		},
		{
			isFetching: false,
			isFetched: false,
			body: null,
			headers: null,
			error: null,
			timerSignal: 0
		}
	);

	const onTimerReset = useCallback(() => dispatch({ type: "reset-timer" }), []);
	const onStartFetch = useCallback(() => dispatch({ type: "start-fetch" }), []);

	const onFetchResults = useCallback(
		data => dispatch({ type: "results", payload: data }),
		[]
	);

	const onFetchFail = useCallback(
		err => dispatch({ type: "fail", payload: err }),
		[]
	);

	const onResetResults = useCallback(() => dispatch({ type: "reset" }), []);

	return {
		...state,
		onTimerReset,
		onStartFetch,
		onFetchResults,
		onFetchFail,
		onResetResults
	};
};

export default useRequestInitialState;
