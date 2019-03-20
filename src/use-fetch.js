import { useEffect } from "react";
import useLazyFetch from "./lazy-fetch";

const useFetch = itemToFetch => {
	const { fetch: doTheFetch, ...result } = useLazyFetch(itemToFetch);

	// JSON.stringify: just relax, it's fine
	// https://github.com/facebook/react/issues/14476#issuecomment-471199055
	useEffect(doTheFetch, [JSON.stringify(itemToFetch)]);

	return result;
};

export default useFetch;
