import { useEffect } from "react";
import useLazyFetch from "./lazy-fetch";

const useFetch = (...args) => {
	const { fetch: doTheFetch, ...result } = useLazyFetch(...args);

	// JSON.stringify: just relax, it's fine
	// https://github.com/facebook/react/issues/14476#issuecomment-471199055
	useEffect(doTheFetch, [JSON.stringify(args)]);

	return result;
};

export default useFetch;
