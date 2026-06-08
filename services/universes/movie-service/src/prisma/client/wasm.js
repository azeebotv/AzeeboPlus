
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 5.22.0
 * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
 */
Prisma.prismaVersion = {
  client: "5.22.0",
  engine: "605197351a3c8bdd595af2d2a9bc3025bca48ea2"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.NotFoundError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`NotFoundError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  password: 'password',
  displayName: 'displayName',
  avatar: 'avatar',
  role: 'role',
  preferences: 'preferences',
  notificationPreferences: 'notificationPreferences',
  trustScore: 'trustScore',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WatchHistoryScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  contentId: 'contentId',
  contentType: 'contentType',
  watchedAt: 'watchedAt',
  createdAt: 'createdAt'
};

exports.Prisma.SavedItemScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  contentId: 'contentId',
  createdAt: 'createdAt'
};

exports.Prisma.WalletScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  balance: 'balance',
  bonusBalance: 'bonusBalance',
  promoBalance: 'promoBalance',
  currency: 'currency',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WalletTransactionScalarFieldEnum = {
  id: 'id',
  walletId: 'walletId',
  type: 'type',
  amount: 'amount',
  status: 'status',
  description: 'description',
  reference: 'reference',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  title: 'title',
  message: 'message',
  metadata: 'metadata',
  readAt: 'readAt',
  createdAt: 'createdAt'
};

exports.Prisma.PaymentIntentScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  amount: 'amount',
  currency: 'currency',
  status: 'status',
  description: 'description',
  providerReference: 'providerReference',
  metadata: 'metadata',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RefundScalarFieldEnum = {
  id: 'id',
  paymentIntentId: 'paymentIntentId',
  amount: 'amount',
  reason: 'reason',
  status: 'status',
  providerReference: 'providerReference',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UniverseScalarFieldEnum = {
  id: 'id',
  name: 'name',
  displayName: 'displayName',
  description: 'description',
  icon: 'icon',
  color: 'color',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  icon: 'icon',
  color: 'color',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  movieId: 'movieId'
};

exports.Prisma.TagScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  movieId: 'movieId'
};

exports.Prisma.ContentItemScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  thumbnail: 'thumbnail',
  mediaUrl: 'mediaUrl',
  universeId: 'universeId',
  creatorId: 'creatorId',
  status: 'status',
  viewCount: 'viewCount',
  metadata: 'metadata',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  creatorProfileId: 'creatorProfileId'
};

exports.Prisma.MediaAssetScalarFieldEnum = {
  id: 'id',
  contentItemId: 'contentItemId',
  originalUrl: 'originalUrl',
  thumbnailUrl: 'thumbnailUrl',
  format: 'format',
  size: 'size',
  duration: 'duration',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CreatorProfileScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  bio: 'bio',
  banner: 'banner',
  socialLinks: 'socialLinks',
  verified: 'verified',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RewardAccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  points: 'points',
  levelId: 'levelId',
  streak: 'streak',
  lastLoginAt: 'lastLoginAt',
  lastCheckInAt: 'lastCheckInAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.LevelScalarFieldEnum = {
  id: 'id',
  name: 'name',
  rank: 'rank',
  minPoints: 'minPoints',
  icon: 'icon',
  color: 'color',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.BadgeScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  icon: 'icon',
  points: 'points',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MissionScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  points: 'points',
  type: 'type',
  isActive: 'isActive',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.MissionRewardScalarFieldEnum = {
  id: 'id',
  missionId: 'missionId',
  rewardId: 'rewardId',
  quantity: 'quantity',
  createdAt: 'createdAt'
};

exports.Prisma.MissionCompletionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  missionId: 'missionId',
  completedAt: 'completedAt'
};

exports.Prisma.RewardScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  cost: 'cost',
  type: 'type',
  metadata: 'metadata',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RewardRedemptionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  rewardId: 'rewardId',
  pointsCost: 'pointsCost',
  redeemedAt: 'redeemedAt'
};

exports.Prisma.PointsLedgerScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  points: 'points',
  type: 'type',
  reason: 'reason',
  metadata: 'metadata',
  createdAt: 'createdAt'
};

exports.Prisma.SearchQueryLogScalarFieldEnum = {
  id: 'id',
  query: 'query',
  count: 'count',
  lastSearchAt: 'lastSearchAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserSearchScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  queryId: 'queryId',
  resultsCount: 'resultsCount',
  createdAt: 'createdAt'
};

exports.Prisma.ProductEventScalarFieldEnum = {
  id: 'id',
  type: 'type',
  userId: 'userId',
  sessionId: 'sessionId',
  metadata: 'metadata',
  timestamp: 'timestamp',
  createdAt: 'createdAt'
};

exports.Prisma.ReportScalarFieldEnum = {
  id: 'id',
  reportingUserId: 'reportingUserId',
  type: 'type',
  contentId: 'contentId',
  userId: 'userId',
  reason: 'reason',
  status: 'status',
  resolvedBy: 'resolvedBy',
  resolutionAction: 'resolutionAction',
  resolutionReason: 'resolutionReason',
  resolvedAt: 'resolvedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ModerationCaseScalarFieldEnum = {
  id: 'id',
  reportId: 'reportId',
  userId: 'userId',
  status: 'status',
  resolvedBy: 'resolvedBy',
  resolutionAction: 'resolutionAction',
  resolutionReason: 'resolutionReason',
  resolvedAt: 'resolvedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AppealScalarFieldEnum = {
  id: 'id',
  caseId: 'caseId',
  userId: 'userId',
  reason: 'reason',
  status: 'status',
  resolvedBy: 'resolvedBy',
  resolutionReason: 'resolutionReason',
  resolvedAt: 'resolvedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CreatorEarningScalarFieldEnum = {
  id: 'id',
  creatorId: 'creatorId',
  amount: 'amount',
  type: 'type',
  referenceId: 'referenceId',
  status: 'status',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
  creatorProfileId: 'creatorProfileId'
};

exports.Prisma.MovieScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  thumbnail: 'thumbnail',
  banner: 'banner',
  mediaUrl: 'mediaUrl',
  universeId: 'universeId',
  creatorId: 'creatorId',
  status: 'status',
  viewCount: 'viewCount',
  metadata: 'metadata',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RentalScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  movieId: 'movieId',
  status: 'status',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt'
};

exports.Prisma.PremiereScalarFieldEnum = {
  id: 'id',
  movieId: 'movieId',
  startsAt: 'startsAt',
  endsAt: 'endsAt',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.WatchlistItemScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  movieId: 'movieId',
  createdAt: 'createdAt'
};

exports.Prisma.ViewingWindowScalarFieldEnum = {
  id: 'id',
  movieId: 'movieId',
  startsAt: 'startsAt',
  endsAt: 'endsAt',
  type: 'type',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CinemaPassScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  type: 'type',
  price: 'price',
  currency: 'currency',
  features: 'features',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CinemaPassSubscriptionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  passId: 'passId',
  status: 'status',
  startDate: 'startDate',
  endDate: 'endDate',
  autoRenew: 'autoRenew',
  paymentIntentId: 'paymentIntentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FilmmakerProjectScalarFieldEnum = {
  id: 'id',
  filmmakerId: 'filmmakerId',
  title: 'title',
  description: 'description',
  thumbnail: 'thumbnail',
  status: 'status',
  fundingGoal: 'fundingGoal',
  fundingRaised: 'fundingRaised',
  targetDate: 'targetDate',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FilmmakerUpdateScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  title: 'title',
  content: 'content',
  createdAt: 'createdAt'
};

exports.Prisma.FilmmakerBackerScalarFieldEnum = {
  id: 'id',
  projectId: 'projectId',
  userId: 'userId',
  amount: 'amount',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};


exports.Prisma.ModelName = {
  User: 'User',
  WatchHistory: 'WatchHistory',
  SavedItem: 'SavedItem',
  Wallet: 'Wallet',
  WalletTransaction: 'WalletTransaction',
  Notification: 'Notification',
  PaymentIntent: 'PaymentIntent',
  Refund: 'Refund',
  Universe: 'Universe',
  Category: 'Category',
  Tag: 'Tag',
  ContentItem: 'ContentItem',
  MediaAsset: 'MediaAsset',
  CreatorProfile: 'CreatorProfile',
  RewardAccount: 'RewardAccount',
  Level: 'Level',
  Badge: 'Badge',
  Mission: 'Mission',
  MissionReward: 'MissionReward',
  MissionCompletion: 'MissionCompletion',
  Reward: 'Reward',
  RewardRedemption: 'RewardRedemption',
  PointsLedger: 'PointsLedger',
  SearchQueryLog: 'SearchQueryLog',
  UserSearch: 'UserSearch',
  ProductEvent: 'ProductEvent',
  Report: 'Report',
  ModerationCase: 'ModerationCase',
  Appeal: 'Appeal',
  CreatorEarning: 'CreatorEarning',
  Movie: 'Movie',
  Rental: 'Rental',
  Premiere: 'Premiere',
  WatchlistItem: 'WatchlistItem',
  ViewingWindow: 'ViewingWindow',
  CinemaPass: 'CinemaPass',
  CinemaPassSubscription: 'CinemaPassSubscription',
  FilmmakerProject: 'FilmmakerProject',
  FilmmakerUpdate: 'FilmmakerUpdate',
  FilmmakerBacker: 'FilmmakerBacker'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }
        
        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
