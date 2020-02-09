/* eslint-disable func-names */
import {
  Context,
  IOClients,
  method,
  ParamsContext,
  RecorderState,
  RouteHandler,
  Service,
  ServiceConfig,
  ServiceContext,
} from '@vtex/api'
import { json as requestParser } from 'co-body'
import { omit, pickAll } from 'ramda'

import {
  AuthorizationRequest,
  AuthorizationResponse,
  AvailablePaymentsResponse,
  CancellationRequest,
  CancellationResponse,
  InboundRequest,
  InboundResponse,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  SettlementRequest,
  SettlementResponse,
} from './types'

type PromiseOrValue<Value> = Promise<Value> | Value

export interface ConnectorContext<
  RequestT extends PaymentRequest,
  ClientsT extends IOClients = IOClients
> extends Context<ClientsT> {
  connector: {
    appKey: string
    appToken: string
    paymentId: string
    transactionId: string
    requestId: string
    content: RequestT
  }
}

export type ConnectorHandler<
  ClientsT extends IOClients,
  RequestT extends PaymentRequest,
  ResponseT extends PaymentResponse
> = (ctx: ConnectorContext<RequestT, ClientsT>) => PromiseOrValue<ResponseT>

export interface ConnectorOptions<ClientsT extends IOClients> {
  authorize: ConnectorHandler<
    ClientsT,
    AuthorizationRequest,
    AuthorizationResponse
  >
  settle: ConnectorHandler<ClientsT, SettlementRequest, SettlementResponse>
  refund: ConnectorHandler<ClientsT, RefundRequest, RefundResponse>
  inbound?: ConnectorHandler<ClientsT, InboundRequest, InboundResponse>
  cancel: ConnectorHandler<ClientsT, CancellationRequest, CancellationResponse>
  paymentMethods: (
    ctx: Context<ClientsT>
  ) => PromiseOrValue<AvailablePaymentsResponse>
}

export interface ConnectorServiceConfig<
  ClientsT extends IOClients,
  StateT extends RecorderState,
  CustomT extends ParamsContext
> extends ServiceConfig<ClientsT, StateT, CustomT> {
  connector: ConnectorOptions<ClientsT>
}

// tslint:disable-next-line:ban-types
export const renameFunction = (name: string, fn: Function) => {
  Object.defineProperty(fn, 'name', { value: name })
}

const promisify = async <Value>(
  pOrValue: PromiseOrValue<Value>
): Promise<Value> => pOrValue

const pickContext: <ClientsT extends IOClients>(
  ctx: ServiceContext<ClientsT>
) => Context<ClientsT> = pickAll([
  'clients',
  'vtex',
  'timings',
  'metrics',
  'previousTimerStart',
  'serverTiming',
])

const buildConnectorContext = async <
  ClientsT extends IOClients,
  StateT extends RecorderState,
  CustomT extends ParamsContext,
  RequestT extends PaymentRequest
>(
  serviceContext: ServiceContext<ClientsT, StateT, CustomT>
): Promise<ConnectorContext<RequestT, ClientsT>> => {
  const content = (await requestParser(serviceContext.req)) as RequestT
  const vtexContext = pickContext(serviceContext)
  const {
    'x-provider-api-appkey': providerKey,
    'x-provider-api-apptoken': providerToken,
  } = serviceContext.headers
  return {
    ...vtexContext,
    connector: {
      appKey: providerKey,
      appToken: providerToken,
      paymentId: content.paymentId,
      transactionId: content.transactionId,
      requestId: content.requestId,
      content,
    },
  }
}

type ContextBuilder<
  BuildedContext extends Context<ClientsT>,
  ClientsT extends IOClients = IOClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext
> = (
  ctx: ServiceContext<ClientsT, StateT, CustomT>
) => PromiseOrValue<BuildedContext>

type Handler<
  Response,
  BuildedContext extends Context<ClientsT>,
  ClientsT extends IOClients = IOClients
> = (ctx: BuildedContext) => PromiseOrValue<Response>

const routify = <
  Response,
  ClientsT extends IOClients = IOClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext,
  BuildedContext extends Context<ClientsT> = Context<ClientsT>
>(
  contextBuilder: ContextBuilder<BuildedContext, ClientsT, StateT, CustomT>,
  handler: Handler<Response, BuildedContext, ClientsT>
): RouteHandler<ClientsT, StateT, CustomT> => {
  // tslint:disable-next-line:only-arrow-functions
  const routeHandler = async function(
    ctx: ServiceContext<ClientsT, StateT, CustomT>,
    next: () => Promise<unknown>
  ) {
    const buildedContext = await promisify(contextBuilder(ctx))
    const result = await promisify(handler(buildedContext))
    ctx.body = result
    ctx.status = 200
    await next()
  }
  renameFunction(handler.name, routeHandler)
  return routeHandler
}

async function notImplemented(
  ctx: ServiceContext,
  next: () => Promise<unknown>
) {
  ctx.status = 501
  await next()
}

const buildConnectorRoutes = <
  ClientsT extends IOClients,
  StateT extends RecorderState,
  CustomT extends ParamsContext
>(
  config: ConnectorServiceConfig<ClientsT, StateT, CustomT>
) => {
  const connectorRoutify = <
    Request extends PaymentRequest,
    Response extends PaymentResponse
  >(
    handler: ConnectorHandler<ClientsT, Request, Response>
  ): RouteHandler<ClientsT, StateT, CustomT> =>
    routify<
      Response,
      ClientsT,
      StateT,
      CustomT,
      ConnectorContext<Request, ClientsT>
    >(buildConnectorContext, handler)
  return {
    authorizations: method({
      POST: connectorRoutify<AuthorizationRequest, AuthorizationResponse>(
        config.connector.authorize
      ),
    }),
    settlements: method({
      POST: connectorRoutify<SettlementRequest, SettlementResponse>(
        config.connector.settle
      ),
    }),
    refunds: method({
      POST: connectorRoutify<RefundRequest, RefundResponse>(
        config.connector.refund
      ),
    }),
    cancellations: method({
      POST: connectorRoutify<CancellationRequest, CancellationResponse>(
        config.connector.cancel
      ),
    }),
    inbound: method({
      POST: config.connector.inbound
        ? connectorRoutify(config.connector.inbound)
        : notImplemented,
    }),
    paymentMethods: method({
      GET: routify<AvailablePaymentsResponse, ClientsT, StateT, CustomT>(
        pickContext,
        config.connector.paymentMethods
      ),
    }),
  }
}

export class ConnectorService<
  ClientsT extends IOClients,
  StateT extends RecorderState,
  CustomT extends ParamsContext
> extends Service<ClientsT, StateT, CustomT> {
  constructor(config: ConnectorServiceConfig<ClientsT, StateT, CustomT>) {
    super(
      omit(['connector'], {
        ...config,
        routes: {
          ...buildConnectorRoutes(config),
          ...config.routes,
        },
      })
    )
  }
}
