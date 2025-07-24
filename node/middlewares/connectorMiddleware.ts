import { AuthorizationRequest, CancellationRequest, RefundRequest, SettlementRequest } from "@vtex/payment-provider";
import PalomaConnector from "../connector";

export default class ConnectorMiddleware {
	public async authorize(context: Context, next: () => Promise<unknown>) {
		const connector = new PalomaConnector(context);
		const authorizationRequest = context.body as AuthorizationRequest;
		const authorizationResponse = await connector.authorize(authorizationRequest);
		context.body = authorizationResponse;

		await next();
	}

	public async cancel(context: Context, next: () => Promise<unknown>) {
		const connector = new PalomaConnector(context);
		const cancellationRequest = context.body as CancellationRequest;
		const cancellationResponse = await connector.cancel(cancellationRequest);
		context.body = cancellationResponse;

		await next();
	}

	public async settle(context: Context, next: () => Promise<unknown>) {
		const connector = new PalomaConnector(context);
		const settleRequest = context.body as SettlementRequest;
		const settleResponse = await connector.settle(settleRequest);
		context.body = settleResponse;

		await next();
	}

	public async refund(context: Context, next: () => Promise<unknown>) {
		const connector = new PalomaConnector(context);
		const refundRequest = context.body as RefundRequest;
		const refundResponse = await connector.refund(refundRequest);
		context.body = refundResponse;

		await next();
	}
}