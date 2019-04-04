import { useState } from "react";

const useIsFetching = () => useState(false);
const useIsFetched = () => useState(false);
const useData = () => useState(null);
const useError = () => useState(null);
const useTimerSignal = () => useState(0);

const useRequestInitialState = () => {
	const [isFetching, setIsFetching] = useIsFetching();
	const [isFetched, setIsFetched] = useIsFetched();
	const [data, setData] = useData();
	const [error, setError] = useError();
	const [timerSignal, resetTimer] = useTimerSignal();

	return {
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
	};
};

export default useRequestInitialState;
