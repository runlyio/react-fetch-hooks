import { get, isString } from "lodash";

const getMessage = ex =>
	get(
		ex,
		"exceptionMessage",
		get(ex, "message", get(ex, "ExceptionMessage", get(ex, "Message")))
	);

export default data => {
	if (isString(data)) return data;
	if (!data) return null;

	// if it is a .net exception, try to find the inner-most exception
	let ex = data;
	while (ex.innerException) {
		const origEx = ex;
		ex = ex.innerException;
		ex.outerException = origEx;
	}

	// try to look for a message or exception message
	let msg = getMessage(ex);

	while (!msg && ex.outerException) {
		// go back up the tree looking for more messages
		ex = ex.outerException;
		msg = getMessage(ex);
	}

	return msg;
};
