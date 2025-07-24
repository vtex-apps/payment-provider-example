import { method } from "@vtex/api"
import ConnectorMiddleware from "./middlewares/connectorMiddleware";
import parseRawBody from "./middlewares/parseBody";

const connectorMiddleware = new ConnectorMiddleware();

const routes = {
	payments: method({
		POST: [parseRawBody, connectorMiddleware.payments],
	}),
	cancellations: method({
		POST: [parseRawBody, connectorMiddleware.cancellations],
	}),
	settlements: method({
		POST: [parseRawBody, connectorMiddleware.settlements],
	}),
	refunds: method({
		POST: [parseRawBody, connectorMiddleware.refunds],
	}),
};

export default routes
