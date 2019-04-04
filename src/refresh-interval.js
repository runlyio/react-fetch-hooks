import { useEffect } from "react";

const useRefreshInterval = ({ timerSignal, refreshInterval, fetchFn }) =>
	useEffect(() => {
		let timer;
		if (timerSignal && refreshInterval) {
			timer = setTimeout(fetchFn, refreshInterval);
		}

		return () => timer && clearTimeout(timer);
	}, [fetchFn, refreshInterval, timerSignal]);

export default useRefreshInterval;
