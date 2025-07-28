import { method } from "@vtex/api"
import ConnectorMiddleware from "./middlewares/connectorMiddleware";
import parseRawBody from "./middlewares/parseBody";

const connectorMiddleware = new ConnectorMiddleware();

const routes = {
	authorize: method({
		POST: [parseRawBody, connectorMiddleware.authorize],
	}),
	cancel: method({
		POST: [parseRawBody, connectorMiddleware.cancel],
	}),
	settle: method({
		POST: [parseRawBody, connectorMiddleware.settle],
	}),
	refund: method({
		POST: [parseRawBody, connectorMiddleware.refund],
	}),
};

export default routes
