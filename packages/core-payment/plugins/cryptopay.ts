import { Context } from '@unchainedshop/types/api';
import { IPaymentAdapter } from '@unchainedshop/types/payments';
import bodyParser from 'body-parser';
import { useMiddlewareWithCurrentContext } from 'meteor/unchained:api';
import {
  PaymentAdapter,
  PaymentDirector,
  PaymentError,
  paymentLogger,
} from 'meteor/unchained:core-payment';
import { Users } from 'meteor/unchained:core-users';
import { ethers } from 'ethers';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';

const {
  CRYPTOPAY_SECRET,
  CRYPTOPAY_WEBHOOK_PATH = '/graphql/cryptopay',
  CRYPTOPAY_BTC_XPUB,
  CRYPTOPAY_ETH_XPUB,
  CRYPTOPAY_BTC_TESTNET = false,
} = process.env;

enum CryptopayCurrencies {
  BTC = 'BTC',
  ETH = 'ETH',
}

useMiddlewareWithCurrentContext(CRYPTOPAY_WEBHOOK_PATH, bodyParser.raw({ type: 'application/json' }));

useMiddlewareWithCurrentContext(CRYPTOPAY_WEBHOOK_PATH, async (request, response) => {
  // Return a 200 response to acknowledge receipt of the event
  response.end(JSON.stringify({ success: true }));
});

const Cryptopay: IPaymentAdapter = {
  ...PaymentAdapter,

  key: 'shop.unchained.payment.cryptopay',
  label: 'Cryptopay',
  version: '1.0',

  typeSupported(type) {
    return type === 'GENERIC';
  },

  actions: (params) => {
    const { modules } = params.context;

    const adapterActions = {
      ...PaymentAdapter.actions(params),

      // eslint-disable-next-line
      configurationError() {
        // eslint-disable-line
        if (!CRYPTOPAY_SECRET) {
          return PaymentError.INCOMPLETE_CONFIGURATION;
        }
        return null;
      },

      isActive() {
        if (this.configurationError() === null) return true;
        return false;
      },

      isPayLaterAllowed() {
        return false;
      },

      charge: async () => {
        const { order } = params.context;
        const orderPricing = modules.orders.pricingSheet(order);
        const { currency, amount } = orderPricing.total({ useNetPrice: false });
        let cryptoAddress: string;
        switch (currency) {
          case CryptopayCurrencies.BTC: {
            if (!CRYPTOPAY_BTC_XPUB) {
              throw new Error(`Cryptopay Plugin: BTC xpub not defined.`);
            }
            const network = CRYPTOPAY_BTC_TESTNET ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
            const bip32 = BIP32Factory(ecc);
            const hardenedMaster = bip32.fromBase58(CRYPTOPAY_BTC_XPUB, network);
            const btcDerivationNumber = 0; // TODO: Consecutive number, unique among orders
            const child = hardenedMaster.derivePath(`0/${btcDerivationNumber}`);
            cryptoAddress = bitcoin.payments.p2pkh({
              pubkey: child.publicKey,
              network,
            }).address;
            break;
          }
          case CryptopayCurrencies.ETH: {
            if (!CRYPTOPAY_ETH_XPUB) {
              throw new Error(`Cryptopay Plugin: ETH xpub not defined.`);
            }
            const hardenedMaster = ethers.utils.HDNode.fromExtendedKey(CRYPTOPAY_ETH_XPUB);
            const ethDerivationNumber = 0; // TODO: Consecutive number, unique among orders
            cryptoAddress = hardenedMaster.derivePath(`0/${ethDerivationNumber}`).address;
            break;
          }
          default:
            throw new Error(`Cryptopay Plugin: Currency ${currency} not supported!`);
        }
        await params.context.modules.orders.updateContext(
          order._id,
          {
            cryptoAddress,
          },
          params.context,
        );
        return false;
      },
    };

    return adapterActions;
  },
};

PaymentDirector.registerAdapter(Cryptopay);
