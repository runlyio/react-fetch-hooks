import { useEffect } from "react";

const useResetDelay = ({
	resetDelay,
	setBody,
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
				setIsFetching(false);
				setIsFetched(false);
				setError(null);
			}, resetDelay);
		}

		return () => timer && clearTimeout(timer);
	}, [resetDelay, setBody, setError, setIsFetched, setIsFetching, timerSignal]);

export default useResetDelay;
