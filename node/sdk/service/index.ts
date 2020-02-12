/* eslint-disable func-names */
import {
  Context,
  method,
  ParamsContext,
  RecorderState,
  RouteHandler,
  Service,
  ServiceConfig,
  ServiceContext,
} from '@vtex/api'
import { json as requestParser } from 'co-body'
import { head, omit, tail } from 'ramda'

import { PaymentProviderClients } from '../clients'
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
} from './typings/api'

type PromiseOrValue<Value> = Promise<Value> | Value

export type PaymentProviderContext<
  RequestT extends PaymentRequest = PaymentRequest,
  ClientsT extends PaymentProviderClients = PaymentProviderClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext
> = ServiceContext<ClientsT, StateT, CustomT> & {
  paymentProvider: {
    appKey: string
    appToken: string
    paymentId: string
    transactionId: string
    requestId: string
    content: RequestT
  }
}

type PaymentProviderHandlerImpl<
  ClientsT extends PaymentProviderClients = PaymentProviderClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext,
  RequestT extends PaymentRequest = PaymentRequest,
  ResponseT extends PaymentResponse = PaymentResponse
> = (
  ctx: PaymentProviderContext<RequestT, ClientsT, StateT, CustomT>
) => PromiseOrValue<ResponseT>

export type PaymentProviderHandler<
  ClientsT extends PaymentProviderClients = PaymentProviderClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext,
  RequestT extends PaymentRequest = PaymentRequest,
  ResponseT extends PaymentResponse = PaymentResponse
> =
  | PaymentProviderHandlerImpl<ClientsT, StateT, CustomT, RequestT, ResponseT>
  | [
      PaymentProviderHandlerImpl<
        ClientsT,
        StateT,
        CustomT,
        RequestT,
        ResponseT
      >,
      // tslint:disable-next-line:array-type
      ...Array<RouteHandler<ClientsT, StateT, CustomT>>
    ]

export interface PaymentProviderOptions<
  ClientsT extends PaymentProviderClients = PaymentProviderClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext
> {
  authorize: PaymentProviderHandler<
    ClientsT,
    StateT,
    CustomT,
    AuthorizationRequest,
    AuthorizationResponse
  >
  settle: PaymentProviderHandler<
    ClientsT,
    StateT,
    CustomT,
    SettlementRequest,
    SettlementResponse
  >
  refund: PaymentProviderHandler<
    ClientsT,
    StateT,
    CustomT,
    RefundRequest,
    RefundResponse
  >
  inbound?: PaymentProviderHandler<
    ClientsT,
    StateT,
    CustomT,
    InboundRequest,
    InboundResponse
  >
  cancel: PaymentProviderHandler<
    ClientsT,
    StateT,
    CustomT,
    CancellationRequest,
    CancellationResponse
  >
  paymentMethods: AvailablePaymentsResponse
}

export interface PaymentProviderServiceConfig<
  ClientsT extends PaymentProviderClients = PaymentProviderClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext
> extends ServiceConfig<ClientsT, StateT, CustomT> {
  paymentProvider: PaymentProviderOptions<ClientsT>
}

// tslint:disable-next-line:ban-types
const renameFunction = (name: string, fn: Function) => {
  Object.defineProperty(fn, 'name', { value: name })
}

const promisify = async <Value>(
  pOrValue: PromiseOrValue<Value>
): Promise<Value> => pOrValue

const buildPaymentProviderContext = async <
  ClientsT extends PaymentProviderClients,
  StateT extends RecorderState,
  CustomT extends ParamsContext,
  RequestT extends PaymentRequest
>(
  serviceContext: ServiceContext<ClientsT, StateT, CustomT>
): Promise<PaymentProviderContext<RequestT, ClientsT, StateT, CustomT>> => {
  const content = (await requestParser(serviceContext.req)) as RequestT
  const {
    'x-provider-api-appkey': providerKey,
    'x-provider-api-apptoken': providerToken,
  } = serviceContext.headers
  return {
    ...serviceContext,
    paymentProvider: {
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
  ClientsT extends PaymentProviderClients = PaymentProviderClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext
> = (
  ctx: ServiceContext<ClientsT, StateT, CustomT>
) => PromiseOrValue<BuildedContext>

type Handler<
  Response,
  BuildedContext extends Context<ClientsT>,
  ClientsT extends PaymentProviderClients = PaymentProviderClients
> = (ctx: BuildedContext) => PromiseOrValue<Response>

const routify = <
  Response,
  ClientsT extends PaymentProviderClients = PaymentProviderClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext,
  BuildedContext extends ServiceContext<
    ClientsT,
    StateT,
    CustomT
  > = ServiceContext<ClientsT, StateT, CustomT>
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

const isTuple = <First, Second>(
  tupleOrValue: First | [First, ...Second[]]
): tupleOrValue is [First, ...Second[]] =>
  (tupleOrValue as [First, ...Second[]]).length > 1

const buildPaymentProviderRoutes = <
  ClientsT extends PaymentProviderClients,
  StateT extends RecorderState,
  CustomT extends ParamsContext
>(
  config: PaymentProviderServiceConfig<ClientsT, StateT, CustomT>
) => {
  const paymentProviderRoutify = <
    Request extends PaymentRequest,
    Response extends PaymentResponse
  >(
    handler: PaymentProviderHandler<
      ClientsT,
      StateT,
      CustomT,
      Request,
      Response
    >
    // tslint:disable-next-line:array-type
  ): Array<RouteHandler<ClientsT, StateT, CustomT>> => {
    const { main, middlewares } = isTuple(handler)
      ? {
          // tslint:disable-next-line:array-type
          middlewares: tail(handler) as Array<
            RouteHandler<ClientsT, StateT, CustomT>
          >,
          main: head(handler),
        }
      : { middlewares: [], main: handler }
    const route = routify<
      Response,
      ClientsT,
      StateT,
      CustomT,
      PaymentProviderContext<Request, ClientsT, StateT, CustomT>
    >(buildPaymentProviderContext, main)
    return [...middlewares, route]
  }
  return {
    authorizations: method({
      POST: paymentProviderRoutify<AuthorizationRequest, AuthorizationResponse>(
        config.paymentProvider.authorize
      ),
    }),
    settlements: method({
      POST: paymentProviderRoutify<SettlementRequest, SettlementResponse>(
        config.paymentProvider.settle
      ),
    }),
    refunds: method({
      POST: paymentProviderRoutify<RefundRequest, RefundResponse>(
        config.paymentProvider.refund
      ),
    }),
    cancellations: method({
      POST: paymentProviderRoutify<CancellationRequest, CancellationResponse>(
        config.paymentProvider.cancel
      ),
    }),
    inbound: method({
      POST: config.paymentProvider.inbound
        ? paymentProviderRoutify(config.paymentProvider.inbound)
        : notImplemented,
    }),
    paymentMethods: method({
      GET: async function paymentMethods(
        ctx: ServiceContext,
        next: () => Promise<unknown>
      ) {
        ctx.status = 200
        ctx.body = config.paymentProvider.paymentMethods
        await next()
      },
    }),
  }
}

export class PaymentProviderService<
  ClientsT extends PaymentProviderClients = PaymentProviderClients,
  StateT extends RecorderState = RecorderState,
  CustomT extends ParamsContext = ParamsContext
> extends Service<ClientsT, StateT, CustomT> {
  constructor(config: PaymentProviderServiceConfig<ClientsT, StateT, CustomT>) {
    super(
      omit(['paymentProvider'], {
        ...config,
        routes: {
          ...buildPaymentProviderRoutes(config),
          ...config.routes,
        },
      })
    )
  }
}

export * from './typings/api'
