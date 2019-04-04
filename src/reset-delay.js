import { useEffect } from "react";

const useResetDelay = ({
	resetDelay,
	setData,
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
				setData(null);
				setIsFetching(false);
				setIsFetched(false);
				setError(null);
			}, resetDelay);
		}

		return () => timer && clearTimeout(timer);
	}, [resetDelay, setData, setError, setIsFetched, setIsFetching, timerSignal]);

export default useResetDelay;
