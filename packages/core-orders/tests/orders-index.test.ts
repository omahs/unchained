import {buildFindByIdSelector as buildFindByIdSelectorForDelivery} from "../lib/module/configureOrderDeliveriesModule.js"
import {buildFindByIdSelector as buildFindByIdSelectorForDiscount } from "../lib/module/configureOrderDiscountsModule.js"
import {buildFindByIdSelector as buildFindByIdSelectorForPayment, buildFindByContextDataSelector } from "../lib/module/configureOrderPaymentsModule.js"
import {buildFindByIdSelector as buildFindByIdSelectorForPosition } from "../lib/module/configureOrderPositionsModule.js"
import {buildFindSelector as buildFindSelectorForOrder} from "../lib/module/configureOrdersModule-queries.js"


describe('OrderPosition', () => {
  describe('buildFindSelector',  () => {
    it('Return filter object when passed no argument', async () => {   
      expect(buildFindSelectorForOrder({})).toEqual({ status: { '$ne': null } })
      
    });

    it('Return filter object when passed no argument includeCarts, queryString, status, userId and (status should take precedence over includeCarts', async () => {   
      expect(buildFindSelectorForOrder({includeCarts: false, queryString: "hello world", status: 'CONFIRMED', userId: "admin-id"})).toEqual({
        userId: 'admin-id',
        status: 'CONFIRMED',
        '$text': { '$search': 'hello world' }
      }
  )
      
    });

    it('Return filter object when passed no argument includeCarts, queryString, userId ', async () => {   
      expect(buildFindSelectorForOrder({includeCarts: true, queryString: "hello world", userId: "admin-id"})).toEqual( {
        userId: 'admin-id',
        
        '$text': { '$search': 'hello world' }
      }
  )
      
    });

    it('Return filter object when passed no argument queryString, userId ', async () => {   
      expect(buildFindSelectorForOrder({ queryString: "hello world", userId: "admin-id"})).toEqual( {
        userId: 'admin-id',
        '$text': { '$search': 'hello world' },
        status: { '$ne': null },
      }
  )
      
    });

    it('Return filter object when passed no argument queryString ', async () => {   
      expect(buildFindSelectorForOrder({ queryString: "hello world"})).toEqual( {
        '$text': { '$search': 'hello world' },
        status: { '$ne': null },
      })
      
    });

  })

});

describe('OrderDelivery', () => {

  describe('buildFindByIdSelector',  () => {
    it('Return correct db _id selector', async () => {
      
      expect(buildFindByIdSelectorForDelivery('order-delivery-id')).toEqual({ _id: 'order-delivery-id' })
    });
  })
  
});


describe('OrderDiscount', () => {

  describe('buildFindByIdSelector',  () => {
    it('Return correct db _id selector', async () => {
      
      expect(buildFindByIdSelectorForDiscount('order-discount-id')).toEqual({ _id: 'order-discount-id' })
    });
  })
  
});

describe('OrderPayment', () => {

  describe('buildFindByIdSelector',  () => {
    it('Return correct db _id selector', async () => {
      
      expect(buildFindByIdSelectorForPayment('order-payment-id')).toEqual({ _id: 'order-payment-id' })
    });
  })

  describe('buildFindByContextDataSelector',  () => {
      it('Return correct db context field selector object', async () => {
        expect(buildFindByContextDataSelector({'first': 'first value', 'second': 'second value'})).toEqual({ 'context.first': 'first value', 'context.second': 'second value' })
      });
  })
  
});


describe('OrderPosition', () => {
  describe('buildFindByIdSelector',  () => {
    it('Return correct db _id selector', async () => {      
      expect(buildFindByIdSelectorForPosition('order-position-id')).toEqual({ _id: 'order-position-id' })
    });
  })

});
