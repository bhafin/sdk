import type {
  MarketDataClient,
  CurrentHoldingsInput,
  CurrentHoldingsResult,
} from "./market-types.cjs";
export type * from "./market-types.cjs";
import type {
  Holding,
  HoldingPosition,
  HistoryCapability,
  HistoryView,
  HistoryImport,
  HistoryImportResult,
  HoldingsList,
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
} from "./models.cjs";
export type * from "./models.cjs";
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
/** Trusted caller-owned transport. Authentication, session handling and origin policy belong to the host application. */
export interface BharosaTransport {
  send(url: string, request: RequestInit): Promise<Response>;
}
interface BharosaBaseConfig {
  readonly baseUrl: string;
  readonly account: string;
  readonly allowLocalhostHttp?: boolean;
  readonly maxResponseBytes?: number;
}
export type BharosaConfig = BharosaBaseConfig &
  (
    | {
        readonly auth: Auth;
        readonly fetch?: typeof globalThis.fetch;
        readonly transport?: never;
      }
    | {
        readonly transport: BharosaTransport;
        readonly auth?: never;
        readonly fetch?: never;
      }
  );
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
export interface DatedPortfolioMethods {
  assetMix(
    params?: MixOptions & { valuationDate?: string },
    options?: RequestOptions,
  ): Promise<AssetMix>;
  sectorMix(
    params?: MixOptions & { valuationDate?: string },
    options?: RequestOptions,
  ): Promise<SectorMix>;
  issuerMix(
    params?: MixOptions & { valuationDate?: string },
    options?: RequestOptions,
  ): Promise<IssuerMix>;
  on(date: string): DatedPortfolioMethods;
}
export type HoldingObject = Holding & {
  positionOn(date: string, options?: RequestOptions): Promise<HoldingPosition>;
};
export interface InMemoryPortfolio extends PortfolioMethods {
  on(date: string): DatedPortfolioMethods;
  readonly positions: ReadonlyArray<Readonly<PositionInput>>;
}
export interface CurrentPortfolioMethods {
  assetMix(
    params?: Record<string, never>,
    options?: RequestOptions,
  ): Promise<AssetMix & CurrentMixEvidence>;
  sectorMix(
    params?: Record<string, never>,
    options?: RequestOptions,
  ): Promise<SectorMix & CurrentMixEvidence>;
  issuerMix(
    params?: Record<string, never>,
    options?: RequestOptions,
  ): Promise<IssuerMix & CurrentMixEvidence>;
}
export interface CurrentMixEvidence {
  current_valuation: {
    valuation_date: string;
    holdings: Array<{
      holding: string;
      investment_account: string;
      instrument: string;
      scheme_id: string;
      status: "available";
      units: string;
      as_of: string;
      position_date: string;
      value: { amount: string; currency: "INR" };
      nav: { amount: string; currency: "INR"; date: string };
      freshness: {
        status: "recent" | "stale";
        age_days: number;
        recent_within_days: 3;
        time_zone: "Asia/Kolkata";
      };
      ownership_status: "user_supplied_not_verified";
      valuation_basis: "units_times_latest_nav";
      revision: number | null;
      source: { kind: "user" | "statement"; reference: string };
      derivation:
        | import("./market-types.cjs").CurrentHoldingsResult["holdings"][number]["derivation"]
        | null;
    }>;
  };
}
export type PortfolioObject = Portfolio &
  PortfolioMethods & {
    current(): CurrentPortfolioMethods;
    currentSnapshot(options?: RequestOptions): Promise<SnapshotPortfolioView>;
    on(date: string): DatedPortfolioMethods;
    readonly history: {
      retrieve(options?: RequestOptions): Promise<HistoryView>;
      import(
        body: HistoryImport,
        options: IdempotentOptions,
      ): Promise<HistoryImportResult>;
      canReconstruct(
        date: string,
        options?: RequestOptions,
      ): Promise<HistoryCapability>;
    };
    readonly holdings: {
      setCurrent(
        body: CurrentHoldingsInput,
        options: IdempotentOptions,
      ): Promise<CurrentHoldingsResult>;
      retrieve(
        holding: string,
        options?: RequestOptions,
      ): Promise<HoldingObject>;
      list(
        params?: { date?: string },
        options?: RequestOptions,
      ): Promise<Omit<HoldingsList, "data"> & { data: HoldingObject[] }>;
    };
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
export interface ClientSurface {
  readonly marketData: MarketDataClient;
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
