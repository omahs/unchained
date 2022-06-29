import { GraphQLUpload } from 'graphql-upload';
import { JSONResolver, TimestampResolver, DateTimeResolver, DateResolver } from 'graphql-scalars';
import Query from './queries';
import Mutation from './mutations';
import Types from './type';

export default {
  ...Types,
  Upload: GraphQLUpload,
  JSON: JSONResolver,
  Query,
  Mutation,
  DateTime: DateTimeResolver,
  Date: DateResolver,
  Timestamp: TimestampResolver,
} as unknown as Record<string, any>;
