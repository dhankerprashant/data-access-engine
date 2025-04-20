const jwt = require('jsonwebtoken');

const token = jwt.sign(
  {
    sub: "test-user-102938",
    ldapGroups: ["LDAP_TEST_NESTED_DENY"],
    iat: Math.floor(Date.now() / 1000)
  },
  'demo-secret'
);

console.log(token);
console.log("JWT token generated successfully.");