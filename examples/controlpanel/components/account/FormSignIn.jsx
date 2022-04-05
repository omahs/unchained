import React from 'react';
import { compose, pure, mapProps, withHandlers } from 'recompose';
import { withApollo } from '@apollo/client/react/hoc';
import AutoField from 'uniforms-semantic/AutoField';
import SubmitField from 'uniforms-semantic/SubmitField';
import ErrorsField from 'uniforms-semantic/ErrorsField';
import AutoForm from 'uniforms-semantic/AutoForm';
import { loginWithPassword } from '../../lib/accounts';
import withFormSchema from '../../lib/withFormSchema';
import withFormErrorHandlers from '../../lib/withFormErrorHandlers';

const FormSignIn = ({ loginType, changeLoginType, ...formProps }) => (
  <div>
    <AutoForm {...formProps}>
      <AutoField id="email" name="email" />
      <AutoField name="password" type="password" />
      <AutoField name="totpCode" type="text" />
      <ErrorsField />
      <SubmitField value="Sign in" className="primary" />
    </AutoForm>
  </div>
);

export default compose(
  withApollo,
  withFormSchema({
    email: {
      type: String,
      label: 'E-Mail Address',
    },
    password: {
      type: String,
      label: 'Password',
    },
    totpCode: {
      type: String,
      label: 'TOTP Code',
      required: false,
    },
  }),
  withHandlers({
    onSubmit:
      ({ client }) =>
      ({ email, password, totpCode }) =>
        loginWithPassword(
          {
            email,
            password,
            totpCode,
            disableHashing: true,
          },
          client,
        ),
  }),
  withFormErrorHandlers,
  mapProps(({ client, ...rest }) => ({ ...rest })),
  pure,
)(FormSignIn);
