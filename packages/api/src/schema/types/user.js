export default [
  /* GraphQL */ `
    enum RoleAction

    """
    Type returned when the user logs in
    """
    type LoginMethodResponse {
      """
      Id of the user logged in user
      """
      id: String!

      """
      Token of the connection
      """
      token: String!

      """
      Expiration date for the token
      """
      tokenExpires: DateTime!

      """
      The logged in user
      """
      user: User
    }

    type UserProfile {
      displayName: String
      phoneMobile: String
      gender: String
      birthday: Date
      address: Address
    }

    type UserEmail {
      address: String!
      verified: Boolean!
    }

    type UserLoginTracker {
      timestamp: Timestamp!
      remoteAddress: String
      remotePort: String
      userAgent: String
      locale: String
      countryCode: String
    }

    type WebAuthnMDSv3Metadata {
      legalHeader: String
      description: String
      authenticatorVersion: Int
      protocolFamily: String
      schema: Int
      upv: [JSON!]
      authenticationAlgorithms: [String!]
      publicKeyAlgAndEncodings: [String!]
      attestationTypes: [String!]
      userVerificationDetails: [JSON!]
      keyProtection: [String!]
      matcherProtection: [String!]
      cryptoStrength: Int
      attachmentHint: [String!]
      tcDisplay: [JSON!]
      attestationRootCertificates: [String!]
      icon: String
      authenticatorGetInfo: JSON
    }

    type WebAuthnCredentials {
      _id: ID!
      created: DateTime!
      aaguid: String!
      counter: Int!
      mdsMetadata: WebAuthnMDSv3Metadata
    }

    type User {
      _id: ID!
      email: String @deprecated(reason: "Please use primaryEmail.address instead")
      username: String
      isEmailVerified: Boolean! @deprecated(reason: "Please use primaryEmail.verified instead")
      isGuest: Boolean!
      isTwoFactorEnabled: Boolean!
      isInitialPassword: Boolean!
      webAuthnCredentials: [WebAuthnCredentials!]!
      name: String!
      avatar: Media
      profile: UserProfile
      language: Language
      country: Country
      lastBillingAddress: Address
      lastContact: Contact
      lastLogin: UserLoginTracker
      primaryEmail: UserEmail
      emails: [UserEmail!]
      roles: [String!]
      tags: [String!]
      cart(orderNumber: String): Order
      orders(includeCarts: Boolean = false, sort: [SortOptionInput!], queryString: String): [Order!]!
      quotations(sort: [SortOptionInput!], queryString: String): [Quotation!]!
      bookmarks: [Bookmark!]!
      paymentCredentials: [PaymentCredentials!]!
      enrollments(sort: [SortOptionInput!], queryString: String): [Enrollment!]!
      allowedActions: [RoleAction!]!
    }
  `,
];
