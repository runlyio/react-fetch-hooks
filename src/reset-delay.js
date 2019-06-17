import { useEffect } from "react";

const useResetDelay = ({
	resetDelay,
	setBody,
	setHeaders,
	setError,
	setIsFetched,
	setIsFetching,
	timerSignal
}) =>
	useEffect(() => {
		let timer;
		if (timerSignal && resetDelay) {
			timer = setTimeout(() => {
				// reset the state
				setBody(null);
				setHeaders(null);
				setIsFetching(false);
				setIsFetched(false);
				setError(null);
			}, resetDelay);
		}

		return () => timer && clearTimeout(timer);
	}, [
		resetDelay,
		setBody,
		setHeaders,
		setError,
		setIsFetched,
		setIsFetching,
		timerSignal
	]);

export default useResetDelay;
