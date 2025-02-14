// Import the function to be tested.
import {admin} from '../lib/roles/admin.js'
import {actions} from '../lib/roles/index.js';
import {jest} from '@jest/globals'
import {checkAction, ensureActionExists, ensureIsFunction} from '../lib/acl.js'
import { NoPermissionError, PermissionSystemError } from '../lib/errors.js';
import { Roles } from '@unchainedshop/roles';

describe('API', () => {

  describe('roles', () => {
    const role = {
      allow: jest.fn()
    };

    it('creates the admin role and grants permissions to all actions', () => {
      admin(role, actions);
      for (const actionName of Object.keys(actions)) {
        expect(role.allow).toHaveBeenCalledWith(actions[actionName], expect.any(Function));
      }
    })

  })

  describe('ensureActionExists', () => {
    it('should throw a PermissionSystemError if the action is undefined', () => {
      expect(() => ensureActionExists(undefined, {})).toThrow(PermissionSystemError);
    });
    
    it('should not throw an error if the action is defined', () => {
      expect(() => ensureActionExists('some action', {})).not.toThrow();
    });
  });

  describe('ensureIsFunction', () => {
    it('should throw a PermissionSystemError if the provided value is not a function', () => {
      const action = 'some action';
      const options = { showKey: true };
      const key = 'some key';
      expect(() => ensureIsFunction(null, action, options, key)).toThrow(PermissionSystemError);
    });
    
    it('should not throw an error if the provided value is a function', () => {
      const action = 'some action';
      const options = { showKey: true };
      const key = 'some key';
      expect(() => ensureIsFunction(() => {}, action, options, key)).not.toThrow();
    });
  });


  describe('checkAction', () => {
    
  it('should throw a NoPermissionError if the user does not have permission to perform the action', async () => {
    Roles.userHasPermission = jest.fn(async () => false);

    const context = { userId: '123' };
    const action = 'some action';
    const args: any = [];
    const options = { key: 'some key' };

    await expect(checkAction(context, action, args, options)).rejects.toThrow(NoPermissionError);
  });
  
  it('should not throw an error if the user has permission to perform the action', async () => {
    Roles.userHasPermission = jest.fn(async () => true);
    const context = { userId: '123' };
    const action = 'some action';
    const args: any = {};
    const options = { key: 'some key' };

    await expect(checkAction(context, action, args, options)).resolves.not.toThrow();
  });
});



});