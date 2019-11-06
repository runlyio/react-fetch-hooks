import { useEffect } from "react";

const useResetDelay = ({ resetDelay, timerSignal, onResetResults }) =>
	useEffect(() => {
		let timer;
		if (timerSignal && resetDelay) {
			timer = setTimeout(() => {
				// reset the state
				onResetResults();
			}, resetDelay);
		}

		return () => timer && clearTimeout(timer);
	}, [onResetResults, resetDelay, timerSignal]);

export default useResetDelay;
