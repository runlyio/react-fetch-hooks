import { useCallback } from "react";
import checkStatus from "./check-status";

const useFetchFn = ({
	refreshInterval,
	resetDelay,
	url,
	opts,
	resetTimer,
	setIsFetching,
	setIsFetched,
	setError,
	setBody,
	setHeaders
}) =>
	useCallback(() => {
		resetTimer(0);

		if (url) {
			setIsFetching(true);
			setError(null);
			doFetch();
		}

		async function doFetch() {
			try {
				let _response = await fetch(url, opts);
				let _headers;
				let _body;

				_response = await checkStatus(_response);

				_headers = _response.headers;

				if (_response.status != 204) {
					_body = await _response.json();
				} else {
					// for 204 No Content, just return null data
					_body = null;
				}

				setBody(_body);
				setHeaders(_headers);
				setIsFetching(false);
				setIsFetched(true);
				setError(null);

				if (resetDelay) {
					resetTimer(s => s + 1);
				}

				if (refreshInterval) {
					resetTimer(s => s + 1);
				}
			} catch (ex) {
				setIsFetching(false);
				setError(ex);
			}
		}
		// JSON.stringify: just relax, it's fine
		// https://github.com/facebook/react/issues/14476#issuecomment-471199055
	}, [refreshInterval, resetDelay, url, JSON.stringify(opts)]); // eslint-disable-line react-hooks/exhaustive-deps

export default useFetchFn;
