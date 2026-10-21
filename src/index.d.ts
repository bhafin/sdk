import type {
  AssetMix,
  SectorMix,
  IssuerMix,
  PositionInput,
  Account,
  Client,
  ClientsList,
  Investor,
  InvestorsList,
  InvestorCreate,
  InvestorUpdate,
  Portfolio,
  PortfoliosList,
  PortfolioCreate,
  SnapshotCreate,
  SnapshotView,
  FundsList,
  FundReferences,
} from "./models.js";
export type * from "./models.js";
export type Auth =
  | {
      readonly type: "account_key";
      readonly apiKey: string;
      readonly userAccessToken?: never;
    }
  | {
      readonly type: "delegated_application";
      readonly apiKey: string;
      readonly userAccessToken: string;
    };
export interface BharosaConfig {
  readonly baseUrl: string;
  readonly account: string;
  readonly auth: Auth;
  readonly allowLocalhostHttp?: boolean;
  readonly maxResponseBytes?: number;
  /** Trusted transport injection for synthetic tests. Receives credentials; never use an untrusted implementation. */ readonly fetch?: typeof globalThis.fetch;
}
export interface RequestOptions {
  idempotencyKey?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
  maxRetries?: 0 | 1 | 2;
}
export interface IdempotentOptions extends RequestOptions {
  idempotencyKey: string;
}
export interface ListOptions {
  limit?: number;
  startingAfter?: string;
}
export interface FilteredListOptions extends ListOptions {
  client?: string;
}
export type MutationOutcome =
  "not_applicable" | "not_sent" | "rejected" | "unknown";
export class BharosaError extends Error {
  readonly kind:
    | "validation"
    | "api"
    | "transport"
    | "timeout"
    | "abort"
    | "invalid_response";
  readonly outcome: MutationOutcome;
  readonly status?: number;
  readonly requestId?: string;
  readonly code?: string;
  readonly param?: string | null;
  readonly type?: string;
}
export class ValidationError extends BharosaError {}
export class APIError extends BharosaError {}
export class TransportError extends BharosaError {}
export class TimeoutError extends BharosaError {}
export class AbortError extends BharosaError {}
export class InvalidResponseError extends BharosaError {}
export interface MixOptions {
  asOf?: string;
}
export interface PortfolioMethods {
  assetMix(params?: MixOptions, options?: RequestOptions): Promise<AssetMix>;
  sectorMix(params?: MixOptions, options?: RequestOptions): Promise<SectorMix>;
  issuerMix(params?: MixOptions, options?: RequestOptions): Promise<IssuerMix>;
}
export interface InMemoryPortfolioInput {
  valuationDate: string;
  currency?: "INR";
  positions: ReadonlyArray<Readonly<PositionInput>>;
}
export interface InMemoryPortfolio extends PortfolioMethods {
  readonly positions: ReadonlyArray<Readonly<PositionInput>>;
}
export type PortfolioObject = Portfolio &
  PortfolioMethods & {
    currentSnapshot(options?: RequestOptions): Promise<SnapshotPortfolioView>;
  };
type Fields<T> = { [K in keyof T as string extends K ? never : K]: T[K] };
export type SnapshotPortfolioView = Omit<Fields<SnapshotView>, "portfolio"> & {
  portfolio: PortfolioObject;
};
export type PortfolioObjectsList = Omit<Fields<PortfoliosList>, "data"> & {
  data: PortfolioObject[];
};
export interface MutualFundObject extends PortfolioMethods {
  readonly portfolio: PortfolioMethods;
  readonly mutual_fund_id?: string;
  readonly instrument?: string;
}
export type FundObjectsList = Omit<Fields<FundsList>, "data"> & {
  data: Array<
    FundsList["data"][number] & {
      instrument: FundsList["data"][number]["instrument"] & MutualFundObject;
    }
  >;
};
export type FundObjectReferences = Omit<Fields<FundReferences>, "data"> & {
  data: Array<
    FundReferences["data"][number] & {
      instrument: FundReferences["data"][number]["instrument"] &
        MutualFundObject;
    }
  >;
};
export class Bharosa {
  constructor(config: BharosaConfig);
  readonly accounts: {
    readonly retrieve: (options?: RequestOptions) => Promise<Account>;
  };
  readonly clients: {
    readonly list: (
      params?: ListOptions,
      options?: RequestOptions,
    ) => Promise<ClientsList>;
    readonly retrieve: (
      id: string,
      options?: RequestOptions,
    ) => Promise<Client>;
  };
  readonly investors: {
    readonly list: (
      params?: FilteredListOptions,
      options?: RequestOptions,
    ) => Promise<InvestorsList>;
    readonly retrieve: (
      id: string,
      options?: RequestOptions,
    ) => Promise<Investor>;
    readonly create: (
      body: InvestorCreate,
      options: IdempotentOptions,
    ) => Promise<Investor>;
    readonly update: (
      id: string,
      body: InvestorUpdate,
      options?: RequestOptions,
    ) => Promise<Investor>;
  };
  readonly portfolios: {
    readonly build: (input: InMemoryPortfolioInput) => InMemoryPortfolio;
    readonly fromPositions: (
      input: InMemoryPortfolioInput,
    ) => InMemoryPortfolio;
    readonly list: (
      params?: FilteredListOptions,
      options?: RequestOptions,
    ) => Promise<PortfolioObjectsList>;
    readonly retrieve: (
      id: string,
      options?: RequestOptions,
    ) => Promise<PortfolioObject>;
    readonly create: (
      body: PortfolioCreate,
      options: IdempotentOptions,
    ) => Promise<SnapshotPortfolioView>;
    readonly snapshots: {
      readonly retrieveCurrent: (
        id: string,
        options?: RequestOptions,
      ) => Promise<SnapshotPortfolioView>;
      readonly create: (
        id: string,
        body: SnapshotCreate,
        options: IdempotentOptions,
      ) => Promise<SnapshotPortfolioView>;
    };
  };
  readonly mutualFunds: {
    readonly fromId: (mutualFundId: string) => MutualFundObject;
    readonly fromInstrument: (instrument: string) => MutualFundObject;
    readonly search: (
      params: { query: string; limit?: number },
      options?: RequestOptions,
    ) => Promise<FundObjectsList>;
    readonly references: (
      params: { instruments: string[] },
      options?: RequestOptions,
    ) => Promise<FundObjectReferences>;
  };
}
