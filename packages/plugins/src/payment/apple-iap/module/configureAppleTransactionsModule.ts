import { Db } from '@unchainedshop/types/common';
import { AppleTransaction, AppleTransactionsCollection } from '../db/AppleTransactionsCollection';

export interface AppleTransactionsModule {
  findTransactionById: (transactionIdentifier: string) => Promise<AppleTransaction>;

  createTransaction: (doc: AppleTransaction, userId: string) => Promise<string | null>;
}

export const configureAppleTransactionsModule = async ({
  db,
}: {
  db: Db;
}): Promise<AppleTransactionsModule> => {
  const AppleTransactions = await AppleTransactionsCollection(db);

  return {
    findTransactionById: async (transactionIdentifier) => {
      return AppleTransactions.findOne({ _id: transactionIdentifier });
    },

    createTransaction: async (doc, userId) => {
      await AppleTransactions.insertOne({
        ...doc,
        created: new Date(),
        createdBy: userId,
      });
      return doc._id;
    },
  };
};
