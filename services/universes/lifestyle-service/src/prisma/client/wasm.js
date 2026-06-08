
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

exports.Prisma.CultureStoryScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  content: 'content',
  excerpt: 'excerpt',
  coverImage: 'coverImage',
  categoryId: 'categoryId',
  authorId: 'authorId',
  status: 'status',
  viewCount: 'viewCount',
  readTime: 'readTime',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.StoryCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description'
};

exports.Prisma.StoryCommentScalarFieldEnum = {
  id: 'id',
  content: 'content',
  authorId: 'authorId',
  storyId: 'storyId',
  parentId: 'parentId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  description: 'description',
  coverImage: 'coverImage',
  startDate: 'startDate',
  endDate: 'endDate',
  location: 'location',
  venue: 'venue',
  isOnline: 'isOnline',
  onlineLink: 'onlineLink',
  maxAttendees: 'maxAttendees',
  status: 'status',
  categoryId: 'categoryId',
  creatorId: 'creatorId',
  viewCount: 'viewCount',
  rsvpCount: 'rsvpCount',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.EventCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  description: 'description',
  icon: 'icon'
};

exports.Prisma.EventRsvpScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  eventId: 'eventId',
  status: 'status',
  guests: 'guests',
  note: 'note',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  username: 'username',
  displayName: 'displayName',
  avatarUrl: 'avatarUrl',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SavedItemScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  itemType: 'itemType',
  itemId: 'itemId',
  note: 'note',
  createdAt: 'createdAt'
};

exports.Prisma.ShareRecordScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  itemType: 'itemType',
  itemId: 'itemId',
  platform: 'platform',
  createdAt: 'createdAt'
};

exports.Prisma.CityGuideEntryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  type: 'type',
  description: 'description',
  coverImage: 'coverImage',
  address: 'address',
  city: 'city',
  country: 'country',
  latitude: 'latitude',
  longitude: 'longitude',
  rating: 'rating',
  priceLevel: 'priceLevel',
  hours: 'hours',
  phone: 'phone',
  website: 'website',
  amenities: 'amenities',
  status: 'status',
  viewCount: 'viewCount',
  createdById: 'createdById',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CityGuideTagScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug'
};

exports.Prisma.MusicEntryScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  type: 'type',
  description: 'description',
  coverImage: 'coverImage',
  artistName: 'artistName',
  albumName: 'albumName',
  duration: 'duration',
  genre: 'genre',
  trackUrl: 'trackUrl',
  isPremium: 'isPremium',
  playCount: 'playCount',
  status: 'status',
  createdById: 'createdById',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CelebrityEntryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  bio: 'bio',
  coverImage: 'coverImage',
  profession: 'profession',
  nationality: 'nationality',
  birthDate: 'birthDate',
  socialLinks: 'socialLinks',
  isFeatured: 'isFeatured',
  viewCount: 'viewCount',
  status: 'status',
  createdById: 'createdById',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CelebrityNewsScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  content: 'content',
  excerpt: 'excerpt',
  coverImage: 'coverImage',
  celebrityId: 'celebrityId',
  status: 'status',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.NightlifeEntryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  slug: 'slug',
  type: 'type',
  description: 'description',
  coverImage: 'coverImage',
  address: 'address',
  city: 'city',
  country: 'country',
  latitude: 'latitude',
  longitude: 'longitude',
  hours: 'hours',
  dressCode: 'dressCode',
  coverCharge: 'coverCharge',
  rating: 'rating',
  status: 'status',
  viewCount: 'viewCount',
  createdById: 'createdById',
  publishedAt: 'publishedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InfluencerEntryScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  slug: 'slug',
  displayName: 'displayName',
  bio: 'bio',
  avatarUrl: 'avatarUrl',
  coverImage: 'coverImage',
  category: 'category',
  followerCount: 'followerCount',
  followingCount: 'followingCount',
  postCount: 'postCount',
  isVerified: 'isVerified',
  socialLinks: 'socialLinks',
  collaborationCount: 'collaborationCount',
  status: 'status',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InfluencerCollaborationScalarFieldEnum = {
  id: 'id',
  influencerId: 'influencerId',
  brandName: 'brandName',
  campaignName: 'campaignName',
  description: 'description',
  coverImage: 'coverImage',
  startDate: 'startDate',
  endDate: 'endDate',
  status: 'status',
  createdAt: 'createdAt'
};

exports.Prisma.ChallengeScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  description: 'description',
  coverImage: 'coverImage',
  type: 'type',
  startDate: 'startDate',
  endDate: 'endDate',
  prize: 'prize',
  rules: 'rules',
  status: 'status',
  participantCount: 'participantCount',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.ChallengeSubmissionScalarFieldEnum = {
  id: 'id',
  challengeId: 'challengeId',
  userId: 'userId',
  content: 'content',
  mediaUrl: 'mediaUrl',
  status: 'status',
  votes: 'votes',
  submittedAt: 'submittedAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PollScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  description: 'description',
  coverImage: 'coverImage',
  status: 'status',
  totalVotes: 'totalVotes',
  createdById: 'createdById',
  expiresAt: 'expiresAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PollOptionScalarFieldEnum = {
  id: 'id',
  pollId: 'pollId',
  text: 'text',
  imageUrl: 'imageUrl',
  voteCount: 'voteCount',
  createdAt: 'createdAt'
};

exports.Prisma.PollVoteScalarFieldEnum = {
  id: 'id',
  pollId: 'pollId',
  optionId: 'optionId',
  userId: 'userId',
  votedAt: 'votedAt'
};

exports.Prisma.QuizScalarFieldEnum = {
  id: 'id',
  title: 'title',
  slug: 'slug',
  description: 'description',
  coverImage: 'coverImage',
  category: 'category',
  difficulty: 'difficulty',
  timeLimit: 'timeLimit',
  status: 'status',
  playCount: 'playCount',
  createdById: 'createdById',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.QuizQuestionScalarFieldEnum = {
  id: 'id',
  quizId: 'quizId',
  question: 'question',
  options: 'options',
  correctAnswer: 'correctAnswer',
  explanation: 'explanation',
  points: 'points',
  order: 'order'
};

exports.Prisma.QuizAttemptScalarFieldEnum = {
  id: 'id',
  quizId: 'quizId',
  userId: 'userId',
  score: 'score',
  totalQuestions: 'totalQuestions',
  answers: 'answers',
  completedAt: 'completedAt',
  startedAt: 'startedAt',
  updatedAt: 'updatedAt'
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

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};


exports.Prisma.ModelName = {
  CultureStory: 'CultureStory',
  StoryCategory: 'StoryCategory',
  StoryComment: 'StoryComment',
  Event: 'Event',
  EventCategory: 'EventCategory',
  EventRsvp: 'EventRsvp',
  User: 'User',
  SavedItem: 'SavedItem',
  ShareRecord: 'ShareRecord',
  CityGuideEntry: 'CityGuideEntry',
  CityGuideTag: 'CityGuideTag',
  MusicEntry: 'MusicEntry',
  CelebrityEntry: 'CelebrityEntry',
  CelebrityNews: 'CelebrityNews',
  NightlifeEntry: 'NightlifeEntry',
  InfluencerEntry: 'InfluencerEntry',
  InfluencerCollaboration: 'InfluencerCollaboration',
  Challenge: 'Challenge',
  ChallengeSubmission: 'ChallengeSubmission',
  Poll: 'Poll',
  PollOption: 'PollOption',
  PollVote: 'PollVote',
  Quiz: 'Quiz',
  QuizQuestion: 'QuizQuestion',
  QuizAttempt: 'QuizAttempt'
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
