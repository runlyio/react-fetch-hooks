import { useState } from "react";

const useIsFetching = () => useState(false);
const useIsFetched = () => useState(false);
const useBody = () => useState(null);
const useHeaders = () => useState(null);
const useError = () => useState(null);
const useTimerSignal = () => useState(0);

const useRequestInitialState = () => {
	const [isFetching, setIsFetching] = useIsFetching();
	const [isFetched, setIsFetched] = useIsFetched();
	const [body, setBody] = useBody();
	const [headers, setHeaders] = useHeaders();
	const [error, setError] = useError();
	const [timerSignal, resetTimer] = useTimerSignal();

	return {
		isFetching,
		setIsFetching,
		isFetched,
		setIsFetched,
		body,
		setBody,
		headers,
		setHeaders,
		error,
		setError,
		timerSignal,
		resetTimer
	};
};

export default useRequestInitialState;
